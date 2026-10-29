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
