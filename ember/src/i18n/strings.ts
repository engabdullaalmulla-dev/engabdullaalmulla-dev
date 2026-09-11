import type { PhraseId } from '../../shared/expressions';
import { SITE_HOST } from '../../shared/site';
import type { AvatarColour, AvatarShape, BadgeId, Tier, TitleId } from '../../shared/progress';
import type { Difficulty, LogEntry, Power, Rank, Suit } from '../../shared/types';

/**
 * Every line the player reads, in both languages.
 *
 * Anything with a value in it is a function, so a translator can put the
 * number where the sentence needs it rather than where English happened to
 * put it — which matters far more in Arabic than the word order suggests.
 */

export type LocaleCode = 'en' | 'ar';

export interface LogContext {
  card: (ref: NonNullable<LogEntry['card']>) => string;
  power: (p: Power) => string;
  /** The reader did this. */
  you: boolean;
  /** It was done to the reader. */
  toYou: boolean;
}

export interface Strings {
  readonly code: LocaleCode;
  readonly rtl: boolean;
  /** What this language is called, in this language. */
  readonly name: string;

  /** Names for the bots you play at your own table. */
  bots: string[];

  common: {
    back: string;
    /** Points the way back, whichever way that is. */
    backArrow: string;
    gotIt: string;
    doneLooking: string;
    cancel: string;
    leave: string;
    leaveTable: string;
    you: string;
    points: string;
    round: (n: string) => string;
    toScore: (n: string) => string;
    seconds: (n: string) => string;
  };

  home: {
    tagline: string;
    blurb: string;
    playOnline: string;
    onlineSignedIn: (name: string) => string;
    onlineBlurb: string;
    offlineOnly: string;
    againstBots: string;
    table: string;
    players: (n: string) => string;
    opponents: string;
    assist: string;
    assistHint: string;
    sound: string;
    soundHint: string;
    deal: string;
    howToPlay: string;
    language: string;
  };

  difficulty: Record<Difficulty, string>;

  powers: Record<Power, { name: string; hint: string }>;

  table: {
    lookAtTwo: string;
    oneMoreLook: string;
    rememberThem: string;
    waitingForTable: string;
    everyoneSaw: string;
    burnRank: (rank: string) => string;
    burnPlain: string;
    burnHint: string;
    yourMove: string;
    lastTurn: string;
    thinking: (name: string) => string;
    usingPower: (name: string, power: string) => string;
    drew: (card: string) => string;
    swapItIn: string;
    giveAwayWhich: string;
    andTakeWhich: string;
    lookAtWhose: string;
    takeIt: string;
    whoTakesCard: string;
    lookAtOneOfYours: string;
    lookAtOneOfTheirs: string;
    cardsOnTable: string;
    youWillNotSeeAgain: string;
    inHand: string;
    remember: string;
    pile: string;
    knock: string;
    alreadyKnocked: string;
    knocked: string;
    throwIt: string;
    justThrow: string;
    leaveIt: string;
    burnWindow: string;
    away: string;
    faceDownCard: string;
    emptySpace: string;
    cardWorth: (rank: string, suit: string, points: string) => string;
    stockCount: (n: string) => string;
    discardPile: string;
    leaveGame: string;
  };

  overlay: {
    matchOver: string;
    roundNumber: (n: string) => string;
    youWin: string;
    someoneWins: (name: string) => string;
    ashedOut: (name: string) => string;
    knockStuck: (name: string) => string;
    knockPaid: (name: string) => string;
    takesRound: (name: string) => string;
    player: string;
    pilePoints: string;
    roundPoints: string;
    total: string;
    knockedTag: string;
    lowestWins: string;
    firstTo: (n: string) => string;
    nextRound: string;
    nextRoundIn: (n: string) => string;
    playAgain: string;
    home: string;
  };

  auth: {
    signInTitle: string;
    registerTitle: string;
    name: string;
    password: string;
    namePlaceholder: string;
    passwordPlaceholder: string;
    signIn: string;
    createAccount: string;
    oneMoment: string;
    switchToRegister: string;
    switchToSignIn: string;
    privacy: string;
  };

  lobby: {
    status: Record<'idle' | 'connecting' | 'online' | 'reconnecting' | 'failed', string>;
    playingAs: (name: string) => string;
    online: string;
    playAnyone: string;
    playAnyoneBlurb: string;
    quickMatch: string;
    playFriends: string;
    playFriendsBlurb: string;
    createPrivate: string;
    code: string;
    join: string;
    roomCode: string;
    yourRecord: string;
    signOut: string;
    lookingForPlayers: string;
    firstAtTable: string;
    waitingCount: (n: string) => string;
    botsWillFill: string;
  };

  room: {
    roomCode: string;
    tapToSend: string;
    publicTable: string;
    publicBlurb: string;
    atTable: (seated: string, max: string) => string;
    host: string;
    away: string;
    emptySeat: string;
    addBot: string;
    deal: string;
    needThree: string;
    waitingForHost: string;
    remove: (name: string) => string;
    invite: (code: string) => string;
    youSuffix: string;
  };

  express: {
    open: string;
    title: string;
    everyone: string;
    emoji: string;
    phrases: string;
    kind: string;
    cheeky: string;
    muted: string;
    mute: string;
    unmute: string;
    aimHint: string;
    tooFast: string;
    phrase: Record<PhraseId, string>;
  };

  rank: {
    title: string;
    season: string;
    allTime: string;
    seasonEnds: (days: string) => string;
    seasonEndsToday: string;
    points: (points: string) => string;
    toNext: (points: string, tier: string) => string;
    atTheTop: string;
    unranked: string;
    unrankedHint: string;
    place: (place: string) => string;
    you: string;
    empty: string;
    emptyAllTime: string;
    columnPlayer: string;
    columnPoints: string;
    columnWinRate: string;
    columnPlayed: string;
    tier: Record<Tier, string>;
    tierBlurb: Record<Tier, string>;
  };

  profile: {
    matches: string;
    won: string;
    winRate: string;
    rounds: string;
    roundsWon: string;
    bestPile: string;
    knocks: string;
    knocksValue: (stuck: string, total: string, rate: string) => string;
    cardsBurned: string;
    misfires: string;
    ashOuts: string;
    pointsTaken: string;
    leaderboard: string;
    noRecord: string;
    noLeaders: string;
    none: string;
    yourMark: string;
    markHint: string;
    badges: string;
    badgesEarned: (earned: string, total: string) => string;
    locked: string;
    seeRankings: string;
    title: Record<TitleId, string>;
    badge: Record<BadgeId, string>;
    badgeHint: Record<BadgeId, string>;
    shape: Record<AvatarShape, string>;
    colour: Record<AvatarColour, string>;
  };

  rules: {
    title: string;
    thePoint: string;
    pointBody: string[];
    yourTurn: string;
    turnSteps: string[];
    burning: string;
    burningBody: string[];
    knocking: string;
    knockingBody: string[];
    values: string;
    valueNotes: { bestCard: string; getRidOfIt: string; faceValue: string };
    powersTitle: string;
    redKingNote: string;
    ending: string;
    endingBody: string;
  };

  /** Turns a recorded event into a sentence, in the right person. */
  log: (entry: LogEntry, context: LogContext) => string;

  /** Named by the code the server sends, so the wording stays on the phone. */
  errors: Record<string, string>;

  cards: {
    rank: (rank: Rank) => string;
    suit: (suit: Suit | null) => string;
    /** "the 7♥", "a red King" — as a sentence would say it. */
    name: (ref: { rank: Rank; suit: Suit | null }) => string;
    /** "an 8", "a Queen" — as a question would say it. */
    spoken: (rank: Rank) => string;
  };

  /** Digits in whatever form this language writes them. */
  digits: (value: number | string) => string;
}

/* ------------------------------------------------------------------ */
/* English                                                             */
/* ------------------------------------------------------------------ */

const SUIT_SYMBOL: Record<Suit, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const isRed = (suit: Suit | null) => suit === 'H' || suit === 'D';

export const en: Strings = {
  code: 'en',
  rtl: false,
  name: 'English',

  bots: ['Rashid', 'Noura', 'Salem', 'Maitha'],

  common: {
    back: 'BACK',
    backArrow: '←',
    gotIt: 'GOT IT',
    doneLooking: 'DONE LOOKING',
    cancel: 'CANCEL',
    leave: 'LEAVE',
    leaveTable: 'LEAVE TABLE',
    you: 'You',
    points: 'pts',
    round: (n) => `ROUND ${n}`,
    toScore: (n) => `TO ${n}`,
    seconds: (n) => `${n}s`,
  },

  home: {
    tagline: 'Remember. Burn. Knock.',
    blurb:
      'Four cards, face down. You saw two of them once. Keep the smallest pile at the table and call it before anyone beats you to it.',
    playOnline: 'PLAY ONLINE',
    onlineSignedIn: (name) => `Signed in as ${name}. Quick match, or a private table with friends.`,
    onlineBlurb: 'Quick match against people, or a private table just for your friends.',
    offlineOnly: 'This build plays the bots only. Online tables need the EMBER server — see the README.',
    againstBots: 'AGAINST THE BOTS',
    table: 'TABLE',
    players: (n) => `${n} players`,
    opponents: 'OPPONENTS',
    assist: 'Assist mode',
    assistHint: 'Marks the cards you have already been shown.',
    sound: 'Sound',
    soundHint: 'Card snaps, the crackle of a burn, the knock.',
    deal: 'DEAL ME IN',
    howToPlay: 'HOW TO PLAY',
    language: 'اللغة العربية',
  },

  difficulty: { easy: 'Forgetful', normal: 'Steady', sharp: 'Merciless' },

  powers: {
    PEEK: { name: 'Peek', hint: 'Look at one of your own cards.' },
    SPY: { name: 'Spy', hint: "Look at one of a rival's cards." },
    SWAP: { name: 'Swap', hint: 'Trade one of yours for one of theirs, sight unseen.' },
    LOOK_SWAP: { name: 'Look & Swap', hint: "Look at a rival's card, then take it if you want it." },
    EMBER: { name: 'Ember', hint: 'Force a rival to take a card from the stock.' },
  },

  table: {
    lookAtTwo: 'Look at two of yours',
    oneMoreLook: 'One more look',
    rememberThem: 'Remember them',
    waitingForTable: 'Waiting for the table',
    everyoneSaw: 'Everyone saw that',
    burnRank: (rank) => `Burn ${rank}?`,
    burnPlain: 'Burn?',
    burnHint: 'Yours or theirs — a wrong card costs you one',
    yourMove: 'Your move',
    lastTurn: 'Last turn',
    thinking: (name) => `${name}…`,
    usingPower: (name, power) => `${name} — ${power}`,
    drew: (card) => `You drew ${card}`,
    swapItIn: 'Swap it in',
    giveAwayWhich: 'Give away which?',
    andTakeWhich: 'And take which?',
    lookAtWhose: "Look at whose?",
    takeIt: 'Take it?',
    whoTakesCard: 'Who takes a card?',
    lookAtOneOfYours: 'Look at one of yours',
    lookAtOneOfTheirs: 'Look at one of theirs',
    cardsOnTable: 'Cards on the table',
    youWillNotSeeAgain: 'You will not see them again',
    inHand: 'IN HAND',
    remember: 'REMEMBER',
    pile: 'PILE',
    knock: 'KNOCK',
    alreadyKnocked: 'ALREADY KNOCKED',
    knocked: 'KNOCKED',
    throwIt: 'THROW IT',
    justThrow: 'THROW',
    leaveIt: 'LEAVE IT',
    burnWindow: 'BURN WINDOW',
    away: 'AWAY',
    faceDownCard: 'face down card',
    emptySpace: 'burned away, empty space',
    cardWorth: (rank, suit, points) => `${rank} ${suit}, ${points} points`,
    stockCount: (n) => `Stock, ${n} cards left`,
    discardPile: 'Discard pile',
    leaveGame: 'Leave game',
  },

  overlay: {
    matchOver: 'MATCH OVER',
    roundNumber: (n) => `ROUND ${n}`,
    youWin: 'You win the match.',
    someoneWins: (name) => `${name} wins the match.`,
    ashedOut: (name) => `${name} burned out the whole pile.`,
    knockStuck: (name) => `${name} knocked and made it stick.`,
    knockPaid: (name) => `${name} knocked and paid for it.`,
    takesRound: (name) => `${name} takes the round.`,
    player: 'PLAYER',
    pilePoints: 'PILE',
    roundPoints: 'ROUND',
    total: 'TOTAL',
    knockedTag: 'knocked',
    lowestWins: 'Lowest total wins.',
    firstTo: (n) => `First to ${n} ends the match — and the lowest score wins it.`,
    nextRound: 'NEXT ROUND',
    nextRoundIn: (n) => `Next round deals in ${n}s.`,
    playAgain: 'PLAY AGAIN',
    home: 'HOME',
  },

  auth: {
    signInTitle: 'Sign in to play online.',
    registerTitle: 'Pick a name and a password.',
    name: 'NAME',
    password: 'PASSWORD',
    namePlaceholder: 'Abdulla',
    passwordPlaceholder: 'At least 8 characters',
    signIn: 'SIGN IN',
    createAccount: 'CREATE ACCOUNT',
    oneMoment: 'ONE MOMENT…',
    switchToRegister: 'No account yet? Create one.',
    switchToSignIn: 'Already playing? Sign in.',
    privacy:
      'EMBER keeps a name and a password and nothing else — no email, no address book, no tracking. There is no way to reset a password you forget, so choose one you will remember.',
  },

  lobby: {
    status: {
      idle: 'Not connected',
      connecting: 'Connecting…',
      online: 'Connected',
      reconnecting: 'Reconnecting…',
      failed: 'Cannot reach the server',
    },
    playingAs: (name) => `Playing as ${name}.`,
    online: 'Online.',
    playAnyone: 'PLAY ANYONE',
    playAnyoneBlurb:
      'Join the next table that needs players. Empty seats fill with bots if nobody turns up.',
    quickMatch: 'QUICK MATCH',
    playFriends: 'PLAY YOUR FRIENDS',
    playFriendsBlurb: 'Start a private table and share the code. Nobody without it can sit down.',
    createPrivate: 'CREATE A PRIVATE TABLE',
    code: 'CODE',
    join: 'JOIN',
    roomCode: 'Room code',
    yourRecord: 'YOUR RECORD',
    signOut: 'SIGN OUT',
    lookingForPlayers: 'Looking for players…',
    firstAtTable: 'You are first at the table.',
    waitingCount: (n) => `${n} waiting.`,
    botsWillFill: 'If nobody else turns up, bots will fill the empty seats.',
  },

  room: {
    roomCode: 'ROOM CODE',
    tapToSend: 'Tap to send it to someone.',
    publicTable: 'PUBLIC TABLE',
    publicBlurb: 'Anyone looking for a game can sit down here.',
    atTable: (seated, max) => `AT THE TABLE · ${seated}/${max}`,
    host: 'HOST',
    away: 'AWAY',
    emptySeat: 'Empty seat',
    addBot: 'ADD A BOT',
    deal: 'DEAL',
    needThree: 'THREE PLAYERS TO START',
    waitingForHost: 'Waiting for the host to deal…',
    remove: (name) => `Remove ${name}`,
    // The code on its own is no use to somebody who has never heard of the
    // game, so the invite says where to go as well as what to type.
    invite: (code) => `Sit down at my EMBER table — ${SITE_HOST}, room code ${code}`,
    youSuffix: ' (you)',
  },

  express: {
    open: 'SAY SOMETHING',
    title: 'Say something',
    everyone: 'Everyone',
    emoji: 'THROW ONE',
    phrases: 'SAY IT',
    kind: 'NICELY',
    cheeky: 'NOT SO NICELY',
    muted: 'Reactions are off.',
    mute: 'TURN OFF',
    unmute: 'TURN ON',
    aimHint: 'Pick a seat above to throw it at somebody.',
    tooFast: 'Give the table a moment.',
    phrase: {
      hello: 'Hello!',
      nice: 'Nice one',
      wellPlayed: 'Well played',
      goodGame: 'Good game',
      lucky: 'Lucky',
      close: 'That was close',
      oops: 'Oops',
      thanks: 'Much appreciated',
      yourTurn: 'Any day now',
      sleeping: 'Did you fall asleep?',
      teaTime: "I'll put the kettle on",
      memory: 'I remember everything',
      forgot: 'I forgot my own cards',
      didntSee: 'I saw nothing',
      notThatLucky: 'Nobody is that lucky',
      watchThis: 'Watch this',
    },
  },

  rank: {
    title: 'RANKINGS',
    season: 'THIS SEASON',
    allTime: 'ALL TIME',
    seasonEnds: (days) => `Season ends in ${days} days.`,
    seasonEndsToday: 'Season ends today.',
    points: (points) => `${points} pts`,
    toNext: (points, tier) => `${points} points to ${tier}`,
    atTheTop: 'Top of the ladder.',
    unranked: 'Unranked',
    unrankedHint: 'Finish a match against other people to get on the board.',
    place: (place) => `#${place}`,
    you: 'YOU',
    empty: 'Nobody has scored this season yet. Be first.',
    emptyAllTime: 'Nobody has finished enough matches yet.',
    columnPlayer: 'PLAYER',
    columnPoints: 'POINTS',
    columnWinRate: 'WIN RATE',
    columnPlayed: 'PLAYED',
    tier: {
      ash: 'Ash',
      spark: 'Spark',
      ember: 'Ember',
      blaze: 'Blaze',
      inferno: 'Inferno',
    },
    tierBlurb: {
      ash: 'Everyone starts cold.',
      spark: 'Something caught.',
      ember: 'Burning steadily.',
      blaze: 'Hard to sit across from.',
      inferno: 'The table clears when you sit down.',
    },
  },

  profile: {
    matches: 'MATCHES',
    won: 'WON',
    winRate: 'WIN RATE',
    rounds: 'ROUNDS',
    roundsWon: 'ROUNDS WON',
    bestPile: 'BEST PILE',
    knocks: 'Knocks',
    knocksValue: (stuck, total, rate) => `${stuck} of ${total} stuck${rate ? ` · ${rate}%` : ''}`,
    cardsBurned: 'Cards burned',
    misfires: 'Misfires',
    ashOuts: 'Ash outs',
    pointsTaken: 'Points taken',
    leaderboard: 'LEADERBOARD',
    yourMark: 'YOUR MARK',
    markHint: 'What everyone sees beside your name.',
    badges: 'BADGES',
    badgesEarned: (earned, total) => `${earned} of ${total}`,
    locked: 'Not yet',
    seeRankings: 'SEE THE RANKINGS',
    title: {
      newcomer: 'Newcomer',
      arsonist: 'The Arsonist',
      coldHands: 'Cold Hands',
      lightFingers: 'Light Fingers',
      tableRunner: 'Table Runner',
      sparkThrower: 'Spark Thrower',
      vanisher: 'The Vanisher',
      steadyHand: 'Steady Hand',
    },
    badge: {
      firstMatch: 'Sat Down',
      regular: 'Regular',
      fiveWins: 'Five Times Over',
      arsonist: 'Arsonist',
      pyromaniac: 'Pyromaniac',
      coldKnocks: 'Cold Caller',
      ashOut: 'Ash Out',
      emptyHanded: 'Empty Handed',
      century: 'Century',
      lightFingers: 'Light Fingers',
    },
    badgeHint: {
      firstMatch: 'Finish a match.',
      regular: 'Finish 25 matches.',
      fiveWins: 'Win five matches.',
      arsonist: 'Burn 10 cards.',
      pyromaniac: 'Burn 100 cards.',
      coldKnocks: 'Knock and make it stick 10 times.',
      ashOut: 'Burn your last card away.',
      emptyHanded: 'Take a round to the showdown with nothing left.',
      century: 'Play 100 rounds.',
      lightFingers: 'Finish a round on 3 points or fewer.',
    },
    shape: {
      spade: 'Spade',
      heart: 'Heart',
      diamond: 'Diamond',
      club: 'Club',
      flame: 'Flame',
      star: 'Star',
    },
    colour: {
      coral: 'Coral',
      sage: 'Sage',
      navy: 'Navy',
      gold: 'Gold',
      plum: 'Plum',
      teal: 'Teal',
    },
    noRecord: 'No record yet. Play a match online.',
    noLeaders: 'Nobody has finished enough matches yet.',
    none: '—',
  },

  rules: {
    title: 'HOW TO PLAY',
    thePoint: 'The point',
    pointBody: [
      'Two decks, 108 cards. Everyone gets four, face down. The pile in front of you is worth points, and points are bad — you want the lowest total at the table.',
      'Before play starts you look at two of your own cards. That is the last honest look you get. Everything after that is memory.',
    ],
    yourTurn: 'Your turn',
    turnSteps: [
      'Draw the top of the stock, or take the face-up discard. A card you take off the discard has to go into your pile — no changing your mind.',
      'Swap it for one of your cards (the old one goes face up on the discard), or throw the drawn card away.',
      'Throw away a 7 or higher and you may use its power instead of keeping it. That is the trade: points now, or information now.',
    ],
    burning: 'Burning',
    burningBody: [
      'The moment a card lands face up, anyone may burn a card of the same rank — out of their own pile, or out of somebody else\'s.',
      'Your own card leaves the table for good: one card fewer, and nothing takes its place.',
      "A rival's card is replaced from the stock instead, face down. They keep the same number of cards, but they lose the one they knew — and nobody at the table knows what they are holding now. That is what remembering a rival's card is worth.",
      'Get it wrong and you take the penalty card, whosever card you reached for, and it is turned over for the whole table to see. Be sure before you tap.',
    ],
    knocking: 'Knocking',
    knockingBody: [
      'When you think your pile is the smallest, knock at the start of your turn. Everyone else gets one last turn, then every card is turned over.',
      'Lowest at the table and the knock costs you nothing. Beaten by anyone, even tied, and it costs your pile plus ten.',
    ],
    values: 'What cards are worth',
    valueNotes: {
      bestCard: 'the best card in the deck',
      getRidOfIt: 'get rid of it',
      faceValue: 'face value',
    },
    powersTitle: 'Powers',
    redKingNote: 'A red King is already worth nothing, so it has nothing to spend — keep it.',
    ending: 'Ending it',
    endingBody:
      'Round scores stack up. As soon as anyone reaches 100 the match is over, and whoever has the fewest points wins. Burn your pile away to nothing and the round ends on the spot, scoring you zero.',
  },

  log: (entry, { card, power, you, toYou }) => {
    const who = you ? 'You' : entry.name ?? '';
    const them = toYou ? 'you' : entry.other ?? '';
    const which = entry.card ? card(entry.card) : '';
    switch (entry.key) {
      case 'round_dealt':
        return `Round ${entry.count}. Memorise two of your cards.`;
      case 'round_begins':
        return `Round ${entry.count} is under way.`;
      case 'reshuffled':
        return 'Stock ran out — the discards were shuffled back in.';
      case 'knocked':
        return `${who} knocked! One last turn each.`;
      case 'knock_stuck':
        return `${who} knocked and got away with it — no points.`;
      case 'knock_missed':
        return `${who} knocked and missed. +${entry.count}.`;
      case 'took_discard':
        return `${who} took ${which} off the pile.`;
      case 'swapped_threw':
        return `${who} swapped a card and threw ${which}.`;
      case 'threw':
        return `${who} threw ${which}.`;
      case 'threw_power':
        return `${who} threw ${which} — ${entry.power ? power(entry.power) : ''}.`;
      case 'blind_swap':
        return `${who} swapped a card with ${them}, sight unseen.`;
      case 'look_swap_took':
        return `${who} looked, liked it, and took it from ${them}.`;
      case 'look_swap_left':
        return `${who} looked and left it alone.`;
      case 'looked':
        return `${who} looked at a card.`;
      case 'ember':
        return `${who} forced a card on ${them}. Ember!`;
      case 'burned':
        return `${who} burned ${which}. One card lighter.`;
      case 'burned_theirs':
        return toYou
          ? `${who} burned ${which} out of your pile.`
          : `${who} burned ${which} out of ${entry.other ?? ''}'s pile.`;
      case 'misfire':
        return `${who} misfired on ${which} — penalty card.`;
      case 'misfire_theirs':
        return toYou
          ? `${who} grabbed at ${which} in your pile — penalty card.`
          : `${who} grabbed at ${which} in ${entry.other ?? ''}'s pile — penalty card.`;
      case 'ash_out':
        return `${who} burned away every card. Ash out!`;
      default:
        return '';
    }
  },

  errors: {
    offline: 'Could not reach the server. Check your connection.',
    bad_name: 'Names are 3 to 16 characters: letters, numbers, spaces, and . _ -',
    weak_password: 'Passwords need at least 8 characters.',
    long_password: 'That password is too long.',
    name_taken: 'That name is already playing.',
    bad_credentials: 'Wrong name or password.',
    rate_limited: 'Too many tries. Wait a moment.',
    too_large: 'That request is too big.',
    bad_json: 'The app sent something the table did not understand.',
    bad_message: 'The app sent something the table did not understand.',
    unauthorised: 'You need to sign in again.',
    version_mismatch: 'This app is out of date. Update to keep playing online.',
    no_such_room: 'No room with that code.',
    room_full: 'That room is full.',
    room_in_play: 'That game has already started.',
    not_host: 'Only the host can do that.',
    not_in_room: 'You are not at a table.',
    need_players: 'You need at least three at the table.',
    not_your_move: 'It is not your move.',
    server_error: 'Something went wrong at our end.',
    session_expired: 'Your session expired. Sign in again.',
  },

  cards: {
    rank: (rank) => (rank === 'JOKER' ? 'Joker' : rank),
    suit: (suit) => (suit ? SUIT_SYMBOL[suit] : ''),
    name: (ref) => {
      if (ref.rank === 'JOKER') return 'a Joker';
      if (ref.rank === 'K') return isRed(ref.suit) ? 'a red King' : 'a black King';
      return `the ${ref.rank}${ref.suit ? SUIT_SYMBOL[ref.suit] : ''}`;
    },
    spoken: (rank) => {
      const spoken: Partial<Record<Rank, string>> = {
        A: 'an Ace',
        '8': 'an 8',
        J: 'a Jack',
        Q: 'a Queen',
        K: 'a King',
        JOKER: 'a Joker',
      };
      return spoken[rank] ?? `a ${rank}`;
    },
  },

  digits: (value) => String(value),
};

/* ------------------------------------------------------------------ */
/* العربية                                                             */
/* ------------------------------------------------------------------ */

/**
 * Numbers stay in Western digits in both languages.
 *
 * Arabic-Indic digits are correct and they are what a book would print, but
 * the numbers here are read against the cards themselves — a 7 on the table,
 * a score beside a name — and the cards are printed 7. Two numbering systems
 * on one screen is one more than anybody wants to read mid-game.
 */
function arabicDigits(value: number | string): string {
  return String(value);
}

/**
 * What the cards are called at a table in the Gulf, which is not what the
 * dictionary calls them: a King is الشايب, the old man, and a Queen is البنت.
 * Suits take the names that travel furthest across the GCC rather than the
 * Baloot-specific jargon (سبيت، هاص، ديمن، كلفس), which not every casual
 * player uses.
 */
const AR_RANK: Record<Rank, string> = {
  A: 'آس',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  '10': '10',
  J: 'ولد',
  Q: 'بنت',
  K: 'شايب',
  JOKER: 'جوكر',
};

/**
 * The bots at your own table. Their names are ours to choose, so their verbs
 * can agree with them properly — Arabic conjugates for gender, and «نورة بدّل»
 * is as wrong to an Arabic ear as "Noura swapped himself" is to an English one.
 * A player online could be anyone, so unknown names take the masculine, which
 * is the ordinary fallback.
 */
const AR_BOTS = ['راشد', 'نورة', 'سالم', 'ميثاء'];
const AR_FEMININE = new Set(['نورة', 'ميثاء']);

/** Picks between speaking to you, about him, or about her. */
function person(
  you: boolean,
  name: string,
  forms: { you: string; he: string; she: string },
): string {
  if (you) return forms.you;
  return AR_FEMININE.has(name) ? forms.she : forms.he;
}

const AR_SUIT: Record<Suit, string> = {
  S: 'بستوني',
  H: 'كبة',
  D: 'ديناري',
  C: 'شيريا',
};

/**
 * Emirati, not "Gulf".
 *
 * This is written the way it is spoken in the UAE rather than in the pan-Gulf
 * register a translator reaches for: وايد for "very", مب for "not", عيل for
 * "so then", منو for "who", شقد for "how much", ربع for the friends you would
 * actually call. Where a ج turns into a ي in speech — يديد, الياية — it is
 * written the way it sounds.
 *
 * The verbs still agree with whoever is doing the thing, because Arabic
 * insists on it, and «نورة طقّت» against «راشد طقّ» is the difference between
 * a table and a translation.
 */
export const ar: Strings = {
  code: 'ar',
  rtl: true,
  name: 'العربية',

  bots: AR_BOTS,

  common: {
    back: 'رجوع',
    backArrow: '→',
    gotIt: 'حفظتهن',
    doneLooking: 'خلصت',
    cancel: 'خلاص',
    leave: 'أطلع',
    leaveTable: 'أطلع من الطاولة',
    you: 'أنت',
    points: 'نقطة',
    round: (n) => `الجولة ${n}`,
    toScore: (n) => `لين ${n}`,
    seconds: (n) => `${n} ث`,
  },

  home: {
    tagline: 'احفظ. احرق. طق.',
    blurb:
      'أربع أوراق مقلوبة، وشفت ثنتين منهن بس مرة وحدة. خل مجموعك أقل واحد على الطاولة، وطق قبل لا أحد يسبقك.',
    playOnline: 'العب أونلاين',
    onlineSignedIn: (name) => `داخل باسم ${name}. مباراة سريعة، ولا طاولة خاصة وية ربعك.`,
    onlineBlurb: 'مباراة سريعة وية ناس حقيقيين، ولا طاولة خاصة لربعك بس.',
    offlineOnly:
      'هالنسخة تلعب ضد الروبوتات بس. الطاولات الأونلاين تبي سيرفر EMBER — شوف ملف README.',
    againstBots: 'ضد الروبوتات',
    table: 'الطاولة',
    players: (n) => `${n} لاعبين`,
    opponents: 'الخصوم',
    assist: 'وضع المساعدة',
    assistHint: 'يحط علامة على الأوراق اللي سبق وشفتها.',
    sound: 'الصوت',
    soundHint: 'طقطقة الورق، وفرقعة الحرق، وصوت الطقة.',
    deal: 'وزّع الورق',
    howToPlay: 'شلون تلعب',
    language: 'English',
  },

  difficulty: { easy: 'وايد ينسى', normal: 'متمكّن', sharp: 'ما يرحم' },

  powers: {
    PEEK: { name: 'نظرة', hint: 'شوف وحدة من أوراقك.' },
    SPY: { name: 'تجسس', hint: 'شوف وحدة من أوراق خصمك.' },
    SWAP: { name: 'تبديل', hint: 'بدّل ورقة من عندك بوحدة من عنده، وما أحد يشوف شي.' },
    LOOK_SWAP: { name: 'شوف وبدّل', hint: 'شوف ورقة خصمك، وإذا عيبتك خذها.' },
    EMBER: { name: 'جمرة', hint: 'خل خصمك يسحب ورقة من الكومة غصب.' },
  },

  table: {
    lookAtTwo: 'شوف ثنتين من عندك',
    oneMoreLook: 'باقي وحدة',
    rememberThem: 'احفظهن زين',
    waitingForTable: 'ننتظر باقي الطاولة',
    everyoneSaw: 'الكل شافها',
    burnRank: (rank) => `تحرق ${rank}؟`,
    burnPlain: 'تحرق؟',
    burnHint: 'من أوراقك ولا من أوراقه — والغلط يكلّفك ورقة',
    yourMove: 'دورك',
    lastTurn: 'آخر دور',
    thinking: (name) => `${name}…`,
    usingPower: (name, power) => `${name} — ${power}`,
    drew: (card) => `سحبت ${card}`,
    swapItIn: 'حطها مكان ورقة',
    giveAwayWhich: 'أي ورقة بتعطي؟',
    andTakeWhich: 'وأي وحدة بتاخذ؟',
    lookAtWhose: 'ورقة منو تبي تشوف؟',
    takeIt: 'تاخذها؟',
    whoTakesCard: 'منو يسحب ورقة؟',
    lookAtOneOfYours: 'شوف وحدة من عندك',
    lookAtOneOfTheirs: 'شوف وحدة من عنده',
    cardsOnTable: 'اكشفوا الورق',
    youWillNotSeeAgain: 'ما بتشوفهن مرة ثانية',
    inHand: 'في يدك',
    remember: 'احفظها',
    pile: 'المرمى',
    knock: 'طق',
    alreadyKnocked: 'أحد طق قبلك',
    knocked: 'طق',
    throwIt: 'ارمها',
    justThrow: 'ارمها بس',
    leaveIt: 'خلّها',
    burnWindow: 'وقت الحرق',
    away: 'غايب',
    faceDownCard: 'ورقة مقلوبة',
    emptySpace: 'مكان فاضي، الورقة انحرقت',
    cardWorth: (rank, suit, points) => `${rank} ${suit}، ${points} نقطة`,
    stockCount: (n) => `الكومة، باقي ${n} ورقة`,
    discardPile: 'كومة المرمى',
    leaveGame: 'أطلع من اللعبة',
  },

  overlay: {
    matchOver: 'خلصت المباراة',
    roundNumber: (n) => `الجولة ${n}`,
    youWin: 'فزت بالمباراة.',
    someoneWins: (name) => `${name} فاز بالمباراة.`,
    ashedOut: (name) => `${name} حرق أوراقه كلها.`,
    knockStuck: (name) => `${name} طق ونجح.`,
    knockPaid: (name) => `${name} طق ودفع الثمن.`,
    takesRound: (name) => `${name} ياخذ الجولة.`,
    player: 'اللاعب',
    pilePoints: 'الورق',
    roundPoints: 'الجولة',
    total: 'المجموع',
    knockedTag: 'طق',
    lowestWins: 'اللي مجموعه أقل يفوز.',
    firstTo: (n) => `أول واحد يوصل ${n} ينهي المباراة — واللي نقاطه أقل يفوز فيها.`,
    nextRound: 'الجولة الياية',
    nextRoundIn: (n) => `الجولة الياية بعد ${n} ثواني.`,
    playAgain: 'العب مرة ثانية',
    home: 'الرئيسية',
  },

  auth: {
    signInTitle: 'سجّل دخولك عشان تلعب أونلاين.',
    registerTitle: 'اختر لك اسم وكلمة سر.',
    name: 'الاسم',
    password: 'كلمة السر',
    namePlaceholder: 'عبدالله',
    passwordPlaceholder: '8 أحرف على الأقل',
    signIn: 'دخول',
    createAccount: 'سوّي حساب',
    oneMoment: 'لحظة…',
    switchToRegister: 'ما عندك حساب؟ سوّ لك واحد.',
    switchToSignIn: 'عندك حساب؟ ادخل.',
    privacy:
      'EMBER ما تبي منك غير اسم وكلمة سر — لا إيميل، ولا جهات اتصال، ولا تتبّع. وما في طريقة ترجّع كلمة سر نسيتها، عيل اختر وحدة تحفظها.',
  },

  lobby: {
    status: {
      idle: 'مب متصل',
      connecting: 'يتصل…',
      online: 'متصل',
      reconnecting: 'يحاول يتصل…',
      failed: 'ما قدر يوصل للسيرفر',
    },
    playingAs: (name) => `تلعب باسم ${name}.`,
    online: 'أونلاين.',
    playAnyone: 'العب وية أي أحد',
    playAnyoneBlurb:
      'ادخل أول طاولة ناقصها لاعبين. وإذا ما حضر أحد، الروبوتات تملي المقاعد الفاضية.',
    quickMatch: 'مباراة سريعة',
    playFriends: 'العب وية ربعك',
    playFriendsBlurb: 'افتح طاولة خاصة وعطهم الرمز. ما يقعد فيها أحد ما عنده الرمز.',
    createPrivate: 'افتح طاولة خاصة',
    code: 'الرمز',
    join: 'ادخل',
    roomCode: 'رمز الطاولة',
    yourRecord: 'سجلّك',
    signOut: 'طلّعني',
    lookingForPlayers: 'ندوّر لاعبين…',
    firstAtTable: 'أنت أول واحد قعد على الطاولة.',
    waitingCount: (n) => `${n} ينتظرون.`,
    botsWillFill: 'إذا ما حضر أحد ثاني، الروبوتات بتملي المقاعد الفاضية.',
  },

  room: {
    roomCode: 'رمز الطاولة',
    tapToSend: 'دوس عليه وأرسله لأحد.',
    publicTable: 'طاولة عامة',
    publicBlurb: 'أي أحد يدوّر مباراة يقدر يقعد هني.',
    atTable: (seated, max) => `على الطاولة · ${seated}/${max}`,
    host: 'المضيف',
    away: 'غايب',
    emptySeat: 'مقعد فاضي',
    addBot: 'ضيف روبوت',
    deal: 'وزّع',
    needThree: 'نبي ثلاثة لاعبين',
    waitingForHost: 'ننتظر المضيف يوزّع…',
    remove: (name) => `شيل ${name}`,
    invite: (code) => `اقعد على طاولتي في EMBER — ${SITE_HOST}، ورمز الطاولة ${code}`,
    youSuffix: ' (أنت)',
  },

  express: {
    open: 'قل شي',
    title: 'قل شي',
    everyone: 'الكل',
    emoji: 'ارمها عليه',
    phrases: 'قلها',
    kind: 'بطيبة',
    cheeky: 'بمزح',
    muted: 'التفاعلات مقفلة.',
    mute: 'قفّلها',
    unmute: 'فتّحها',
    aimHint: 'اختر مقعد فوق عشان ترميها على أحد.',
    tooFast: 'عط الطاولة شوي.',
    phrase: {
      hello: 'مرحبا الساع!',
      nice: 'عفية عليك',
      wellPlayed: 'لعب مضبوط',
      goodGame: 'لعبة وايد حلوة',
      lucky: 'حظك زين',
      close: 'قرّبت وايد',
      oops: 'يا ساتر',
      thanks: 'يزاك الله خير',
      yourTurn: 'عيل متى بتلعب؟',
      sleeping: 'نمت ولا شو؟',
      teaTime: 'بسوّي چاي لين تخلّص',
      memory: 'ذاكرتي وايد زينة',
      forgot: 'أنا ناسي ورقي',
      didntSee: 'ما شفت شي والله',
      notThatLucky: 'ما أحد حظه چذي',
      watchThis: 'شوف هالسالفة',
    },
  },

  rank: {
    title: 'الترتيب',
    season: 'هالموسم',
    allTime: 'كل الأوقات',
    seasonEnds: (days) => `الموسم يخلص بعد ${days} يوم.`,
    seasonEndsToday: 'الموسم يخلص اليوم.',
    points: (points) => `${points} نقطة`,
    toNext: (points, tier) => `${points} نقطة وتوصل ${tier}`,
    atTheTop: 'أعلى السلّم.',
    unranked: 'بدون ترتيب',
    unrankedHint: 'خلّص مباراة ضد ناس حقيقيين عشان تدخل اللوحة.',
    place: (place) => `#${place}`,
    you: 'أنت',
    empty: 'ما أحد سجّل هالموسم. كن أول واحد.',
    emptyAllTime: 'ما أحد خلّص مباريات كافية لين الحين.',
    columnPlayer: 'اللاعب',
    columnPoints: 'النقاط',
    columnWinRate: 'نسبة الفوز',
    columnPlayed: 'لعب',
    tier: {
      ash: 'رماد',
      spark: 'شرارة',
      ember: 'جمرة',
      blaze: 'لهب',
      inferno: 'حريق',
    },
    tierBlurb: {
      ash: 'الكل يبدأ بارد.',
      spark: 'شبّت.',
      ember: 'تحترق على مهلها.',
      blaze: 'صعب أحد يقعد قبالك.',
      inferno: 'الطاولة تفضى لين تقعد.',
    },
  },

  profile: {
    matches: 'المباريات',
    won: 'الفوز',
    winRate: 'نسبة الفوز',
    rounds: 'الجولات',
    roundsWon: 'جولات رابحة',
    bestPile: 'أحسن مجموع',
    knocks: 'الطقات',
    knocksValue: (stuck, total, rate) => `${stuck} من ${total} نجحت${rate ? ` · ${rate}٪` : ''}`,
    cardsBurned: 'ورق محروق',
    misfires: 'غلطات حرق',
    ashOuts: 'حرق كامل',
    pointsTaken: 'النقاط اللي عليك',
    leaderboard: 'لوحة الصدارة',
    yourMark: 'علامتك',
    markHint: 'اللي يشوفه الكل يم اسمك.',
    badges: 'الأوسمة',
    badgesEarned: (earned, total) => `${earned} من ${total}`,
    locked: 'لين الحين لا',
    seeRankings: 'شوف الترتيب',
    title: {
      newcomer: 'يديد',
      arsonist: 'الحرّاق',
      coldHands: 'يده باردة',
      lightFingers: 'خفيف اليد',
      tableRunner: 'سيد الطاولة',
      sparkThrower: 'رامي الشرر',
      vanisher: 'المختفي',
      steadyHand: 'يده ثابتة',
    },
    badge: {
      firstMatch: 'قعدت',
      regular: 'وجه معروف',
      fiveWins: 'خمس مرات',
      arsonist: 'حرّاق',
      pyromaniac: 'مهووس حريق',
      coldKnocks: 'طقة باردة',
      ashOut: 'صار رماد',
      emptyHanded: 'يدك فاضية',
      century: 'مية جولة',
      lightFingers: 'خفيف اليد',
    },
    badgeHint: {
      firstMatch: 'خلّص مباراة.',
      regular: 'خلّص 25 مباراة.',
      fiveWins: 'افز بخمس مباريات.',
      arsonist: 'احرق 10 أوراق.',
      pyromaniac: 'احرق 100 ورقة.',
      coldKnocks: 'طق وتثبت طقتك 10 مرات.',
      ashOut: 'احرق آخر ورقة عندك.',
      emptyHanded: 'وصّل جولة للكشف وما عندك ولا ورقة.',
      century: 'العب 100 جولة.',
      lightFingers: 'خلّص جولة بـ 3 نقاط ولا أقل.',
    },
    shape: {
      spade: 'بستوني',
      heart: 'كبة',
      diamond: 'ديناري',
      club: 'شيريا',
      flame: 'شعلة',
      star: 'نجمة',
    },
    colour: {
      coral: 'مرجاني',
      sage: 'أخضر',
      navy: 'كحلي',
      gold: 'ذهبي',
      plum: 'برقوقي',
      teal: 'فيروزي',
    },
    noRecord: 'ما في سجل لين الحين. العب مباراة أونلاين.',
    noLeaders: 'ما أحد خلّص مباريات كافية لين الحين.',
    none: '—',
  },

  rules: {
    title: 'شلون تلعب',
    thePoint: 'الفكرة',
    pointBody: [
      'شدّتين ورق، 108 ورقة. كل واحد ياخذ أربع مقلوبات. الورق اللي قدامك يسوى نقاط، والنقاط مب زينة — تبي أقل مجموع على الطاولة.',
      'قبل ما تبدأ اللعب تشوف ثنتين من أوراقك. هذي آخر نظرة صادقة تحصّلها، وكل اللي بعدها ذاكرة.',
    ],
    yourTurn: 'دورك',
    turnSteps: [
      'اسحب من فوق الكومة، ولا خذ الورقة المكشوفة من المرمى. اللي تاخذه من المرمى لازم يدخل أوراقك — ما في تراجع.',
      'بدّلها بورقة من عندك (والقديمة تروح مكشوفة على المرمى)، ولا ارمِ الورقة اللي سحبتها.',
      'وإذا رميت 7 ولا أعلى، تقدر تستخدم قوتها بدال ما تحتفظ فيها. هذي هي المقايضة: نقاط الحين، ولا معلومة الحين.',
    ],
    burning: 'الحرق',
    burningBody: [
      'أول ما تنزل ورقة مكشوفة، أي واحد يقدر يحرق ورقة من نفس الرتبة — من أوراقه هو، ولا من أوراق غيره.',
      'ورقتك أنت تطلع من اللعب نهائي: ورقة أقل، وما في شي يحل مكانها.',
      'أما ورقة خصمك فتتبدّل بورقة من الكومة مقلوبة. عدد أوراقه ما يتغيّر، بس يخسر الورقة اللي كان يعرفها، وما أحد على الطاولة يدري شو صار في يده. هذا اللي تسواه معرفتك بورقة خصمك.',
      'وإذا غلطت، تاخذ أنت ورقة العقوبة، مهما كان صاحب الورقة، وتنكشف الورقة للطاولة كلها. تأكّد قبل لا تدوس.',
    ],
    knocking: 'الطق',
    knockingBody: [
      'لين تشوف أوراقك هي الأقل، طق في بداية دورك. كل واحد ياخذ دور أخير، وبعدين ينكشف الورق كله.',
      'إذا كنت الأقل على الطاولة، الطقة ما تكلّفك شي. وإذا سبقك أحد، ولا حتى تعادل وياك، كلّفك مجموعك زايد عشرة.',
    ],
    values: 'شقد تسوى الأوراق',
    valueNotes: {
      bestCard: 'أحسن ورقة في الشدّة',
      getRidOfIt: 'تخلّص منها',
      faceValue: 'حسب رقمها',
    },
    powersTitle: 'القوى',
    redKingNote: 'الشايب الأحمر ما يسوى شي أصلاً، عيل ما له قوة تنصرف — خلّه عندك.',
    ending: 'النهاية',
    endingBody:
      'نقاط الجولات تتجمّع. وأول ما يوصل أحد 100 تخلص المباراة، ويفوز اللي نقاطه أقل. وإذا حرقت أوراقك كلها، تخلص الجولة على طول وما تتسجّل عليك ولا نقطة.',
  },

  /**
   * Arabic conjugates for the person acting: your own moves read in the second
   * person, everyone else's in the third, and the verb agrees with them.
   */
  log: (entry, { card, power, you, toYou }) => {
    const who = entry.name ?? '';
    const said = (forms: { you: string; he: string; she: string }) => person(you, who, forms);
    const subject = you ? '' : `${who} `;
    const onThem = toYou ? 'عليك' : `على ${entry.other ?? ''}`;
    const withThem = toYou ? 'وياك' : `وية ${entry.other ?? ''}`;
    const fromThem = toYou ? 'منك' : `من ${entry.other ?? ''}`;
    const theirCards = toYou ? 'أوراقك' : `أوراق ${entry.other ?? ''}`;
    const atThem = toYou ? 'عندك' : `عند ${entry.other ?? ''}`;
    const which = entry.card ? card(entry.card) : '';
    const count = arabicDigits(entry.count ?? 0);

    switch (entry.key) {
      case 'round_dealt':
        return `الجولة ${count}. احفظ ثنتين من أوراقك.`;
      case 'round_begins':
        return `بدت الجولة ${count}.`;
      case 'reshuffled':
        return 'خلصت الكومة — رجّعنا المرمى وخلطناه.';
      case 'knocked':
        return `${subject}${said({ you: 'طقيت', he: 'طقّ', she: 'طقّت' })}! دور أخير لكل واحد.`;
      case 'knock_stuck':
        return `${subject}${said({ you: 'طقيت ونجيت', he: 'طقّ ونجا', she: 'طقّت ونجت' })} — بلا نقاط.`;
      case 'knock_missed':
        return `${subject}${said({ you: 'طقيت وغلطت', he: 'طقّ وغلط', she: 'طقّت وغلطت' })}. زايد ${count}.`;
      case 'took_discard':
        return `${subject}${said({ you: 'خذيت', he: 'خذ', she: 'خذت' })} ${which} من المرمى.`;
      case 'swapped_threw':
        return `${subject}${said({ you: 'بدّلت', he: 'بدّل', she: 'بدّلت' })} ورقة و${said({ you: 'رميت', he: 'رمى', she: 'رمت' })} ${which}.`;
      case 'threw':
        return `${subject}${said({ you: 'رميت', he: 'رمى', she: 'رمت' })} ${which}.`;
      case 'threw_power':
        return `${subject}${said({ you: 'رميت', he: 'رمى', she: 'رمت' })} ${which} — ${entry.power ? power(entry.power) : ''}.`;
      case 'blind_swap':
        return `${subject}${said({ you: 'بدّلت', he: 'بدّل', she: 'بدّلت' })} ورقة ${withThem} وما أحد شاف شي.`;
      case 'look_swap_took':
        return `${subject}${said({ you: 'شفتها وعيبتك وخذيتها', he: 'شافها وعيبته وخذها', she: 'شافتها وعيبتها وخذتها' })} ${fromThem}.`;
      case 'look_swap_left':
        return `${subject}${said({ you: 'شفتها وخليتها', he: 'شافها وخلاها', she: 'شافتها وخلتها' })} مكانها.`;
      case 'looked':
        return `${subject}${said({ you: 'شفت', he: 'شاف', she: 'شافت' })} ورقة.`;
      case 'ember':
        return `${subject}${said({ you: 'فرضت', he: 'فرض', she: 'فرضت' })} ورقة ${onThem}. جمرة!`;
      case 'burned':
        return `${subject}${said({ you: 'حرقت', he: 'حرق', she: 'حرقت' })} ${which}. ورقة أقل.`;
      case 'burned_theirs':
        return `${subject}${said({ you: 'حرقت', he: 'حرق', she: 'حرقت' })} ${which} من ${theirCards}.`;
      case 'misfire':
        return `${subject}${said({ you: 'غلطت', he: 'غلط', she: 'غلطت' })} في ${which} — ورقة عقوبة.`;
      case 'misfire_theirs':
        return `${subject}${said({ you: 'غلطت', he: 'غلط', she: 'غلطت' })} في ${which} ${atThem} — ورقة عقوبة.`;
      case 'ash_out':
        return `${subject}${said({ you: 'حرقت أوراقك', he: 'حرق أوراقه', she: 'حرقت أوراقها' })} كلها. ما بقى شي!`;
      default:
        return '';
    }
  },

  errors: {
    offline: 'ما قدرنا نوصل للسيرفر. شيّك على النت.',
    bad_name: 'الاسم من 3 لين 16 حرف: حروف وأرقام ومسافات و . _ -',
    weak_password: 'كلمة السر 8 أحرف على الأقل.',
    long_password: 'كلمة السر طويلة وايد.',
    name_taken: 'هالاسم محجوز.',
    bad_credentials: 'الاسم ولا كلمة السر غلط.',
    rate_limited: 'محاولات وايد. انتظر شوي.',
    too_large: 'الطلب كبير وايد.',
    bad_json: 'التطبيق أرسل شي ما فهمته الطاولة.',
    bad_message: 'التطبيق أرسل شي ما فهمته الطاولة.',
    unauthorised: 'لازم تسجّل دخولك من يديد.',
    version_mismatch: 'هالنسخة قديمة. حدّثها عشان تكمّل أونلاين.',
    no_such_room: 'ما في طاولة بهالرمز.',
    room_full: 'الطاولة مليانة.',
    room_in_play: 'هالمباراة بدت من قبل.',
    not_host: 'المضيف بس يقدر يسوي جي.',
    not_in_room: 'أنت مب على طاولة.',
    need_players: 'تبي ثلاثة لاعبين على الأقل.',
    not_your_move: 'مب دورك.',
    too_chatty: 'عط الطاولة شوي.',
    server_error: 'صار خطأ عندنا.',
    session_expired: 'خلصت جلستك. سجّل دخولك من يديد.',
  },

  cards: {
    rank: (rank) => AR_RANK[rank],
    suit: (suit) => (suit ? AR_SUIT[suit] : ''),
    name: (ref) => {
      if (ref.rank === 'JOKER') return 'جوكر';
      // The colour is the thing worth saying about a King: the red one is
      // worth nothing at all.
      if (ref.rank === 'K') return isRed(ref.suit) ? 'الشايب الأحمر' : 'الشايب الأسود';
      const rank = AR_RANK[ref.rank];
      return ref.suit ? `${rank} ${AR_SUIT[ref.suit]}` : rank;
    },
    spoken: (rank) => {
      if (rank === 'JOKER') return 'جوكر';
      if (rank === 'A') return 'آس';
      if (rank === 'J') return 'ولد';
      if (rank === 'Q') return 'بنت';
      if (rank === 'K') return 'شايب';
      return AR_RANK[rank];
    },
  },

  digits: arabicDigits,
};

export const LOCALES: Record<LocaleCode, Strings> = { en, ar };
