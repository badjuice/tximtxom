// Every change to the game, newest first. Shown by the Changelog button on
// the title screen; `npm run changelog` writes CHANGELOG.md from it.
// Versions up to 0.11.0 were assigned afterwards from the commit history.

export type ChangeKind = 'new' | 'change' | 'fix' | 'removed';

export interface Release {
  version: string;
  date: string;
  items: { kind: ChangeKind; en: string; pt: string }[];
}

export const KIND_ICON: Record<ChangeKind, string> = { new: '✨', change: '🔧', fix: '🐛', removed: '🗑️' };

const n = (en: string, pt: string) => ({ kind: 'new' as const, en, pt });
const c = (en: string, pt: string) => ({ kind: 'change' as const, en, pt });
const f = (en: string, pt: string) => ({ kind: 'fix' as const, en, pt });
const r = (en: string, pt: string) => ({ kind: 'removed' as const, en, pt });

export const CHANGELOG: Release[] = [
  {
    version: '0.66.0',
    date: '2026-11-10',
    items: [
      c("The neobrutalist UI style is now the default, and it's called Classic. The original rounded style is now called Balala, still in Settings > Style.", "O estilo de interface neobrutalista é agora o padrão e chama-se Clássico. O estilo arredondado original chama-se agora Balala e continua em Definições > Estilo."),
      f("Coloured text in the Classic style no longer has a black outline bleeding into its letters.", "O texto colorido no estilo Clássico já não tem um contorno preto a invadir as letras."),
      f("The squares inside the switches sit centred in the Classic style.", "Os quadrados dentro dos interruptores ficam centrados no estilo Clássico."),
    ],
  },
  {
    version: '0.65.0',
    date: '2026-11-05',
    items: [
      f("Made the UI more lookable-at by improving the contrasts and reducing the flashbanguiness of the themes and UI styles. The Neobrutalist style no longer flashbangs you: its own colours are now dark panels with saturated colours and pure black edges.", "A interface ficou mais olhável: melhores contrastes e menos flashbanguice nos temas e estilos de interface. O estilo Neobrutalista já não lhe dá um flashbang: as suas cores são agora painéis escuros com cores saturadas e contornos pretos puros."),
      f("Every theme now checks its own colours: text, faded text, rarity and rule colours and the text on buttons are nudged until they meet the WCAG contrast guidelines.", "Todos os temas verificam as suas próprias cores: o texto, o texto esbatido, as cores das raridades e das regras e o texto nos botões são ajustados até cumprirem as diretrizes de contraste WCAG."),
      f("Gold & Silver is now silver and gold on dark metal; Ink & Paper is a softer paper; Red & Blue reads better.", "Ouro e Prata é agora prata e ouro sobre metal escuro; Tinta e Papel tem um papel mais suave; Vermelho e Azul lê-se melhor."),
      f("Option pickers show their options as hollow squares, the picked one a square inside a square, in the text's own colours, so they show in every theme.", "Os seletores de opções mostram as opções como quadrados vazios, e a escolhida como um quadrado dentro de um quadrado, nas cores do texto, para se verem em todos os temas."),
      f("Chip amounts, buy buttons, keys and tags read well in every theme.", "As quantias de fichas, os botões de compra, as teclas e as etiquetas leem-se bem em todos os temas."),
    ],
  },
  {
    version: '0.64.0',
    date: '2026-11-05',
    items: [
      f("Windows with tabs (Settings, Stats, the scoreboard) no longer scroll when the open tab fits: each tab scrolls on its own, only when it is too tall, and the tab bar stays put.", "As janelas com separadores (Definições, Estatísticas, o placar) já não deslizam quando o separador aberto cabe: cada separador desliza sozinho, só quando é demasiado alto, e a barra de separadores fica no lugar."),
      f("In the Shop, the chips, tabs and legend stay put while the items scroll.", "Na Loja, as fichas, os separadores e a legenda ficam no lugar enquanto os artigos deslizam."),
      f("Scrollbars never hide in Firefox and Zen either: the game draws its own there, always shown, in its own lane.", "As barras de deslocamento também nunca se escondem no Firefox e no Zen: o jogo desenha as suas, sempre à vista, no seu próprio espaço."),
      f("The arrows of every option picker in a window line up in one column.", "As setas de todos os seletores de opções de uma janela ficam alinhadas numa coluna."),
      f("The main menu keeps the game's own colours whatever the theme.", "O menu principal mantém as cores do próprio jogo, seja qual for o tema."),
      f("The word Chips in the Stats tab no longer waves.", "A palavra Fichas no separador das Estatísticas já não ondula."),
      f("No more \"Next suit\" and \"The other Joker\" hints on the cards in Settings.", "Acabaram as dicas \"Naipe seguinte\" e \"O outro Joker\" nas cartas das Definições."),
    ],
  },
  {
    version: '0.63.1',
    date: '2026-11-05',
    items: [
      f("Switching tabs (Settings, Stats, Shop, How to play) keeps each tab where you scrolled it, instead of jumping back to the top. A tab opened for the first time starts at the top.", "Mudar de separador (Definições, Estatísticas, Loja, Como jogar) mantém cada separador onde o deixou, em vez de voltar ao topo. Um separador aberto pela primeira vez começa no topo."),
    ],
  },
  {
    version: '0.63.0',
    date: '2026-11-05',
    items: [
      n("A second UI style, a first test: Settings, Style, UI style, Neobrutalist. Square corners, thick black outlines, hard black shadows and saturated colours on cream, with the pixel font and art kept. Pick a Theme too and its colours go on the neobrutalist shapes.", "Um segundo estilo de interface, um primeiro teste: Definições, Estilo, Estilo da interface, Neobrutalista. Cantos retos, contornos pretos grossos, sombras pretas duras e cores saturadas sobre creme, com a letra e a arte em píxeis. Escolha também um Tema e as suas cores vão para as formas neobrutalistas."),
    ],
  },
  {
    version: '0.62.1',
    date: '2026-11-05',
    items: [
      c("Wherever a rarity's shape sits next to its name (the changelog, achievement descriptions), the shape pumps along with the name. The shape before an achievement's or a Shop item's name stays still.", "Onde a forma de uma raridade está ao lado do seu nome (as Alterações, as descrições das conquistas), a forma pulsa com o nome. A forma antes do nome de uma conquista ou de um artigo da Loja fica parada."),
    ],
  },
  {
    version: '0.62.0',
    date: '2026-11-05',
    items: [
      n("Themes, a first test: Settings, Style, Theme recolours the menus, windows and buttons. Two colours: Ink and Paper, Night, Red and Blue, Gold and Silver, Terminal. Three colours: Handheld, Sunset, Arctic. A full palette: Pastel. Cards and the table keep their own colours for now; themes will come to the Shop later.", "Temas, um primeiro teste: Definições, Estilo, Tema muda as cores dos menus, janelas e botões. Duas cores: Tinta e Papel, Noite, Vermelho e Azul, Ouro e Prata, Terminal. Três cores: Consola Portátil, Pôr do Sol, Ártico. Uma paleta completa: Pastel. As cartas e a mesa mantêm as suas cores por agora; os temas vão chegar à Loja mais tarde."),
    ],
  },
  {
    version: '0.61.1',
    date: '2026-11-05',
    items: [
      c("The rarity shapes in the Achievements and Shop legends pump along with their names, and the Shop legend's names pump and shine like the Achievements'.", "As formas das raridades nas legendas das Conquistas e da Loja pulsam com os seus nomes, e os nomes da legenda da Loja pulsam e brilham como os das Conquistas."),
    ],
  },
  {
    version: '0.61.0',
    date: '2026-11-05',
    items: [
      n("Rarities have shapes as well as colours: common a circle, uncommon a triangle, epic a square, legendary a rhombus, unique a star, secret a cross and locked a ring. They're in the legends and in front of achievement names, Shop item names and rarities named in text.", "As raridades têm formas além das cores: comum um círculo, invulgar um triângulo, épica um quadrado, lendária um losango, única uma estrela, secreta uma cruz e bloqueada um anel. Aparecem nas legendas e antes dos nomes das conquistas, dos artigos da Loja e das raridades no texto."),
      c("The word Chips keeps its flowing colours but no longer waves.", "A palavra Fichas mantém as cores a correr, mas já não ondula."),
      f("The spinning chip no longer disappears when it turns edge-on: its striped rim shows.", "A ficha a girar já não desaparece quando fica de lado: vê-se a borda às riscas."),
      f("A new achievement scrolled under a still mouse counts as seen and loses its New sign.", "Uma conquista nova que passa por baixo do rato parado ao deslizar conta como vista e perde o sinal de Nova."),
    ],
  },
  {
    version: '0.60.0',
    date: '2026-11-04',
    items: [
      n("New uncommon achievement, AK-47: hold an Ace, King, 4 and 7 side by side in your hand, in that order.", "Nova conquista invulgar, AK-47: tenha um Ás, um Rei, um 4 e um 7 lado a lado na mão, por esta ordem."),
      n("Settings, Style: the Joker sits next to the card back. Tap it to switch between the red and the black Joker.", "Definições, Estilo: o Joker fica ao lado das costas das cartas. Toque nele para trocar entre o Joker vermelho e o preto."),
      n("Gold, silver and bust badges glow in their own colour, with a light sweeping across them.", "Os emblemas de ouro, prata e Rabenta brilham na sua cor, com uma luz a passar por eles."),
      c("Tapping a card in the Style tab makes it hop, like the Aces on the main menu, instead of leaving it raised.", "Tocar numa carta no separador Estilo fá-la saltar, como os Ases do menu principal, em vez de a deixar levantada."),
      c("Portuguese now speaks to you as \"você\" everywhere.", "O português agora trata-o por \"você\" em todo o lado."),
    ],
  },
  {
    version: '0.59.0',
    date: '2026-11-04',
    items: [
      n("Shop items have rarities: an item's name is in its rarity's colour, with the colours' legend under the tabs. Tables are rarer the more colours they have.", "Os artigos da Loja têm raridade: o nome de cada um vem na cor da sua raridade, com a legenda das cores por baixo dos separadores. As mesas são mais raras quantas mais cores tiverem."),
      n("Hold a table in the Shop (and drag about if you like) to hide the Shop and see the table behind it. Let go to bring the Shop back.", "Mantém uma mesa carregada na Loja (e arrasta, se quiseres) para esconder a Loja e ver a mesa por trás. Larga para a Loja voltar."),
      n("Shop items say which pack they came from: \"Starter pack\", or the pack an opened pack's backs belong to.", "Os artigos da Loja dizem de que pacote vieram: \"Pacote inicial\", ou o pacote a que pertencem as costas de um pacote aberto."),
      c("The Rules window in the lobby is one column. Chip multipliers are shown with a switch, \"Show Chips Multipliers\", that no longer moves as the total changes.", "A janela das Regras na sala tem uma só coluna. Os multiplicadores de fichas mostram-se com um interruptor, \"Mostrar Multiplicadores de Fichas\", que já não salta quando o total muda."),
      c("Achievements for showing a formation need that exact size: a quad doesn't count as a trio, six of a rank isn't five, a 7-card straight isn't a 3, 4 or 6, and Long Haul counts straights of exactly 5.", "As conquistas de mostrar uma formação pedem esse tamanho exato: uma quadra não conta como trio, seis do mesmo valor não são cinco, uma escada de 7 não é de 3, 4 ou 6, e o Longo Curso conta escadas de exatamente 5."),
      c("Scrollbars stay in their own lane and never sit over what they scroll.", "As barras de deslocamento ficam no seu espaço e nunca por cima do que deslizam."),
      f("Polydactyly and Two Decks count as changed rules in the lobby and show their cards in the game.", "Polidactilia e Dois Baralhos contam como regras mudadas na sala e mostram as suas cartas no jogo."),
      f("The Polychrome and Gold Foil backs show in the Shop when you play with board game cards.", "As costas Policromado e Folha de Ouro aparecem na Loja quando jogas com as cartas de jogo de tabuleiro."),
      f("The light across an achievement's reward crosses only its letters, not a box round them.", "O brilho na recompensa de uma conquista passa só pelas letras, e não por uma caixa à volta delas."),
    ],
  },
  {
    version: '0.58.0',
    date: '2026-11-03',
    items: [
      n("10 new tables painted in more colours, dearer the more they have. 2 colours (600): Ice and Fire, Night and Day, Mint and Coral. 3 (900): Tropical, Berry, Autumn. 5 (1.500): Aurora, Carnival. 7 (2.500): Spectrum, Kaleidoscope.", "10 mesas novas pintadas em mais cores, mais caras quantas mais tiverem. 2 cores (600): Gelo e Fogo, Noite e Dia, Menta e Coral. 3 (900): Tropical, Frutos Silvestres, Outono. 5 (1.500): Aurora, Carnaval. 7 (2.500): Espectro, Caleidoscópio."),
      n("7 simple frames: a ring round your plate in Bronze (300), Silver (500), Gold (800), Ruby, Emerald, Sapphire or Amethyst (600 each).", "7 molduras simples: um anel à volta da tua placa em Bronze (300), Prata (500), Ouro (800), Rubi, Esmeralda, Safira ou Ametista (600 cada)."),
      c("Formations shows every card from Ace to King with its points, and says cards are worth their rank.", "As Formações mostram todas as cartas do Ás ao Rei com os seus pontos, e dizem que as cartas valem a sua posição."),
      c("The rules of a game are in one column, the ones that shape the game first: length, timer, rides, penalties, then the helpers.", "As regras de um jogo ficam numa coluna, primeiro as que mudam o jogo: duração, tempo, boleias, multas, e depois as ajudas."),
    ],
  },
  {
    version: '0.57.0',
    date: '2026-11-03',
    items: [
      n("Card stats: your favourite card, suit and value, and the cards you throw away, pick up and get stuck with most.", "Estatísticas das cartas: a tua carta, naipe e valor favoritos, e as cartas que mais deitas fora, apanhas e ficam encalhadas."),
      n("Rarities in their colours, with a shine and a pulse, wherever they're written. The changelog puts an achievement's rarity before its name.", "As raridades nas suas cores, com brilho e pulsação, onde quer que apareçam. As Alterações põem a raridade de uma conquista antes do nome."),
      c("Rules have their Rules-window colour everywhere they're named.", "As regras têm a cor da janela das Regras em todo o lado onde aparecem."),
      c("Amounts of chips put the chip after the number (+30 chips), and thousands are split by a dot: 1.000.000.", "As quantias de fichas põem a ficha depois do número (+30 fichas), e os milhares separam-se com um ponto: 1.000.000."),
      c("No chip counter on the main menu or in the lobby. The Chips stats keep the big chips only.", "Sem contador de fichas no menu principal nem na sala. As estatísticas das Fichas ficam só com as fichas grandes."),
      c("Style shows Ace to King in one row, each card half over the last, in a random suit. Click the back to turn to the next suit.", "O Estilo mostra do Ás ao Rei numa fila, cada carta meio por cima da anterior, num naipe ao calhas. Clica nas costas para passar ao naipe seguinte."),
      c("Random items in the Shop fade from one option to the next.", "Os itens Aleatórios da Loja passam de uma opção à outra a esbater."),
      c("A Shop item from a hidden achievement says \"Unlocked by the achievement [Secret achievement]\".", "Um item da Loja de uma conquista escondida diz \"Desbloqueia-se com a conquista [Conquista secreta]\"."),
    ],
  },
  {
    version: '0.56.0',
    date: '2026-11-03',
    items: [
      n("Four Unique achievements for the long haul, each with a reward: Average TximTxom Enjoyer (play 100 games, the Negative table), Local TximTxom Legend (win 250, the Polychrome back), Final Boss of TximTxom (win 10 in a row, the Boss frame) and CEO of TximTxom (earn 1.000.000 chips, the Gold Foil back).", "Quatro conquistas Únicas para quem fica, cada uma com um prémio: Apreciador Médio de TximTxom (joga 100 jogos, a mesa Negativo), Lenda Local do TximTxom (ganha 250, as costas Policromadas), Chefe Final do TximTxom (ganha 10 seguidos, a moldura Chefe) e CEO do TximTxom (ganha 1.000.000 fichas, as costas Folha de Ouro)."),
      n("Plate frames: a new Shop tab. The Boss frame glows dark red round your plate, and everyone at the table sees it.", "Molduras: um separador novo na Loja. A moldura Chefe brilha a vermelho escuro à volta da tua placa, e toda a mesa a vê."),
      n("Three characters you can't buy: The Boss (Flawless), Top Hat CEO (Royal Flush) and Suited CEO (Rulebook).", "Três personagens que não se compram: O Chefe (Imbatível), CEO de Cartola (Sequência Real) e CEO de Fato (Livro de Regras)."),
      n("A new table, Holographic: a rainbow film over silver (2.500).", "Uma mesa nova, Holográfica: uma película de arco-íris sobre prata (2.500)."),
      n("10 new common achievements for the small firsts: How to play, a new table, a setting changed, History in a game, a 4-player round, a round with a bot, your first Txi jog, first card from the Discard Pile, first ride, and 3 games in one day.", "10 conquistas comuns novas para as pequenas estreias: Como jogar, uma mesa nova, uma definição mudada, o Histórico num jogo, uma ronda com 4 jogadores, uma ronda com um bot, o teu primeiro Txi jog, a primeira carta do Descarte, a primeira boleia, e 3 jogos no mesmo dia."),
      c("An achievement that gives something says what, in rainbow letters: \"Unlocks Negative (table)\". Completionist and Completionist+ now pay chips only.", "Uma conquista que dá alguma coisa diz o quê, em letras de arco-íris: \"Desbloqueia Negativo (mesa)\". Completista e Completista+ passam a pagar só fichas."),
      c("The Achievements button (and any other) no longer stays outlined after you close what it opened with a click.", "O botão das Conquistas (e os outros) já não fica contornado depois de fechares o que abriu com um clique."),
    ],
  },
  {
    version: '0.55.0',
    date: '2026-11-03',
    items: [
      n("New game mode, Rounds: play 5 or 10 rounds with no bust limit. The lowest total wins.", "Novo modo, Rondas: joga 5 ou 10 rondas sem limite para rabentar. Ganha o total mais baixo."),
      n("Chip multipliers: rules that make formations easier pay less, harder ones pay more (×0.5 to ×2). The Rules window shows each rule's multiplier and the total on request.", "Multiplicadores de fichas: regras que facilitam as formações pagam menos, as mais difíceis pagam mais (×0,5 a ×2). A janela das Regras mostra o multiplicador de cada regra e o total, se pedires."),
      n("A new rarity, Unique, in rainbow letters. Collection achievements: all commons, all uncommons, all epics, all legendaries, all secrets, every secret formation, Completionist, Completionist+ and Completionist++.", "Uma raridade nova, Única, em letras de arco-íris. Conquistas de coleção: todas as comuns, incomuns, épicas, lendárias, secretas, todas as formações secretas, Completista, Completista+ e Completista++."),
      n("Rewards you can't buy: King John (a character with a rainbow plate) for John TximTxom, the Negative table for Completionist, the Polychrome card back for Completionist+.", "Prémios que não se compram: Rei John (uma personagem com placa de arco-íris) pelo John TximTxom, a mesa Negativo pelo Completista, as costas Policromadas pelo Completista+."),
      n("14 more achievements: straights of every length from 3 to 13, a first pair and trio, first purchases in the Shop, and Early Bird. Every achievement and tier has its own flavour text now.", "Mais 14 conquistas: escadas de todos os tamanhos de 3 a 13, o primeiro par e trio, as primeiras compras na Loja, e Madrugador. Todas as conquistas e níveis têm agora a sua frase."),
      n("Shop: Pride and Trans tables and a Rainbow card back. Random items flick through what they could be.", "Loja: mesas Orgulho e Trans e costas Arco-íris. Os itens aleatórios vão mostrando o que podem ser."),
      n("Chips have their own spinning icon, next to every amount, and \"Chips\" is written in rainbow letters. Achievement toasts show what they pay.", "As fichas têm um ícone próprio a girar ao lado de cada valor, e \"Fichas\" aparece em letras de arco-íris. Os avisos de conquista mostram quanto pagam."),
      c("End of a round: the summary waits for the last formation and its chips. Hold Table on it to look at the cards.", "Fim da ronda: o resumo espera pela última formação e pelas suas fichas. Segura Mesa para ver as cartas."),
      c("History shows the cut for the first deal: who drew which card.", "O Histórico mostra o corte para a primeira distribuição: quem tirou que carta."),
      c("Scramble shuffles only the hand of the player who takes a card.", "Baralhada só baralha a mão de quem apanha uma carta."),
      c("Rules window: two columns of equal width and equal card height, and only the rules scroll.", "Janela das Regras: duas colunas da mesma largura e cartas da mesma altura, e só as regras deslizam."),
      c("Names are up to 10 characters and always show whole on the plates. The dealer's D sits on the plate's corner.", "Os nomes têm até 10 caracteres e aparecem sempre inteiros nas placas. O D de quem dá fica no canto da placa."),
      c("Settings › Style shows every rank and suit in a flat row, with the back on its own. A hovered card comes to the front.", "Definições › Estilo mostra todos os valores e naipes numa fila direita, com as costas à parte. A carta por baixo do cursor vem para a frente."),
      c("The loading and battery-saving screens wait for their button, and both show the spinning card again (it showed halves of several cards).", "Os ecrãs de carregar e de poupar bateria esperam pelo botão, e voltam a mostrar a carta a girar (mostravam metades de várias cartas)."),
      c("Bigger piles and copy buttons. Previewing a table in the Shop changes only its colours. Achievements filter: a \"Show:\" label and a button that keeps its width.", "Montes e botões de copiar maiores. Ver uma mesa na Loja só muda as cores. Filtro das Conquistas: um rótulo \"Mostrar:\" e um botão que mantém a largura."),
    ],
  },
  {
    version: '0.54.0',
    date: '2026-11-03',
    items: [
      n("New rule, Polydactyly: 9-card hands. All nine formed is -15, a hand emptied on rides is -10, and a TximTxom is a one-suit straight of 7 or more with the rest formed. Turning it on moves the bust limit to 50.", "Nova regra, Polidactilia: mãos de 9 cartas. As nove formadas valem -15, uma mão esvaziada com boleias vale -10, e um TximTxom é uma escada de 7 ou mais do mesmo naipe com o resto formado. Ligá-la passa o limite para 50."),
      n("New rule, Two Decks: 104 cards, each card twice. Sets go up to eight of a rank (quintet to octet), and quads take rides too.", "Nova regra, Dois Baralhos: 104 cartas, cada uma duas vezes. Os conjuntos vão até oito do mesmo valor (quinteto a octeto), e as quadras também levam boleias."),
      n("Nine new achievements: one for each new rule, and seven secret ones for the big formations they allow.", "Nove conquistas novas: uma por cada regra nova, e sete secretas para as formações grandes que elas permitem."),
      n("+30 chips when your hand runs out of cards (a full hand, a TximTxom, or your last card gone on a ride), once a round. Big sets and long straights pay extra.", "+30 fichas quando a tua mão fica sem cartas (mão completa, TximTxom ou a última carta numa boleia), uma vez por ronda. Conjuntos grandes e escadas longas pagam mais."),
      n("Chip pops say what paid (\"3-Straight\", \"Hand emptied\"), and the chips of a round or game roll up like an odometer.", "As fichas que aparecem dizem o que pagou (\"Escada de 3\", \"Mão vazia\"), e as fichas da ronda ou do jogo sobem como um conta-quilómetros."),
      c("Your name instead of \"You\" everywhere, framed in gold among the others.", "O teu nome em vez de \"Tu\" em todo o lado, com uma moldura dourada entre os outros."),
      c("The Shop starts smaller: two of each card back style, two tables and six characters are free. Recoloured backs come in packs, and Random is the last buy of each group (2.000). What you bought stays yours.", "A Loja começa mais pequena: duas costas de cada estilo, duas mesas e seis personagens são grátis. As costas recoloridas vêm em pacotes, e Aleatória é a última compra de cada grupo (2.000). O que compraste continua teu."),
      c("Whose turn it is: the plate keeps its gold border, with the player's colour still showing inside it, and their character glows in their colour.", "De quem é a vez: a placa mantém a borda dourada, com a cor do jogador por dentro, e a personagem brilha na cor do jogador."),
      c("The Full hand and TximTxom note sits centred above the formations.", "A nota de Mão completa e TximTxom fica centrada por cima das formações."),
      c("Formations: clearer card values, and the rule each formation needs written under it.", "Formações: valores das cartas mais claros, e a regra que cada formação precisa escrita por baixo."),
      c("Achievements: cards shine only while hovered or tapped, the modal keeps its size when filtered, and the filter hints are shorter.", "Conquistas: as cartas só brilham quando lhes passas por cima ou lhes tocas, o painel mantém o tamanho ao filtrar, e as dicas do filtro são mais curtas."),
      c("A thicker chip, and a bigger copy button on the end-of-game screen.", "Uma ficha mais grossa, e um botão de copiar maior no fim do jogo."),
    ],
  },
  {
    version: '0.53.0',
    date: '2026-11-01',
    items: [
      n("The Shop, on the main menu: spend chips on 12 card backs, 8 table colours and 16 characters. Tap the price, then \"Buy?\" to confirm.", "A Loja, no menu principal: gasta fichas em 12 costas de cartas, 8 cores de mesa e 16 personagens. Toca no preço e depois em \"Comprar?\" para confirmar."),
      n("The Shop is also where you choose what you use, free items included. Tables show behind it while you browse.", "A Loja é também onde escolhes o que usas, incluindo o que é grátis. As mesas aparecem por trás enquanto as vês."),
      n("New setting, Table colours: Random, or a fixed one of yours.", "Nova opção, Cores da mesa: Aleatória, ou uma fixa das tuas."),
      c("In a room, tapping your character also cycles through the ones you bought.", "Numa sala, tocar na tua personagem também passa pelas que compraste."),
      c("The main menu has room for the Shop: four buttons under Play.", "O menu principal tem lugar para a Loja: quatro botões por baixo de Jogar."),
    ],
  },
  {
    version: '0.52.1',
    date: '2026-11-01',
    items: [
      n("Achievements: a button switches between all of them, only the locked ones and only the unlocked ones. Its hint says which comes next.", "Conquistas: um botão alterna entre todas, só as bloqueadas e só as desbloqueadas. A dica diz qual vem a seguir."),
      n("Credits: nevesfred, who made Odj c*, the game that inspired this one, and the testers SFGrey and the.red_angel. Each section's icon now sits on a little card.", "Créditos: nevesfred, que fez o Odj c*, o jogo que inspirou este, e os testadores SFGrey e the.red_angel. O ícone de cada secção está agora numa pequena carta."),
      c("The chip is seen from the side, and can't be dragged around any more.", "A ficha aparece de lado e já não pode ser arrastada."),
      c("Stats > Chips: each way to earn chips has its own colour, in the list and in the explanation under it.", "Estatísticas > Fichas: cada forma de ganhar fichas tem a sua cor, na lista e na explicação por baixo."),
      c("Long player names are cut with \"…\" in the lobby, the chat and the score tables.", "Nomes de jogadores compridos são cortados com \"…\" na sala, no chat e nas tabelas de pontos."),
      c("The copy button in the History panel is a raised button like the close button beside it.", "O botão de copiar no painel do Histórico é um botão em relevo como o de fechar ao lado."),
      c("Scrollbars light up when hovered and when held.", "As barras de deslocamento acendem ao passar o rato e ao agarrar."),
      c("Tabs are lower, like the small buttons on the game's top bar.", "Os separadores são mais baixos, como os botões pequenos da barra de cima do jogo."),
    ],
  },
  {
    version: '0.52.0',
    date: '2026-11-01',
    items: [
      c("Digital Disco is the game's font now. m6x11 is still one of the choices, and players who picked a font keep it.", "A letra do jogo agora é a Digital Disco. A m6x11 continua a ser uma das opções, e quem escolheu uma letra mantém-na."),
      c("\"Confirm moves\" is now \"Play at once\", off by default: the game still waits for End Turn unless you turn it on.", "\"Confirmar jogadas\" agora é \"Jogar logo\", desligado por defeito: o jogo continua a esperar por Acabar a vez, a não ser que o ligues."),
      n("Achievements can be sorted by progress, rarity, similar ones together, date unlocked or name, either way round.", "As conquistas podem ser ordenadas por progresso, raridade, semelhantes juntas, data ou nome, em qualquer sentido."),
      n("Tap or click an unlocked achievement to see when you unlocked it.", "Toca ou clica numa conquista desbloqueada para ver quando a desbloqueaste."),
      c("Achievement progress bars shine: each card's with its name, the overall one with the sweep across the cards.", "As barras de progresso das conquistas brilham: a de cada carta com o nome, a geral com o brilho que passa pelas cartas."),
    ],
  },
  {
    version: '0.51.1',
    date: '2026-11-01',
    items: [
      n("The first game you win each day pays an extra 50 chips.", "O primeiro jogo que ganhas em cada dia dá mais 50 fichas."),
      n("New achievement, Regular: collect the daily bonus 7 days in a row. Stats shows your current and longest run.", "Nova conquista, Cliente da Casa: recebe o bónus diário 7 dias seguidos. As Estatísticas mostram a sequência atual e a maior."),
    ],
  },
  {
    version: '0.51.0',
    date: '2026-11-01',
    items: [
      n("Chips! Each card you form pays its rank, a ride card half that. Not busting, winning rounds and games, achievements and the first game of the day pay too.", "Fichas! Cada carta que formas vale o seu valor, uma carta de boleia metade. Não rabentar, ganhar rondas e jogos, conquistas e o primeiro jogo do dia também dão fichas."),
      n("Your chips show on the main menu and in the lobby, float up over your formations, and add up in the round and game summaries.", "As tuas fichas aparecem no menu principal e na sala, sobem por cima das tuas formações e somam-se nos resumos da ronda e do jogo."),
      n("Stats has a Chips tab: balance, most ever held, and where they came from.", "As Estatísticas têm um separador Fichas: saldo, o máximo que já tiveste e de onde vieram."),
      n("Achievements you already had pay their chips once. The chip achievements are back, at 1.000, 10.000 and 100.000 chips earned.", "As conquistas que já tinhas pagam as suas fichas uma vez. As conquistas de fichas voltaram, aos 1000, 10.000 e 100.000 fichas ganhas."),
    ],
  },
  {
    version: '0.50.2',
    date: '2026-11-01',
    items: [c("Seat colours are easier to tell apart: the orange seat is now purple (orange looked like the gold of the current turn), and plate borders are brighter.", "As cores dos lugares distinguem-se melhor: o lugar laranja agora é roxo (o laranja parecia o dourado da vez), e as bordas das placas estão mais vivas.")],
  },
  {
    version: '0.50.1',
    date: '2026-11-01',
    items: [
      f("Other players' formations leave their hand and fly to the table, instead of popping up out of nowhere.", "As formações dos outros jogadores saem da mão deles e voam para a mesa, em vez de aparecerem do nada."),
      f("A ride card waits for its formation to land before it flies in.", "Uma carta de boleia espera que a formação chegue à mesa antes de voar."),
      c("Whose turn it is: their card on the plate glows gold.", "De quem é a vez: a carta na placa brilha a dourado."),
    ],
  },
  {
    version: '0.50.0',
    date: '2026-11-01',
    items: [
      n("New rule, Rides: no limit (as before), one ride per formation, or no rides at all. Each has its achievement.", "Nova regra, Boleias: sem limite (como antes), uma boleia por formação, ou nenhuma. Cada uma tem a sua conquista."),
      c("Pairs, trios and quads keep the order you laid them in. Straights are still sorted.", "Pares, trios e quadras ficam pela ordem em que os puseste. As sequências continuam ordenadas."),
    ],
  },
  {
    version: '0.49.14',
    date: '2026-11-01',
    items: [
      c("The \"every rule on except one\" achievements are gone; each rule keeps its \"finish a game with it on\" one.", "As conquistas \"todas as regras ligadas menos uma\" saíram; cada regra mantém a de \"acabar um jogo com ela ligada\"."),
      c("On a phone, in a game, the emotes close after you send one.", "No telemóvel, durante o jogo, os emotes fecham depois de enviares um."),
    ],
  },
  {
    version: '0.49.13',
    date: '2026-11-01',
    items: [f("An achievement unlocked with the window open shines in step with the others.", "Uma conquista desbloqueada com a janela aberta brilha ao mesmo ritmo das outras.")],
  },
  {
    version: '0.49.12',
    date: '2026-11-01',
    items: [c("On touch screens, tapping an achievement again puts it back in place.", "Nos ecrãs táteis, tocar outra vez numa conquista põe-na de volta no lugar.")],
  },
  {
    version: '0.49.11',
    date: '2026-11-01',
    items: [c("Unlocked achievements shine on a loop: first the card and the name, then the whole achievement.", "As conquistas desbloqueadas brilham sem parar: primeiro a carta e o nome, depois a conquista toda.")],
  },
  {
    version: '0.49.10',
    date: '2026-11-01',
    items: [f("The Achievements button's golden glow now goes all the way round, bottom included.", "O brilho dourado do botão Conquistas agora dá a volta toda, incluindo em baixo.")],
  },
  {
    version: '0.49.9',
    date: '2026-11-01',
    items: [
      f("The auto-skip countdown no longer runs into the button's text.", "A contagem para passar automaticamente já não fica por cima do texto do botão."),
      c("Player plates in the game have a thicker border.", "As placas dos jogadores no jogo têm uma borda mais grossa."),
    ],
  },
  {
    version: '0.49.8',
    date: '2026-11-01',
    items: [
      n("Chat messages show the time they were sent, and a date where the day changes.", "As mensagens da conversa mostram a hora a que foram enviadas, e a data quando o dia muda."),
      c("Your name in the chat reads \"Name (you)\".", "O teu nome na conversa aparece como \"Nome (tu)\"."),
      c("The chat's Send button still looks like a button while there's nothing to send.", "O botão Enviar da conversa continua a parecer um botão quando não há nada para enviar."),
    ],
  },
  {
    version: '0.49.7',
    date: '2026-11-01',
    items: [
      c("Locked rules show the rule they need in its own colour.", "As regras bloqueadas mostram a regra de que precisam na cor dela."),
      c("The emotes stay open while you pick, and close when you tap elsewhere.", "Os emotes ficam abertos enquanto escolhes e fecham quando tocas fora."),
      f("Emotes now rest for 3 seconds after each one: greyed out, with a ring that empties as the wait runs out.", "Os emotes agora descansam 3 segundos depois de cada um: ficam cinzentos, com um anel que esvazia até poderes enviar outro."),
    ],
  },
  {
    version: '0.49.6',
    date: '2026-11-01',
    items: [c("The game waits longer before going to sleep in the background: 10 minutes, 15 in a room.", "O jogo espera mais antes de adormecer em segundo plano: 10 minutos, 15 numa sala.")],
  },
  {
    version: '0.49.5',
    date: '2026-11-01',
    items: [
      c("Achievements: bigger count and progress bar text, and a hovered card comes forward and grows instead of tilting.", "Conquistas: contagem e texto da barra maiores, e um cartão com o rato por cima vem para a frente e cresce em vez de inclinar."),
      c("Bigger Aces on the main menu on big screens.", "Ases maiores no menu principal em ecrãs grandes."),
    ],
  },
  {
    version: '0.49.4',
    date: '2026-11-01',
    items: [c("Main menu: one button per row on phones, and a wider box on computers.", "Menu principal: um botão por linha nos telemóveis, e uma caixa mais larga nos computadores.")],
  },
  {
    version: '0.49.3',
    date: '2026-11-01',
    items: [
      c("The main menu's Achievements button pulses with a golden glow while any achievement is New!.", "O botão Conquistas do menu principal pulsa com um brilho dourado enquanto houver conquistas Nova!."),
      c("Magic sort is only in the game, with the Magic Sort rule: it's gone from Settings.", "A ordenação Mágica só existe no jogo, com a regra Ordem Mágica: saiu das Definições."),
      c("A new room always starts on the default rules.", "Uma sala nova começa sempre com as regras de base."),
    ],
  },
  {
    version: '0.49.2',
    date: '2026-11-01',
    items: [
      c("Nope! and the other quick callouts stay on screen a bit longer.", "O Nope! e os outros avisos rápidos ficam no ecrã um pouco mais."),
      f("An achievement unlocked while the Achievements window is open (Window Shopper) gets its New! sign right away.", "Uma conquista desbloqueada com a janela das Conquistas aberta (Só a Ver) ganha logo o sinal Nova!."),
    ],
  },
  {
    version: '0.49.1',
    date: '2026-11-01',
    items: [f("When a round ends, the piles slide aside before any formation is shown, so formations no longer land under them.", "Quando uma ronda acaba, os montes afastam-se antes de se mostrar qualquer formação, para as formações já não caírem debaixo deles.")],
  },
  {
    version: '0.49.0',
    date: '2026-11-01',
    items: [
      c("The \"rule off\" achievements are now \"everything but\": finish a game with every other rule on. Mobius Strip goes off with Ace High, and either Magic Sort or Scramble counts.", "As conquistas de \"regra desligada\" agora são \"tudo menos\": acaba um jogo com todas as outras regras ligadas. A Fita de Mobius desliga-se com o Ás Alto, e conta a Ordem Mágica ou a Baralhada."),
      c("Magic Sort and Scramble can't be on together: turning one on turns the other off, and says so.", "A Ordem Mágica e a Baralhada não podem estar ligadas juntas: ligar uma desliga a outra, com um aviso."),
      c("A rule that needs another is striped under a gold padlock sign; tapping it shakes it and flashes the rule it needs. Mobius Strip's achievement says it needs Ace High.", "Uma regra que precisa de outra fica às riscas sob um aviso dourado com cadeado; tocar nela abana-a e faz piscar a regra de que precisa. A conquista da Fita de Mobius diz que precisa do Ás Alto."),
      c("Lobby: How to play and Formations sit at the top next to Settings, as in the game, and Rules is a button above Start game that says how many rules changed.", "Sala: Como jogar e Formações ficam no topo ao lado das Definições, como no jogo, e as Regras são um botão por cima de Começar que diz quantas regras mudaram."),
      c("New achievements glow with a golden tint, and achievement cards lift a little when hovered.", "As conquistas novas brilham com um tom dourado, e os cartões das conquistas levantam-se um pouco ao passar o rato."),
    ],
  },
  {
    version: '0.48.1',
    date: '2026-11-01',
    items: [
      c("Tapping a rule card at the top of the table explains it in a balloon, as on the Formations screen.", "Tocar numa carta de regra no topo da mesa explica-a num balão, como no ecrã das Formações."),
      c("Anarchist now needs your whole hand formed in a round, with no J, Q or K.", "O Anarquista agora pede a mão inteira formada numa ronda, sem J, Q nem K."),
      c("Card back credits its Kenney pack; the Board game backs are named Blue, Red, Green and Blue Frame, Red Frame, Green Frame.", "As Costas das cartas creditam o pack da Kenney; as costas do Jogo de tabuleiro chamam-se Azul, Vermelho, Verde e Azul com moldura, Vermelho com moldura, Verde com moldura."),
      f("The lobby no longer jumps when a second player joins.", "A sala já não salta quando entra um segundo jogador."),
      f("A dragged TximTxom example card on the Formations screen keeps changing instead of freezing.", "Uma carta do exemplo do TximTxom arrastada no ecrã das Formações continua a mudar em vez de congelar."),
    ],
  },
  {
    version: '0.48.0',
    date: '2026-11-01',
    items: [
      n("Saves battery: left in the background (3 minutes, 5 in a room), the game goes to sleep. Come back and it reloads, straight into your room.", "Poupa bateria: deixado em segundo plano (3 minutos, 5 numa sala), o jogo adormece. Volta e ele recarrega, direto para a tua sala."),
      n("Settings > Graphics: Frame rate (Auto is 30 on phones, 60 on computers; also 15, 30, 60, 120) and Low power graphics.", "Definições > Gráficos: Fotogramas por segundo (Auto é 30 nos telemóveis, 60 nos computadores; também 15, 30, 60, 120) e Gráficos de baixo consumo."),
      c("The music pauses while the tab is hidden; out of focus, everything runs at 10 frames per second. The table stops drawing when no cards are on it.", "A música pára com o separador escondido; fora de foco, tudo corre a 10 fotogramas por segundo. A mesa deixa de desenhar quando não tem cartas."),
      f("The Achievements button's letters hop again.", "As letras do botão Conquistas voltam a saltar."),
    ],
  },
  {
    version: '0.47.0',
    date: '2026-11-01',
    items: [
      n("New achievement: Window Shopper, scroll to the end of the Achievements list.", "Nova conquista: Só a Ver, desliza até ao fim da lista das Conquistas."),
      c("The Credits window is wider, and each section has an icon.", "A janela dos Créditos é mais larga, e cada secção tem um ícone."),
    ],
  },
  {
    version: '0.46.1',
    date: '2026-11-01',
    items: [c('Least Worst is now Last One Standing: win a game where everyone but you busted.', 'O Menos Mau passa a O Último de Pé: ganha um jogo em que todos menos tu passaram o limite.')],
  },
  {
    version: '0.46.0',
    date: '2026-11-01',
    items: [
      n('A Credits button next to Language on the main menu: everyone who made the game possible, with links to their pages.', 'Um botão Créditos ao lado da Língua no menu principal: todos os que tornaram o jogo possível, com ligações para as suas páginas.'),
      c("A New! achievement's border pulses with the same glow as its sign.", 'A borda de uma conquista Nova! pulsa com o mesmo brilho do sinal.'),
      f("In Achievements only the list scrolls, its scrollbar starts at the first row, and the cards' right edge and glow are no longer cut off (phones included).", 'Nas Conquistas só a lista desliza, a barra começa na primeira linha, e o lado direito e o brilho dos cartões já não ficam cortados (também nos telemóveis).'),
    ],
  },
  {
    version: '0.45.0',
    date: '2026-11-01',
    items: [
      n('New achievement: Least Worst, win a game where everyone busted in the last round.', 'Nova conquista: O Menos Mau, ganha um jogo em que todos passaram o limite na última ronda.'),
      f('New! signs on achievements now clear: hover or tap the card and the sign fades away.', 'Os sinais Nova! das conquistas já desaparecem: passa o rato ou toca no cartão e o sinal some-se.'),
      c('"Nananinanão!" turns up more often: one time in twenty.', 'O "Nananinanão!" aparece mais vezes: uma em cada vinte.'),
    ],
  },
  {
    version: '0.44.1',
    date: '2026-11-01',
    items: [
      c('In Portuguese, the Pass countdown reads "Passa automaticamente em 9,4s".', 'Em português, a contagem do Passar diz "Passa automaticamente em 9,4s".'),
      f('The Achievements window is wider, never scrolls sideways, and its first row (with any New! signs) is no longer hidden under the top.', 'A janela das Conquistas é mais larga, nunca desliza para o lado, e a primeira linha (com os sinais Nova!) já não fica tapada pelo topo.'),
    ],
  },
  {
    version: '0.44.0',
    date: '2026-11-01',
    items: [
      n('New rule, Magic Sort (support): turns on the Magic sort button. Magic sort now follows the room\'s rules and groups cards one short of a formation, after the formed ones.', 'Nova regra, Ordem Mágica (apoio): liga o botão de ordenar Magia. A Magia segue agora as regras da sala e junta as cartas a uma de formar, depois das já formadas.'),
      n('New rule, Scramble (funny): no sorting, and every card someone picks up shuffles everyone\'s hand.', 'Nova regra, Baralhada (divertida): nada de ordenar, e cada carta que alguém apanha baralha a mão de todos.'),
      n('New achievements: Vanilla (win with the default rules), and one per rule for finishing a game with it off while another rule is on.', 'Novas conquistas: Baunilha (ganha com as regras de origem), e uma por regra por acabar um jogo com ela desligada e outra ligada.'),
      n('Achievements you haven\'t seen yet show a New! sign, on the Achievements button and on the card, until you look at them.', 'As conquistas que ainda não viste mostram um sinal Nova!, no botão Conquistas e no cartão, até as veres.'),
      c('Auto-pass waits 10 seconds when the formation could still take a card, 5 when it\'s full, and the button says "Auto-skipping in 9.4s" over a smooth bar.', 'A passagem automática espera 10 segundos quando a formação ainda pode levar cartas, 5 quando está completa, e o botão diz "Passa automaticamente em 9,4s" sobre uma barra suave.'),
      c('Thin scrollbars in the game\'s colours, beside the content instead of over it. The top of Achievements and the Changelog stays in view while you scroll.', 'Barras de deslocamento finas nas cores do jogo, ao lado do conteúdo em vez de por cima. O topo das Conquistas e das Alterações fica à vista ao deslizar.'),
      c('Boardgame card backs: variants 1 and 3 of each colour, and Random never shows one colour twice in a row.', 'Costas de cartas do Boardgame: variantes 1 e 3 de cada cor, e o Aleatório nunca mostra a mesma cor duas vezes seguidas.'),
      c('How to play colours "2–10 as printed" like the other card values.', 'O Como jogar dá cor a "2–10 o que diz a carta" como aos outros valores.'),
    ],
  },
  {
    version: '0.43.2',
    date: '2026-11-01',
    items: [
      c('The page checks for a newer version as it loads and reloads itself to get it. Game files are fetched fresh for each version.', 'A página procura uma versão mais recente ao abrir e recarrega-se para a obter. Os ficheiros do jogo são obtidos de novo em cada versão.'),
      c('The achievement shine is slower and more see-through.', 'O brilho das conquistas é mais lento e mais transparente.'),
    ],
  },
  {
    version: '0.43.1',
    date: '2026-11-01',
    items: [
      c('An automatic pass in the History says why: no card fits, the formation is full, or the player can\'t add more to it.', 'Uma passagem automática no Histórico diz porquê: nenhuma carta serve, a formação está completa, ou o jogador já não pode acrescentar.'),
    ],
  },
  {
    version: '0.43.0',
    date: '2026-11-01',
    items: [
      n('Magic sort puts the cards of each formation together. A setting picks whether the cards that form nothing go left or right.', 'A ordenação Magia junta as cartas de cada formação. Uma definição escolhe se as cartas que não formam nada ficam à esquerda ou à direita.'),
      n('When none of your cards can ride, Pass counts down 5 seconds and passes for you. The History marks moves the game made for a player with a timer icon.', 'Quando nenhuma carta tua pode ir à boleia, o Passar conta 5 segundos e passa por ti. O Histórico marca com um relógio as jogadas que o jogo fez por um jogador.'),
      n('The History folds earlier rounds and earlier games in the room instead of losing them. Open one to read it or copy it.', 'O Histórico fecha as rondas e os jogos anteriores da sala em vez de os perder. Abre um para o ler ou copiar.'),
      n('Unlocking an achievement shines the whole card three times, with a chime for each.', 'Desbloquear uma conquista faz brilhar o cartão inteiro três vezes, com um som para cada.'),
      n('Formations show their cards first, then their name, which shines when laid and again for each card added. A closed formation shines once.', 'As formações mostram primeiro as cartas, depois o nome, que brilha ao ser mostrado e outra vez por cada carta acrescentada. Uma formação fechada brilha uma vez.'),
      n('Stats count the rides you gave.', 'As estatísticas contam as boleias que deste.'),
      c('Straights are named by their length before rides, like 4-Straight.', 'As escadas têm o nome do tamanho antes das boleias, como Escada de 4.'),
      c('TximTxom has to be called with a card of 5 or less, like Txi jog.', 'O TximTxom tem de ser chamado com uma carta de 5 ou menos, como o Txi jog.'),
      c('Hand points stack on wide screens too, and round totals stay on one line. The pile counters appear once the cards are dealt.', 'Os pontos da mão ficam empilhados também em ecrãs largos, e os totais da ronda ficam numa linha. Os contadores dos montes aparecem depois de as cartas serem dadas.'),
      f('Txi jog with a card picked before drawing ends the round with that card and keeps the drawn one.', 'O Txi jog com uma carta escolhida antes de comprar acaba a ronda com essa carta e fica com a comprada.'),
    ],
  },
  {
    version: '0.42.0',
    date: '2026-11-01',
    items: [
      n('Emotes: 12 pixel emotes by Kenney. Pick one from the smiley button on your plate or next to the chat field, and it pops up over your plate (or your row in the lobby) for everyone.', 'Emotes: 12 emotes em pixel art do Kenney. Escolhe um no botão da carinha no teu painel ou ao lado do campo da conversa, e aparece por cima do teu painel (ou da tua linha na sala) para todos.'),
      n('A Chat button in the top bar (shortcut C) opens the chat directly and shows how many messages you haven\'t read.', 'Um botão Conversa na barra de cima (atalho C) abre a conversa diretamente e mostra quantas mensagens tens por ler.'),
      n('New achievements: Show, Don\'t Tell (send your first emote) and Anarchist.', 'Novas conquistas: Mostra, Não Digas (envia o teu primeiro emote) e Anarquista.'),
      c('The side panel\'s close button looks like a button.', 'O botão de fechar o painel lateral parece mesmo um botão.'),
    ],
  },
  {
    version: '0.41.0',
    date: '2026-11-01',
    items: [
      n('New achievements: Say Hi, Polyglot, Recycler, Through the Ace, Quick Draw, Royal Flush and Seven Up, plus five secret ones.', 'Novas conquistas: Diz Olá, Poliglota, Reciclador, Volta ao Ás, Gatilho Rápido, Sequência Real e Sete em Linha, e mais cinco secretas.'),
      n('New achievements with progress bars: Chatterbox, Badge Collector, Scavenger, Marathon, and one for each kind of badge.', 'Novas conquistas com barra de progresso: Tagarela, Colecionador de Emblemas, Catador, Maratonista, e uma para cada tipo de emblema.'),
      c('Gold badges have a 50-win step after Midas (5) and Card Shark (10).', 'Os emblemas de ouro têm um passo de 50 vitórias depois de Midas (5) e Tubarão (10).'),
    ],
  },
  {
    version: '0.40.2',
    date: '2026-11-01',
    items: [
      f('High contrast cards now tell all four suits apart: diamonds are orange and clubs dark blue, while hearts stay red and spades black. Card backs are unchanged.', 'As cartas de alto contraste distinguem agora os quatro naipes: ouros cor de laranja e paus azul-escuro, enquanto copas continuam vermelhas e espadas pretas. As costas das cartas não mudam.'),
    ],
  },
  {
    version: '0.40.1',
    date: '2026-11-01',
    items: [
      f('Txi jog plays out as at a real table: the ending card goes face up under the discard pile, then the whole pile is turned face down onto the draw pile.', 'O Txi jog é como numa mesa a sério: a carta final vai virada para cima para debaixo da pilha de descarte, e depois a pilha toda é virada para baixo em cima do Monte.'),
    ],
  },
  {
    version: '0.40.0',
    date: '2026-11-01',
    items: [
      n('Chat: one conversation per room, in the lobby and in a Chat tab next to History during a game. A count shows messages you haven\'t read.', 'Conversa: uma por sala, na sala de espera e num separador ao lado do Histórico durante o jogo. Um número mostra as mensagens por ler.'),
      n('Stats has a Badges tab: gold, silver and bust badges, and the total.', 'As Estatísticas têm um separador de Emblemas: ouro, prata e Rabenta, e o total.'),
      c('Rule achievements now need a whole game finished with the rule on, not just one round.', 'As conquistas de regras pedem agora um jogo inteiro acabado com a regra, não só uma ronda.'),
      c('The in-game Rules window shows what each rule does, under its name.', 'A janela de Regras durante o jogo mostra o que cada regra faz, debaixo do nome.'),
      c('The Txi jog sign over the Draw Pile says why a card can\'t end the round (the card you just took, or higher than 5).', 'O aviso de Txi jog sobre o Monte diz porque é que uma carta não pode acabar a ronda (a carta que acabaste de apanhar, ou acima de 5).'),
      f('Dropping a card on the Txi jog sign over the Draw Pile now ends the round, as dropping it on the pile does.', 'Largar uma carta no aviso de Txi jog sobre o Monte já acaba a ronda, como largá-la no Monte.'),
      f('The card burn and deck animations render properly on phones.', 'As animações de queimar cartas e do baralho aparecem bem nos telemóveis.'),
      f('A tab reopened by the browser (after sleeping, a reload or Back) starts on the main menu instead of jumping into Play.', 'Um separador que o navegador reabre (depois de adormecer, recarregar ou Voltar) começa no menu principal em vez de saltar para Jogar.'),
    ],
  },
  {
    version: '0.39.0',
    date: '2026-11-01',
    items: [
      n('New rule, Mobius Strip: straights loop through the Ace, so it can sit in the middle (K-A-2). It needs Ace High.', 'Nova regra, Fita de Mobius: as escadas dão a volta pelo Ás, que pode ficar no meio (K-Ás-2). Precisa do Ás Alto.'),
      n('A rule that needs another is greyed out until that one is on, with a sign saying which.', 'Uma regra que precisa de outra fica cinzenta até essa estar ligada, com um aviso a dizer qual.'),
      n('New achievement for playing with Mobius Strip. Ace High has a new flavour line.', 'Nova conquista por jogar com a Fita de Mobius. O Ás Alto tem uma frase nova.'),
      c('Settings explain what they do as they are set: "The table stays still", "Cards stay where you put them" and so on.', 'As definições explicam o que fazem conforme estão: "A mesa fica quieta", "As cartas ficam onde as pões" e por aí fora.'),
    ],
  },
  {
    version: '0.38.1',
    date: '2026-11-01',
    items: [n('New epic achievement: Self-Service, for taking a ride on your own straight.', 'Nova conquista épica: Self-Service, por apanhares boleia na tua própria escada.')],
  },
  {
    version: '0.38.0',
    date: '2026-11-01',
    items: [
      n('New achievements for pairs, trios and straights of 5 cards or more.', 'Novas conquistas para pares, trincas e escadas de 5 cartas ou mais.'),
      n('Once someone stretches your straight, you can add to it too: a 2 on your 3-4-5-6 lets you place an Ace.', 'Quando alguém estica a tua escada, também lhe podes juntar cartas: um 2 na tua 3-4-5-6 deixa-te pôr um Ás.'),
      n('Tap to deselect: a setting for one tap on the table to let go of your cards. Without it, touch screens take a double tap.', 'Tocar para largar: uma opção para um toque na mesa largar as cartas. Sem ela, nos ecrãs tácteis são dois toques.'),
      c('Formation achievement goals follow how often each formation turns up: the last quad one asks for 15, not 100.', 'As metas das conquistas de formações seguem a frequência de cada formação: a última de quadras pede 15, não 100.'),
      c('Rulebook and Addicted show a progress bar.', 'O Livro de Regras e o Viciado mostram uma barra de progresso.'),
      c('Each rule achievement has its own flavour line.', 'Cada conquista de regra tem a sua frase.'),
      c('Any number of hand cards can be selected at any time. A move that takes one card uses the last one picked.', 'Podes escolher quantas cartas quiseres, a qualquer altura. Uma jogada de uma carta usa a última escolhida.'),
      c('A left click on the table no longer lets go of your cards. Right-click does.', 'Um clique esquerdo na mesa já não larga as cartas. O clique direito larga.'),
      f('A formation keeps the name it was shown with: a trio with a card added is "Trio +1", not "Quad +1".', 'Uma formação mantém o nome com que foi mostrada: uma trinca com mais uma carta é "Trinca +1", não "Quadra +1".'),
      f('When the turn timer runs out, your hand stays as it was: a drawn card is discarded, and a card taken from the discard pile goes back.', 'Quando o tempo da vez acaba, a tua mão fica como estava: uma carta tirada do Monte é descartada, e uma carta apanhada do descarte volta para lá.'),
    ],
  },
  {
    version: '0.37.0',
    date: '2026-10-29',
    items: [
      n('Progress achievements at 5, 25 and 100: rounds won, games won, formations, straights, quads, rides taken, rides given, Txi jogs and cards drawn. Each card shows how far along you are, and keeps counting past its goal.', 'Conquistas de progresso aos 5, 25 e 100: rondas ganhas, jogos ganhos, formações, escadas, quadras, boleias apanhadas, boleias dadas, Txi jogs e cartas tiradas. Cada carta mostra quanto falta, e continua a contar depois do objetivo.'),
      n('New achievements: Close Call, Flawless, Comeback and Generous.', 'Novas conquistas: Por Um Triz, Imbatível, Reviravolta e Generoso.'),
      c('Roundhouse, Card Shark, Midas and Bus Pass show their progress too.', 'Ronda a Ronda, Tubarão, Midas e Passe Social também mostram o progresso.'),
      n('Stats count the rides other players take on your formations.', 'As estatísticas contam as boleias que os outros apanham nas tuas formações.'),
    ],
  },
  {
    version: '0.36.2',
    date: '2026-10-29',
    items: [
      c('Rulebook wears legendary gold. The rainbow frame is saved for a later achievement.', 'O Livro de Regras usa o dourado lendário. A moldura de arco-íris fica guardada para uma conquista futura.'),
    ],
  },
  {
    version: '0.36.1',
    date: '2026-10-29',
    items: [
      c('Rulebook is a legendary achievement, still in its rainbow frame.', 'O Livro de Regras é uma conquista lendária, sempre com a moldura de arco-íris.'),
    ],
  },
  {
    version: '0.36.0',
    date: '2026-10-29',
    items: [
      n('New achievements: New Look, Distracted, one for playing a round with each rule, and Rulebook for playing with every rule, framed in moving rainbow colours.', 'Novas conquistas: Visual Novo, Distraído, uma por jogar uma ronda com cada regra, e Livro de Regras por jogar com todas, numa moldura de arco-íris animada.'),
      c('Unlocked achievements shine like the rules: their names and cards glint in their rarity\'s colour.', 'As conquistas desbloqueadas brilham como as regras: os nomes e as cartas reluzem na cor da raridade.'),
      c('A legend at the top of Achievements explains the rarity colours, in place of the hint when pointing at a card.', 'Uma legenda no topo das Conquistas explica as cores da raridade, em vez da dica ao apontar para uma carta.'),
    ],
  },
  {
    version: '0.35.2',
    date: '2026-10-29',
    items: [
      c('Action buttons too narrow for their label say the short form ("Show", "Discard") instead of cutting it off.', 'Os botões de ação sem espaço para o texto mostram a forma curta ("Mostrar", "Descartar") em vez de o cortar.'),
      c('With a turn timer, the clock starts again after each formation you show.', 'Com tempo por jogada, o relógio recomeça depois de cada formação mostrada.'),
      c('The timer bar on the player card shows the seconds left in its middle.', 'A barra do tempo no cartão do jogador mostra os segundos que faltam ao meio.'),
    ],
  },
  {
    version: '0.35.1',
    date: '2026-10-29',
    items: [
      n('Joining or creating a room that takes a moment shows "Joining..." with the loading screen\'s spinning card, over a dimmed screen that waits until you\'re in.', 'Entrar ou criar uma sala que demora mostra "A entrar..." com a carta a girar do ecrã de carregamento, sobre o ecrã escurecido, que espera até entrares.'),
    ],
  },
  {
    version: '0.35.0',
    date: '2026-10-29',
    items: [
      n('New achievement: Full Hand, for ending a round with all 7 cards formed.', 'Nova conquista: Mão Cheia, por acabar uma ronda com as 7 cartas formadas.'),
      n('In Formations, a rule card opens its rule in a balloon pointing at the card.', 'Nas Formações, uma carta de regra abre a regra num balão a apontar para a carta.'),
      c('Every rule you can switch now starts off, so anything switched on was chosen. Formation notice was the one that started on.', 'Todas as regras que se ligam e desligam começam desligadas, por isso o que estiver ligado foi escolhido. O Aviso de formações era a única que começava ligada.'),
      c('Bigger text on large screens. Medium and small screens keep their size, so windows still fit.', 'Texto maior em ecrãs grandes. Ecrãs médios e pequenos mantêm o tamanho, para as janelas continuarem a caber.'),
      c('Locked achievements say they are locked when you point at them; their rarity shows once unlocked.', 'As conquistas bloqueadas dizem que estão bloqueadas quando lhes apontas; a raridade aparece ao desbloquear.'),
      c('The loading card floats up and down as it spins.', 'A carta do ecrã de carregamento flutua enquanto gira.'),
      f('TximTxom glows in the rule texts in Formations.', 'O TximTxom brilha nos textos das regras nas Formações.'),
    ],
  },
  {
    version: '0.34.2',
    date: '2026-10-29',
    items: [
      c('Rule cards shine like their names: a glint in the rule\'s colour crosses each card from top left to bottom right.', 'As cartas das regras brilham como os nomes: um reflexo na cor da regra atravessa cada carta do canto superior esquerdo ao inferior direito.'),
    ],
  },
  {
    version: '0.34.1',
    date: '2026-10-29',
    items: [
      f('Changing the language no longer flashes the main menu Aces without their edition.', 'Mudar de língua já não mostra por um instante os Ases do menu sem a edição.'),
      f('The Style preview keeps its cards in place while a new card style loads.', 'A pré-visualização do Estilo mantém as cartas no lugar enquanto um novo estilo carrega.'),
      f('"Reportar um problema" breaks onto two lines inside its button.', 'O "Reportar um problema" passa para duas linhas dentro do botão.'),
      c('Achievements wear their rarity colour all the way round.', 'As conquistas têm a cor da raridade à volta toda.'),
    ],
  },
  {
    version: '0.34.0',
    date: '2026-10-29',
    items: [
      n('New achievements: Ragequit, 2nd Place First Loser, RTFM, Full Party!, Roundhouse, Bus Pass, Addicted, Card Shark, Midas, Bad Timing, and a secret one.', 'Novas conquistas: Ragequit, 2.º Lugar 1.º a Perder, RTFM, Casa Cheia!, Ronda a Ronda, Passe Social, Viciado, Tubarão, Midas, Na Hora Errada, e uma secreta.'),
      n('Achievements show their rarity down the side: blue common, green uncommon, purple epic, gold legendary, red secret. Grey until unlocked.', 'As conquistas mostram a raridade de lado: azul comum, verde invulgar, roxo épica, dourado lendária, vermelho secreta. Cinzento até desbloquear.'),
      n('History: copy one finished round, or the whole game, as a compact log.', 'Histórico: copia uma ronda acabada, ou o jogo todo, num registo compacto.'),
      n('A Full Hand or a TximTxom stays pinned on screen after its banner, with who did it.', 'Uma Mão Cheia ou um TximTxom fica afixado no ecrã depois do aviso, com quem o fez.'),
      n('Stats count the games you left early. Percentages now sit in parentheses beside wins and losses.', 'As estatísticas contam os jogos abandonados. As percentagens aparecem entre parênteses ao lado das vitórias e derrotas.'),
      c('Penalty +10 and Double Down pardon an ender with 0 points.', 'A Multa +10 e a Dobra perdoam quem fez Txi jog com 0 pontos.'),
      c('History only follows new moves while you are at the bottom. Reopening it jumps back to the newest move.', 'O Histórico só segue as novas jogadas quando estás no fundo. Ao reabrir volta à mais recente.'),
      c('"-10! Full hand" is now "Full Hand! -10".', '"-10! Mão cheia" passa a "Mão Cheia! -10".'),
      f('Tapping the Aces on the main menu quickly no longer flashes them without their edition.', 'Tocar depressa nos Ases do menu principal já não os mostra por um instante sem a edição.'),
    ],
  },
  {
    version: '0.33.0',
    date: '2026-10-29',
    items: [
      n('Silver and bust badges: at the end of a game everyone who lost without busting gets silver, and whoever busted gets the skull. Each badge names itself when you point at it, with its count beside it.', 'Emblemas de prata e de Rabenta: no fim do jogo quem perdeu sem rabentar ganha prata, e quem rabentou leva a caveira. Cada emblema diz o nome quando lhe apontas, com a contagem ao lado.'),
      n('The Scoreboard has three tabs: this round, every round of this game, and the badges of every game played at the table. It no longer scrolls.', 'A Pontuação tem três separadores: esta ronda, todas as rondas deste jogo, e os emblemas de todos os jogos da mesa. Já não desliza.'),
      n('Tap the empty table to let go of the cards you selected.', 'Toca na mesa vazia para largar as cartas selecionadas.'),
      c('BUST pulses in red at the end of the game.', 'O RABENTOU pulsa a vermelho no fim do jogo.'),
      c('Rule names glow in their colour everywhere: the room\'s rules, the rules in a game, descriptions and banners.', 'Os nomes das regras brilham na sua cor em todo o lado: nas regras da sala, nas regras do jogo, nas descrições e nos avisos.'),
      c('In the room, Leave room sits beside the title and Start game takes the whole row.', 'Na sala, o Sair da sala fica ao lado do título e o Começar jogo ocupa a linha toda.'),
    ],
  },
  {
    version: '0.32.0',
    date: '2026-10-29',
    items: [
      c('Shown formations are labelled in their owner\'s colour instead of with their name, so labels no longer overlap. A +2 after the name counts the cards others added on rides.', 'As formações mostradas têm a etiqueta na cor do dono em vez do nome, para as etiquetas não se taparem. Um +2 depois do nome conta as cartas que outros juntaram de boleia.'),
      c('Cards added on a ride have a border in the colour of the player who added them.', 'As cartas juntadas de boleia têm uma borda na cor de quem as juntou.'),
      c('Bots join as a random character instead of always the same ones in the same order.', 'Os bots entram com uma personagem aleatória em vez de serem sempre os mesmos pela mesma ordem.'),
      c('Nope! sometimes says Nuh-uh! instead, and very rarely something else.', 'O Nope! às vezes diz Nuh-uh!, e muito raramente outra coisa.'),
      c('Totals in the score tables end in pts.', 'Os totais nas tabelas de pontos acabam em pts.'),
    ],
  },
  {
    version: '0.31.2',
    date: '2026-10-29',
    items: [
      n('Achievements have a progress bar.', 'As conquistas têm uma barra de progresso.'),
    ],
  },
  {
    version: '0.31.1',
    date: '2026-10-29',
    items: [
      c('With reduced motion on, TximTxom no longer sits still: the whole word slowly fades from colour to colour.', 'Com o movimento reduzido ligado, o TximTxom já não fica parado: a palavra toda muda de cor devagar.'),
    ],
  },
  {
    version: '0.31.0',
    date: '2026-10-29',
    items: [
      n('A Style tab in Settings: switch the card art to the smooth cards of Kenney\'s Boardgame Pack, with 15 new card backs, and pick the game\'s font from five.', 'Um separador Estilo nas Definições: muda a arte das cartas para as cartas suaves do Boardgame Pack da Kenney, com 15 costas novas, e escolhe a letra do jogo entre cinco.'),
      n('Infected now also counts how many players caught it from you. Both counts are a secret: you know where to look once you have it.', 'O Infetado agora também conta quantos jogadores o apanharam de ti. As duas contagens são secretas: quando o tiveres, sabes onde procurar.'),
      c('Stats\' Overview fits without scrolling: the big numbers sit beside the formations.', 'A Vista geral das Estatísticas cabe sem deslizar: os números grandes ficam ao lado das formações.'),
      f('TximTxoms in Stats wasn\'t colourful or animated.', 'O TximTxoms nas Estatísticas não tinha cor nem animação.'),
    ],
  },
  {
    version: '0.30.0',
    date: '2026-10-29',
    items: [
      n('Three new achievements: Tip Tap (tap each Ace on the main menu), and two secret ones.', 'Três conquistas novas: Tip Tap (toca em cada Ás do menu principal), e duas secretas.'),
      n('Rule names light up in their colour wherever they\'re mentioned, and the coloured words in How to play wave.', 'Os nomes das regras acendem-se na sua cor onde quer que sejam mencionados, e as palavras coloridas do Como jogar ondulam.'),
      n('Formations: tap a rule card to read its rule. Card values are shown as cards.', 'Formações: toca numa carta de regra para a leres. Os valores das cartas aparecem como cartas.'),
      n('Stats: your longest game, and a bar of where your cards came from (Draw Pile or Discard Pile).', 'Estatísticas: o teu jogo mais longo, e uma barra de onde vieram as tuas cartas (Monte ou Descarte).'),
      n('The Language button has an icon.', 'O botão Idioma tem um ícone.'),
      c('The player counter is hidden. Rumour has it the name at the bottom of the main menu knows something. It now counts rounds played too.', 'O contador de jogadores está escondido. Diz-se que o nome no fundo do menu principal sabe alguma coisa. Agora também conta as rondas jogadas.'),
      c('Infected now spreads at the start of every round, to everyone at the table who doesn\'t have it yet.', 'O Infetado agora espalha-se no início de cada ronda, a todos os que estão à mesa e ainda não o têm.'),
      c('How to play, Stats and Settings are wider, with their tabs in one row. Stats\' third tab is just Cards, and Visits and Playing since moved to Overview.', 'O Como jogar, as Estatísticas e as Definições são mais largos, com os separadores numa linha. O terceiro separador das Estatísticas é só Cartas, e as Visitas e o A jogar desde passaram para a Vista geral.'),
      c('Achievement toasts stay a little longer, so there\'s time to read them. That\'s Nuts! is now Dirty Hands.', 'Os avisos de conquistas ficam um pouco mais, para dar tempo de os ler. Que Maluquice! passou a Mãos Sujas.'),
      c('Taking a ride is explained in How to play instead of Formations.', 'Apanhar boleia é explicado no Como jogar em vez das Formações.'),
      f('TximTxom\'s wave wasn\'t moving.', 'A onda do TximTxom não se mexia.'),
      f('The swirly background could be broken on phones.', 'O fundo em espiral podia aparecer estragado nos telemóveis.'),
      f('Hovering the formation chart in Stats showed hints in the top left corner. It shows each formation\'s share instead.', 'Passar por cima do gráfico de formações nas Estatísticas mostrava dicas no canto superior esquerdo. Agora mostra a percentagem de cada formação.'),
      f('In the room, the Settings button could cover the other buttons on some screen sizes.', 'Na sala, o botão Definições podia tapar os outros botões em alguns tamanhos de ecrã.'),
      f('Locks on locked achievements are the size of the question mark.', 'Os cadeados das conquistas bloqueadas têm o tamanho do ponto de interrogação.'),
      r('Cards discarded and the counts for everyone are gone from Stats.', 'As cartas descartadas e as contagens de todos saíram das Estatísticas.'),
    ],
  },
  {
    version: '0.29.0',
    date: '2026-10-28',
    items: [
      n('Achievements! Eleven to unlock, some of them secret. A toast at the top of the screen tells you when you get one.', 'Conquistas! Onze para desbloquear, algumas secretas. Um aviso no topo do ecrã diz-te quando ganhas uma.'),
      n('Pick up the cards in the menus and windows (rules, characters, achievements, card backs) and swing them around, just for fun.', 'Pega nas cartas dos menus e janelas (regras, personagens, conquistas, costas) e atira-as por aí, só por diversão.'),
      n('The Changelog has buttons to report an issue on GitHub or to contact me.', 'As Alterações têm botões para reportar um problema no GitHub ou para me contactar.'),
      n('Stats show the date and time you started playing.', 'As estatísticas mostram a data e a hora em que começaste a jogar.'),
      c('TximTxom\'s colours flow from left to right, with a dark outline so it reads on any background, and its letters ride a wave.', 'As cores do TximTxom correm da esquerda para a direita, com um contorno escuro para se ler em qualquer fundo, e as letras ondulam.'),
      c('In the room, the rules open in their own window from a red Rules button, next to How to play and Formations. The room no longer scrolls.', 'Na sala, as regras abrem numa janela própria com um botão Regras vermelho, ao lado do Como jogar e das Formações. A sala já não desliza.'),
      c('Settings has an Accessibility tab. Controls only lists the keyboard and mouse, and is hidden on touch screens. Sorting moved to General.', 'As Definições têm um separador Acessibilidade. Os Controlos só mostram o teclado e o rato, e não aparecem em ecrãs táteis. A ordenação passou para Geral.'),
      f('The Aces only show on the main menu, not behind the Play panel.', 'Os Ases só aparecem no menu principal, não atrás do painel Jogar.'),
      f('The Aces could appear in the wrong colours while materialising on some browsers.', 'Em alguns navegadores, os Ases podiam aparecer com as cores erradas enquanto se materializavam.'),
    ],
  },
  {
    version: '0.28.0',
    date: '2026-10-28',
    items: [
      n('A new main menu in the style of Balatro: Play, Stats, Achievements (coming soon), Settings, Changelog and How to play.', 'Um menu principal novo ao estilo do Balatro: Jogar, Estatísticas, Conquistas (brevemente), Definições, Alterações e Como jogar.'),
      n('Stats: time in games, rounds and games played, won and lost, win streaks, best and worst round, lowest total, record bust, cards drawn and a chart of your formations.', 'Estatísticas: tempo em jogo, rondas e jogos jogados, ganhos e perdidos, vitórias seguidas, melhor e pior ronda, total mais baixo, recorde de Rabenta, cartas tiradas e um gráfico das tuas formações.'),
      n('A counter on the main menu shows how many players and visits the game has had.', 'Um contador no menu principal mostra quantos jogadores e visitas o jogo já teve.'),
      n('Drag a card onto the Txi jog button to Txi jog. A hand card takes the drawn card\'s place. The button lights up while you hold a card it takes.', 'Arrasta uma carta para o botão de Txi jog para fazer Txi jog. Uma carta da mão troca de lugar com a carta tirada. O botão acende enquanto seguras uma carta que ele aceita.'),
      n('Calling TximTxom without one gets a Nope!', 'Chamar TximTxom sem o ter dá um Nope!'),
      n('TximTxom glows in colour and waves wherever it\'s written, except the title.', 'O TximTxom brilha a cores e ondula onde quer que esteja escrito, exceto no título.'),
      c('Options with several choices are picked with arrows, with dots showing the choice, like Game speed.', 'As opções com várias escolhas mudam-se com setas, com pontos a mostrar a escolha, como a Velocidade do jogo.'),
      c('Anti-aliasing is just on or off.', 'O anti-aliasing é só ligado ou desligado.'),
      c('A room code is forgotten 10 minutes after you leave the room.', 'O código da sala é esquecido 10 minutos depois de saíres da sala.'),
      c('The rules in a game show as a short two-column list, with On in green and Off in red.', 'As regras num jogo aparecem numa lista curta em duas colunas, com Sim a verde e Não a vermelho.'),
      c('Settings, Stats, How to play and the language menu are narrower, and switching tabs no longer changes their size.', 'As Definições, as Estatísticas, o Como jogar e o menu de línguas são mais estreitos, e mudar de separador já não lhes muda o tamanho.'),
      c('Round and game summaries are more compact, and lobby rules take one row each on desktop.', 'Os resumos da ronda e do jogo ocupam menos espaço, e as regras na sala ocupam uma linha cada no computador.'),
      c('Rename and Remove in the lobby look like buttons, and the language menu\'s title is blue.', 'Mudar nome e Remover na sala parecem botões, e o título do menu de línguas é azul.'),
      f('On short screens and with bigger text, the hand and piles move up so nothing overlaps.', 'Em ecrãs baixos e com texto maior, a mão e as pilhas sobem para nada se sobrepor.'),
      f('Hopping letters no longer shimmer.', 'As letras que saltam já não tremem.'),
      f('The game page can no longer be scrolled.', 'A página do jogo já não se pode deslocar.'),
      f('The Aces on the menu can\'t be tapped or lit up before they appear.', 'Os Ases no menu já não se podem tocar nem acender antes de aparecerem.'),
      f('"cards" no longer spills out of the player plates on phones.', 'O "cartas" já não sai das placas dos jogadores nos telemóveis.'),
      r('Stats are no longer in Settings: they have their own button on the main menu.', 'As estatísticas já não estão nas Definições: têm o seu próprio botão no menu principal.'),
    ],
  },
  {
    version: '0.27.1',
    date: '2026-10-26',
    items: [
      c('When every player has left, the bots stop and wait: for someone to come back, or for the room to close after 10 minutes.', 'Quando todos os jogadores saem, os bots param e esperam: que alguém volte, ou que a sala feche ao fim de 10 minutos.'),
    ],
  },
  {
    version: '0.27.0',
    date: '2026-10-26',
    items: [
      n('Players say Ready in the lobby before the host can start. A tick or an hourglass shows who is ready.', 'Os jogadores carregam em Pronto na sala antes de o anfitrião poder começar. Um visto ou uma ampulheta mostra quem está pronto.'),
      n('A Language button on the main menu opens a language menu. The PT/EN switch in the corner is gone.', 'Um botão Língua no menu principal abre um menu de línguas. O interruptor PT/EN no canto desapareceu.'),
      n('Left a game in progress? Join on the main menu takes you back to your seat.', 'Saíste de um jogo a decorrer? O Entrar no menu principal leva-te de volta ao teu lugar.'),
      f('Switching language no longer moves buttons and labels: each takes the space of its longest translation.', 'Mudar de língua já não mexe botões nem textos: cada um ocupa o espaço da sua tradução mais comprida.'),
      f('Scoreboard columns have even widths, and the copy button\'s icon is centred.', 'As colunas da pontuação têm a mesma largura, e o ícone do botão de copiar está centrado.'),
      f('The browser\'s own tooltips no longer show on hover.', 'As dicas do próprio navegador já não aparecem ao passar o rato.'),
      c('The History log is more compact.', 'O Histórico ocupa menos espaço.'),
      c('Leave game is no longer in Settings.', 'Sair do jogo já não está nas Definições.'),
    ],
  },
  {
    version: '0.26.1',
    date: '2026-10-25',
    items: [
      f('When the turn timer ran out, the game could end the round for you. Now it only draws and discards for you; the round ends on its own only if the Draw Pile runs out.', 'Quando o tempo da jogada acabava, o jogo podia fazer Txi jog por ti. Agora só tira e descarta por ti; a ronda só acaba sozinha se o Monte acabar.'),
      f('Every active rule shows on the round chip, and its hint gives the rule\'s name and description.', 'Todas as regras ativas aparecem ao lado da ronda, e a dica mostra o nome e a descrição da regra.'),
      c('In game, History and How to play swapped places.', 'No jogo, o Histórico e o Como jogar trocaram de lugar.'),
    ],
  },
  {
    version: '0.26.0',
    date: '2026-10-25',
    items: [
      n('Drag a card of 5 or lower onto the Draw Pile to Txi jog. The pile shows a Txi jog sign while you hold one.', 'Arrasta uma carta de 5 ou menos para o Monte para fazer Txi jog. O Monte mostra um sinal de Txi jog enquanto a seguras.'),
      c('Txi jog plays out as at a real table: the card slides face down under the Discard Pile, and the pile goes onto the Draw Pile. Nobody sees which card it was.', 'O Txi jog é como numa mesa a sério: a carta entra virada para baixo debaixo da Pilha de Descarte, e a pilha vai para cima do Monte. Ninguém vê que carta foi.'),
      f('A new round started out of order. Now the old cards burn, the new deck appears, the cards are dealt, then the bottom card opens the Discard Pile. Bots wait for all of it.', 'Uma nova ronda começava fora de ordem. Agora as cartas antigas ardem, o baralho novo aparece, as cartas são dadas e só depois a carta de baixo abre a Pilha de Descarte. Os bots esperam por tudo isto.'),
      c('Random card backs use every back once before repeating, and never the same one twice in a row.', 'As costas aleatórias usam todas as costas uma vez antes de repetir, e nunca a mesma duas vezes seguidas.'),
      c('On the menu, the Aces appear a second after the title, one at a time. Tapping an Ace no longer makes it appear again.', 'No menu, os Ases aparecem um segundo depois do título, um de cada vez. Tocar num Ás já não o faz aparecer de novo.'),
      f('Button hints point at their button near the screen edge, and don\'t show when the button\'s text already says it.', 'As dicas dos botões apontam para o botão certo junto à borda do ecrã, e não aparecem quando o texto do botão já o diz.'),
      c('Reset to defaults asks first.', 'Repor tudo pergunta primeiro.'),
      c('Screen shake and Animated background sit under Reduced motion, which turns them off; locked switches are now clearly greyed out.', 'Ecrã a tremer e Fundo animado ficam por baixo de Menos movimento, que os desliga; os interruptores bloqueados ficam agora bem acinzentados.'),
    ],
  },
  {
    version: '0.25.0',
    date: '2026-10-25',
    items: [
      n('Drag the top of the Discard Pile onto a hand card to take it in that card\'s place; the hand card goes to the pile.', 'Arrasta a carta do topo da Pilha de Descarte para uma carta da mão para a trocar por ela; a carta da mão vai para a pilha.'),
      f('Auto sort turned itself off when a card was dragged. It now stays on and keeps the hand sorted as cards come and go.', 'A ordenação automática desligava-se ao arrastar uma carta. Agora fica ligada e mantém a mão ordenada quando entram e saem cartas.'),
      c('Held cards swing and wobble as they move, instead of staying upright.', 'As cartas agarradas balançam enquanto se movem, em vez de ficarem direitas.'),
      c('Sound drops to 10% while the game\'s window or tab is not in focus.', 'O som baixa para 10% quando a janela ou o separador do jogo não está em foco.'),
    ],
  },
  {
    version: '0.24.4',
    date: '2026-10-25',
    items: [c('The title Aces start materialising only once the "TximTxom" title is whole.', 'Os Ases do título só começam a materializar-se quando o título "TximTxom" está completo.')],
  },
  {
    version: '0.24.3',
    date: '2026-10-25',
    items: [
      n('Each round, the new deck materialises in Tarot purple before the cards are dealt.', 'A cada ronda, o baralho novo materializa-se em roxo de Tarot antes de as cartas serem dadas.'),
    ],
  },
  {
    version: '0.24.2',
    date: '2026-10-25',
    items: [
      c('"Click to start" always opens the main menu. After a refresh, Join reads "Rejoin" and takes you back to your seat.', '"Clica para começar" abre sempre o menu principal. Depois de recarregar a página, o botão Entrar passa a "Voltar" e leva-te de volta ao teu lugar.'),
      n('The "TximTxom" title materialises in Spectral blue before the Aces.', 'O título "TximTxom" materializa-se em azul Espectral antes dos Ases.'),
    ],
  },
  {
    version: '0.24.1',
    date: '2026-10-25',
    items: [
      c('The "Click to start" button is always there once the game has loaded; the music starts with it.', 'O botão "Clica para começar" aparece sempre quando o jogo acaba de carregar; a música começa com ele.'),
      c('The title Aces materialise in green, like Balatro\'s DNA.', 'Os Ases do título materializam-se a verde, como o DNA do Balatro.'),
      c('The "Random" card back fades through every back in turn.', 'As costas "Aleatórias" passam por todas as costas, umas atrás das outras.'),
      f('The question mark on the "Random" card back vanished on hover.', 'O ponto de interrogação das costas "Aleatórias" desaparecia ao passar o rato.'),
    ],
  },
  {
    version: '0.24.0',
    date: '2026-10-25',
    items: [
      c('Pairs no longer count by default. The new Softcore rule turns them back on; it replaces Hardcore.', 'Os pares já não contam por defeito. A nova regra Softcore volta a ligá-los; substitui a Hardcore.'),
      c('Dealt cards fill the hand one by one, in the order they arrive. Auto sort waits until the deal is over.', 'As cartas dadas enchem a mão uma a uma, pela ordem em que chegam. A ordenação automática espera pelo fim da distribuição.'),
      n('The title Aces appear once you reach the menu: they materialise, then get their editions.', 'Os Ases do título aparecem quando chegas ao menu: materializam-se e depois recebem as edições.'),
      n('Card back "Random": a new back every round.', 'Costas "Aleatórias": costas novas a cada ronda.'),
      c('Tapped title Aces hop straight up along the card.', 'Os Ases do título, quando tocados, saltam a direito ao longo da carta.'),
      c('Penalty +10 now comes before Double Down in the rules.', 'A Multa +10 aparece agora antes da Dobra nas regras.'),
    ],
  },
  {
    version: '0.23.6',
    date: '2026-10-25',
    items: [
      c('The music loads with the game and starts with the menu. Browsers that need a click first get a "Click to start" button.', 'A música carrega com o jogo e começa com o menu. Nos browsers que pedem um clique primeiro aparece o botão "Clica para começar".'),
      c('The loading text hops like the rest of the game\'s text.', 'O texto do carregamento salta como o resto do texto do jogo.'),
      c('While others ride on your formation, you can select several cards for your next one.', 'Enquanto os outros apanham boleia na tua formação, podes escolher várias cartas para a próxima.'),
      c('Text in the game can no longer be selected (names and codes you type still can).', 'O texto do jogo já não pode ser selecionado (nomes e códigos que escreves ainda podem).'),
    ],
  },
  {
    version: '0.23.5',
    date: '2026-10-25',
    items: [
      c('New music: the TximTxom Theme by BadJuice, in place of the Balatro track.', 'Música nova: o TximTxom Theme da BadJuice, no lugar da faixa do Balatro.'),
    ],
  },
  {
    version: '0.23.4',
    date: '2026-10-25',
    items: [
      c('"Loading..." under the loading card.', '"A carregar..." por baixo da carta do carregamento.'),
      c('The Controls tab lists right-click (deselect all cards), under "Keyboard and mouse".', 'O separador Controlos mostra o clique direito (largar todas as cartas), em "Teclado e rato".'),
    ],
  },
  {
    version: '0.23.3',
    date: '2026-10-25',
    items: [f('The loading card glitched while it turned.', 'A carta do carregamento falhava enquanto girava.')],
  },
  {
    version: '0.23.2',
    date: '2026-10-25',
    items: [
      c('The loading card turns over: red Joker, back, black Joker, back. The back is a new colour each time.', 'A carta do carregamento vira-se: Joker vermelho, costas, Joker preto, costas. As costas mudam de cor de cada vez.'),
      c('Right-click no longer opens the browser menu. In a game it lets go of the selected cards.', 'O clique direito já não abre o menu do navegador. Num jogo, larga as cartas selecionadas.'),
    ],
  },
  {
    version: '0.23.1',
    date: '2026-10-25',
    items: [
      f('The table showed no cards (hand, piles, other players) since 0.23.0.', 'A mesa não mostrava cartas (mão, montes, outros jogadores) desde a 0.23.0.'),
      c('The Cards tab in Settings is now called Graphics.', 'O separador Cartas das Definições passa a chamar-se Gráficos.'),
    ],
  },
  {
    version: '0.23.0',
    date: '2026-10-25',
    items: [
      n('A spinning card shows while the game loads.', 'Uma carta a girar aparece enquanto o jogo carrega.'),
      c('Anti-aliasing "Everything" no longer blurs the cards: only the edges between pixels are smoothed. It is now the default.', 'A suavização "Tudo" já não desfoca as cartas: só suaviza as margens entre píxeis. Passa a ser a predefinição.'),
      c('The hand points read "Total" and "Unformed" (points of the cards left out of formations).', 'Os pontos da mão dizem "Total" e "Por formar" (pontos das cartas que ficam fora das formações).'),
      c('The edition shine sways like a wave: three steps forward, one back.', 'O brilho das edições ondula: três passos para a frente, um para trás.'),
      c('Bigger Aces on the title screen.', 'Ases maiores no ecrã inicial.'),
      c('More colour on the buttons: How to play, the bot buttons and the reset buttons.', 'Mais cor nos botões: Como jogar, os botões dos bots e os de repor.'),
      c('How to play no longer mentions Mixed Suits; the rule is explained in the room.', 'Como jogar já não fala de Naipes Misturados; a regra está explicada na sala.'),
      f('"Unformed" counted a card that still fitted a laid formation (a third 7 next to a pair of 7s) as left over.', '"Por formar" contava como solta uma carta que ainda cabia numa formação (um terceiro 7 ao lado de um par de 7).'),
      f('The hint over the hand points flickered while the pointer moved across it, and the browser showed its own hint too.', 'A dica dos pontos da mão piscava ao passar o ponteiro, e o navegador mostrava também a sua.'),
    ],
  },
  {
    version: '0.22.1',
    date: '2026-10-24',
    items: [c('Polychrome is now a 5% chance per Ace, up from 3%.', 'A Policromática passa a ter 5% de hipótese por Ás, em vez de 3%.')],
  },
  {
    version: '0.22.0',
    date: '2026-10-21',
    items: [
      c('The title-screen Aces are no longer sure to get an edition: each one rolls for it every time they are dealt (Foil 10%, Holographic 7%, Polychrome 3%, Negative 3%).', 'Os Ases do ecrã inicial já não ganham sempre uma edição: cada um tenta a sorte sempre que são dados (Foil 10%, Holográfica 7%, Policromática 3%, Negativa 3%).'),
      c('Negative inverts the card\'s colours and keeps its sheen, so rank and suit stay readable.', 'A Negativa inverte as cores da carta e mantém o brilho, por isso o valor e o naipe continuam legíveis.'),
      c('The title has a thin dark outline, so it reads over any colour of the background.', 'O título tem um contorno escuro fino, para se ler sobre qualquer cor do fundo.'),
      n('The Aces may answer to a certain word.', 'Os Ases podem responder a uma certa palavra.'),
    ],
  },
  {
    version: '0.21.0',
    date: '2026-10-20',
    items: [
      n('The title-screen Aces get Balatro-style editions: Foil, Holographic, Polychrome and Negative, as shaders that shimmer under the pointer. Each one lands with its own sound and a little jolt, in a new shuffle every visit.', 'Os Ases do ecrã inicial ganham edições à Balatro: Foil, Holográfica, Policromática e Negativa, como shaders que brilham debaixo do ponteiro. Cada uma chega com o seu som e um pequeno abanão, baralhadas de novo a cada visita.'),
      n('Added RDCLSM.', 'Adicionado RDCLSM.'),
      c('Settings: a switch and the sliders it locks share a frame (Mute with the volumes, CRT with its strength).', 'Definições: um interruptor e as barras que ele bloqueia ficam na mesma moldura (Silenciar com os volumes, CRT com a força).'),
      c('In the room, language and Settings sit in the top corner of the screen, as on the title screen.', 'Na sala, a língua e as Definições ficam no canto de cima do ecrã, como no ecrã inicial.'),
      c('The small buttons show their name next to the icon where there is room (computer), and just the icon where there is not (phone).', 'Os botões pequenos mostram o nome ao lado do ícone quando há espaço (computador), e só o ícone quando não há (telemóvel).'),
      c('"After formations" is now "Formed". Labels sit on the left, numbers on the right.', '"Após formações" passa a "Formada". Os nomes ficam à esquerda e os números à direita.'),
      f('TximTxom! and Txi jog are the same size as the other action buttons, and on phones the buttons have more room between them.', 'TximTxom! e Txi jog têm o mesmo tamanho que os outros botões de ação, e no telemóvel há mais espaço entre os botões.'),
    ],
  },
  {
    version: '0.20.0',
    date: '2026-10-20',
    items: [
      n('Next to Hand Points, "After formations" shows in blue what your hand would still be worth once you lay your formations: from the best way of laying them to the worst.', 'Ao lado dos Pontos na mão, "Após formações" mostra a azul quanto a mão ainda valeria depois de pousares as formações: da melhor maneira de as pousar à pior.'),
      n('Added 👾.', 'Adicionado 👾.'),
      c('Scores, Formations and History are small buttons too, like Rules, on computer and phone.', 'Pontuação, Formações e Histórico também são botões pequenos, como Regras, no computador e no telemóvel.'),
      c('In the room, the two panels end on the same line.', 'Na sala, os dois painéis acabam à mesma altura.'),
      c('Settings > Controls: the two columns of keys are evenly spaced.', 'Definições > Controlos: as duas colunas de teclas ficam igualmente espaçadas.'),
      f('Phones: the top buttons, the name plates and the bar under the hand no longer overlap, down to 360px wide screens.', 'Telemóveis: os botões de cima, as placas com os nomes e a barra debaixo da mão já não se sobrepõem, até ecrãs com 360px de largura.'),
    ],
  },
  {
    version: '0.19.0',
    date: '2026-10-19',
    items: [
      n('While you drag a card over your hand, the other cards open a gap where it would land, like in Balatro. The title-screen Aces do the same.', 'Enquanto arrastas uma carta sobre a mão, as outras abrem espaço onde ela vai cair, como no Balatro. Os Ases do ecrã inicial fazem o mesmo.'),
      n('Anti-aliasing setting (Cards tab): off, card edges (default) or everything.', 'Opção de suavização (separador Cartas): desligada, margens das cartas (por defeito) ou tudo.'),
      n('Esc opens Settings during a game.', 'Esc abre as Definições durante um jogo.'),
      n('Leaving the room asks first.', 'Sair da sala pede confirmação.'),
      c('Settings sits in the top corner next to the language switch, on the title screen and in the room. The room no longer has a Changelog button.', 'As Definições ficam no canto de cima, ao lado da língua, no ecrã inicial e na sala. A sala já não tem o botão do Registo de alterações.'),
      c('In a game, Help, Settings and Leave are small buttons with clearer icons. Leave is now "Leave game" or "Leave room".', 'Num jogo, Ajuda, Definições e Sair são botões pequenos com ícones mais claros. Sair passa a "Sair do jogo" ou "Sair da sala".'),
      c('The room is centred on the screen.', 'A sala fica ao centro do ecrã.'),
      c('The title is bigger on big screens.', 'O título é maior em ecrãs grandes.'),
      c('Settings: "Reset to defaults" shows on every tab. Muted sound and CRT off grey out their sliders instead of hiding them. Slider values sit in the middle of the bar.', 'Definições: "Repor tudo" aparece em todos os separadores. Com o som silenciado ou o CRT desligado, as barras ficam cinzentas em vez de desaparecer. Os valores ficam no meio da barra.'),
      c('Keyboard list: "Hold R" instead of "R hold", centred on the screen.', 'Lista de teclas: "Manter R" em vez de "R manter", ao centro do ecrã.'),
      f('Name plates no longer overflow at 160% text size.', 'As placas com os nomes já não transbordam com o texto a 160%.'),
      f('Scoreboard: more space between names and the coloured circles.', 'Pontuação: mais espaço entre os nomes e os círculos de cor.'),
    ],
  },
  {
    version: '0.18.2',
    date: '2026-10-19',
    items: [
      c('The title-screen Aces drag like cards in your hand: drop one on the fan to move it to a new spot, anywhere else and it goes back. The fan starts over when you return to the title screen.', 'Os Ases do ecrã inicial arrastam-se como as cartas da mão: larga um no leque para o mudar de lugar; noutro sítio qualquer, ele volta. O leque recomeça quando regressas ao ecrã inicial.'),
    ],
  },
  {
    version: '0.18.1',
    date: '2026-10-19',
    items: [
      c('The Aces on the title screen stay where you drop them. They go back into the fan when you return to the title screen.', 'Os Ases do ecrã inicial ficam onde os largas. Voltam ao leque quando regressas ao ecrã inicial.'),
    ],
  },
  {
    version: '0.18.0',
    date: '2026-10-19',
    items: [
      f('A card can be dragged onto an empty discard pile.', 'Já se pode arrastar uma carta para o Descarte vazio.'),
      f('While you drag a card, the buttons at the bottom are locked, so "End with" can no longer fire mid-drag.', 'Enquanto arrastas uma carta, os botões do fundo ficam bloqueados, por isso o "Txi jog" já não dispara a meio do arrasto.'),
      c('"That is not a valid formation" now gets the Nope! too.', '"Isso não é uma formação válida" agora também leva o Nope!.'),
      c("Another player's draw shows what they did: a returned card turns face up on its way to the discard pile, a kept one tucks into their hand while another card leaves it.", 'O tirar de outro jogador mostra o que fez: uma carta devolvida vira-se a caminho do Descarte, uma carta guardada entra na mão enquanto sai outra.'),
      c('"Já está" is now "Acabar de mostrar" ("Finish showing") and must be held to confirm, so it is no longer pressed by mistake.', '"Já está" passa a "Acabar de mostrar" e tem de ser mantido premido para confirmar, para não ser carregado por engano.'),
    ],
  },
  {
    version: '0.17.0',
    date: '2026-10-19',
    items: [
      f('Auto-sort no longer turns itself off when a dragged card goes back to your hand without moving, or is dropped somewhere it cannot go.', 'A ordenação automática já não se desliga quando uma carta arrastada volta à mão sem mudar de sítio, ou é largada onde não pode ir.'),
      n('Your character is remembered: new rooms give it back to you if nobody else has it.', 'A tua personagem fica guardada: as salas novas devolvem-ta se ninguém a tiver.'),
      n('New rooms start with the rules you used last as host. A "Reset to default rules" button puts them back.', 'As salas novas começam com as regras que usaste da última vez como anfitrião. O botão "Repor as regras predefinidas" volta ao normal.'),
      n('Settings has a Controls tab: hand sorting, Confirm moves, the keyboard shortcuts, and a Left-handed option that swaps the sides of the buttons at the bottom.', 'As Definições têm um separador Controlos: ordenação da mão, Confirmar jogadas, os atalhos de teclado e uma opção Canhoto que troca os lados dos botões no fundo.'),
    ],
  },
  {
    version: '0.16.0',
    date: '2026-10-19',
    items: [
      c("New look: cards, card backs, characters, rule pictures and badges now come from Kenney's free art packs instead of Balatro.", 'Visual novo: as cartas, os versos, as personagens, as imagens das regras e os emblemas vêm agora dos pacotes de arte gratuitos da Kenney em vez do Balatro.'),
      c('Bots are dungeon characters with new names: Mágiku, Kabaleru, Bikingu, Fantasma, Ziku and Frei. Players pick from 14 characters.', 'Os bots são personagens de masmorra com nomes novos: Mágiku, Kabaleru, Bikingu, Fantasma, Ziku e Frei. Os jogadores escolhem entre 14 personagens.'),
      c('New sound effects from Kenney. The music stays for now.', 'Efeitos sonoros novos da Kenney. A música fica, por agora.'),
      c('Rules renamed: Superposition is now Ace High, Smeared is Mixed Suits, and Sixth Sense is Peek.', 'Regras com nomes novos: Superposição passa a Ás Alto, Borrod passa a Naipes Misturados e Sexto Sentido passa a Espreitar.'),
      c('Portuguese text translates every game term except Rabenta, TximTxom, Txi jog and the Panha Boleia! and Jog txid! callouts.', 'O texto em português traduz todos os termos do jogo exceto Rabenta, TximTxom, Txi jog e os avisos Panha Boleia! e Jog txid!.'),
      f('Banners no longer break words in the middle on phones.', 'Os avisos já não partem palavras a meio nos telemóveis.'),
    ],
  },
  {
    version: '0.15.3',
    date: '2026-10-18',
    items: [
      c('New browser tab icon made from the TximTxom logo, plus a home screen icon for phones.', 'Novo ícone no separador do navegador, feito a partir do logótipo do TximTxom, e um ícone para o ecrã inicial do telemóvel.'),
    ],
  },
  {
    version: '0.15.2',
    date: '2026-10-18',
    items: [
      n('How to play, Formations, Settings and Changelog are now in the game room too.', 'Como jogar, Formações, Definições e Alterações agora também estão na sala.'),
      c('Cards move snappier, closer to Balatro: selecting, hovering, dealing and sorting settle in about a fifth of a second.', 'As cartas mexem-se com mais rapidez, mais perto do Balatro: selecionar, passar o rato, distribuir e ordenar assentam em cerca de um quinto de segundo.'),
      r('Small card pictures (history, Formations) no longer show a hint on hover.', 'As cartas pequenas (histórico, Formações) já não mostram uma dica ao passar o rato.'),
      c('A dragged card follows the pointer without bouncing, and the title Aces swing more gently.', 'Uma carta arrastada segue o ponteiro sem saltitar, e os Ases do ecrã inicial balançam com mais calma.'),
      c('Burning cards glow gold, orange and red instead of purple.', 'As cartas a desfazer-se brilham em dourado, laranja e vermelho em vez de roxo.'),
    ],
  },
  {
    version: '0.15.1',
    date: '2026-10-18',
    items: [
      n('Before a new deal, the cards left on the table burn away like the Hanged Man in Balatro, and a fresh deck is placed in the middle.', 'Antes de cada distribuição, as cartas que ficaram na mesa desfazem-se como com o Hanged Man do Balatro, e um baralho novo é posto no meio.'),
      c('The title Aces swing while you drag them: they lean into the movement and wobble when shaken.', 'Os Ases do ecrã inicial balançam enquanto os arrastas: inclinam-se com o movimento e abanam quando sacudidos.'),
      c("Hover hints use the game's own style instead of the browser's.", 'As dicas ao passar o rato usam o estilo do jogo em vez do do navegador.'),
      f('Callout text has a dark outline, so it reads over card backs.', 'O texto dos avisos tem um contorno escuro, para se ler por cima do verso das cartas.'),
    ],
  },
  {
    version: '0.15.0',
    date: '2026-10-18',
    items: [
      n('Buttons, headings and the title wobble, and a wave hops across their letters one at a time.', 'Botões, títulos e o logótipo abanam, e uma onda salta pelas letras, uma de cada vez.'),
      c('New background: a simpler swirl of our own that spins up and changes colour when the screen changes.', 'Fundo novo: um redemoinho mais simples, feito por nós, que acelera e muda de cor quando o ecrã muda.'),
      n('Rooms and rounds get a random colour palette, including a new gold and silver one. Red and blue stay on the title screen.', 'Salas e rondas recebem cores ao calhas, incluindo uma nova em dourado e prateado. O vermelho e azul ficam só no ecrã inicial.'),
      n('"Fill with bots" and "Remove all bots" in the lobby, above the player list. Free seats hold their place, so nothing jumps around when players join.', '"Encher com bots" e "Tirar os bots" na sala, acima da lista de jogadores. Os lugares vazios guardam o espaço, para nada saltar quando alguém entra.'),
      c('Bots are marked with the Uncommon Tag, and the lobby icons sit in fixed columns.', 'Os bots têm a Uncommon Tag, e os ícones da sala ficam em colunas fixas.'),
      n('The Aces on the title screen can be picked up, dragged and tapped.', 'Os Ases do ecrã inicial podem ser apanhados, arrastados e tocados.'),
      c('When the round ends, the draw and discard piles slide into one stack next to the ending card.', 'Quando a ronda acaba, o monte e a pilha de descarte juntam-se num só monte ao lado da carta final.'),
      f('"Your turn" and other callouts no longer show on top of open windows.', '"É a tua vez" e outros avisos já não aparecem por cima das janelas abertas.'),
      n('Tags on the player plates: the Rare Tag marks the host and the Handy Tag whose turn it is. Hover them for a hint.', 'Etiquetas nas placas dos jogadores: a Rare Tag marca o anfitrião e a Handy Tag de quem é a vez. Passa o rato por cima para ver a dica.'),
      c('New rename and remove icons in the lobby.', 'Ícones novos para mudar o nome e remover na sala.'),
      c('A dragged card stays upright instead of leaning.', 'Uma carta arrastada fica direita em vez de inclinar.'),
      c('Opening the history panel moves the table over in one go.', 'Abrir o histórico desloca a mesa de uma vez.'),
      c('The buttons under the title panel fill its width.', 'Os botões por baixo do painel inicial ocupam a largura toda.'),
      f('A host who reloaded right after a change (like starting the game) could come back to an older state of the room.', 'Um anfitrião que recarregasse logo após uma mudança (como começar o jogo) podia voltar a um estado antigo da sala.'),
    ],
  },
  {
    version: '0.14.3',
    date: '2026-10-18',
    items: [
      f('Players whose networks block direct connections can play together: the game falls back to a relay server.', 'Jogadores cujas redes bloqueiam ligações diretas já conseguem jogar juntos: o jogo passa por um servidor de relay.'),
    ],
  },
  {
    version: '0.14.2',
    date: '2026-10-18',
    items: [
      n('The title screen shows four Aces fanned like a hand.', 'O ecrã inicial mostra quatro Ases em leque, como numa mão.'),
      c('A drawn card leaves the Draw Pile face down and turns over when it lands.', 'A carta tirada sai do Monte virada para baixo e vira-se quando chega.'),
      c('"Take a ride!" shows before the formation lands, so it no longer covers the cards.', 'O aviso Panha Boleia! aparece antes da formação, para não tapar as cartas.'),
      c('The squares behind callouts are half the size.', 'Os quadrados atrás dos avisos têm metade do tamanho.'),
      c('"No formations possible" instead of "No more formations possible".', '"No formations possible" em vez de "No more formations possible" (inglês).'),
      c('The Join button fills the rest of its row.', 'O botão Entrar ocupa o resto da linha.'),
      f('With Auto sort on, the hand stays sorted while a discard waits for End Turn.', 'Com Auto ligado, a mão continua ordenada enquanto uma carta espera por Acabar a vez.'),
      f('Your name is saved when you leave the name box.', 'O teu nome fica guardado quando sais da caixa do nome.'),
      f('Renaming yourself in the room no longer resets when someone joins while you type.', 'Mudar o nome na sala já não volta atrás quando alguém entra enquanto escreves.'),
    ],
  },
  {
    version: '0.14.1',
    date: '2026-10-18',
    items: [
      c('More servers to help browsers on different networks find each other; a dead relay server was removed.', 'Mais servidores para ajudar browsers em redes diferentes a encontrarem-se; foi removido um relay que já não funcionava.'),
      f('When the room exists but the connection is blocked, the error says so instead of "Room not found".', 'Quando a sala existe mas a ligação é bloqueada, o erro diz isso em vez de "Sala não encontrada".'),
    ],
  },
  {
    version: '0.14.0',
    date: '2026-10-15',
    items: [n('Changelog button on the title screen.', 'Botão de alterações no ecrã inicial.')],
  },
  {
    version: '0.13.1',
    date: '2026-10-15',
    items: [
      f('Cards no longer fly around and snap back when a game starts.', 'As cartas já não voam e voltam ao lugar quando o jogo começa.'),
      f('Round 1 is dealt on screen, also after Play again.', 'A ronda 1 é dada no ecrã, também depois de Jogar outra vez.'),
      c('Turn callouts wait until the cards are dealt.', 'Os avisos de vez esperam que as cartas sejam dadas.'),
    ],
  },
  {
    version: '0.13.0',
    date: '2026-10-15',
    items: [
      n(
        'Rules are colour-coded: punishing (red), information (blue), support (green), neutral (grey).',
        'As regras têm cores: castigo (vermelho), informação (azul), ajuda (verde), neutras (cinzento).',
      ),
    ],
  },
  {
    version: '0.12.0',
    date: '2026-10-15',
    items: [
      n('Version number and GitHub link on the title screen and in Settings.', 'Número da versão e link do GitHub no ecrã inicial e nas Definições.'),
      c('"Invite link copied" shows inside the room-code box instead of a pop-up.', '"Link de convite copiado" aparece na caixa do código em vez de uma janela.'),
    ],
  },
  {
    version: '0.11.0',
    date: '2026-10-15',
    items: [
      n('A button on the game-over window copies a game report for bug reports.', 'Um botão no fim do jogo copia um relatório para reportar erros.'),
      n('Rules button: shows the rules of the game being played.', 'Botão Regras: mostra as regras do jogo em curso.'),
      n('"Show your formations!" callout.', 'Aviso "Mostra as formações!".'),
      c('With no formation left to make, the only button is Finish.', 'Sem formações possíveis, o único botão é Terminar.'),
      c('Callouts use Balatro\'s timing: faster, with a single square behind the text.', 'Os avisos usam o ritmo do Balatro: mais rápidos, com um quadrado atrás do texto.'),
      f('Callouts are centred on the table when the history panel is open.', 'Os avisos ficam centrados na mesa com o histórico aberto.'),
      f('Settings keeps the same size on every tab.', 'As Definições mantêm o mesmo tamanho em todos os separadores.'),
    ],
  },
  {
    version: '0.10.2',
    date: '2026-10-15',
    items: [
      c('Keyboard shortcuts are shown as small keycaps.', 'Os atalhos de teclado aparecem como pequenas teclas.'),
      f('Hovering a card or Joker no longer stops its idle animation.', 'Passar o rato por uma carta ou Joker já não pára a animação.'),
    ],
  },
  {
    version: '0.10.1',
    date: '2026-10-15',
    items: [
      c(
        'English uses plain words (end the round, bust, take a ride); the Kriolu terms are only in Portuguese.',
        'O inglês usa palavras simples; os termos em Kriolu ficam só em português.',
      ),
    ],
  },
  {
    version: '0.10.0',
    date: '2026-10-15',
    items: [
      n('Callouts for turns, Panha Boleia, Nope!, TximTxom! and the end of the game.', 'Avisos de vez, Panha Boleia, Nope!, TximTxom! e fim do jogo.'),
      n('The Handy Tag marks the player whose turn it is.', 'A Handy Tag marca o jogador da vez.'),
      n('Play again after a game; wins are shown as Gold Stake chips (x2, x3…).', 'Jogar outra vez no fim; as vitórias aparecem como fichas Gold Stake (x2, x3…).'),
      n('Cards and Jokers sway gently when idle.', 'As cartas e os Jokers balançam quando estão parados.'),
      c('Buttons and player plates keep one size, whatever they say.', 'Os botões e as placas dos jogadores mantêm o tamanho.'),
      c('Card names on buttons are shown in their suit colour.', 'Os nomes das cartas nos botões têm a cor do naipe.'),
      c('Auto sort is a switch; Pass and Done are red; finished formations close up.', 'Ordenar Auto é um interruptor; Passar vez e Já está são vermelhos; formações acabadas ficam mais juntas.'),
      f('Card names in the history were pale on white.', 'Os nomes das cartas no histórico estavam claros em fundo branco.'),
    ],
  },
  {
    version: '0.9.0',
    date: '2026-10-15',
    items: [
      n('Human players pick from 10 Jokers of their own.', 'Os jogadores humanos escolhem entre 10 Jokers próprios.'),
      c('A card dropped on the Discard Pile waits for End Turn, so others don\'t see it early.', 'Uma carta largada no Descarte espera pelo Acabar a vez; os outros não a veem antes.'),
      c('Undo is orange instead of grey.', 'Desfazer é laranja em vez de cinzento.'),
      c('A legendary Joker\'s soul zooms in on hover instead of rising.', 'A alma dos Jokers lendários aproxima-se ao passar o rato em vez de subir.'),
      f('Dragging sliders, holding buttons or dragging cards no longer selects text.', 'Arrastar barras, manter botões ou arrastar cartas já não seleciona texto.'),
    ],
  },
  {
    version: '0.8.0',
    date: '2026-10-15',
    items: [
      n('Every player has a Joker; click it in the room to change it.', 'Cada jogador tem um Joker; clica nele na sala para mudar.'),
      n('Rename yourself in the room before the game starts.', 'Muda o teu nome na sala antes do jogo começar.'),
      n('A player\'s Joker shakes when their turn starts.', 'O Joker de um jogador abana quando é a vez dele.'),
      c('Portuguese text uses J, Q, K instead of V, D, R.', 'O texto em português usa J, Q, K em vez de V, D, R.'),
    ],
  },
  {
    version: '0.7.0',
    date: '2026-10-15',
    items: [
      n('Rooms close after 10 minutes with no human activity.', 'As salas fecham após 10 minutos sem atividade humana.'),
      f('A table of bots no longer keeps a room open; old rooms don\'t reopen after a reload.', 'Uma mesa só de bots já não mantém a sala aberta; salas antigas não reabrem.'),
    ],
  },
  {
    version: '0.6.1',
    date: '2026-10-15',
    items: [c('Portuguese terms: Trinca, Escada, Dealer, Passar vez.', 'Termos em português: Trinca, Escada, Dealer, Passar vez.')],
  },
  {
    version: '0.6.0',
    date: '2026-10-15',
    items: [
      n('Smeared rule (Borrod): straights can mix suits; TximTxom still needs one suit.', 'Regra Borrod: as escadas podem misturar naipes; o TximTxom continua a ser de um só naipe.'),
      f('The Formations menu fits phones without scrolling.', 'O menu Formações cabe no telemóvel sem deslizar.'),
      f('The written rules were cut off; they are complete now.', 'As regras escritas estavam cortadas; agora estão completas.'),
    ],
  },
  {
    version: '0.5.0',
    date: '2026-10-14',
    items: [
      n('Drag cards onto the table to show a formation.', 'Arrasta cartas para a mesa para mostrar uma formação.'),
      c('New layouts for tall and short phone screens.', 'Novos esquemas para ecrãs de telemóvel altos e baixos.'),
      f('Holding Txi jog or TximTxom no longer restarts when the buttons redraw.', 'Manter Txi jog ou TximTxom premido já não recomeça quando os botões se atualizam.'),
      f('The Txi jog card no longer covers formations; no banner over the game-over window.', 'A carta do Txi jog já não tapa formações; nenhum aviso por cima do fim do jogo.'),
    ],
  },
  {
    version: '0.4.0',
    date: '2026-10-14',
    items: [
      n('Portuguese by default; English in Settings and on the title screen.', 'Português por defeito; inglês nas Definições e no ecrã inicial.'),
      n('Kriolu terms: Txi jog, Rabenta, Panha Boleia.', 'Termos em Kriolu: Txi jog, Rabenta, Panha Boleia.'),
      n('Sixth Sense rule with a Peek button.', 'Regra Sexto Sentido com um botão para espreitar.'),
      n('Bots are Jimbo and the legendary Jokers; the host can rename them.', 'Os bots são o Jimbo e os Jokers lendários; o anfitrião pode mudar-lhes o nome.'),
      n('Sort by rank, suit or automatically; Hand Points under the hand.', 'Ordenar por valor, naipe ou automaticamente; Pontos na mão debaixo da mão.'),
      n('Leave button in the top bar.', 'Botão Sair na barra de cima.'),
      n('Jokers and small cards tilt and shine under the pointer.', 'Os Jokers e as cartas pequenas inclinam e brilham sob o rato.'),
      c('Txi jog and TximTxom moved to their own corners and need a press-and-hold.', 'Txi jog e TximTxom passaram para os cantos e têm de ser mantidos premidos.'),
      c('Round summary, scoreboard, Settings, How to play and Formations redesigned, with tabs instead of scrolling.', 'Resumo da ronda, pontuação, Definições, Como jogar e Formações redesenhados, com separadores.'),
    ],
  },
  {
    version: '0.3.0',
    date: '2026-10-14',
    items: [
      n('Drag cards to discard, swap or ride; valid targets glow green.', 'Arrasta cartas para descartar, trocar ou apanhar boleia; os destinos válidos brilham a verde.'),
      c('Drawn and dealt cards leave the top of the draw pile face down and turn over when they land.', 'As cartas tiradas e dadas saem de cima do Monte viradas para baixo e viram-se ao chegar.'),
      f('Cards no longer flicker under a still pointer.', 'As cartas já não tremem com o rato parado.'),
      f('No hover or taps through an open window or panel.', 'Sem cliques através de janelas ou painéis abertos.'),
    ],
  },
  {
    version: '0.2.1',
    date: '2026-10-14',
    items: [f('The round chip stays on one line on phones.', 'A indicação da ronda fica numa linha no telemóvel.')],
  },
  {
    version: '0.2.0',
    date: '2026-10-14',
    items: [
      n('The room creator\'s browser hosts the game; others connect to it directly. No server needed.', 'O browser de quem cria a sala aloja o jogo; os outros ligam-se diretamente. Sem servidor.'),
      n('The host can refresh the page: the room reopens and guests reconnect.', 'O anfitrião pode recarregar a página: a sala reabre e os convidados voltam a ligar-se.'),
      n('Playable online at badjuice.github.io/tximtxom.', 'Jogável online em badjuice.github.io/tximtxom.'),
      r('Fly.io hosting.', 'Alojamento no Fly.io.'),
    ],
  },
  {
    version: '0.1.0',
    date: '2026-10-14',
    items: [
      n(
        'The game: 7-card hands, ending the round with a 5 or lower, one reshuffle, -10 for a full hand, rides, TximTxom.',
        'O jogo: mãos de 7 cartas, acabar a ronda com um 5 ou menos, um baralhar, -10 por mão cheia, boleias, TximTxom.',
      ),
      n(
        'Room rules: points limit 40 or 100, Hardcore, Superposition, Double Down, Penalty +10, Auto Ride, ride order, turn timer.',
        'Regras da sala: limite de 40 ou 100, Hardcore, Superposição, Dobra, Multa +10, boleia automática, ordem da boleia, tempo por jogada.',
      ),
      n('Bots, which also take over a disconnected player\'s seat.', 'Bots, que também jogam por quem se desliga.'),
      n('Online rooms with 4-letter codes; reconnect to your seat.', 'Salas online com códigos de 4 letras; volta ao teu lugar se te desligares.'),
      n('Table with springy cards, particles, Balatro\'s swirling background, CRT effect, sounds and music.', 'Mesa com cartas animadas, partículas, fundo do Balatro, efeito CRT, sons e música.'),
      n('Lobby, scoreboard, Formations menu, move history, accessibility settings and phone layouts.', 'Sala, pontuação, menu Formações, histórico, acessibilidade e esquemas para telemóvel.'),
    ],
  },
];
