import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const rawUrl = process.env.DATABASE_URL;
const url = rawUrl ? new URL(rawUrl) : null;
if (url) {
  const ssl = url.searchParams.get("ssl");
  url.searchParams.delete("ssl");
  if (ssl === "true" || ssl === "1") url.searchParams.set("sslmode", "require");
}
const prisma = new PrismaClient({ datasourceUrl: url?.toString() });
const IMG = (name) => `/images/${name}.jpg`;
const beaches = [
  {
    slug: "martin-de-sa",
    name: "Martin de S\xE1",
    neighborhood: "Martim de S\xE1",
    photo: "praia-martim-de-sa",
    sea: "Misto: lado esquerdo mais calmo e raso; lado direito de tombo, com ondas fortes",
    structure: "Quiosques e bares ao longo da orla, cal\xE7ad\xE3o e ciclovia; Posto de Bombeiros Mar\xEDtimo na Av. Dr. Aldino Schiavi, 600.",
    access: "Acesso pela Av. da Praia, a cerca de 2,5 km do Centro.",
    profile: "Badalada; fam\xEDlias, grupos de amigos e surfistas",
    capacity: "Muito alta na alta temporada; movimentada ao longo do ano",
    lat: -23.62858,
    lng: -45.38175,
    description: "A praia mais movimentada de Caraguatatuba fica a cerca de 2,5 km do Centro, entre a Prainha e a Praia Brava. A orla \xE9 urbanizada, com cal\xE7ad\xE3o, ciclovia e a maior concentra\xE7\xE3o de quiosques e bares da cidade, o que atrai grupos de amigos e fam\xEDlias. O mar \xE9 misto: o lado esquerdo tende a ser mais calmo e raso, enquanto o lado direito \xE9 de tombo e ondas fortes, procurado por surfistas. Na alta temporada, o som dos quiosques e o fluxo de pessoas deixam o ambiente bastante agitado."
  },
  {
    slug: "praia-brava",
    name: "Praia Brava",
    neighborhood: "Casa Branca (acesso pela Martim de S\xE1)",
    photo: "praia-brava",
    sea: "Ondas fortes; praia de tombo com fortes correntes em toda a extens\xE3o",
    structure: "Sem quiosques, resid\xEAncias ou banheiros; n\xE3o h\xE1 posto de salva-vidas confirmado.",
    access: "Acesso a p\xE9 por trilha a partir do canto norte da Martim de S\xE1; n\xE3o h\xE1 estacionamento na praia.",
    profile: "Tranquila e isolada; surfistas e naturistas",
    capacity: "Baixa; pouco frequentada",
    lat: -23.628169,
    lng: -45.368109,
    description: "Pequena enseada em forma de concha, cercada pela Mata Atl\xE2ntica, entre a Martim de S\xE1 e a Praia do Capric\xF3rnio. O acesso \xE9 o principal filtro: chega-se por trilha a partir da Martim de S\xE1, e n\xE3o h\xE1 resid\xEAncias nem quiosques na areia. \xC9 uma praia de tombo, com ondas fortes e correntes em toda a extens\xE3o, preferida por surfistas; o canto esquerdo costuma oferecer as melhores condi\xE7\xF5es. A baixa frequ\xEAncia e o isolamento tamb\xE9m tornaram o local conhecido pela pr\xE1tica de nudismo."
  },
  {
    slug: "praia-da-freira",
    name: "Praia da Freira",
    neighborhood: "Camaroeiro (acesso pelo Complexo Tur\xEDstico do Camaroeiro)",
    photo: "praia-da-freira",
    sea: "Calmo; \xE1gua rasa e praticamente parada",
    structure: "Apenas um quiosque; sem banheiros ou posto de salva-vidas confirmados; poucas vagas de estacionamento antes da trilha.",
    access: "Trilha com escadaria de cerca de 100 degraus, corrim\xE3o e ilumina\xE7\xE3o, a partir do Complexo Tur\xEDstico do Camaroeiro (cerca de 160 m).",
    profile: "Tranquila; fam\xEDlias e casais",
    capacity: "Baixa a moderada; poucas vagas de estacionamento",
    lat: -23.629801,
    lng: -45.395377,
    description: "Tamb\xE9m chamada de Praia do Garcez, \xE9 uma pequena enseada abrigada entre o Camaroeiro e a Prainha, a cerca de 1 km do Centro. O mar \xE9 praticamente parado, raso e muito calmo, lembrando uma piscina natural, o que a torna indicada para fam\xEDlias com crian\xE7as. O acesso \xE9 feito por uma trilha curta com escadaria de cerca de 100 degraus e corrim\xE3o, a partir do Complexo Tur\xEDstico do Camaroeiro, sem estacionamento amplo na entrada. H\xE1 apenas um quiosque e poucas vagas de estacionamento, ent\xE3o o ambiente costuma ser tranquilo."
  },
  {
    slug: "cocanha",
    name: "Cocanha",
    neighborhood: "Cocanha",
    photo: "praia-cocanha",
    sea: "Calmo no lado esquerdo; praia pouco abrigada, sujeita a agita\xE7\xE3o",
    structure: "Grande quantidade de quiosques na faixa de areia e ranchos de pescadores; banheiros e salva-vidas n\xE3o confirmados.",
    access: "Pela Rodovia Rio\u2013Santos (SP-55), a cerca de 12 km do Centro; estacionamento na orla, sujeito a satura\xE7\xE3o na alta temporada.",
    profile: "Fam\xEDlias e turismo gastron\xF4mico",
    capacity: "Alta na alta temporada; acesso vi\xE1rio saturado",
    lat: -23.576505,
    lng: -45.313665,
    description: "Praia a cerca de 12 km do Centro, formada por comunidade de pescadores artesanais e cercada pela Mata Atl\xE2ntica. O lado esquerdo concentra \xE1guas mais calmas e rasas, bom para crian\xE7as, enquanto a praia como um todo \xE9 pouco abrigada e pode ficar agitada. A orla tem boa estrutura de quiosques, muitos especializados em frutos do mar, e \xE9 ponto de partida para passeios \xE0 Ilha da Cocanha. Na alta temporada, o acesso vi\xE1rio costuma saturar."
  },
  {
    slug: "massaguacu",
    name: "Massagua\xE7u",
    neighborhood: "Massagua\xE7u",
    photo: "praia-massaguacu",
    sea: "Ondas fortes; praia de tombo com correntes pr\xF3ximas \xE0 orla",
    structure: "Quiosques e restaurantes na orla; banheiros e salva-vidas n\xE3o confirmados.",
    access: "A Rodovia Caraguatatuba\u2013Ubatuba (SP-55) margeia a praia; estacionamento na via (n\xE3o confirmado).",
    profile: "Tranquila; pescadores e surfistas",
    capacity: "Baixa a moderada; pouco frequentada por banhistas",
    lat: -23.58962,
    lng: -45.33191,
    description: "Praia aberta e de grande extens\xE3o, logo ao norte do Capric\xF3rnio, acompanhada de perto pela rodovia Caraguatatuba\u2013Ubatuba. Quase toda a orla \xE9 de tombo, com ondas e correntes que passam perto da areia, exigindo cuidado de quem entra no mar. \xC9 pouco frequentada por banhistas e mais procurada para pesca esportiva de linha e surfe. No canto norte, perto da rodovia, h\xE1 uma vila de pescadores onde ainda se fabricam canoas e artesanato."
  },
  {
    slug: "mococa",
    name: "Mococa",
    neighborhood: "Mococa",
    photo: "praia-mococa",
    sea: "Calmo",
    structure: "V\xE1rios quiosques e \xE1rea de estacionamento pr\xF3xima; banheiros e salva-vidas n\xE3o confirmados.",
    access: "Pela SP-55, a cerca de 14 km do Centro; estacionamento pr\xF3ximo aos quiosques.",
    profile: "Tranquila; fam\xEDlias e natureza",
    capacity: "Moderada; tranquila",
    lat: -23.573699,
    lng: -45.30079,
    description: "Fica entre a Cocanha e a Tabatinga, junto \xE0 foz do Rio Mococa, a cerca de 14 km do Centro. \xC9 uma das praias mais limpas e preservadas do munic\xEDpio, com areia escura de origem monaz\xEDtica e mar calmo, bom para fam\xEDlias e esportes como caiaque e stand up paddle. A orla tem v\xE1rios quiosques e \xE1reas para estacionar, mas a infraestrutura \xE9 mais simples que a das praias centrais. O canto esquerdo, na foz do rio, \xE9 usado para banhos curtos e como sa\xEDda para a Ilha do Tamandu\xE1."
  },
  {
    slug: "prainha",
    name: "Prainha",
    neighborhood: "Prainha",
    photo: "praia-prainha",
    sea: "Calmo e raso",
    structure: "Boa infraestrutura de quiosques; banheiros e salva-vidas n\xE3o confirmados.",
    access: "Acesso pela Av. da Praia, a menos de 3 km do Centro.",
    profile: "Badalada; fam\xEDlias e jovens",
    capacity: "Alta; muito movimentada",
    lat: -23.631133,
    lng: -45.391088,
    description: "Pequena enseada abrigada por cost\xF5es rochosos, entre a Pedra da Freira e a Martim de S\xE1, a menos de 3 km do Centro. O mar \xE9 calmo e raso, e a orla tem boa infraestrutura de quiosques, o que a torna muito procurada por fam\xEDlias e jovens. No canto esquerdo, uma trilha curta leva \xE0 Pedra do Jacar\xE9, mirante popular. No boletim da CETESB de outubro/novembro de 2026, o ponto da Prainha apareceu como impr\xF3prio para banho."
  },
  {
    slug: "tabatinga",
    name: "Tabatinga",
    neighborhood: "Tabatinga",
    photo: "praia-tabatinga",
    sea: "Calmo",
    structure: "Resorts e hot\xE9is, marinas e vila de pescadores com ranchos de canoas; quiosques, banheiros e salva-vidas n\xE3o confirmados.",
    access: "Pela SP-55, a cerca de 18\u201321 km do Centro; acesso \xE0 areia por vias locais.",
    profile: "Fam\xEDlias e h\xF3spedes de resorts; passeios de barco",
    capacity: "Moderada a alta, sobretudo nos passeios de barco",
    lat: -23.57483,
    lng: -45.28361,
    description: "\xDAltima praia do munic\xEDpio antes da divisa com Ubatuba, a cerca de 18\u201321 km do Centro. A areia \xE9 fina e clara, o mar \xE9 calmo e a orla concentra resorts e hot\xE9is, al\xE9m de uma vila de pescadores com ranchos de canoas. Do lado norte do Rio Tabatinga h\xE1 intenso tr\xE1fego de lanchas, jet-skis e caiaques, e \xE9 dali que saem muitos passeios para a Ilha do Tamandu\xE1. O lado sul \xE9 ocupado por condom\xEDnio fechado, acess\xEDvel pela faixa de areia."
  }
];
const points = [
  {
    slug: "morro-santo-antonio",
    name: "Morro Santo Ant\xF4nio",
    neighborhood: "Sumar\xE9 (acesso pela Estrada do Morro Santo Ant\xF4nio)",
    photo: "ponto-morro-santo-antonio",
    access: "Entrada pela Estrada do Morro Santo Ant\xF4nio, no bairro Sumar\xE9; subida de carro ou a p\xE9 (cerca de 2 km, \xEDngreme). Acesso gratuito; estacionamento pequeno e sem com\xE9rcio no topo.",
    structure: "Est\xE1tua de Santo Ant\xF4nio, rampa de decolagem de voo livre e mirante. Aberto diariamente, das 8h \xE0s 20h (confirmar antes da visita).",
    profile: "Mirante e voo livre",
    capacity: "Estacionamento pequeno",
    lat: -23.60972,
    lng: -45.40118,
    description: "Mirante a cerca de 325 metros de altitude, logo atr\xE1s do Centro, com est\xE1tua de Santo Ant\xF4nio, padroeiro da cidade. Do alto se v\xEA a ba\xEDa, a orla, a Serra do Mar e, em dias claros, o canal de S\xE3o Sebasti\xE3o e Ilhabela. O local tem rampa de decolagem de voo livre e parapente e recebe missa campal em junho."
  },
  {
    slug: "camaroeiro",
    name: "Camaroeiro",
    neighborhood: "Prainha",
    photo: "ponto-camaroeiro",
    access: "Rua Jos\xE9 Vieira da Mota, s/n, Prainha; acesso de carro ou a p\xE9 pela subida que contorna o morro.",
    structure: "Complexo de mirantes, pra\xE7a e arquibancada; visita\xE7\xE3o gratuita. Aberto diariamente, das 8h \xE0s 17h (eventos podem estender o hor\xE1rio).",
    profile: "Mirante, eventos e gastronomia",
    capacity: "Moderada",
    lat: -23.62821,
    lng: -45.39482,
    description: "Complexo de mirantes no morro entre o Centro e a Prainha, com vista panor\xE2mica da ba\xEDa e da orla de Caraguatatuba. O espa\xE7o recebe shows, food trucks e programa\xE7\xE3o cultural em fins de semana. A visita\xE7\xE3o \xE9 gratuita."
  },
  {
    slug: "parque-trombini",
    name: "Parque Trombini",
    neighborhood: "Sumar\xE9 (orla do Centro)",
    photo: "ponto-parque-trombini",
    access: "Av. Dr. Arthur da Costa Filho, 1500, Sumar\xE9/Centro; acesso a p\xE9 a partir da orla do Centro e do Caragu\xE1 Praia Shopping.",
    structure: "Parque de divers\xF5es privado em funcionamento desde 1957, com mais de 50 brinquedos em 6.500 m\xB2. Sexta a domingo e feriados a partir das 17h30; diariamente em janeiro (confirmar no Instagram @parktrombini).",
    profile: "Fam\xEDlias com crian\xE7as e adolescentes",
    capacity: "Alta nos fins de semana",
    lat: -23.625461,
    lng: -45.410769,
    description: "Parque de divers\xF5es privado operado pela fam\xEDlia Trombini, na orla central, em frente ao Caragu\xE1 Praia Shopping. A marca oficial \xE9 Park Trombini (Parque de Divers\xF5es Trombini); n\xE3o se trata de um parque estadual. \xC9 um programa tradicional para fam\xEDlias h\xE1 mais de 60 anos."
  },
  {
    slug: "macc",
    name: "MACC",
    neighborhood: "Centro",
    photo: "ponto-macc",
    access: "Pra\xE7a Dr. C\xE2ndido Motta, 72, Centro; acesso a p\xE9 a partir da orla central e da Pra\xE7a da Cultura.",
    structure: "Museu no Polo Cultural Prof\xAA Adaly Coelho Passos, com exposi\xE7\xF5es, Videoteca L\xFAcio Braun e a\xE7\xF5es educativas. Ter\xE7a a sexta, das 10h \xE0s 19h; s\xE1bado, das 13h \xE0s 19h. Entrada gratuita.",
    profile: "Cultura e hist\xF3ria cai\xE7ara",
    capacity: "Moderada",
    lat: -23.622467,
    lng: -45.410988,
    description: "O Museu de Arte e Cultura de Caraguatatuba funciona em uma casa tradicional cai\xE7ara no Centro. A programa\xE7\xE3o inclui exposi\xE7\xF5es tempor\xE1rias, sess\xF5es na Videoteca L\xFAcio Braun e a\xE7\xF5es educativas sobre a hist\xF3ria e a cultura local. A entrada \xE9 gratuita. Contato: WhatsApp (12) 3897-5662."
  },
  {
    slug: "pesm-nucleo-caraguatatuba",
    name: "PESM \u2014 N\xFAcleo Caraguatatuba",
    category: "TRILHA",
    neighborhood: "Rio do Ouro",
    photo: "ativ-trilhas",
    access: "Rua do Horto Florestal, 1200, Rio do Ouro, pr\xF3ximo ao km 81 da Rodovia dos Tamoios; visita\xE7\xE3o com agendamento pr\xE9vio.",
    structure: "Unidade de conserva\xE7\xE3o com 35.947 hectares de Mata Atl\xE2ntica. Trilhas Jequitib\xE1, Po\xE7\xE3o, Esmeralda, Palmeiras, Mirante dos Caraguat\xE1s e Rota das Aves; cachoeiras e piscinas naturais. Ter\xE7a a domingo, das 8h \xE0s 17h. Ingresso de R$ 19 para brasileiros.",
    profile: "Ecoturismo e trilhas monitoradas",
    capacity: "Limitada por agendamento",
    lat: -23.596532,
    lng: -45.429594,
    description: "O N\xFAcleo Caraguatatuba do Parque Estadual da Serra do Mar protege um dos maiores remanescentes de Mata Atl\xE2ntica do estado. As trilhas variam de f\xE1ceis (Jequitib\xE1, at\xE9 1 km) a dif\xEDceis (Esmeralda, 4\u20135 km com cachoeira de cerca de 10 m). A visita\xE7\xE3o exige agendamento pr\xE9vio e monitoria em v\xE1rias trilhas. Este \xE9 o parque estadual do munic\xEDpio, diferente do Park Trombini."
  },
  {
    slug: "cachoeira-do-mancha",
    name: "Cachoeira do Mancha",
    category: "CACHOEIRA",
    neighborhood: "Canta Galo",
    photo: "preservacao-floresta",
    access: "Estrada do Canta Galo, 6705, a cerca de 7 km do Centro, com pequena trilha at\xE9 a queda.",
    structure: "Acesso por trilha; leve repelente e \xE1gua. N\xE3o h\xE1 estrutura de apoio confirmada.",
    profile: "Banho de cachoeira e contato com a Mata Atl\xE2ntica",
    capacity: "Baixa",
    lat: null,
    lng: null,
    description: "Cachoeira a cerca de 7 km do Centro, com acesso por uma pequena trilha a partir da Estrada do Canta Galo. O local \xE9 procurado para banho de \xE1gua fria e contato com a Mata Atl\xE2ntica. Leve repelente, \xE1gua e recolha todo o lixo produzido."
  }
];
const activities = [
  {
    slug: "stand-up-paddle",
    name: "Stand up Paddle",
    photo: "ativ-paddle",
    location: "Praia de Tabatinga (EcoPaddle Tabatinga); Mococa e Pedra da Freira (mar calmo)",
    contact: "(12) 99665-9371 \u2014 Instagram @ecopaddle",
    schedule: "Aulas e loca\xE7\xE3o conforme condi\xE7\xF5es de mar; confirmar hor\xE1rios com o operador",
    priceInfo: null,
    description: "Aulas, aluguel de pranchas e passeios em \xE1guas calmas, especialmente na Praia de Tabatinga, na Mococa e na Pedra da Freira. A EcoPaddle Tabatinga mant\xE9m aulas e loca\xE7\xE3o de stand up, caiaque e canoa havaiana na divisa Caraguatatuba/Ubatuba."
  },
  {
    slug: "passeio-de-barco",
    name: "Passeio de barco",
    photo: "ativ-passeio-barco",
    location: "Embarque na Praia de Tabatinga; Ilhas do Tamandu\xE1 e da Cocanha",
    contact: "(12) 98262-8632 (WhatsApp) \u2014 contato@nasilhas.com.br; Neves: (11) 94503-3626",
    schedule: "Di\xE1rias de 10h \xE0s 16h (passeio privativo de 5 a 6 horas)",
    priceInfo: "Consulte o operador",
    description: "Passeios de lancha para as Ilhas do Tamandu\xE1 e da Cocanha, com paradas para mergulho, stand up paddle e quiosques nas ilhas. H\xE1 op\xE7\xF5es privativas de 5 a 6 horas e di\xE1rias das 10h \xE0s 16h que tamb\xE9m alcan\xE7am Ubatuba, Ilha Anchieta e Ilhabela, com mergulhador profissional a bordo."
  },
  {
    slug: "paraquedas",
    name: "Paraquedas",
    photo: "ativ-paraquedas",
    location: "Morro Santo Ant\xF4nio (parapente e voo livre)",
    contact: null,
    schedule: "Conforme condi\xE7\xF5es de vento",
    priceInfo: "Consulte operadores credenciados no local",
    description: "N\xE3o foi localizado operador de parasail (paraquedas rebocado por lancha) com atua\xE7\xE3o confirmada em Caraguatatuba. A pr\xE1tica confirmada na cidade \xE9 o voo livre/parapente, com rampa de decolagem no Morro Santo Ant\xF4nio e vista sobre a ba\xEDa; procure operadores credenciados no local antes de voar."
  },
  {
    slug: "velejar",
    name: "Velejar",
    photo: "ativ-velejar",
    location: "Praia do Centro (aulas de inicia\xE7\xE3o)",
    contact: "WhatsApp (12) 99614-3903 \u2014 Instagram @caravellasescola",
    schedule: "Cursos, cl\xEDnicas de um dia e aulas avulsas; consultar turmas",
    priceInfo: null,
    description: "A Caravellas Escola de Vela oferece curso b\xE1sico em monotipos, cl\xEDnicas de um dia, aulas avulsas e viv\xEAncias de vela oce\xE2nica, com instrutores certificados pela CBVELA. As aulas de inicia\xE7\xE3o saem da Praia do Centro, aproveitando os ventos de sudeste e leste da ba\xEDa."
  },
  {
    slug: "trilhas",
    name: "Trilhas",
    photo: "ativ-trilhas",
    location: "PESM N\xFAcleo Caraguatatuba (Rio do Ouro) e Morro Santo Ant\xF4nio",
    contact: "PESM: (12) 3882-5999 \u2014 pesm.caragua@fflorestal.sp.gov.br",
    schedule: "PESM: ter\xE7a a domingo, das 8h \xE0s 17h, com agendamento",
    priceInfo: "PESM: ingresso de R$ 19 para brasileiros",
    description: "Trilhas monitoradas na Mata Atl\xE2ntica, como Jequitib\xE1 (at\xE9 1 km, f\xE1cil), Po\xE7\xE3o (3\u20134 km, moderada, Cachoeira da Pedra Redonda) e Esmeralda (4\u20135 km, dif\xEDcil, cachoeira de cerca de 10 m). A Trilha do Morro Santo Ant\xF4nio sobe cerca de 2 km at\xE9 o mirante a 325 m. A visita\xE7\xE3o ao PESM exige agendamento pr\xE9vio e monitoria em v\xE1rias trilhas."
  }
];
const restaurants = [
  {
    slug: "garage-bar-steakhouse",
    name: "Garage Bar Steakhouse",
    photo: "rest-garage",
    neighborhood: "Centro",
    address: "Pra\xE7a Dr. Di\xF3genes Ribeiro de Lima, 699, Lj 13, Centro",
    contact: "(12) 2132-7026",
    cuisine: "Steakhouse e hamburgueria",
    openingHours: { "Segunda a sexta": "18h \xE0s 00h", "S\xE1bado e domingo": "12h \xE0s 00h" },
    priceRange: "$$",
    description: "Steakhouse no Centro de Caraguatatuba, com carnes grelhadas, hamb\xFArgueres e por\xE7\xF5es. Funciona \xE0 noite durante a semana e desde o meio-dia nos fins de semana."
  },
  {
    slug: "mar-e-terra",
    name: "Mar & Terra",
    photo: "rest-mar-e-terra",
    neighborhood: "Massagua\xE7u",
    address: "Av. Maria de Lourdes da Silva Kfouri, 897, Massagua\xE7u",
    contact: "(12) 3884-5489",
    cuisine: "Frutos do mar e cozinha brasileira",
    openingHours: null,
    priceRange: "$$",
    description: "Restaurante em Massagua\xE7u com pratos de frutos do mar e cozinha brasileira, em ambiente amplo pr\xF3ximo \xE0 praia. O atendimento se encerra por volta das 23h; confirme os dias de funcionamento antes da visita."
  },
  {
    slug: "alecrim-restaurante",
    name: "Alecrim Restaurante",
    photo: "rest-alecrim",
    neighborhood: "Centro",
    address: "Av. Dr. Arthur da Costa Filho, 399, Centro",
    contact: null,
    cuisine: "Cozinha brasileira e pratos do dia",
    openingHours: null,
    priceRange: "$$",
    description: "Restaurante no Centro, na avenida da orla, com pratos da cozinha brasileira e op\xE7\xF5es para almo\xE7o. Consulte hor\xE1rios e reservas diretamente com o estabelecimento."
  },
  {
    slug: "ostra-e-ourico",
    name: "Ostra & Ouri\xE7o",
    photo: "rest-ostra-ourico",
    neighborhood: "Pontal de Santa Marina",
    address: "Rua Prud\xEAncia Baeta, 21, Pontal de Santa Marina",
    contact: "(12) 3887-1500 / (12) 99637-8749",
    cuisine: "Frutos do mar",
    openingHours: { "Ter\xE7a a s\xE1bado": "11h30 \xE0s 23h", Domingo: "11h30 \xE0s 17h30" },
    priceRange: "$$$",
    description: "Casa especializada em frutos do mar no Pontal de Santa Marina, com ostras, mexilh\xF5es e pratos \xE0 base de pescados. Abre de ter\xE7a a domingo; fecha \xE0s segundas-feiras."
  },
  {
    slug: "ticos-burger",
    name: "Tico's Burger",
    photo: "rest-ticos-burger",
    neighborhood: "Massagua\xE7u",
    address: "Rua Pedro Leandro, 65, Massagua\xE7u",
    contact: "(12) 3600-9050 / WhatsApp (12) 99617-7376",
    cuisine: "Hamburgueria artesanal",
    openingHours: null,
    priceRange: "$",
    description: "Hamburgueria artesanal em Massagua\xE7u, com hamb\xFArgueres montados na hora, batatas e op\xE7\xF5es para viagem. Atende por telefone e WhatsApp; consulte o hor\xE1rio de funcionamento do dia."
  },
  {
    slug: "zanfredo",
    name: "Zanfredo",
    photo: "rest-zanfredo",
    neighborhood: "Centro",
    address: "Av. Prestes Maia, 508, Centro",
    contact: "(12) 3883-5635",
    cuisine: "Cozinha italiana e brasileira",
    openingHours: null,
    priceRange: "$$",
    description: "Restaurante tradicional no Centro, com massas, pratos de frutos do mar e receitas da cozinha \xEDtalo-brasileira. Consulte hor\xE1rios e reservas pelo telefone."
  },
  {
    slug: "imperial-bar-e-restaurante",
    name: "Imperial Bar e Restaurante",
    photo: "rest-imperial",
    neighborhood: "Centro",
    address: null,
    contact: null,
    cuisine: "Bar e restaurante",
    openingHours: null,
    priceRange: null,
    description: "Bar e restaurante listado no guia gastron\xF4mico de Caraguatatuba. Em verifica\xE7\xF5es recentes, o estabelecimento constava como fechado; confirme o funcionamento antes de se deslocar."
  },
  {
    slug: "caicaras-restaurante",
    name: "Cai\xE7ara's Restaurante",
    photo: "rest-caicaras",
    neighborhood: "Centro",
    address: "Av. Frei Pac\xEDfico Wagner, 498, Centro",
    contact: "(12) 2132-2772",
    cuisine: "Culin\xE1ria cai\xE7ara e frutos do mar",
    openingHours: null,
    priceRange: "$$",
    description: "Restaurante de culin\xE1ria cai\xE7ara no Centro, com peixes, frutos do mar e receitas tradicionais da costa norte paulista. Consulte hor\xE1rios pelo telefone."
  }
];
const accommodations = [
  {
    slug: "hotel-areia-branca",
    name: "Hotel Areia Branca",
    photo: "hosp-1",
    category: "Hotel",
    neighborhood: "Centro",
    address: "Av. Dr. Arthur Costa Filho, 615, Centro",
    contactPhone: "(12) 3882-2133",
    description: "Hotel no Centro de Caraguatatuba, pr\xF3ximo \xE0 orla central e a poucos minutos da Praia do Centro. Hospedagem pr\xE1tica para quem quer explorar a cidade a p\xE9.",
    amenities: ["Wi-Fi", "Estacionamento"]
  },
  {
    slug: "hotel-atlantico-sul",
    name: "Hotel Atl\xE2ntico Sul",
    photo: "hosp-2",
    category: "Hotel",
    neighborhood: "Centro",
    address: "Rua Sebasti\xE3o Mariano Nepomuceno, 77, Centro",
    contactPhone: "(12) 3882-1713",
    description: "Hotel central com f\xE1cil acesso ao com\xE9rcio, \xE0 Pra\xE7a da Cultura e \xE0 orla de Caraguatatuba. Boa base para roteiros pela cidade e pelo litoral norte.",
    amenities: ["Wi-Fi"]
  },
  {
    slug: "hotel-mar",
    name: "Hotel Mar",
    photo: "hosp-3",
    category: "Hotel",
    neighborhood: "Centro",
    address: "Rua S\xE3o Jos\xE9 dos Campos, 159, Centro",
    contactPhone: "(12) 3883-5222",
    description: "Op\xE7\xE3o de hospedagem no Centro, com localiza\xE7\xE3o conveniente para quem chega de \xF4nibus ou carro e quer conhecer as praias centrais.",
    amenities: ["Wi-Fi"]
  },
  {
    slug: "hotel-litoral-norte",
    name: "Hotel Litoral Norte",
    photo: "hosp-4",
    category: "Hotel",
    neighborhood: "Centro",
    address: "Av. Artur Costa Filho, 325, Centro",
    contactPhone: "(12) 3883-1655",
    description: "Hotel na avenida da orla central, com acesso r\xE1pido \xE0 Praia do Centro, ao Park Trombini e \xE0 gastronomia do Centro.",
    amenities: ["Wi-Fi", "Estacionamento"]
  },
  {
    slug: "hotel-costa-norte-massaguacu",
    name: "Hotel Costa Norte Massagua\xE7u",
    photo: "hosp-5",
    category: "Hotel",
    neighborhood: "Massagua\xE7u",
    address: "Rod. SP-55, km 92, Massagua\xE7u",
    contactPhone: "(12) 3884-9000",
    description: "Hotel \xE0s margens da SP-55, em Massagua\xE7u, com acesso direto \xE0s praias do norte do munic\xEDpio e \xE0 rota para Ubatuba.",
    amenities: ["Wi-Fi", "Estacionamento", "Piscina"]
  },
  {
    slug: "pousada-assojuris",
    name: "Pousada Assojuris",
    photo: "hosp-6",
    category: "Pousada",
    neighborhood: "Martim de S\xE1",
    address: "Rua Guanandy, 35, Martim de S\xE1",
    contactPhone: "(12) 99634-2840",
    description: "Pousada no bairro Martim de S\xE1, perto da praia mais movimentada da cidade e de quiosques, bares e ciclovia.",
    amenities: ["Wi-Fi"]
  },
  {
    slug: "pousada-da-costa",
    name: "Pousada da Costa",
    photo: "hosp-7",
    category: "Pousada",
    neighborhood: "Centro",
    address: "Av. Dr. Arthur da Costa Filho, 39, Centro",
    contactPhone: "(12) 3882-1369",
    description: "Pousada na avenida da orla central, com localiza\xE7\xE3o estrat\xE9gica para caminhar at\xE9 a praia, o Centro e os mirantes.",
    amenities: ["Wi-Fi"]
  },
  {
    slug: "pousada-jofisa",
    name: "Pousada Jofisa",
    photo: "hosp-8",
    category: "Pousada",
    neighborhood: "Centro",
    address: "Rua Maj. Aires, 58, Centro",
    contactPhone: "Reservas (11) 2391-9751",
    description: "Pousada no Centro de Caraguatatuba, com reservas por telefone. Boa op\xE7\xE3o para quem busca uma estadia simples e bem localizada.",
    amenities: ["Wi-Fi"]
  }
];
const events = [
  {
    slug: "carnagua-folia-2026",
    name: "Carnagu\xE1 Folia",
    photo: "evento-carnaval",
    start: "2026-02-13",
    end: "2026-02-17",
    time: "Programa\xE7\xE3o a partir das 18h",
    place: "Orla do Centro e Pra\xE7a da Cultura",
    address: "Av. Dr. Arthur da Costa Filho, Centro",
    entry: "Gratuito",
    description: "Carnaval de rua de Caraguatatuba, com blocos, trios e apresenta\xE7\xF5es na orla central e na Pra\xE7a da Cultura. A programa\xE7\xE3o oficial \xE9 divulgada pela Prefeitura e pela Fundacc antes de cada edi\xE7\xE3o."
  },
  {
    slug: "festa-de-iemanja-2026",
    name: "42\xAA Festa de Iemanj\xE1",
    photo: "evento-praia",
    start: "2026-12-05",
    end: null,
    time: "Abertura oficial \xE0s 19h",
    place: "Praia do Centro, junto \xE0 est\xE1tua de Iemanj\xE1",
    address: "Praia do Centro",
    entry: "Gratuito",
    description: "Festa religiosa e cultural na Praia do Centro, com tendas ao longo da orla, oferendas e apresenta\xE7\xF5es. A 42\xAA edi\xE7\xE3o tem abertura oficial \xE0s 19h do dia 5 de dezembro."
  },
  {
    slug: "aniversario-169-anos",
    name: "Anivers\xE1rio de Caraguatatuba \u2014 169 anos",
    photo: "evento-show",
    start: "2026-04-20",
    end: "2026-04-30",
    time: "Programa\xE7\xE3o divulgada pela Prefeitura",
    place: "Programa\xE7\xE3o descentralizada pela cidade",
    address: null,
    entry: "Gratuito",
    description: "Caraguatatuba celebra em 20 de abril os 169 anos de emancipa\xE7\xE3o, com agenda descentralizada de shows, cultura e atividades comunit\xE1rias ao longo do m\xEAs."
  },
  {
    slug: "projeto-verao-2026",
    name: "Projeto Ver\xE3o",
    photo: "evento-verao",
    start: "2026-01-01",
    end: "2026-02-28",
    time: "Programa\xE7\xE3o diurna e noturna",
    place: "Praias e pra\xE7as de Caraguatatuba",
    address: null,
    entry: "Gratuito",
    description: "Programa\xE7\xE3o de ver\xE3o da Prefeitura, com esportes na areia, aulas, atividades culturais e a\xE7\xF5es de conscientiza\xE7\xE3o nas praias e pra\xE7as durante a alta temporada."
  },
  {
    slug: "festa-de-santo-antonio-2026",
    name: "173\xAA Festa de Santo Ant\xF4nio",
    photo: "evento-feira",
    start: "2026-05-29",
    end: "2026-06-28",
    time: "Programa\xE7\xE3o a confirmar",
    place: "Pra\xE7a de Santo Ant\xF4nio e Morro Santo Ant\xF4nio",
    address: "Sumar\xE9",
    entry: "Gratuito",
    description: "Festa tradicional em homenagem ao padroeiro, com quermesse, m\xFAsica, barracas e missa campal no Morro Santo Ant\xF4nio. Em 2026 a 173\xAA edi\xE7\xE3o se estende de 29 de maio a 28 de junho."
  },
  {
    slug: "arraia-de-caraguatatuba-2026",
    name: "1\xBA Arrai\xE1 de Caraguatatuba",
    photo: "evento-festival",
    start: "2026-07-03",
    end: "2026-07-05",
    time: "A partir das 18h",
    place: "Pra\xE7a da Cultura",
    address: "Centro",
    entry: "Gratuito",
    description: "Festa junina municipal na Pra\xE7a da Cultura, com quadrilhas, forr\xF3, comidas t\xEDpicas e apresenta\xE7\xF5es culturais."
  },
  {
    slug: "caragua-a-gosto-2026",
    name: "Caragu\xE1 a Gosto",
    photo: "evento-artesanato",
    start: "2026-08-01",
    end: "2026-09-09",
    time: "Conforme hor\xE1rio dos restaurantes participantes",
    place: "Restaurantes participantes de Caraguatatuba",
    address: null,
    entry: "Pratos com pre\xE7o fixo definido pelo festival",
    description: "Maior festival gastron\xF4mico do Litoral Norte. A 21\xAA edi\xE7\xE3o reuniu 52 estabelecimentos e 79 pratos, com premia\xE7\xE3o em sete categorias no Teatro Mario Covas."
  },
  {
    slug: "park-fest-2026",
    name: "Park Fest",
    photo: "evento-musica",
    start: "2026-10-09",
    end: "2026-10-12",
    time: "Programa\xE7\xE3o cultural ao longo do dia",
    place: "Pra\xE7a da Cultura",
    address: "Centro",
    entry: "Gratuito",
    description: "Quatro dias de m\xFAsica, oficinas e apresenta\xE7\xF5es na Pra\xE7a da Cultura, integrando a agenda cultural de outubro da cidade."
  },
  {
    slug: "feira-municipal-de-arte-e-artesanato",
    name: "Feira Municipal de Arte e Artesanato",
    photo: "evento-feira",
    start: "2026-01-10",
    end: "2026-12-20",
    time: "Fins de semana",
    place: "Pra\xE7a Dr. Di\xF3genes Ribeiro de Lima",
    address: "Centro",
    entry: "Gratuito",
    description: "Feira permanente de artesanato e arte cai\xE7ara no Centro, com cerca de 90 quiosques de artes\xE3os da Pra\xE7a Di\xF3genes Ribeiro de Lima. Boa parada para comprar lembran\xE7as e conhecer o trabalho local."
  },
  {
    slug: "reveillon-caraguatatuba-2026",
    name: "R\xE9veillon Caraguatatuba",
    photo: "evento-trombini",
    start: "2026-12-31",
    end: null,
    time: "Shows a partir das 22h; queima de fogos \xE0 meia-noite",
    place: "Orla de Caraguatatuba (Centro, Indai\xE1, Porto Novo e Praia Brava)",
    address: null,
    entry: "Gratuito",
    description: "Virada do ano com shows e queima de fogos sem estampido em diferentes regi\xF5es da cidade. A programa\xE7\xE3o oficial \xE9 divulgada pela Prefeitura em dezembro."
  }
];
const sustainability = [
  {
    slug: "descarte-correto-de-lixo",
    title: "Descarte seu lixo corretamente",
    category: "DESCARTE",
    summary: "Leve seu res\xEDduo de volta e use as lixeiras da orla. Praia limpa come\xE7a com quem visita.",
    image: "cuidar-descarte",
    content: "Na areia n\xE3o h\xE1 coleta durante o banho de mar. Leve uma sacola, recolha embalagens, copos e bitucas e deposite nas lixeiras da orla ou leve embora. Bitucas e pl\xE1sticos levam s\xE9culos para se decompor e s\xE3o confundidos com alimento por aves, tartarugas e peixes. Participar de mutir\xF5es de limpeza organizados no munic\xEDpio \xE9 uma forma direta de ajudar."
  },
  {
    slug: "respeite-a-natureza",
    title: "Respeite a natureza e seus recursos",
    category: "ORIENTACAO",
    summary: "N\xE3o alimente animais, n\xE3o retire conchas ou plantas e mantenha dist\xE2ncia da fauna.",
    image: "cuidar-natureza",
    content: "Alimentar gaivotas, saguis ou outras esp\xE9cies altera o comportamento dos animais e prejudica sua sa\xFAde. N\xE3o retire conchas, pedras, plantas de restinga ou mudas de mangue. Mantenha dist\xE2ncia de ninhos, filhotes e \xE1reas de desova de tartarugas. Em rios e cachoeiras, use protetor solar biodegrad\xE1vel e evite sabonetes."
  },
  {
    slug: "materiais-reciclaveis",
    title: "Priorize mat\xE9rias recicl\xE1veis",
    category: "DICA",
    summary: "Prefira garrafas reutiliz\xE1veis, evite descart\xE1veis e separe res\xEDduos para a coleta seletiva.",
    image: "cuidar-reciclaveis",
    content: "Troque copos e canudos descart\xE1veis por vers\xF5es reutiliz\xE1veis e prefira embalagens de vidro, papel ou alum\xEDnio. Na cidade, separe papel, pl\xE1stico, vidro e metal para a coleta seletiva e para os pontos de entrega volunt\xE1ria. A Feira Municipal de Arte e Artesanato valoriza produtos locais e artesanais, uma alternativa ao consumo de itens descart\xE1veis."
  },
  {
    slug: "preserve-trilhas",
    title: "Preserve as trilhas e \xE1reas naturais",
    category: "ORIENTACAO",
    summary: "Fique na trilha, n\xE3o fa\xE7a fogo e agende a visita \xE0s unidades de conserva\xE7\xE3o.",
    image: "cuidar-trilhas",
    content: "No N\xFAcleo Caraguatatuba do Parque Estadual da Serra do Mar, a visita\xE7\xE3o a v\xE1rias trilhas exige agendamento e monitoria. Fique no caminho sinalizado, n\xE3o corte vegeta\xE7\xE3o, n\xE3o fa\xE7a fogueiras e n\xE3o deixe res\xEDduos. Trilhas degradadas perdem solo, aumentam a eros\xE3o e comprometem a fauna local. Leve \xE1gua, repelente e cal\xE7ado adequado."
  },
  {
    slug: "manguezais-e-restinga",
    title: "Manguezais e restinga: ber\xE7\xE1rios da vida marinha",
    category: "PROJETO",
    summary: "Caraguatatuba tem manguezais e restingas que protegem a costa e abrigam esp\xE9cies.",
    image: "preservacao-floresta",
    content: "Manguezais e restingas funcionam como ber\xE7\xE1rios para peixes, crust\xE1ceos e aves, al\xE9m de proteger a orla contra a eros\xE3o. N\xE3o remova plantas, n\xE3o aterre \xE1reas \xFAmidas e apoie projetos locais de recupera\xE7\xE3o. A qualidade da \xE1gua tamb\xE9m depende desses ambientes: acompanhe a balneabilidade oficial da CETESB antes de entrar no mar."
  }
];
async function main() {
  console.log("Iniciando seed do Caragua360\u2026");
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@caragua360.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "Caragua360#2026";
  const touristEmail = "turista@caragua360.com";
  const residentEmail = "morador@caragua360.com";
  const hash = await bcrypt.hash(adminPassword, 10);
  const demoHash = await bcrypt.hash("Caragua360#2026", 10);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      fullName: "Administra\xE7\xE3o Caragua360",
      username: "caragua360.admin",
      email: adminEmail,
      passwordHash: hash,
      role: "ADMIN",
      city: "Caraguatatuba"
    }
  });
  const tourist = await prisma.user.upsert({
    where: { email: touristEmail },
    update: {},
    create: {
      fullName: "Ana Turista",
      username: "ana.turista",
      email: touristEmail,
      passwordHash: demoHash,
      role: "TOURIST",
      city: "S\xE3o Paulo",
      neighborhood: "Pinheiros"
    }
  });
  const resident = await prisma.user.upsert({
    where: { email: residentEmail },
    update: {},
    create: {
      fullName: "Jo\xE3o Morador",
      username: "joao.morador",
      email: residentEmail,
      passwordHash: demoHash,
      role: "RESIDENT",
      city: "Caraguatatuba",
      neighborhood: "Massagua\xE7u"
    }
  });
  const localIds = /* @__PURE__ */ new Map();
  for (const beach of beaches) {
    const local = await prisma.local.upsert({
      where: { slug: beach.slug },
      update: {},
      create: {
        slug: beach.slug,
        name: beach.name,
        category: "PRAIA",
        description: beach.description,
        neighborhood: beach.neighborhood,
        latitude: beach.lat,
        longitude: beach.lng,
        access: beach.access,
        capacity: beach.capacity,
        sea: beach.sea,
        structure: beach.structure,
        profile: beach.profile,
        characteristics: { fonte: "Prefeitura de Caraguatatuba / Wikip\xE9dia" },
        createdById: admin.id
      }
    });
    localIds.set(beach.slug, local.id);
    if (await prisma.localPhoto.count({ where: { localId: local.id } }) === 0) {
      await prisma.localPhoto.create({ data: { localId: local.id, url: IMG(beach.photo), sortOrder: 0 } });
      const second = beaches.find((item) => item.slug !== beach.slug);
      if (second) await prisma.localPhoto.create({ data: { localId: local.id, url: IMG(second.photo), sortOrder: 1 } });
    }
  }
  for (const point of points) {
    const local = await prisma.local.upsert({
      where: { slug: point.slug },
      update: {},
      create: {
        slug: point.slug,
        name: point.name,
        category: point.category ?? "PONTO",
        description: point.description,
        neighborhood: point.neighborhood,
        latitude: point.lat,
        longitude: point.lng,
        access: point.access,
        capacity: point.capacity,
        structure: point.structure,
        profile: point.profile,
        characteristics: { fonte: "Prefeitura de Caraguatatuba / PESM / MACC" },
        createdById: admin.id
      }
    });
    localIds.set(point.slug, local.id);
    if (await prisma.localPhoto.count({ where: { localId: local.id } }) === 0) {
      await prisma.localPhoto.create({ data: { localId: local.id, url: IMG(point.photo), sortOrder: 0 } });
      await prisma.localPhoto.create({ data: { localId: local.id, url: IMG("praia-martim-de-sa"), sortOrder: 1 } });
    }
  }
  for (const activity of activities) {
    const created = await prisma.activity.upsert({
      where: { slug: activity.slug },
      update: {},
      create: {
        slug: activity.slug,
        name: activity.name,
        description: activity.description,
        location: activity.location,
        contact: activity.contact,
        schedule: activity.schedule,
        priceInfo: activity.priceInfo,
        neighborhood: "Caraguatatuba"
      }
    });
    if (await prisma.activityPhoto.count({ where: { activityId: created.id } }) === 0) {
      await prisma.activityPhoto.create({ data: { activityId: created.id, url: IMG(activity.photo), sortOrder: 0 } });
    }
  }
  for (const restaurant2 of restaurants) {
    const created = await prisma.restaurant.upsert({
      where: { slug: restaurant2.slug },
      update: {},
      create: {
        slug: restaurant2.slug,
        name: restaurant2.name,
        description: restaurant2.description,
        neighborhood: restaurant2.neighborhood,
        address: restaurant2.address,
        contact: restaurant2.contact,
        cuisine: restaurant2.cuisine,
        openingHours: restaurant2.openingHours ?? void 0,
        priceRange: restaurant2.priceRange
      }
    });
    if (await prisma.restaurantPhoto.count({ where: { restaurantId: created.id } }) === 0) {
      await prisma.restaurantPhoto.create({ data: { restaurantId: created.id, url: IMG(restaurant2.photo), sortOrder: 0 } });
    }
  }
  for (const item of accommodations) {
    const created = await prisma.accommodation.upsert({
      where: { slug: item.slug },
      update: {},
      create: {
        slug: item.slug,
        name: item.name,
        category: item.category,
        description: item.description,
        neighborhood: item.neighborhood,
        address: item.address,
        contactPhone: item.contactPhone,
        amenities: item.amenities
      }
    });
    if (await prisma.accommodationPhoto.count({ where: { accommodationId: created.id } }) === 0) {
      await prisma.accommodationPhoto.create({ data: { accommodationId: created.id, url: IMG(item.photo), sortOrder: 0 } });
    }
  }
  for (const event of events) {
    const created = await prisma.event.upsert({
      where: { slug: event.slug },
      update: {},
      create: {
        slug: event.slug,
        name: event.name,
        description: event.description,
        startDate: /* @__PURE__ */ new Date(`${event.start}T12:00:00Z`),
        endDate: event.end ? /* @__PURE__ */ new Date(`${event.end}T12:00:00Z`) : null,
        time: event.time,
        place: event.place,
        address: event.address,
        entryInfo: event.entry
      }
    });
    if (await prisma.eventPhoto.count({ where: { eventId: created.id } }) === 0) {
      await prisma.eventPhoto.create({ data: { eventId: created.id, url: IMG(event.photo), sortOrder: 0 } });
    }
  }
  for (const content of sustainability) {
    await prisma.sustainabilityContent.upsert({
      where: { slug: content.slug },
      update: {},
      create: {
        slug: content.slug,
        title: content.title,
        category: content.category,
        summary: content.summary,
        content: content.content,
        imageUrl: IMG(content.image)
      }
    });
  }
  const cetesbPoints = [
    ["Tabatinga \u2013 250 m do Rio Tabatinga", "tabatinga"],
    ["Tabatinga \u2013 anexo ao Condom\xEDnio Gaivotas", "tabatinga"],
    ["Mococa", "mococa"],
    ["Cocanha", "cocanha"],
    ["Massagua\xE7u", "massaguacu"],
    ["Capric\xF3rnio", null],
    ["Lagoa Azul", null],
    ["Martim de S\xE1", "martin-de-sa"],
    ["Prainha", "prainha"],
    ["Centro", null],
    ["Indai\xE1", null],
    ["Aruan", null],
    ["Palmeiras", null],
    ["Porto Novo", null]
  ];
  const measuredAt = /* @__PURE__ */ new Date();
  for (const [beachName, slug] of cetesbPoints) {
    const exists = await prisma.balneabilityRecord.findFirst({ where: { beachName, status: "NAO_AVALIADA" } });
    if (!exists) {
      await prisma.balneabilityRecord.create({
        data: {
          beachName,
          status: "NAO_AVALIADA",
          measuredAt,
          source: "CETESB \u2014 integra\xE7\xE3o n\xE3o configurada",
          sourceUrl: "https://praias.cetesb.sp.gov.br/",
          localId: slug ? localIds.get(slug) ?? null : null,
          raw: { observacao: "Consulte o boletim oficial da CETESB para a condi\xE7\xE3o atual." }
        }
      });
    }
  }
  async function upsertItinerary(options) {
    const existing = await prisma.itinerary.findFirst({ where: { title: options.title } });
    if (existing) return existing;
    const created = await prisma.itinerary.create({
      data: {
        userId: options.userId,
        title: options.title,
        description: options.description,
        daysCount: options.days.length,
        startDate: /* @__PURE__ */ new Date("2026-12-12T12:00:00Z"),
        endDate: /* @__PURE__ */ new Date("2026-12-13T12:00:00Z"),
        coverPhotoUrl: IMG(options.cover),
        status: options.status,
        submittedAt: options.status === "DRAFT" ? null : /* @__PURE__ */ new Date(),
        publishedAt: options.status === "APPROVED" ? /* @__PURE__ */ new Date() : null,
        reviewedAt: options.status === "APPROVED" ? /* @__PURE__ */ new Date() : null,
        reviewedById: options.status === "APPROVED" ? admin.id : null
      }
    });
    for (const [index, day] of options.days.entries()) {
      const createdDay = await prisma.itineraryDay.create({
        data: { itineraryId: created.id, dayNumber: index + 1 }
      });
      for (const [placeIndex, place] of day.places.entries()) {
        const localId = localIds.get(place.slug) ?? null;
        const localName = [...beaches, ...points].find((item) => item.slug === place.slug)?.name ?? place.slug;
        await prisma.itineraryPlace.create({
          data: {
            itineraryId: created.id,
            dayId: createdDay.id,
            localId,
            placeName: localName,
            comments: place.comments,
            knewPlace: false,
            visitDate: /* @__PURE__ */ new Date(`2026-12-${12 + index}T12:00:00Z`),
            visitTime: placeIndex === 0 ? "09:00" : "14:00",
            visitDuration: "3 horas",
            rating: place.rating,
            sortOrder: placeIndex,
            photos: {
              create: (place.photos ?? []).map((photo) => ({ itineraryId: created.id, url: IMG(photo) }))
            }
          }
        });
      }
    }
    return created;
  }
  const itineraryA = await upsertItinerary({
    title: "Dois dias na orla central",
    userId: tourist.id,
    description: "Roteiro de fim de semana para conhecer a orla central de Caraguatatuba, alternando praia, cultura e mirantes. Ideal para quem chega de S\xE3o Paulo e quer caminhar bastante.",
    status: "APPROVED",
    cover: "praia-martim-de-sa",
    days: [
      {
        places: [
          { slug: "martin-de-sa", comments: "Praia movimentada, \xF3tima para caminhar no cal\xE7ad\xE3o e almo\xE7ar nos quiosques.", rating: 5, photos: ["praia-martim-de-sa"] },
          { slug: "prainha", comments: "Enseada abrigada, boa para ir com crian\xE7as. Vale checar a balneabilidade.", rating: 4 },
          { slug: "macc", comments: "Exposi\xE7\xF5es gratuitas e um bom lugar para entender a cultura cai\xE7ara.", rating: 5, photos: ["macc-exposicao"] }
        ]
      },
      {
        places: [
          { slug: "morro-santo-antonio", comments: "Subimos de carro no fim da tarde. A vista da ba\xEDa \xE9 imperd\xEDvel.", rating: 5, photos: ["ponto-morro-santo-antonio"] },
          { slug: "camaroeiro", comments: "Parada r\xE1pida para fotos do complexo e da orla.", rating: 4 },
          { slug: "parque-trombini", comments: "Programa \xE0 noite com a fam\xEDlia; ir cedo para evitar filas.", rating: 4 }
        ]
      }
    ]
  });
  await upsertItinerary({
    title: "Ilhas e matas de Caraguatatuba",
    userId: resident.id,
    description: "Roteiro de dois dias para quem quer fugir da orla central: praias do norte, passeio de barco at\xE9 a Ilha do Tamandu\xE1 e um dia inteiro de trilhas na Mata Atl\xE2ntica.",
    status: "APPROVED",
    cover: "destino-tamandua",
    days: [
      {
        places: [
          { slug: "mococa", comments: "Mar calmo e areia escura. Sa\xEDmos daqui para o passeio de barco.", rating: 5, photos: ["praia-mococa"] },
          { slug: "tabatinga", comments: "Estrutura de resorts e vila de pescadores. Boa para terminar o dia.", rating: 4 }
        ]
      },
      {
        places: [
          { slug: "pesm-nucleo-caraguatatuba", comments: "Trilha do Po\xE7\xE3o com monitor. Agendamos com anteced\xEAncia.", rating: 5, photos: ["ativ-trilhas"] },
          { slug: "cachoeira-do-mancha", comments: "Banho gelado e trilha curta. Levar repelente.", rating: 4 }
        ]
      }
    ]
  });
  await upsertItinerary({
    title: "Fim de semana gastron\xF4mico",
    userId: tourist.id,
    description: "Roteiro para provar os restaurantes do Centro e de Massagua\xE7u, com paradas na praia entre as refei\xE7\xF5es.",
    status: "PENDING",
    cover: "rest-mar-e-terra",
    days: [
      {
        places: [
          { slug: "martin-de-sa", comments: "Manh\xE3 na praia antes do almo\xE7o.", rating: 4 },
          { slug: "mococa", comments: "Tarde tranquila na praia do norte.", rating: 5 }
        ]
      }
    ]
  });
  const reviewSeeds = [
    { userId: tourist.id, slug: "martin-de-sa", rating: 5, comment: "Movimentada, mas com boa estrutura de quiosques e cal\xE7ad\xE3o. Volto sempre." },
    { userId: resident.id, slug: "martin-de-sa", rating: 4, comment: "\xD3tima para caminhar. No ver\xE3o fica bem cheia." },
    { userId: tourist.id, slug: "mococa", rating: 5, comment: "Mar calmo e uma das praias mais bonitas da regi\xE3o." },
    { userId: resident.id, slug: "macc", rating: 5, comment: "Programa\xE7\xE3o cultural gratuita e de qualidade." }
  ];
  for (const review of reviewSeeds) {
    const localId = localIds.get(review.slug);
    if (!localId) continue;
    const exists = await prisma.review.findFirst({ where: { userId: review.userId, localId } });
    if (!exists) {
      await prisma.review.create({
        data: { userId: review.userId, localId, rating: review.rating, comment: review.comment }
      });
    }
  }
  if (itineraryA.status === "APPROVED") {
    const reviewExists = await prisma.review.findFirst({ where: { userId: resident.id, itineraryId: itineraryA.id } });
    if (!reviewExists) {
      await prisma.review.create({
        data: { userId: resident.id, itineraryId: itineraryA.id, rating: 5, comment: "Roteiro bem organizado, d\xE1 para fazer tudo a p\xE9 ou de carro em pouco tempo." }
      });
    }
  }
  const favLocal = localIds.get("martin-de-sa");
  if (favLocal) {
    const exists = await prisma.favorite.findFirst({ where: { userId: tourist.id, localId: favLocal } });
    if (!exists) await prisma.favorite.create({ data: { userId: tourist.id, localId: favLocal } });
  }
  const restaurant = await prisma.restaurant.findUnique({ where: { slug: "mar-e-terra" } });
  if (restaurant) {
    const exists = await prisma.favorite.findFirst({ where: { userId: tourist.id, restaurantId: restaurant.id } });
    if (!exists) await prisma.favorite.create({ data: { userId: tourist.id, restaurantId: restaurant.id } });
  }
  const suggestionExists = await prisma.suggestion.findFirst({ where: { userId: resident.id, title: "Placa indicando acesso \xE0 Praia Brava" } });
  if (!suggestionExists) {
    await prisma.suggestion.create({
      data: {
        userId: resident.id,
        type: "CORRECAO",
        title: "Placa indicando acesso \xE0 Praia Brava",
        description: "Sugiro refor\xE7ar a sinaliza\xE7\xE3o da trilha de acesso \xE0 Praia Brava a partir da Martim de S\xE1, principalmente no per\xEDodo de ver\xE3o, quando muitos visitantes se perdem.",
        localId: localIds.get("praia-brava") ?? null
      }
    });
  }
  console.log("Seed conclu\xEDdo.");
  console.log(`Administrador: ${adminEmail}`);
  console.log(`Contas de demonstra\xE7\xE3o: ${touristEmail} e ${residentEmail} (senha padr\xE3o de demonstra\xE7\xE3o).`);
}
main().catch((error) => {
  console.error("Falha no seed:", error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
