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
    invite: (code) => `Sit down at my EMBER table. Room code: ${code}`,
    youSuffix: ' (you)',
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

const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Western digits into Arabic-Indic ones, leaving everything else alone. */
function arabicDigits(value: number | string): string {
  return String(value).replace(/[0-9]/g, (digit) => ARABIC_DIGITS[Number(digit)]);
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
  '2': '٢',
  '3': '٣',
  '4': '٤',
  '5': '٥',
  '6': '٦',
  '7': '٧',
  '8': '٨',
  '9': '٩',
  '10': '١٠',
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

export const ar: Strings = {
  code: 'ar',
  rtl: true,
  name: 'العربية',

  bots: AR_BOTS,

  common: {
    back: 'رجوع',
    backArrow: '→',
    gotIt: 'حفظتها',
    doneLooking: 'انتهيت',
    cancel: 'إلغاء',
    leave: 'خروج',
    leaveTable: 'مغادرة الطاولة',
    you: 'أنت',
    points: 'نقطة',
    round: (n) => `الجولة ${n}`,
    toScore: (n) => `حتى ${n}`,
    seconds: (n) => `${n} ث`,
  },

  home: {
    tagline: 'احفظ. احرق. اطرق.',
    blurb:
      'أربع أوراق مقلوبة، رأيت اثنتين منها مرة واحدة. اجعل مجموعك الأقل على الطاولة، وأعلنها قبل أن يسبقك أحد.',
    playOnline: 'العب على الإنترنت',
    onlineSignedIn: (name) => `مسجّل باسم ${name}. مباراة سريعة، أو طاولة خاصة مع أصدقائك.`,
    onlineBlurb: 'مباراة سريعة مع لاعبين حقيقيين، أو طاولة خاصة لأصدقائك وحدهم.',
    offlineOnly: 'هذه النسخة تلعب ضد الروبوتات فقط. الطاولات على الإنترنت تحتاج خادم EMBER — راجع ملف README.',
    againstBots: 'ضد الروبوتات',
    table: 'الطاولة',
    players: (n) => `${n} لاعبين`,
    opponents: 'الخصوم',
    assist: 'وضع المساعدة',
    assistHint: 'يضع علامة على الأوراق التي سبق أن رأيتها.',
    sound: 'الصوت',
    soundHint: 'طقطقة الورق، وفرقعة الحرق، وصوت الطرق.',
    deal: 'وزّع الأوراق',
    howToPlay: 'كيف تلعب',
    language: 'English',
  },

  difficulty: { easy: 'كثير النسيان', normal: 'متمكّن', sharp: 'لا يرحم' },

  powers: {
    PEEK: { name: 'نظرة', hint: 'انظر إلى واحدة من أوراقك.' },
    SPY: { name: 'تجسس', hint: 'انظر إلى واحدة من أوراق خصمك.' },
    SWAP: { name: 'تبديل', hint: 'بدّل ورقة من عندك بأخرى من عنده، دون أن يرى أحد شيئًا.' },
    LOOK_SWAP: { name: 'انظر وبدّل', hint: 'انظر إلى ورقة خصمك، ثم خذها إن أعجبتك.' },
    EMBER: { name: 'جمرة', hint: 'أجبر خصمًا على سحب ورقة من الكومة.' },
  },

  table: {
    lookAtTwo: 'انظر إلى ورقتين من عندك',
    oneMoreLook: 'نظرة أخيرة',
    rememberThem: 'احفظهما جيدًا',
    waitingForTable: 'في انتظار بقية الطاولة',
    everyoneSaw: 'رآها الجميع',
    burnRank: (rank) => `تحرق ${rank}؟`,
    burnPlain: 'تحرق؟',
    burnHint: 'من أوراقك أو أوراقه — والورقة الخطأ تكلّفك ورقة',
    yourMove: 'دورك',
    lastTurn: 'الدور الأخير',
    thinking: (name) => `${name}…`,
    usingPower: (name, power) => `${name} — ${power}`,
    drew: (card) => `سحبت ${card}`,
    swapItIn: 'ضعها مكان ورقة',
    giveAwayWhich: 'أي ورقة تعطي؟',
    andTakeWhich: 'وأي ورقة تأخذ؟',
    lookAtWhose: 'ورقة من تريد أن ترى؟',
    takeIt: 'تأخذها؟',
    whoTakesCard: 'من يسحب ورقة؟',
    lookAtOneOfYours: 'انظر إلى واحدة من عندك',
    lookAtOneOfTheirs: 'انظر إلى واحدة من عنده',
    cardsOnTable: 'اكشفوا الأوراق',
    youWillNotSeeAgain: 'لن تراهما مرة أخرى',
    inHand: 'في يدك',
    remember: 'احفظها',
    pile: 'المرمى',
    knock: 'اطرق',
    alreadyKnocked: 'طُرقت بالفعل',
    knocked: 'طَرَق',
    throwIt: 'ارمها',
    justThrow: 'ارمها',
    leaveIt: 'اتركها',
    burnWindow: 'مهلة الحرق',
    away: 'غائب',
    faceDownCard: 'ورقة مقلوبة',
    emptySpace: 'مكان فارغ، احترقت الورقة',
    cardWorth: (rank, suit, points) => `${rank} ${suit}، ${points} نقطة`,
    stockCount: (n) => `الكومة، بقيت ${n} ورقة`,
    discardPile: 'كومة المرمى',
    leaveGame: 'مغادرة اللعبة',
  },

  overlay: {
    matchOver: 'انتهت المباراة',
    roundNumber: (n) => `الجولة ${n}`,
    youWin: 'فزت بالمباراة.',
    someoneWins: (name) => `${name} فاز بالمباراة.`,
    ashedOut: (name) => `${name} أحرق أوراقه كلها.`,
    knockStuck: (name) => `${name} طَرَق ونجح.`,
    knockPaid: (name) => `${name} طَرَق ودفع الثمن.`,
    takesRound: (name) => `${name} يكسب الجولة.`,
    player: 'اللاعب',
    pilePoints: 'الأوراق',
    roundPoints: 'الجولة',
    total: 'المجموع',
    knockedTag: 'طَرَق',
    lowestWins: 'الأقل مجموعًا يفوز.',
    firstTo: (n) => `أول من يبلغ ${n} ينهي المباراة — والأقل نقاطًا يفوز بها.`,
    nextRound: 'الجولة التالية',
    nextRoundIn: (n) => `الجولة التالية بعد ${n} ثوانٍ.`,
    playAgain: 'العب مرة أخرى',
    home: 'الرئيسية',
  },

  auth: {
    signInTitle: 'سجّل الدخول للعب على الإنترنت.',
    registerTitle: 'اختر اسمًا وكلمة مرور.',
    name: 'الاسم',
    password: 'كلمة المرور',
    namePlaceholder: 'عبدالله',
    passwordPlaceholder: '٨ أحرف على الأقل',
    signIn: 'تسجيل الدخول',
    createAccount: 'إنشاء حساب',
    oneMoment: 'لحظة…',
    switchToRegister: 'ليس لديك حساب؟ أنشئ واحدًا.',
    switchToSignIn: 'لديك حساب؟ سجّل الدخول.',
    privacy:
      'تحتفظ EMBER باسمك وكلمة مرورك فقط — بلا بريد إلكتروني، ولا جهات اتصال، ولا تتبّع. ولا توجد طريقة لاستعادة كلمة مرور منسية، فاختر واحدة تتذكرها.',
  },

  lobby: {
    status: {
      idle: 'غير متصل',
      connecting: 'جارٍ الاتصال…',
      online: 'متصل',
      reconnecting: 'إعادة الاتصال…',
      failed: 'تعذّر الوصول إلى الخادم',
    },
    playingAs: (name) => `تلعب باسم ${name}.`,
    online: 'على الإنترنت.',
    playAnyone: 'العب مع أي أحد',
    playAnyoneBlurb: 'انضم إلى أول طاولة تحتاج لاعبين. وإن لم يحضر أحد، تملأ الروبوتات المقاعد الفارغة.',
    quickMatch: 'مباراة سريعة',
    playFriends: 'العب مع أصدقائك',
    playFriendsBlurb: 'افتح طاولة خاصة وشارك الرمز. لا يجلس عليها أحد لا يملكه.',
    createPrivate: 'افتح طاولة خاصة',
    code: 'الرمز',
    join: 'انضم',
    roomCode: 'رمز الطاولة',
    yourRecord: 'سجلّك',
    signOut: 'تسجيل الخروج',
    lookingForPlayers: 'نبحث عن لاعبين…',
    firstAtTable: 'أنت أول من جلس على الطاولة.',
    waitingCount: (n) => `${n} في الانتظار.`,
    botsWillFill: 'إن لم يحضر أحد آخر، ستملأ الروبوتات المقاعد الفارغة.',
  },

  room: {
    roomCode: 'رمز الطاولة',
    tapToSend: 'اضغط لإرساله إلى أحدهم.',
    publicTable: 'طاولة عامة',
    publicBlurb: 'يستطيع أي باحث عن مباراة أن يجلس هنا.',
    atTable: (seated, max) => `على الطاولة · ${seated}/${max}`,
    host: 'المضيف',
    away: 'غائب',
    emptySeat: 'مقعد فارغ',
    addBot: 'أضف روبوتًا',
    deal: 'وزّع',
    needThree: 'نحتاج ثلاثة لاعبين',
    waitingForHost: 'في انتظار المضيف ليوزّع…',
    remove: (name) => `أزل ${name}`,
    invite: (code) => `اجلس على طاولتي في EMBER. رمز الطاولة: ${code}`,
    youSuffix: ' (أنت)',
  },

  profile: {
    matches: 'المباريات',
    won: 'الفوز',
    winRate: 'نسبة الفوز',
    rounds: 'الجولات',
    roundsWon: 'جولات رابحة',
    bestPile: 'أفضل مجموع',
    knocks: 'الطرقات',
    knocksValue: (stuck, total, rate) => `${stuck} من ${total} نجحت${rate ? ` · ${rate}٪` : ''}`,
    cardsBurned: 'أوراق محروقة',
    misfires: 'محاولات خاطئة',
    ashOuts: 'حرق كامل',
    pointsTaken: 'النقاط المحصّلة',
    leaderboard: 'لوحة الصدارة',
    noRecord: 'لا سجلّ بعد. العب مباراة على الإنترنت.',
    noLeaders: 'لم يُكمل أحد ما يكفي من المباريات بعد.',
    none: '—',
  },

  rules: {
    title: 'كيف تلعب',
    thePoint: 'الفكرة',
    pointBody: [
      'مجموعتان من الورق، ١٠٨ أوراق. يأخذ كل لاعب أربعًا مقلوبة. الأوراق أمامك تساوي نقاطًا، والنقاط سيئة — تريد أقل مجموع على الطاولة.',
      'قبل أن تبدأ اللعب تنظر إلى ورقتين من أوراقك. هذه آخر نظرة صادقة تحصل عليها، وكل ما بعدها ذاكرة.',
    ],
    yourTurn: 'دورك',
    turnSteps: [
      'اسحب من أعلى الكومة، أو خذ الورقة المكشوفة من المرمى. الورقة التي تأخذها من المرمى يجب أن تدخل أوراقك — لا تراجع.',
      'بدّلها بورقة من أوراقك (فتذهب القديمة مكشوفة إلى المرمى)، أو ارمِ الورقة التي سحبتها.',
      'إن رميت ٧ أو أعلى جاز لك استعمال قوتها بدل الاحتفاظ بها. هذه هي المقايضة: نقاط الآن، أو معلومة الآن.',
    ],
    burning: 'الحرق',
    burningBody: [
      'ما إن تسقط ورقة مكشوفة حتى يجوز لأي لاعب أن يحرق ورقة من الرتبة نفسها — من أوراقه هو، أو من أوراق غيره.',
      'ورقتك أنت تخرج من اللعب نهائيًا: ورقة أقل، ولا شيء يحل مكانها.',
      'أما ورقة خصمك فتُستبدل بورقة من الكومة مقلوبة. يبقى عدد أوراقه كما هو، لكنه يفقد الورقة التي كان يعرفها، ولا أحد على الطاولة يعرف ما صار في يده. هذا ما تساويه معرفتك بورقة خصمك.',
      'وإن أخطأت أخذت أنت ورقة العقوبة، أيًّا كان صاحب الورقة، وتُكشف الورقة للطاولة كلها. تأكّد قبل أن تضغط.',
    ],
    knocking: 'الطرق',
    knockingBody: [
      'حين ترى أن أوراقك هي الأقل، اطرق في بداية دورك. يأخذ كل واحد دورًا أخيرًا، ثم تُكشف كل الأوراق.',
      'إن كنت الأقل على الطاولة فالطرق لا يكلفك شيئًا. وإن سبقك أحد، أو حتى تعادل معك، كلّفك مجموعك زائد عشرة.',
    ],
    values: 'كم تساوي الأوراق',
    valueNotes: {
      bestCard: 'أفضل ورقة في المجموعة',
      getRidOfIt: 'تخلّص منها',
      faceValue: 'حسب رقمها',
    },
    powersTitle: 'القوى',
    redKingNote: 'الشايب الأحمر لا يساوي شيئًا أصلًا، فلا قوة له تُنفق — احتفظ به.',
    ending: 'النهاية',
    endingBody:
      'تتراكم نقاط الجولات. وما إن يبلغ أحدهم ١٠٠ حتى تنتهي المباراة، ويفوز صاحب أقل النقاط. وإن أحرقت أوراقك كلها انتهت الجولة في الحال ولم تسجّل عليك نقطة.',
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
    const withThem = toYou ? 'معك' : `مع ${entry.other ?? ''}`;
    const fromThem = toYou ? 'منك' : `من ${entry.other ?? ''}`;
    const theirCards = toYou ? 'أوراقك' : `أوراق ${entry.other ?? ''}`;
    const atThem = toYou ? 'عندك' : `عند ${entry.other ?? ''}`;
    const which = entry.card ? card(entry.card) : '';
    const count = arabicDigits(entry.count ?? 0);

    switch (entry.key) {
      case 'round_dealt':
        return `الجولة ${count}. احفظ ورقتين من أوراقك.`;
      case 'round_begins':
        return `بدأت الجولة ${count}.`;
      case 'reshuffled':
        return 'نفدت الكومة — أُعيد خلط المرمى فيها.';
      case 'knocked':
        return `${subject}${said({ you: 'طرقتَ', he: 'طَرَق', she: 'طَرَقت' })}! دور أخير لكل واحد.`;
      case 'knock_stuck':
        return `${subject}${said({ you: 'طرقتَ ونجوتَ', he: 'طَرَق ونجا', she: 'طَرَقت ونجت' })} بها — بلا نقاط.`;
      case 'knock_missed':
        return `${subject}${said({ you: 'طرقتَ وأخطأتَ', he: 'طَرَق وأخطأ', she: 'طَرَقت وأخطأت' })}. زائد ${count}.`;
      case 'took_discard':
        return `${subject}${said({ you: 'أخذتَ', he: 'أخذ', she: 'أخذت' })} ${which} من المرمى.`;
      case 'swapped_threw':
        return `${subject}${said({ you: 'بدّلتَ', he: 'بدّل', she: 'بدّلت' })} ورقة و${said({ you: 'رميتَ', he: 'رمى', she: 'رمت' })} ${which}.`;
      case 'threw':
        return `${subject}${said({ you: 'رميتَ', he: 'رمى', she: 'رمت' })} ${which}.`;
      case 'threw_power':
        return `${subject}${said({ you: 'رميتَ', he: 'رمى', she: 'رمت' })} ${which} — ${entry.power ? power(entry.power) : ''}.`;
      case 'blind_swap':
        return `${subject}${said({ you: 'بدّلتَ', he: 'بدّل', she: 'بدّلت' })} ورقة ${withThem} دون أن يرى أحد شيئًا.`;
      case 'look_swap_took':
        return `${subject}${said({ you: 'نظرتَ فأعجبتك، فأخذتها', he: 'نظر فأعجبته، فأخذها', she: 'نظرت فأعجبتها، فأخذتها' })} ${fromThem}.`;
      case 'look_swap_left':
        return `${subject}${said({ you: 'نظرتَ وتركتها', he: 'نظر وتركها', she: 'نظرت وتركتها' })} مكانها.`;
      case 'looked':
        return `${subject}${said({ you: 'نظرتَ', he: 'نظر', she: 'نظرت' })} إلى ورقة.`;
      case 'ember':
        return `${subject}${said({ you: 'فرضتَ', he: 'فرض', she: 'فرضت' })} ورقة ${onThem}. جمرة!`;
      case 'burned':
        return `${subject}${said({ you: 'أحرقتَ', he: 'أحرق', she: 'أحرقت' })} ${which}. ورقة أقل.`;
      case 'burned_theirs':
        return `${subject}${said({ you: 'أحرقتَ', he: 'أحرق', she: 'أحرقت' })} ${which} من ${theirCards}.`;
      case 'misfire':
        return `${subject}${said({ you: 'أخطأتَ', he: 'أخطأ', she: 'أخطأت' })} في ${which} — ورقة عقوبة.`;
      case 'misfire_theirs':
        return `${subject}${said({ you: 'أخطأتَ', he: 'أخطأ', she: 'أخطأت' })} في ${which} ${atThem} — ورقة عقوبة.`;
      case 'ash_out':
        return `${subject}${said({ you: 'أحرقتَ أوراقك', he: 'أحرق أوراقه', she: 'أحرقت أوراقها' })} كلها. لم يبق شيء!`;
      default:
        return '';
    }
  },

  errors: {
    offline: 'تعذّر الوصول إلى الخادم. تحقّق من اتصالك.',
    bad_name: 'الاسم من ٣ إلى ١٦ حرفًا: حروف وأرقام ومسافات و . _ -',
    weak_password: 'كلمة المرور ٨ أحرف على الأقل.',
    long_password: 'كلمة المرور طويلة أكثر من اللازم.',
    name_taken: 'هذا الاسم مستخدم بالفعل.',
    bad_credentials: 'الاسم أو كلمة المرور غير صحيحة.',
    rate_limited: 'محاولات كثيرة. انتظر قليلًا.',
    too_large: 'الطلب كبير أكثر من اللازم.',
    bad_json: 'أرسل التطبيق شيئًا لم تفهمه الطاولة.',
    bad_message: 'أرسل التطبيق شيئًا لم تفهمه الطاولة.',
    unauthorised: 'عليك تسجيل الدخول من جديد.',
    version_mismatch: 'هذه النسخة قديمة. حدّثها لتكمل اللعب على الإنترنت.',
    no_such_room: 'لا توجد طاولة بهذا الرمز.',
    room_full: 'الطاولة ممتلئة.',
    room_in_play: 'بدأت هذه المباراة بالفعل.',
    not_host: 'المضيف وحده يستطيع ذلك.',
    not_in_room: 'لست على طاولة.',
    need_players: 'تحتاج ثلاثة لاعبين على الأقل.',
    not_your_move: 'ليس دورك.',
    server_error: 'حدث خطأ عندنا.',
    session_expired: 'انتهت جلستك. سجّل الدخول من جديد.',
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
      if (rank === 'A') return 'آسًا';
      if (rank === 'J') return 'ولدًا';
      if (rank === 'Q') return 'بنتًا';
      if (rank === 'K') return 'شايبًا';
      return AR_RANK[rank];
    },
  },

  digits: arabicDigits,
};

export const LOCALES: Record<LocaleCode, Strings> = { en, ar };
