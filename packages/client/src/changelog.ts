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
