export type RaceGoal = 'rounds' | 'length';
export type MomentumEffect = -1 | 0 | 1 | 2 | 3;

export type SetupState = {
  goal: RaceGoal;
  goalValue: number;
  momentumEffects: Record<number, MomentumEffect>;
  players: number;
};

export type RaceState = {
  activePlayer: number;
  completedRounds: number;
  finishTriggered: boolean;
  inProgress: boolean;
  lastMove: number | null;
  lastRoll: number | null;
  momentum: number[];
  scores: number[];
  setup: SetupState;
  winner: number | null;
};

export type SimulationTurn = {
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
export const DEFAULT_MOMENTUM_EFFECTS: Record<number, MomentumEffect> = {
  1: -1,
  2: 0,
  3: 0,
  4: 0,
  5: 1,
  6: 1,
};

export function createInitialState(setup: SetupState): RaceState {
  return {
    activePlayer: 0,
    completedRounds: 0,
    finishTriggered: false,
    inProgress: false,
    lastMove: null,
    lastRoll: null,
    momentum: Array.from({ length: setup.players }, () => INITIAL_MOMENTUM),
    scores: Array.from({ length: setup.players }, () => 0),
    setup,
    winner: null,
  };
}

export function getLeaders(scores: number[]): number[] {
  const topScore = Math.max(...scores);
  return scores.flatMap((score, index) => (score === topScore ? index : []));
}

const clampMomentum = (value: number) => Math.min(MOMENTUM_MAX, Math.max(MOMENTUM_MIN, value));

export function resolveTurn(current: RaceState, roll: number): RaceState {
  if (!current.inProgress || current.winner !== null) return current;

  const scores = [...current.scores];
  const momentum = [...current.momentum];
  const activePlayer = current.activePlayer;
  const momentumDelta = current.setup.momentumEffects[roll] ?? 0;
  const momentumBefore = momentum[activePlayer] ?? INITIAL_MOMENTUM;
  const nextMomentum = clampMomentum(momentumBefore + momentumDelta);
  momentum[activePlayer] = nextMomentum;
  scores[activePlayer] = (scores[activePlayer] ?? 0) + nextMomentum;

  const nextActivePlayer = (activePlayer + 1) % current.setup.players;
  const roundFinished = nextActivePlayer === 0;
  const completedRounds = current.completedRounds + (roundFinished ? 1 : 0);
  const reachedLength = scores.some((score) => score >= current.setup.goalValue);
  const finishTriggered =
    current.setup.goal === 'length' ? current.finishTriggered || reachedLength : true;

  const shouldCheckWinner =
    roundFinished &&
    ((current.setup.goal === 'rounds' && completedRounds >= current.setup.goalValue) ||
      (current.setup.goal === 'length' && finishTriggered));

  const leaders = shouldCheckWinner ? getLeaders(scores) : [];
  const winner = leaders.length === 1 ? leaders[0]! : null;

  return {
    ...current,
    activePlayer: nextActivePlayer,
    completedRounds,
    finishTriggered,
    inProgress: winner === null,
    lastMove: nextMomentum,
    lastRoll: roll,
    momentum,
    scores,
    winner,
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
    state = resolveTurn(state, roll);

    turns.push({
      move: state.lastMove ?? 0,
      momentumAfter: state.momentum[player] ?? 0,
      momentumBefore,
      player,
      roll,
      scoresAfterTurn: [...state.scores],
      turn: turns.length + 1,
    });
  }

  return { finalState: state, turns };
}
