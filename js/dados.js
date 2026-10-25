// Dados do protótipo da Lê UAI.
// Todas as obras são de domínio público. Os textos de leitura são só trechos
// para os testes de usabilidade (o capítulo completo está só em Dom Casmurro).

const OBRAS = [
  {
    id: "dom-casmurro",
    titulo: "Dom Casmurro",
    autor: "Machado de Assis",
    ano: 1899,
    categoria: "Romance",
    genero: "Romance Realista",
    cor: "#5b2333",
    resumo: "Bentinho conta a sua história com Capitu e o ciúme que marcou a vida dele.",
    sinopse:
      "Narra a história de Bento Santiago (Bentinho) e sua intensa relação com Capitu. Uma das maiores obras-primas da literatura universal em língua portuguesa, trazendo o enigma do ciúme e da memória humana.",
    capitulo: "Capítulo I: Do Título",
    paginas: [
      [
        "Uma noite destas, vindo da cidade para o Engenho Novo, encontrei no trem da Central um rapaz aqui do bairro, que eu conheço de vista e de chapéu. Cumprimentou-me, sentou-se ao pé de mim, falou da lua e dos ministros, e acabou recitando-me versos. A viagem era curta, e os versos pode ser que não fossem inteiramente maus. Sucedeu, porém, que, como eu estava cansado, fechei os olhos três ou quatro vezes; tanto bastou para que ele interrompesse a leitura e metesse os versos no bolso."
      ],
      [
        "— Continue, disse eu acordando.",
        "— Já acabei, murmurou ele.",
        "— São muito bonitos.",
        "Vi-lhe fazer um gesto para tirá-los outra vez do bolso, mas não passou do gesto; estava amuado. No dia seguinte entrou a dizer de mim nomes feios, e acabou alcunhando-me Dom Casmurro. Os vizinhos, que não gostam dos meus hábitos reclusos e calados, deram curso à alcunha, que afinal pegou. Nem por isso me zanguei. Contei a anedota aos amigos da cidade, e eles, por graça, chamam-me assim, alguns em bilhetes: \"Dom Casmurro, domingo vou jantar com você.\" — \"Vou para Petrópolis, Dom Casmurro; a casa é a mesma da Renânia; vê se deixas essa caverna do Engenho Novo, e vai lá passar uns quinze dias comigo.\" — \"Meu caro Dom Casmurro, não cuide que o dispenso do teatro amanhã; venha e dormirá aqui na cidade; dou-lhe camarote, dou-lhe chá, dou-lhe cama; só não lhe dou moça.\""
      ],
      [
        "Não consultes dicionários. Casmurro não está aqui no sentido que eles lhe dão, mas no que lhe pôs o vulgo de homem calado e metido consigo. Dom veio por ironia, para atribuir-me fumos de fidalgo. Tudo por estar cochilando! Também não achei melhor título para a minha narração; se não tiver outro daqui até ao fim do livro, vai este mesmo. O meu poeta do trem ficará sabendo que não lhe guardo rancor. E com pequeno esforço, sendo o título seu, poderá cuidar que a obra é sua. Há livros que apenas terão isso dos seus autores; alguns nem tanto."
      ]
    ],
    completo: true
  },
  {
    id: "iracema",
    titulo: "Iracema",
    autor: "José de Alencar",
    ano: 1865,
    categoria: "Indianismo",
    genero: "Romance Indianista",
    cor: "#1f4d3a",
    resumo: "O amor entre Iracema, a virgem dos lábios de mel, e o português Martim.",
    sinopse:
      "Conta a história de amor entre Iracema, a \"virgem dos lábios de mel\" da tribo tabajara, e o português Martim, no litoral do Ceará. O livro é lido como uma lenda sobre a formação do povo brasileiro.",
    capitulo: "Capítulo I",
    paginas: [
      [
        "Verdes mares bravios de minha terra natal, onde canta a jandaia nas frondes da carnaúba;",
        "Verdes mares, que brilhais como líquida esmeralda aos raios do sol nascente, perlongando as alvas praias ensombradas de coqueiros;",
        "Serenai, verdes mares, e alisai docemente a vaga impetuosa, para que o barco aventureiro manso resvale à flor das águas."
      ]
    ],
    completo: false
  },
  {
    id: "o-cortico",
    titulo: "O Cortiço",
    autor: "Aluísio Azevedo",
    ano: 1890,
    categoria: "Romance",
    genero: "Romance Naturalista",
    cor: "#4a3b1f",
    resumo: "A vida dos moradores de um cortiço no Rio de Janeiro do século XIX.",
    sinopse:
      "Mostra o dia a dia dos moradores de um cortiço no Rio de Janeiro, que pertence ao ambicioso João Romão. O livro mostra como a pobreza e o ambiente influenciam a vida das pessoas.",
    capitulo: "Capítulo I",
    paginas: [
      [
        "João Romão foi, dos treze aos vinte e cinco anos, empregado de um vendeiro que enriqueceu entre as quatro paredes de uma suja e obscura taverna nos refolhos do bairro de Botafogo; e tanto economizou do pouco que ganhara nessa dúzia de anos, que, ao retirar-se o patrão para a terra, lhe deixou, em pagamento de ordenados vencidos, nem só a venda com o que estava dentro, como ainda um conto e quinhentos em dinheiro."
      ]
    ],
    completo: false
  },
  {
    id: "varias-historias",
    titulo: "Várias Histórias",
    autor: "Machado de Assis",
    ano: 1896,
    categoria: "Contos",
    genero: "Contos",
    cor: "#2b2d5c",
    resumo: "Contos como \"A Cartomante\" e \"O Enfermeiro\", cheios de ironia.",
    sinopse:
      "Reúne contos de Machado de Assis como \"A Cartomante\", \"O Enfermeiro\" e \"Uns Braços\". Com muita ironia, as histórias mostram o que as pessoas escondem umas das outras.",
    capitulo: "A Cartomante",
    paginas: [
      [
        "Hamlet observa a Horácio que há mais cousas no céu e na terra do que sonha a nossa filosofia. Era a mesma explicação que dava a bela Rita ao moço Camilo, numa sexta-feira de novembro de 1869, quando este ria dela, por ter ido na véspera consultar uma cartomante; a diferença é que o fazia por outras palavras."
      ]
    ],
    completo: false
  },
  {
    id: "memorias-postumas",
    titulo: "Memórias Póstumas de Brás Cubas",
    autor: "Machado de Assis",
    ano: 1881,
    categoria: "Romance",
    genero: "Romance Realista",
    cor: "#3a3a3a",
    resumo: "Depois de morto, Brás Cubas resolve contar a própria vida.",
    sinopse:
      "Depois de morto, Brás Cubas resolve contar a própria vida. Com muita ironia, ele fala dos amores, das vaidades e dos fracassos de um homem rico do Rio de Janeiro do século XIX.",
    capitulo: "Capítulo I: Óbito do Autor",
    paginas: [
      [
        "Algum tempo hesitei se devia abrir estas memórias pelo princípio ou pelo fim, isto é, se poria em primeiro lugar o meu nascimento ou a minha morte. Suposto o uso vulgar seja começar pelo nascimento, duas considerações me levaram a adotar diferente método: a primeira é que eu não sou propriamente um autor defunto, mas um defunto autor, para quem a campa foi outro berço; a segunda é que o escrito ficaria assim mais galante e mais novo."
      ]
    ],
    completo: false
  },
  {
    id: "o-guarani",
    titulo: "O Guarani",
    autor: "José de Alencar",
    ano: 1857,
    categoria: "Indianismo",
    genero: "Romance Indianista",
    cor: "#194a5e",
    resumo: "Peri dedica a vida a proteger Ceci, às margens do rio Paquequer.",
    sinopse:
      "No século XVII, às margens do rio Paquequer, o indígena Peri dedica a vida a proteger Ceci, filha do fidalgo português D. Antônio de Mariz.",
    capitulo: "Primeira Parte: Os Aventureiros · I: Cenário",
    paginas: [
      [
        "De um dos cabeços da Serra dos Órgãos desliza um fio de água que se dirige para o norte, e engrossado com os mananciais que recebe no seu curso de dez léguas, torna-se rio caudal.",
        "É o Paquequer: saltando de cascata em cascata, enroscando-se como uma serpente, vai depois se espreguiçar na várzea e embeber no Paraíba, que rola majestosamente em seu vasto leito."
      ]
    ],
    completo: false
  },
  {
    id: "senhora",
    titulo: "Senhora",
    autor: "José de Alencar",
    ano: 1875,
    categoria: "Romance",
    genero: "Romance Urbano",
    cor: "#5c2a52",
    resumo: "Aurélia fica rica e decide comprar o próprio casamento.",
    sinopse:
      "Aurélia Camargo recebe uma grande herança e decide \"comprar\" o casamento com Fernando Seixas, que antes a tinha trocado por um dote maior. É uma crítica ao casamento por interesse na sociedade do Rio de Janeiro.",
    capitulo: "Primeira Parte: O Preço · Capítulo I",
    paginas: [
      [
        "Há anos raiou no céu fluminense uma nova estrela.",
        "Desde o momento de sua ascensão ninguém lhe disputou o cetro; foi proclamada a rainha dos salões."
      ]
    ],
    completo: false
  },
  {
    id: "paginas-recolhidas",
    titulo: "Páginas Recolhidas",
    autor: "Machado de Assis",
    ano: 1899,
    categoria: "Contos",
    genero: "Contos",
    cor: "#4d3319",
    resumo: "Contos e outros textos, entre eles \"Missa do Galo\".",
    sinopse:
      "Reúne contos e outros textos de Machado de Assis. Entre eles está \"Missa do Galo\", em que um homem lembra uma conversa estranha que teve numa noite de Natal, quando tinha dezessete anos.",
    capitulo: "Missa do Galo",
    paginas: [
      [
        "Nunca pude entender a conversação que tive com uma senhora, há muitos anos, contava eu dezessete, ela trinta. Era noite de Natal. Havendo ajustado com um vizinho irmos à missa do galo, preferi não dormir; combinei que eu iria acordá-lo à meia-noite."
      ]
    ],
    completo: false
  }
];

const TIPOS_DIFICULDADE = [
  "Contraste de cores ou visualização",
  "Navegação ou armadilha de teclado",
  "Leitor de tela / texto alternativo ausente",
  "Quebra de layout ao ampliar a fonte",
  "Outro problema de inclusão"
];

const GENEROS_CADASTRO = ["Romance", "Conto", "Indianismo", "Poesia", "Teatro"];
