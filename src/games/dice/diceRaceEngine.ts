export type RaceGoal = 'rounds' | 'length';
export type MomentumEffect = -1 | 0 | 1 | 2 | 3;
export type CardName = 'burst' | 'hailMary' | 'stumble' | 'secondChance' | 'deepBreath';
export type CardCopies = 0 | 1 | 2;

export type CardRules = {
  burstMove: number;
  copiesPerCard: CardCopies;
  deepBreathBoost: number;
  stumbleDetract: number;
};

export type SetupState = {
  cards: CardRules;
  goal: RaceGoal;
  goalValue: number;
  momentumEffects: Record<number, MomentumEffect>;
  players: number;
};

type PendingStumble = { amount: number; triggerRound: number };

export type RaceState = {
  activePlayer: number;
  completedRounds: number;
  finishTriggered: boolean;
  inProgress: boolean;
  lastCardPlayed: string | null;
  lastMove: number | null;
  lastRoll: number | null;
  momentum: number[];
  pendingDeepBreathBoost: number[];
  pendingStumbles: PendingStumble[][];
  playerCards: Record<CardName, number>[];
  scores: number[];
  setup: SetupState;
  shootoutPlayers: number[] | null;
  shootoutTurnsPlayed: number;
  winner: number | null;
};

export type SimulationTurn = {
  cardPlayed: string | null;
  move: number;
  momentumAfter: number;
  momentumBefore: number;
  player: number;
  roll: number;
  scoresAfterTurn: number[];
  turn: number;
};

export type SimulationResult = {
  finalState: RaceState;
  turns: SimulationTurn[];
};

export const GOAL_DEFAULTS: Record<RaceGoal, number> = { rounds: 5, length: 20 };
export const MOMENTUM_MIN = 0;
export const MOMENTUM_MAX = 5;
export const INITIAL_MOMENTUM = 1;
export const DEFAULT_CARD_RULES: CardRules = {
  burstMove: 10,
  copiesPerCard: 1,
  deepBreathBoost: 2,
  stumbleDetract: 2,
};
export const DEFAULT_MOMENTUM_EFFECTS: Record<number, MomentumEffect> = {
  1: -1,
  2: 0,
  3: 0,
  4: 0,
  5: 1,
  6: 1,
};

const CARD_NAMES: CardName[] = ['burst', 'hailMary', 'stumble', 'secondChance', 'deepBreath'];
const clampMomentum = (value: number) => Math.min(MOMENTUM_MAX, Math.max(MOMENTUM_MIN, value));
const EMPTY_CARDS: Record<CardName, number> = {
  burst: 0,
  hailMary: 0,
  stumble: 0,
  secondChance: 0,
  deepBreath: 0,
};

const getPlayerCards = (state: RaceState, player: number) =>
  state.playerCards[player] ?? EMPTY_CARDS;
const hasCard = (state: RaceState, player: number, card: CardName) =>
  getPlayerCards(state, player)[card] > 0;
const spendCard = (state: RaceState, player: number, card: CardName) => {
  const cards = getPlayerCards(state, player);
  state.playerCards[player] = { ...cards, [card]: Math.max(0, cards[card] - 1) };
};

export function createInitialState(setup: SetupState): RaceState {
  return {
    activePlayer: 0,
    completedRounds: 0,
    finishTriggered: false,
    inProgress: false,
    lastCardPlayed: null,
    lastMove: null,
    lastRoll: null,
    momentum: Array.from({ length: setup.players }, () => INITIAL_MOMENTUM),
    pendingDeepBreathBoost: Array.from({ length: setup.players }, () => 0),
    pendingStumbles: Array.from({ length: setup.players }, () => []),
    playerCards: Array.from({ length: setup.players }, () =>
      CARD_NAMES.reduce<Record<CardName, number>>(
        (acc, card) => ({ ...acc, [card]: setup.cards.copiesPerCard }),
        EMPTY_CARDS
      )
    ),
    scores: Array.from({ length: setup.players }, () => 0),
    setup,
    shootoutPlayers: null,
    shootoutTurnsPlayed: 0,
    winner: null,
  };
}

export function getLeaders(scores: number[]): number[] {
  const topScore = Math.max(...scores);
  return scores.flatMap((score, index) => (score === topScore ? index : []));
}

function chooseStumbleTarget(state: RaceState, player: number): number | null {
  const leader = getLeaders(state.scores).find((index) => index !== player);
  if (leader !== undefined) return leader;
  const fallback = state.scores.findIndex((_, index) => index !== player);
  return fallback >= 0 ? fallback : null;
}

function applyCardEffects(
  state: RaceState,
  player: number,
  roll: number,
  random: () => number
): { move: number; momentumAfter: number; finalRoll: number; cardPlayed: string | null } {
  let cardPlayed: string | null = null;
  const momentumBefore = state.momentum[player] ?? INITIAL_MOMENTUM;
  const momentumDelta = state.setup.momentumEffects[roll] ?? 0;

  if (hasCard(state, player, 'stumble')) {
    const target = chooseStumbleTarget(state, player);
    if (target !== null && target !== player) {
      spendCard(state, player, 'stumble');
      state.pendingStumbles[target] = [
        ...(state.pendingStumbles[target] ?? []),
        { amount: state.setup.cards.stumbleDetract, triggerRound: state.completedRounds + 1 },
      ];
      cardPlayed = `stumble→P${target + 1}`;
    }
  }

  if (roll === 6 && hasCard(state, player, 'burst')) {
    spendCard(state, player, 'burst');
    state.momentum[player] = 0;
    return {
      cardPlayed: cardPlayed ? `${cardPlayed}, burst` : 'burst',
      finalRoll: roll,
      momentumAfter: 0,
      move: state.setup.cards.burstMove,
    };
  }

  if (roll === 6 && hasCard(state, player, 'deepBreath') && momentumBefore >= 4) {
    spendCard(state, player, 'deepBreath');
    state.pendingDeepBreathBoost[player] =
      (state.pendingDeepBreathBoost[player] ?? 0) + state.setup.cards.deepBreathBoost;
    return {
      cardPlayed: cardPlayed ? `${cardPlayed}, deep breath` : 'deep breath',
      finalRoll: roll,
      momentumAfter: momentumBefore,
      move: 0,
    };
  }

  let finalRoll = roll;
  if (momentumDelta < 0 && hasCard(state, player, 'secondChance')) {
    spendCard(state, player, 'secondChance');
    finalRoll = rollDie(random());
    cardPlayed = cardPlayed ? `${cardPlayed}, second chance` : 'second chance';
  }

  const finalDelta = state.setup.momentumEffects[finalRoll] ?? 0;
  if (finalDelta < 0 && hasCard(state, player, 'hailMary')) {
    spendCard(state, player, 'hailMary');
    return {
      cardPlayed: cardPlayed ? `${cardPlayed}, hail mary` : 'hail mary',
      finalRoll,
      momentumAfter: momentumBefore,
      move: momentumBefore,
    };
  }

  const nextMomentum = clampMomentum(momentumBefore + finalDelta);
  state.momentum[player] = nextMomentum;
  return { cardPlayed, finalRoll, momentumAfter: nextMomentum, move: nextMomentum };
}

export function resolveTurn(current: RaceState, roll: number, random = Math.random): RaceState {
  if (!current.inProgress || current.winner !== null) return current;

  const next = {
    ...current,
    momentum: [...current.momentum],
    pendingDeepBreathBoost: [...current.pendingDeepBreathBoost],
    pendingStumbles: current.pendingStumbles.map((effects) => [...effects]),
    playerCards: current.playerCards.map((cards) => ({ ...cards })),
    scores: [...current.scores],
  };

  const activePlayer = next.activePlayer;
  const roundStumbles = (next.pendingStumbles[activePlayer] ?? []).filter(
    (effect) => effect.triggerRound <= next.completedRounds
  );
  const remainingStumbles = (next.pendingStumbles[activePlayer] ?? []).filter(
    (effect) => effect.triggerRound > next.completedRounds
  );
  const stumblePenalty = roundStumbles.reduce((sum, effect) => sum + effect.amount, 0);
  next.pendingStumbles[activePlayer] = remainingStumbles;

  const deepBreathBoost = next.pendingDeepBreathBoost[activePlayer] ?? 0;
  next.pendingDeepBreathBoost[activePlayer] = 0;
  next.momentum[activePlayer] = clampMomentum(
    (next.momentum[activePlayer] ?? INITIAL_MOMENTUM) + deepBreathBoost - stumblePenalty
  );

  const { cardPlayed, finalRoll, move } = applyCardEffects(next, activePlayer, roll, random);
  next.scores[activePlayer] = (next.scores[activePlayer] ?? 0) + move;

  const turnPlayers =
    next.shootoutPlayers ?? Array.from({ length: next.setup.players }, (_, index) => index);
  const activePlayerIndex = turnPlayers.indexOf(activePlayer);
  const nextPlayerIndex = (activePlayerIndex + 1) % turnPlayers.length;
  const nextActivePlayer = turnPlayers[nextPlayerIndex] ?? 0;
  const nextShootoutTurnsPlayed = next.shootoutTurnsPlayed + 1;
  const roundFinished = nextShootoutTurnsPlayed >= turnPlayers.length;
  const completedRounds = next.completedRounds + (roundFinished ? 1 : 0);
  const reachedLength = next.scores.some((score) => score >= next.setup.goalValue);
  const finishTriggered =
    next.setup.goal === 'length' ? next.finishTriggered || reachedLength : true;
  const reachedLimit =
    roundFinished &&
    ((next.setup.goal === 'rounds' && completedRounds >= next.setup.goalValue) ||
      (next.setup.goal === 'length' && finishTriggered));

  if (next.shootoutPlayers === null && reachedLimit) {
    const leaders = getLeaders(next.scores);
    const winner = leaders.length === 1 ? leaders[0]! : null;
    return {
      ...next,
      activePlayer: winner === null ? leaders[0]! : nextActivePlayer,
      completedRounds,
      finishTriggered,
      inProgress: winner === null,
      lastCardPlayed: cardPlayed,
      lastMove: move,
      lastRoll: finalRoll,
      shootoutPlayers: winner === null ? leaders : null,
      shootoutTurnsPlayed: 0,
      winner,
    };
  }

  if (next.shootoutPlayers !== null && roundFinished) {
    const topScore = Math.max(...next.shootoutPlayers.map((player) => next.scores[player] ?? 0));
    const survivors = next.shootoutPlayers.filter(
      (player) => (next.scores[player] ?? 0) === topScore
    );
    const winner = survivors.length === 1 ? survivors[0]! : null;
    return {
      ...next,
      activePlayer: winner === null ? survivors[0]! : nextActivePlayer,
      completedRounds,
      finishTriggered,
      inProgress: winner === null,
      lastCardPlayed: cardPlayed,
      lastMove: move,
      lastRoll: finalRoll,
      shootoutPlayers: winner === null ? survivors : null,
      shootoutTurnsPlayed: 0,
      winner,
    };
  }

  return {
    ...next,
    activePlayer: nextActivePlayer,
    completedRounds,
    finishTriggered,
    inProgress: true,
    lastCardPlayed: cardPlayed,
    lastMove: move,
    lastRoll: finalRoll,
    shootoutTurnsPlayed: roundFinished ? 0 : nextShootoutTurnsPlayed,
  };
}

export function rollDie(randomValue = Math.random()): number {
  return Math.floor(randomValue * 6) + 1;
}

export function simulateGame(setup: SetupState, random = Math.random): SimulationResult {
  let state = { ...createInitialState(setup), inProgress: true };
  const turns: SimulationTurn[] = [];

  while (state.inProgress && turns.length < 2000) {
    const player = state.activePlayer;
    const momentumBefore = state.momentum[player] ?? INITIAL_MOMENTUM;
    const roll = rollDie(random());
    state = resolveTurn(state, roll, random);

    turns.push({
      cardPlayed: state.lastCardPlayed,
      move: state.lastMove ?? 0,
      momentumAfter: state.momentum[player] ?? 0,
      momentumBefore,
      player,
      roll: state.lastRoll ?? roll,
      scoresAfterTurn: [...state.scores],
      turn: turns.length + 1,
    });
  }

  return { finalState: state, turns };
}
