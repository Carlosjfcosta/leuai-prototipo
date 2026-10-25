// Lê UAI – protótipo de alta fidelidade (Etapa 3)
// Tudo roda no navegador. Os dados da demonstração ficam no localStorage,
// sem servidor. O botão "Reiniciar demonstração" apaga tudo entre um teste e outro.

(function () {
  "use strict";

  const CHAVE = "leuai-prototipo";
  const OBRAS_POR_PAGINA = 4;

  const PADRAO = {
    logado: false,
    nome: "Leitor(a)",
    contas: [],
    estante: ["dom-casmurro", "iracema"],
    progresso: {},
    relatos: [],
    obrasNovas: [],
    prefs: { fonte: "100", espaco: "normal", tipo: "sem-serifa", contraste: "normal" }
  };

  const NOMES_PREFS = {
    fonte: { "100": "Fonte em 100%, tamanho padrão", "115": "Fonte em 115%", "130": "Fonte em 130%", "150": "Fonte em 150%" },
    espaco: { normal: "Espaçamento normal", ampliado: "Espaçamento ampliado" },
    tipo: { "sem-serifa": "Letra sem serifa", "com-serifa": "Letra com serifa" },
    contraste: { normal: "Contraste normal", alto: "Alto contraste", baixo: "Baixo contraste" }
  };

  const ROTAS_SEM_LOGIN = ["entrar", "criar-conta", "recuperar-acesso"];

  let estado = carregar();
  let mensagemPendente = null;
  let destinoDepoisDeEntrar = null;
  let ultimaTela = "Catálogo de Obras";
  let primeiraVez = true;
  let leitor = { id: null, pagina: 1, total: 1, esperando: false };
  let busca = { termo: "", criterio: "todos", genero: "todos" };
  let dialogoAberto = null;

  // ---------- Guardar e carregar ----------

  function copiar(objeto) {
    return JSON.parse(JSON.stringify(objeto));
  }

  function carregar() {
    try {
      const salvo = localStorage.getItem(CHAVE);
      if (salvo) {
        const dados = JSON.parse(salvo);
        const novo = Object.assign(copiar(PADRAO), dados);
        novo.prefs = Object.assign({}, PADRAO.prefs, dados.prefs);
        return novo;
      }
    } catch (erro) {
      // sem localStorage (janela anônima, por exemplo): segue com os dados padrão
    }
    return copiar(PADRAO);
  }

  function salvar() {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (erro) {
      // se não der para salvar, o protótipo continua funcionando até fechar a aba
    }
  }

  // ---------- Pequenas ajudas ----------

  function $(seletor, base) {
    return (base || document).querySelector(seletor);
  }

  function $$(seletor, base) {
    return Array.from((base || document).querySelectorAll(seletor));
  }

  function esc(texto) {
    const trocas = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(texto).replace(/[&<>"']/g, function (c) {
      return trocas[c];
    });
  }

  function normalizar(texto) {
    return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  }

  function anunciar(texto) {
    const regiao = $("#anuncio");
    regiao.textContent = "";
    setTimeout(function () {
      regiao.textContent = texto;
    }, 60);
  }

  function obraPorId(id) {
    return OBRAS.find(function (o) {
      return o.id === id;
    });
  }

  function irPara(endereco) {
    if (location.hash === endereco) {
      mostrarTela();
    } else {
      location.hash = endereco;
    }
  }

  function capa(obra, tamanho) {
    return (
      '<div class="capa ' + (tamanho || "") + '" style="--cor-capa: ' + obra.cor + '" aria-hidden="true">' +
      '<span class="capa-titulo">' + esc(obra.titulo) + "</span>" +
      '<span class="capa-autor">' + esc(obra.autor) + "</span></div>"
    );
  }

  function htmlTrilha(itens) {
    const partes = itens.map(function (item, i) {
      if (i === itens.length - 1) {
        return '<li><span aria-current="page">' + esc(item.texto) + "</span></li>";
      }
      return '<li><a href="' + item.href + '">' + esc(item.texto) + "</a></li>";
    });
    return '<nav class="trilha" aria-label="Trilha de navegação"><ol>' + partes.join("") + "</ol></nav>";
  }

  function htmlCampo(id, rotulo, tipo, autocompletar, opcoes) {
    opcoes = opcoes || {};
    const ajuda = opcoes.ajuda ? '<p class="ajuda" id="' + id + '-ajuda">' + opcoes.ajuda + "</p>" : "";
    const descricao = (opcoes.ajuda ? id + "-ajuda " : "") + id + "-erro";
    const obrigatorio = opcoes.obrigatorio
      ? ' <span aria-hidden="true">*</span><span class="visualmente-oculto">(obrigatório)</span>'
      : "";
    return (
      '<div class="campo">' +
      '<label for="' + id + '">' + rotulo + obrigatorio + "</label>" +
      ajuda +
      '<input id="' + id + '" type="' + tipo + '" autocomplete="' + autocompletar + '" aria-describedby="' + descricao + '">' +
      '<p class="erro-campo" id="' + id + '-erro" hidden></p>' +
      "</div>"
    );
  }

  function mostrarErro(id, texto) {
    const campo = $("#" + id);
    const erro = $("#" + id + "-erro");
    if (texto) {
      erro.innerHTML = '<span aria-hidden="true">⚠️ </span>' + esc(texto);
      erro.hidden = false;
      campo.setAttribute("aria-invalid", "true");
    } else {
      erro.innerHTML = "";
      erro.hidden = true;
      campo.removeAttribute("aria-invalid");
    }
  }

  // regras: [{ id, ok, msg, foco }] – mostra os erros e leva o foco ao primeiro
  function validar(regras) {
    let primeiro = null;
    regras.forEach(function (regra) {
      mostrarErro(regra.id, regra.ok ? "" : regra.msg);
      if (!regra.ok && !primeiro) {
        primeiro = regra.foco || regra.id;
      }
    });
    if (primeiro) {
      $("#" + primeiro).focus();
      return false;
    }
    return true;
  }

  function paginacao(base, atual, total, rotulo) {
    const anterior =
      atual > 1
        ? '<a class="botao secundario" href="' + base + (atual - 1) + '"><span aria-hidden="true">←</span> Página anterior</a>'
        : '<span class="botao secundario" aria-disabled="true"><span aria-hidden="true">←</span> Página anterior</span>';
    const proxima =
      atual < total
        ? '<a class="botao secundario" href="' + base + (atual + 1) + '">Próxima página <span aria-hidden="true">→</span></a>'
        : '<span class="botao secundario" aria-disabled="true">Próxima página <span aria-hidden="true">→</span></span>';
    return (
      '<nav class="paginacao" aria-label="' + rotulo + '">' + anterior +
      '<span class="paginacao-atual">Página ' + atual + " de " + total + "</span>" + proxima + "</nav>"
    );
  }

  function cartaoObra(obra) {
    return (
      '<li class="cartao-obra">' + capa(obra) +
      '<div class="cartao-info">' +
      '<p class="etiqueta">' + esc(obra.genero) + "</p>" +
      "<h2>" + esc(obra.titulo) + "</h2>" +
      '<p class="cartao-autor">' + esc(obra.autor) + " · " + obra.ano + "</p>" +
      '<p class="cartao-resumo">' + esc(obra.resumo) + "</p>" +
      '<a class="botao secundario" href="#/obra/' + obra.id + '">Ver detalhes<span class="visualmente-oculto"> de ' + esc(obra.titulo) + "</span></a>" +
      "</div></li>"
    );
  }

  // ---------- Barra de acessibilidade ----------

  function aplicarPreferencias() {
    const raiz = document.documentElement;
    Object.keys(estado.prefs).forEach(function (chave) {
      raiz.setAttribute("data-" + chave, estado.prefs[chave]);
    });
    $$(".barra .opcao").forEach(function (botao) {
      const escolhido = estado.prefs[botao.dataset.pref] === botao.dataset.valor;
      botao.setAttribute("aria-pressed", String(escolhido));
    });
  }

  function ligarBarra() {
    $$(".barra .opcao").forEach(function (botao) {
      botao.addEventListener("click", function () {
        estado.prefs[botao.dataset.pref] = botao.dataset.valor;
        salvar();
        aplicarPreferencias();
        anunciar(NOMES_PREFS[botao.dataset.pref][botao.dataset.valor] + ".");
      });
    });

    const alternar = $(".barra-alternar");
    alternar.addEventListener("click", function () {
      const aberta = alternar.getAttribute("aria-expanded") === "true";
      alternar.setAttribute("aria-expanded", String(!aberta));
      document.documentElement.classList.toggle("barra-fechada", aberta);
    });
  }

  // ---------- Cabeçalho ----------

  function atualizarCabecalho(rota) {
    $(".usuario").hidden = !estado.logado;
    $(".menu").hidden = !estado.logado;
    $("#nome-usuario").textContent = estado.nome;
    $("#contador-estante").textContent = estado.estante.length;

    const grupos = { catalogo: "catalogo", obra: "catalogo", pesquisar: "pesquisar", estante: "estante", relatar: "relatar" };
    $$(".menu a").forEach(function (link) {
      if (link.dataset.rota === grupos[rota]) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  // ---------- Telas ----------

  function telaEntrar() {
    return {
      titulo: "Acesse sua conta",
      html:
        '<div class="cartao cartao-entrar">' +
        "<h1>Acesse sua conta</h1>" +
        "<p>Bem-vindo(a) à Lê UAI, biblioteca pensada para dar conforto visual e facilitar a navegação com leitor de tela e ampliação.</p>" +
        '<p class="dica"><strong>Dica para demonstração:</strong> qualquer e-mail e senha permitem a entrada.</p>' +
        '<form id="form-entrar" novalidate>' +
        htmlCampo("entrar-email", "E-mail cadastrado", "email", "email") +
        htmlCampo("entrar-senha", "Senha", "password", "current-password") +
        '<button type="submit" class="botao primario">Entrar na Biblioteca</button>' +
        "</form>" +
        '<p class="links-entrar"><a href="#/criar-conta">Criar conta</a><a href="#/recuperar-acesso">Recuperar acesso</a></p>' +
        "</div>",
      depois: function () {
        $("#form-entrar").addEventListener("submit", function (evento) {
          evento.preventDefault();
          const email = $("#entrar-email").value.trim();
          const senha = $("#entrar-senha").value;
          const ok = validar([
            { id: "entrar-email", ok: email !== "", msg: "Informe seu e-mail para prosseguir." },
            { id: "entrar-senha", ok: senha !== "", msg: "Informe sua senha para prosseguir." }
          ]);
          if (!ok) return;
          const conta = estado.contas.find(function (c) {
            return c.email.toLowerCase() === email.toLowerCase();
          });
          estado.logado = true;
          estado.nome = conta ? conta.nome : "Leitor(a)";
          salvar();
          mensagemPendente = { tipo: "sucesso", texto: "Você entrou na Lê UAI. Boa leitura!" };
          const destino = destinoDepoisDeEntrar || "#/catalogo";
          destinoDepoisDeEntrar = null;
          irPara(destino);
        });
      }
    };
  }

  function telaCriarConta() {
    return {
      titulo: "Criar conta",
      html:
        '<div class="cartao cartao-entrar">' +
        "<h1>Criar conta</h1>" +
        "<p>Com uma conta, você guarda livros na sua estante e continua a leitura de onde parou.</p>" +
        '<form id="form-conta" novalidate>' +
        htmlCampo("conta-nome", "Nome", "text", "name", { obrigatorio: true }) +
        htmlCampo("conta-email", "E-mail", "email", "email", { obrigatorio: true }) +
        htmlCampo("conta-senha", "Senha", "password", "new-password", { obrigatorio: true, ajuda: "Use pelo menos 6 caracteres." }) +
        htmlCampo("conta-confirmar", "Confirme a senha", "password", "new-password", { obrigatorio: true }) +
        '<button type="submit" class="botao primario">Criar minha conta</button>' +
        "</form>" +
        '<p class="links-entrar"><a href="#/entrar">Já tenho conta: entrar</a></p>' +
        "</div>",
      depois: function () {
        $("#form-conta").addEventListener("submit", function (evento) {
          evento.preventDefault();
          const nome = $("#conta-nome").value.trim();
          const email = $("#conta-email").value.trim();
          const senha = $("#conta-senha").value;
          const confirmar = $("#conta-confirmar").value;
          const ok = validar([
            { id: "conta-nome", ok: nome !== "", msg: "Informe seu nome." },
            { id: "conta-email", ok: email !== "", msg: "Informe seu e-mail." },
            { id: "conta-senha", ok: senha.length >= 6, msg: "A senha precisa ter pelo menos 6 caracteres." },
            { id: "conta-confirmar", ok: confirmar !== "" && confirmar === senha, msg: "As duas senhas precisam ser iguais." }
          ]);
          if (!ok) return;
          const primeiroNome = nome.split(" ")[0];
          // a senha não é guardada: é só uma demonstração
          estado.contas.push({ nome: primeiroNome, email: email });
          estado.logado = true;
          estado.nome = primeiroNome;
          salvar();
          mensagemPendente = { tipo: "sucesso", texto: "Conta criada! Boas-vindas, " + primeiroNome + "." };
          irPara("#/catalogo");
        });
      }
    };
  }

  function telaRecuperarAcesso() {
    return {
      titulo: "Recuperar acesso",
      html:
        '<div class="cartao cartao-entrar">' +
        "<h1>Recuperar acesso</h1>" +
        '<div id="area-recuperar">' +
        "<p>Informe o e-mail da sua conta. Vamos enviar um link para você criar uma nova senha.</p>" +
        '<form id="form-recuperar" novalidate>' +
        htmlCampo("recuperar-email", "E-mail cadastrado", "email", "email") +
        '<button type="submit" class="botao primario">Enviar link de recuperação</button>' +
        "</form>" +
        "</div>" +
        '<p class="links-entrar"><a href="#/entrar">Voltar para o login</a></p>' +
        "</div>",
      depois: function () {
        $("#form-recuperar").addEventListener("submit", function (evento) {
          evento.preventDefault();
          const email = $("#recuperar-email").value.trim();
          if (!validar([{ id: "recuperar-email", ok: email !== "", msg: "Informe seu e-mail para prosseguir." }])) return;
          $("#area-recuperar").innerHTML =
            '<div class="mensagem sucesso" id="recuperar-ok" tabindex="-1">' +
            "<p>Pronto! Se este e-mail estiver cadastrado, você vai receber um link para criar uma nova senha.</p>" +
            "<p>Neste protótipo, nenhum e-mail é enviado de verdade.</p></div>";
          $("#recuperar-ok").focus();
        });
      }
    };
  }

  function telaCatalogo(parametro) {
    const total = OBRAS.length;
    const paginas = Math.ceil(total / OBRAS_POR_PAGINA);
    let pagina = parseInt(parametro, 10) || 1;
    pagina = Math.min(Math.max(pagina, 1), paginas);
    const obras = OBRAS.slice((pagina - 1) * OBRAS_POR_PAGINA, pagina * OBRAS_POR_PAGINA);
    return {
      titulo: "Catálogo de Obras" + (pagina > 1 ? " – página " + pagina : ""),
      trilha: [{ texto: "Início", href: "#/catalogo" }, { texto: "Catálogo" }],
      html:
        "<h1>Catálogo de Obras</h1>" +
        '<p class="introducao">Obras clássicas brasileiras em domínio público, adaptadas para leitura acessível.</p>' +
        '<p class="resumo-lista">Exibindo página ' + pagina + " de " + paginas + " (" + total + " obras no acervo)</p>" +
        '<ul class="lista-obras">' + obras.map(cartaoObra).join("") + "</ul>" +
        paginacao("#/catalogo/", pagina, paginas, "Páginas do catálogo")
    };
  }

  function filtrarObras() {
    const termo = normalizar(busca.termo);
    return OBRAS.filter(function (obra) {
      if (busca.genero !== "todos" && obra.categoria !== busca.genero) return false;
      if (!termo) return true;
      const campos = {
        todos: [obra.titulo, obra.autor, obra.categoria, obra.genero],
        titulo: [obra.titulo],
        autor: [obra.autor],
        categoria: [obra.categoria, obra.genero]
      }[busca.criterio];
      return campos.some(function (campo) {
        return normalizar(campo).indexOf(termo) !== -1;
      });
    });
  }

  function mostrarResultados() {
    const status = $("#status-busca");
    const lista = $("#resultados");
    if (!busca.termo && busca.genero === "todos") {
      status.textContent = "Aguardando pesquisa ou escolha de filtro...";
      lista.innerHTML = "";
      return;
    }
    const achadas = filtrarObras();
    let texto;
    if (achadas.length === 0) {
      texto = "Nenhuma obra encontrada. Tente outra palavra ou limpe os filtros.";
    } else {
      texto = achadas.length + (achadas.length === 1 ? " obra encontrada" : " obras encontradas");
      if (busca.termo) texto += ' para "' + busca.termo + '"';
      if (busca.genero !== "todos") texto += " no gênero " + busca.genero;
      texto += ".";
    }
    status.textContent = texto;
    lista.innerHTML = achadas.map(cartaoObra).join("");
  }

  function telaPesquisar() {
    const criterios = [
      ["todos", "Todos os campos"],
      ["titulo", "Título da obra"],
      ["autor", "Autor / Autora"],
      ["categoria", "Categoria / Gênero"]
    ];
    const generos = ["todos", "Romance", "Contos", "Indianismo"];
    return {
      titulo: "Pesquisar no Acervo",
      trilha: [{ texto: "Início", href: "#/catalogo" }, { texto: "Pesquisar" }],
      html:
        "<h1>Pesquisar no Acervo</h1>" +
        '<form class="form-busca" id="form-busca" role="search" aria-label="Pesquisa no acervo" novalidate>' +
        '<div class="campo"><label for="busca-termo">O que você procura?</label>' +
        '<input id="busca-termo" type="search" autocomplete="off" value="' + esc(busca.termo) + '"></div>' +
        '<div class="campo"><label for="busca-criterio">Critério de busca</label><select id="busca-criterio">' +
        criterios.map(function (c) {
          return '<option value="' + c[0] + '"' + (busca.criterio === c[0] ? " selected" : "") + ">" + c[1] + "</option>";
        }).join("") +
        "</select></div>" +
        '<fieldset><legend>Filtrar por gênero</legend><div class="filtros">' +
        generos.map(function (g) {
          return '<button type="button" class="opcao filtro" data-genero="' + g + '" aria-pressed="' + (busca.genero === g) + '">' + (g === "todos" ? "Todos" : g) + "</button>";
        }).join("") +
        "</div></fieldset>" +
        '<div class="botoes"><button type="submit" class="botao primario"><span aria-hidden="true">🔍</span> Pesquisar</button>' +
        '<button type="button" class="botao secundario" id="limpar-busca">Limpar filtros</button></div>' +
        "</form>" +
        '<p class="status-busca" id="status-busca" role="status"></p>' +
        '<ul class="lista-obras" id="resultados"></ul>',
      depois: function () {
        mostrarResultados();
        $("#form-busca").addEventListener("submit", function (evento) {
          evento.preventDefault();
          busca.termo = $("#busca-termo").value.trim();
          busca.criterio = $("#busca-criterio").value;
          mostrarResultados();
        });
        $$(".filtro").forEach(function (botao) {
          botao.addEventListener("click", function () {
            busca.genero = botao.dataset.genero;
            busca.termo = $("#busca-termo").value.trim();
            busca.criterio = $("#busca-criterio").value;
            $$(".filtro").forEach(function (b) {
              b.setAttribute("aria-pressed", String(b === botao));
            });
            mostrarResultados();
          });
        });
        $("#limpar-busca").addEventListener("click", function () {
          busca = { termo: "", criterio: "todos", genero: "todos" };
          $("#busca-termo").value = "";
          $("#busca-criterio").value = "todos";
          $$(".filtro").forEach(function (b) {
            b.setAttribute("aria-pressed", String(b.dataset.genero === "todos"));
          });
          mostrarResultados();
          $("#busca-termo").focus();
        });
      }
    };
  }

  function telaObra(id) {
    const obra = obraPorId(id);
    if (!obra) return telaNaoEncontrada();
    const naEstante = estado.estante.indexOf(obra.id) !== -1;
    const botaoEstante = naEstante
      ? '<a class="botao secundario" href="#/estante" id="ver-estante"><span aria-hidden="true">✓</span> Está na minha estante</a>'
      : '<button type="button" class="botao secundario" id="adicionar-estante"><span aria-hidden="true">⭐</span> Adicionar à minha estante</button>';
    return {
      titulo: obra.titulo,
      trilha: [{ texto: "Início", href: "#/catalogo" }, { texto: "Catálogo", href: "#/catalogo" }, { texto: obra.titulo }],
      html:
        '<article class="obra">' +
        '<div class="obra-topo">' + capa(obra, "grande") +
        "<div>" +
        '<p class="etiqueta">' + esc(obra.genero) + "</p>" +
        "<h1>" + esc(obra.titulo) + "</h1>" +
        '<p class="obra-autor">' + esc(obra.autor) + " (" + obra.ano + ")</p>" +
        '<div class="botoes"><a class="botao primario" href="#/ler/' + obra.id + '"><span aria-hidden="true">📖</span> Ler agora</a>' + botaoEstante + "</div>" +
        '<p id="aviso-estante" role="status"></p>' +
        "</div></div>" +
        '<section class="secao" aria-labelledby="t-sinopse"><h2 id="t-sinopse">Sinopse e Contexto</h2><p>' + esc(obra.sinopse) + "</p></section>" +
        '<section class="secao" aria-labelledby="t-ficha"><h2 id="t-ficha">Ficha Técnica</h2><dl class="ficha">' +
        "<dt>Autor</dt><dd>" + esc(obra.autor) + "</dd>" +
        "<dt>Primeira edição</dt><dd>" + obra.ano + "</dd>" +
        "<dt>Gênero</dt><dd>" + esc(obra.genero) + "</dd>" +
        "<dt>Idioma</dt><dd>Português (Brasil)</dd>" +
        "<dt>Direitos</dt><dd>Domínio público</dd>" +
        "<dt>Formato</dt><dd>Leitor online acessível</dd>" +
        "<dt>Recursos de acessibilidade</dt><dd>Navegação por teclado e ajuste de fonte, espaçamento e contraste</dd>" +
        "</dl></section></article>",
      depois: function () {
        const botao = $("#adicionar-estante");
        if (!botao) return;
        botao.addEventListener("click", function () {
          estado.estante.push(obra.id);
          salvar();
          atualizarCabecalho("obra");
          botao.outerHTML =
            '<a class="botao secundario" href="#/estante" id="ver-estante"><span aria-hidden="true">✓</span> Está na minha estante</a>';
          $("#aviso-estante").innerHTML =
            '<span class="mensagem sucesso" style="display: inline-block">"' + esc(obra.titulo) + '" foi adicionada à sua estante.</span>';
          $("#ver-estante").focus();
        });
      }
    };
  }

  function mostrarPagina(numero, avisar) {
    const obra = obraPorId(leitor.id);
    leitor.pagina = numero;
    $("#texto-livro").innerHTML = obra.paginas[numero - 1].map(function (paragrafo) {
      return "<p>" + esc(paragrafo) + "</p>";
    }).join("");
    $("#texto-livro").setAttribute("aria-label", "Texto do livro, página " + numero + " de " + leitor.total);
    $("#pagina-atual").textContent = "Página " + numero + " de " + leitor.total;
    $("#pagina-anterior").setAttribute("aria-disabled", String(numero === 1));
    $("#pagina-proxima").setAttribute("aria-disabled", String(numero === leitor.total));
    estado.progresso[obra.id] = numero;
    salvar();
    $("#salvo").innerHTML =
      '<span aria-hidden="true">💾</span> Ponto de leitura salvo automaticamente (página ' + numero + " de " + leitor.total + ")";
    if (avisar) anunciar("Página " + numero + " de " + leitor.total + ". Ponto de leitura salvo.");
  }

  function virarPagina(passo) {
    const nova = leitor.pagina + passo;
    if (nova < 1 || nova > leitor.total) return;
    mostrarPagina(nova, true);
  }

  function telaLer(id) {
    const obra = obraPorId(id);
    if (!obra) return telaNaoEncontrada();
    const salva = estado.progresso[obra.id] || 0;
    const perguntar = salva > 1;
    leitor = { id: obra.id, pagina: 1, total: obra.paginas.length, esperando: perguntar };
    return {
      titulo: "Leitura: " + obra.titulo,
      trilha: [{ texto: "Início", href: "#/catalogo" }, { texto: obra.titulo, href: "#/obra/" + obra.id }, { texto: "Leitor" }],
      html:
        '<article class="leitor" aria-labelledby="titulo-leitura">' +
        '<div class="leitor-cabecalho"><h1 id="titulo-leitura">' + esc(obra.titulo) + "</h1>" +
        '<p class="leitor-meta">' + esc(obra.autor) + " · " + esc(obra.capitulo) + "</p></div>" +
        (perguntar
          ? '<section class="aviso-retomar" id="aviso-retomar" aria-labelledby="t-retomar">' +
            '<h2 id="t-retomar">Leitura em andamento encontrada!</h2>' +
            "<p>Você parou na página " + salva + " deste livro na sua última leitura.</p>" +
            '<div class="botoes"><button type="button" class="botao primario" id="continuar">Continuar da página ' + salva + "</button>" +
            '<button type="button" class="botao secundario" id="recomecar">Começar do início</button></div></section>'
          : "") +
        '<div id="area-leitura"' + (perguntar ? " hidden" : "") + ">" +
        '<p class="leitor-cabecalho"><span class="salvo" id="salvo"></span></p>' +
        (obra.completo
          ? ""
          : '<div class="mensagem info leitor-cabecalho"><p>Prévia do protótipo: esta obra mostra só o começo. A leitura completa para os testes está em <a href="#/ler/dom-casmurro">Dom Casmurro</a>.</p></div>') +
        '<section class="leitor-texto" id="texto-livro" aria-label="Texto do livro" tabindex="0"></section>' +
        '<nav class="paginacao" aria-label="Páginas do livro">' +
        '<button type="button" class="botao secundario" id="pagina-anterior"><span aria-hidden="true">←</span> Página anterior</button>' +
        '<span class="paginacao-atual" id="pagina-atual"></span>' +
        '<button type="button" class="botao secundario" id="pagina-proxima">Próxima página <span aria-hidden="true">→</span></button>' +
        "</nav>" +
        '<p class="dica-teclado"><span aria-hidden="true">⌨️</span> <strong>Dica:</strong> use as setas <kbd>←</kbd> e <kbd>→</kbd> do teclado para virar as páginas.</p>' +
        "</div></article>",
      depois: function () {
        $("#pagina-anterior").addEventListener("click", function () {
          virarPagina(-1);
        });
        $("#pagina-proxima").addEventListener("click", function () {
          virarPagina(1);
        });
        if (!perguntar) {
          mostrarPagina(1, false);
          return;
        }
        function comecar(pagina) {
          leitor.esperando = false;
          $("#aviso-retomar").hidden = true;
          $("#area-leitura").hidden = false;
          mostrarPagina(pagina, false);
          $("#texto-livro").focus();
          anunciar("Lendo a página " + pagina + " de " + leitor.total + ".");
        }
        $("#continuar").addEventListener("click", function () {
          comecar(salva);
        });
        $("#recomecar").addEventListener("click", function () {
          comecar(1);
        });
      }
    };
  }

  function itemEstante(obra) {
    const pagina = estado.progresso[obra.id] || 0;
    const total = obra.paginas.length;
    const porcentagem = pagina ? Math.round((pagina / total) * 100) : 0;
    const progresso = pagina ? "Parou na página " + pagina + " de " + total : "Leitura ainda não começou";
    return (
      '<li class="item-estante">' + capa(obra, "pequena") +
      '<div class="item-info"><h2>' + esc(obra.titulo) + "</h2>" +
      '<p class="cartao-autor">' + esc(obra.autor) + "</p>" +
      "<p>" + progresso + "</p>" +
      '<div class="progresso" aria-hidden="true"><span style="width: ' + porcentagem + '%"></span></div></div>' +
      '<div class="botoes">' +
      '<a class="botao primario" href="#/ler/' + obra.id + '">' + (pagina ? "Continuar leitura" : "Começar a ler") +
      '<span class="visualmente-oculto"> de ' + esc(obra.titulo) + "</span></a>" +
      '<button type="button" class="botao secundario remover-estante" data-id="' + obra.id + '">Remover da estante' +
      '<span class="visualmente-oculto">: ' + esc(obra.titulo) + "</span></button>" +
      "</div></li>"
    );
  }

  function telaEstante() {
    const obras = estado.estante.map(obraPorId).filter(Boolean);
    return {
      titulo: "Minha Estante de Leitura",
      trilha: [{ texto: "Início", href: "#/catalogo" }, { texto: "Minha Estante" }],
      html:
        "<h1>Minha Estante de Leitura</h1>" +
        '<p class="introducao">Seus livros guardados e o progresso salvo em cada obra.</p>' +
        (obras.length
          ? '<ul class="lista-estante">' + obras.map(itemEstante).join("") + "</ul>"
          : '<div class="cartao"><p>Sua estante está vazia. Que tal escolher uma obra no catálogo?</p>' +
            '<a class="botao primario" href="#/catalogo">Ir para o catálogo</a></div>'),
      depois: function () {
        $$(".remover-estante").forEach(function (botao) {
          botao.addEventListener("click", function () {
            const obra = obraPorId(botao.dataset.id);
            abrirDialogo({
              titulo: 'Remover "' + obra.titulo + '" da estante?',
              texto: "Tem certeza que deseja remover esta obra da sua estante de leitura?",
              confirmar: "Sim, remover",
              origem: botao,
              aoConfirmar: function () {
                estado.estante = estado.estante.filter(function (x) {
                  return x !== obra.id;
                });
                salvar();
                mensagemPendente = { tipo: "sucesso", texto: '"' + obra.titulo + '" foi removida da sua estante.' };
                mostrarTela();
              }
            });
          });
        });
      }
    };
  }

  function telaRelatar() {
    const agora = new Date();
    const dataHora =
      agora.toLocaleDateString("pt-BR") + " às " + agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return {
      titulo: "Relatar Problema de Acessibilidade",
      trilha: [{ texto: "Início", href: "#/catalogo" }, { texto: "Relatar problema" }],
      html:
        "<h1>Relatar Problema de Acessibilidade</h1>" +
        '<p class="introducao">Encontrou dificuldade para ler, ouvir ou navegar com o teclado? Conte para a gente: problemas de acessibilidade são corrigidos primeiro.</p>' +
        '<div id="area-relato">' +
        '<form id="form-relato" class="cartao" novalidate>' +
        '<fieldset class="bloco-automatico"><legend>Preenchido automaticamente pelo sistema</legend>' +
        '<div class="campo"><label for="relato-pagina">Página onde ocorreu</label>' +
        '<input id="relato-pagina" type="text" readonly value="' + esc(ultimaTela) + '"></div>' +
        '<div class="campo"><label for="relato-data">Data e hora</label>' +
        '<input id="relato-data" type="text" readonly value="' + dataHora + '"></div>' +
        "</fieldset>" +
        '<fieldset id="relato-tipo" aria-describedby="relato-tipo-erro"><legend>Tipo de dificuldade encontrada ' +
        '<span aria-hidden="true">*</span><span class="visualmente-oculto">(obrigatório)</span></legend>' +
        TIPOS_DIFICULDADE.map(function (tipo, i) {
          return '<label class="escolha"><input type="radio" name="tipo" id="tipo-' + i + '" value="' + esc(tipo) + '"><span>' + esc(tipo) + "</span></label>";
        }).join("") +
        '<p class="erro-campo" id="relato-tipo-erro" hidden></p></fieldset>' +
        '<div class="campo"><label for="relato-descricao">Descreva o que aconteceu ' +
        '<span aria-hidden="true">*</span><span class="visualmente-oculto">(obrigatório)</span></label>' +
        '<p class="ajuda" id="relato-descricao-ajuda">Campo obrigatório. Conte com detalhes o que aconteceu.</p>' +
        '<textarea id="relato-descricao" aria-describedby="relato-descricao-ajuda relato-descricao-erro"></textarea>' +
        '<p class="erro-campo" id="relato-descricao-erro" hidden></p></div>' +
        htmlCampo("relato-email", "Seu e-mail para resposta (opcional)", "email", "email") +
        '<button type="submit" class="botao primario">Enviar relato de acessibilidade</button>' +
        "</form></div>",
      depois: function () {
        $("#form-relato").addEventListener("submit", function (evento) {
          evento.preventDefault();
          const marcado = $('input[name="tipo"]:checked');
          const descricao = $("#relato-descricao").value.trim();
          const ok = validar([
            { id: "relato-tipo", ok: !!marcado, msg: "Escolha o tipo de dificuldade.", foco: "tipo-0" },
            { id: "relato-descricao", ok: descricao !== "", msg: "Descreva o problema antes de enviar." }
          ]);
          if (!ok) return;
          const pagina = $("#relato-pagina").value;
          estado.relatos.push({
            pagina: pagina,
            data: $("#relato-data").value,
            tipo: marcado.value,
            descricao: descricao,
            email: $("#relato-email").value.trim()
          });
          salvar();
          $("#area-relato").innerHTML =
            '<div class="mensagem sucesso" id="relato-ok" tabindex="-1">' +
            '<p><span aria-hidden="true">✅</span> Relato enviado! Obrigado por ajudar a melhorar a Lê UAI.</p>' +
            '<p>Vamos analisar o problema na página "' + esc(pagina) + '" com prioridade.</p></div>' +
            '<div class="botoes"><button type="button" class="botao secundario" id="novo-relato">Enviar outro relato</button>' +
            '<a class="botao primario" href="#/catalogo">Voltar para o catálogo</a></div>';
          $("#relato-ok").focus();
          $("#novo-relato").addEventListener("click", function () {
            mostrarTela();
          });
        });
      }
    };
  }

  function telaAdmin() {
    const linhas = OBRAS.map(function (o) {
      return { id: o.id, titulo: o.titulo, autor: o.autor, categoria: o.genero, situacao: "Publicada", nova: false };
    }).concat(
      estado.obrasNovas.map(function (n) {
        return { id: n.id, titulo: n.titulo, autor: n.autor, categoria: n.categoria, situacao: "Em revisão", nova: true };
      })
    );
    return {
      titulo: "Administração de Obras",
      trilha: [{ texto: "Início", href: "#/catalogo" }, { texto: "Administração do Acervo" }],
      html:
        "<h1>Administração de Obras</h1>" +
        '<p class="introducao">Gestão das obras em domínio público adaptadas para leitores com baixa visão.</p>' +
        '<p class="mensagem aviso">Área restrita a administradores. Nesta demonstração, o acesso está liberado.</p>' +
        '<p><a class="botao primario" href="#/admin/nova-obra"><span aria-hidden="true">+</span> Incluir nova obra</a></p>' +
        '<div class="tabela-rolagem" role="region" aria-labelledby="legenda-obras" tabindex="0">' +
        '<table><caption id="legenda-obras">Obras do acervo (' + linhas.length + ")</caption>" +
        '<thead><tr><th scope="col">Título</th><th scope="col">Autor</th><th scope="col">Categoria</th>' +
        '<th scope="col">Situação</th><th scope="col">Ações</th></tr></thead><tbody>' +
        linhas.map(function (l) {
          const acao = l.nova
            ? '<button type="button" class="botao secundario remover-cadastro" data-id="' + l.id + '">Remover<span class="visualmente-oculto"> ' + esc(l.titulo) + "</span></button>"
            : '<a class="botao secundario" href="#/obra/' + l.id + '">Ver página<span class="visualmente-oculto"> de ' + esc(l.titulo) + "</span></a>";
          return (
            '<tr><th scope="row">' + esc(l.titulo) + "</th><td>" + esc(l.autor) + "</td><td>" + esc(l.categoria) +
            '</td><td class="situacao">' + l.situacao + "</td><td>" + acao + "</td></tr>"
          );
        }).join("") +
        "</tbody></table></div>",
      depois: function () {
        $$(".remover-cadastro").forEach(function (botao) {
          botao.addEventListener("click", function () {
            const nova = estado.obrasNovas.find(function (n) {
              return n.id === botao.dataset.id;
            });
            abrirDialogo({
              titulo: 'Remover o cadastro de "' + nova.titulo + '"?',
              texto: "A obra ainda está em revisão e vai sair da lista. Essa ação não pode ser desfeita.",
              confirmar: "Sim, remover",
              origem: botao,
              aoConfirmar: function () {
                estado.obrasNovas = estado.obrasNovas.filter(function (n) {
                  return n.id !== nova.id;
                });
                salvar();
                mensagemPendente = { tipo: "sucesso", texto: 'O cadastro de "' + nova.titulo + '" foi removido.' };
                mostrarTela();
              }
            });
          });
        });
      }
    };
  }

  function telaNovaObra() {
    const anoAtual = new Date().getFullYear();
    return {
      titulo: "Incluir nova obra",
      trilha: [
        { texto: "Início", href: "#/catalogo" },
        { texto: "Administração do Acervo", href: "#/admin" },
        { texto: "Incluir nova obra" }
      ],
      html:
        "<h1>Incluir nova obra</h1>" +
        '<p class="introducao">Preencha as três partes. Os campos com * são obrigatórios.</p>' +
        '<form id="form-obra" novalidate>' +
        "<fieldset><legend>1. Dados da Obra</legend>" +
        htmlCampo("obra-titulo", "Título da obra", "text", "off", { obrigatorio: true }) +
        htmlCampo("obra-autor", "Autor / Autora", "text", "off", { obrigatorio: true }) +
        "</fieldset>" +
        "<fieldset><legend>2. Classificação</legend>" +
        '<div class="campo"><label for="obra-genero">Gênero literário</label><select id="obra-genero">' +
        GENEROS_CADASTRO.map(function (g) {
          return "<option>" + g + "</option>";
        }).join("") +
        "</select></div>" +
        htmlCampo("obra-ano", "Ano de publicação original", "number", "off", { ajuda: "Exemplo: 1899" }) +
        "</fieldset>" +
        "<fieldset><legend>3. Verificação de Domínio Público</legend>" +
        '<label class="escolha"><input type="checkbox" id="obra-dominio" aria-describedby="obra-dominio-erro">' +
        "<span>Confirmo que esta obra está em domínio público (o autor morreu há mais de 70 anos) e pode ser distribuída livremente. " +
        '<span aria-hidden="true">*</span><span class="visualmente-oculto">(obrigatório)</span></span></label>' +
        '<p class="erro-campo" id="obra-dominio-erro" hidden></p>' +
        "</fieldset>" +
        '<div class="botoes"><a class="botao secundario" href="#/admin">Cancelar</a>' +
        '<button type="submit" class="botao primario">Cadastrar obra</button></div>' +
        "</form>",
      depois: function () {
        $("#form-obra").addEventListener("submit", function (evento) {
          evento.preventDefault();
          const titulo = $("#obra-titulo").value.trim();
          const autor = $("#obra-autor").value.trim();
          const anoTexto = $("#obra-ano").value.trim();
          const ano = parseInt(anoTexto, 10);
          const ok = validar([
            { id: "obra-titulo", ok: titulo !== "", msg: "Informe o título da obra." },
            { id: "obra-autor", ok: autor !== "", msg: "Informe o nome do autor." },
            { id: "obra-ano", ok: anoTexto === "" || (ano >= 1500 && ano <= anoAtual), msg: "Informe um ano entre 1500 e " + anoAtual + "." },
            { id: "obra-dominio", ok: $("#obra-dominio").checked, msg: "A confirmação de domínio público é obrigatória." }
          ]);
          if (!ok) return;
          estado.obrasNovas.push({ id: "nova-" + Date.now(), titulo: titulo, autor: autor, categoria: $("#obra-genero").value });
          salvar();
          mensagemPendente = { tipo: "sucesso", texto: '"' + titulo + '" foi cadastrada e está em revisão.' };
          irPara("#/admin");
        });
      }
    };
  }

  function telaNaoEncontrada() {
    return {
      titulo: "Página não encontrada",
      trilha: [{ texto: "Início", href: "#/catalogo" }, { texto: "Página não encontrada" }],
      html:
        "<h1>Página não encontrada</h1>" +
        "<p>Não achamos essa página. Ela pode ter mudado de endereço.</p>" +
        '<a class="botao primario" href="#/catalogo">Ir para o catálogo</a>'
    };
  }

  const TELAS = {
    entrar: telaEntrar,
    "criar-conta": telaCriarConta,
    "recuperar-acesso": telaRecuperarAcesso,
    catalogo: telaCatalogo,
    pesquisar: telaPesquisar,
    obra: telaObra,
    ler: telaLer,
    estante: telaEstante,
    relatar: telaRelatar,
    admin: function (parametro) {
      return parametro === "nova-obra" ? telaNovaObra() : telaAdmin();
    }
  };

  // ---------- Rotas ----------

  function lerRota() {
    const partes = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    return { nome: partes[0] || "", parametro: partes[1] || "" };
  }

  function mostrarTela() {
    if (dialogoAberto) fecharDialogo(false);
    const rota = lerRota();
    if (!rota.nome) {
      irPara(estado.logado ? "#/catalogo" : "#/entrar");
      return;
    }
    if (!estado.logado && ROTAS_SEM_LOGIN.indexOf(rota.nome) === -1) {
      destinoDepoisDeEntrar = location.hash;
      irPara("#/entrar");
      return;
    }
    if (estado.logado && ROTAS_SEM_LOGIN.indexOf(rota.nome) !== -1) {
      irPara("#/catalogo");
      return;
    }

    leitor = { id: null, pagina: 1, total: 1, esperando: false };
    const criarTela = TELAS[rota.nome] || telaNaoEncontrada;
    const tela = criarTela(rota.parametro);
    const conteudo = $("#conteudo");

    document.title = tela.titulo + " – Lê UAI";
    conteudo.innerHTML = (tela.trilha ? htmlTrilha(tela.trilha) : "") + tela.html;
    atualizarCabecalho(rota.nome);
    if (tela.depois) tela.depois();

    const titulo = $("h1", conteudo);
    if (mensagemPendente && titulo) {
      const m = mensagemPendente;
      titulo.insertAdjacentHTML("afterend", '<div class="mensagem ' + m.tipo + '"><p>' + esc(m.texto) + "</p></div>");
      anunciar(m.texto);
    }
    mensagemPendente = null;

    if (rota.nome !== "relatar") ultimaTela = tela.titulo;

    if (!primeiraVez && titulo) {
      titulo.setAttribute("tabindex", "-1");
      titulo.focus();
    }
    if (!primeiraVez) window.scrollTo(0, 0);
    primeiraVez = false;
  }

  // ---------- Diálogo de confirmação ----------

  function abrirDialogo(opcoes) {
    dialogoAberto = opcoes;
    $("#dialogo-titulo").textContent = opcoes.titulo;
    $("#dialogo-texto").textContent = opcoes.texto;
    $("#dialogo-confirmar").textContent = opcoes.confirmar;
    $("#fundo-dialogo").hidden = false;
    ["#topo", "#conteudo", ".rodape"].forEach(function (s) {
      $(s).inert = true;
    });
    document.body.style.overflow = "hidden";
    $("#dialogo-cancelar").focus();
  }

  function fecharDialogo(confirmou) {
    const opcoes = dialogoAberto;
    if (!opcoes) return;
    dialogoAberto = null;
    $("#fundo-dialogo").hidden = true;
    ["#topo", "#conteudo", ".rodape"].forEach(function (s) {
      $(s).inert = false;
    });
    document.body.style.overflow = "";
    if (confirmou) {
      opcoes.aoConfirmar();
    } else if (opcoes.origem && document.body.contains(opcoes.origem)) {
      opcoes.origem.focus();
    }
  }

  function ligarDialogo() {
    $("#dialogo-cancelar").addEventListener("click", function () {
      fecharDialogo(false);
    });
    $("#dialogo-confirmar").addEventListener("click", function () {
      fecharDialogo(true);
    });
    $("#fundo-dialogo").addEventListener("keydown", function (evento) {
      if (evento.key === "Escape") {
        evento.preventDefault();
        fecharDialogo(false);
      }
      if (evento.key === "Tab") {
        const botoes = [$("#dialogo-cancelar"), $("#dialogo-confirmar")];
        const posicao = botoes.indexOf(document.activeElement);
        evento.preventDefault();
        const proximo = evento.shiftKey ? (posicao <= 0 ? 1 : 0) : posicao === 1 ? 0 : 1;
        botoes[proximo].focus();
      }
    });
  }

  // ---------- Teclado no leitor ----------

  function teclasDoLeitor(evento) {
    if (!leitor.id || leitor.esperando || dialogoAberto || !$("#texto-livro")) return;
    if (evento.altKey || evento.ctrlKey || evento.metaKey) return;
    if (evento.target.closest("input, textarea, select")) return;
    if (evento.key === "ArrowRight") {
      evento.preventDefault();
      virarPagina(1);
    } else if (evento.key === "ArrowLeft") {
      evento.preventDefault();
      virarPagina(-1);
    }
  }

  // ---------- Início ----------

  function iniciar() {
    aplicarPreferencias();
    ligarBarra();
    ligarDialogo();

    $(".pular").addEventListener("click", function (evento) {
      evento.preventDefault();
      const titulo = $("#conteudo h1");
      if (titulo) {
        titulo.setAttribute("tabindex", "-1");
        titulo.focus();
      } else {
        $("#conteudo").focus();
      }
    });

    $("#sair").addEventListener("click", function () {
      estado.logado = false;
      salvar();
      mensagemPendente = { tipo: "sucesso", texto: "Você saiu da sua conta. Até a próxima leitura!" };
      irPara("#/entrar");
    });

    $("#reiniciar").addEventListener("click", function () {
      try {
        localStorage.removeItem(CHAVE);
      } catch (erro) {
        // nada a fazer
      }
      estado = copiar(PADRAO);
      busca = { termo: "", criterio: "todos", genero: "todos" };
      aplicarPreferencias();
      mensagemPendente = { tipo: "sucesso", texto: "Demonstração reiniciada. Os dados do teste foram apagados." };
      irPara("#/entrar");
    });

    document.addEventListener("keydown", teclasDoLeitor);
    window.addEventListener("hashchange", mostrarTela);
    mostrarTela();
  }

  iniciar();
})();
