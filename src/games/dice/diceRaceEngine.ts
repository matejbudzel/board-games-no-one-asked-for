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
  shootoutPlayers: number[] | null;
  shootoutTurnsPlayed: number;
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
    shootoutPlayers: null,
    shootoutTurnsPlayed: 0,
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

  const turnPlayers =
    current.shootoutPlayers ?? Array.from({ length: current.setup.players }, (_, index) => index);
  const activePlayerIndex = turnPlayers.indexOf(activePlayer);
  const nextPlayerIndex = (activePlayerIndex + 1) % turnPlayers.length;
  const nextActivePlayer = turnPlayers[nextPlayerIndex] ?? 0;
  const nextShootoutTurnsPlayed = current.shootoutTurnsPlayed + 1;
  const roundFinished = nextShootoutTurnsPlayed >= turnPlayers.length;
  const completedRounds = current.completedRounds + (roundFinished ? 1 : 0);

  const reachedLength = scores.some((score) => score >= current.setup.goalValue);
  const finishTriggered =
    current.setup.goal === 'length' ? current.finishTriggered || reachedLength : true;

  const reachedLimit =
    roundFinished &&
    ((current.setup.goal === 'rounds' && completedRounds >= current.setup.goalValue) ||
      (current.setup.goal === 'length' && finishTriggered));

  if (current.shootoutPlayers === null && reachedLimit) {
    const leaders = getLeaders(scores);
    const winner = leaders.length === 1 ? leaders[0]! : null;

    return {
      ...current,
      activePlayer: winner === null ? leaders[0]! : nextActivePlayer,
      completedRounds,
      finishTriggered,
      inProgress: winner === null,
      lastMove: nextMomentum,
      lastRoll: roll,
      momentum,
      scores,
      shootoutPlayers: winner === null ? leaders : null,
      shootoutTurnsPlayed: 0,
      winner,
    };
  }

  if (current.shootoutPlayers !== null && roundFinished) {
    const topScore = Math.max(...current.shootoutPlayers.map((player) => scores[player] ?? 0));
    const survivors = current.shootoutPlayers.filter(
      (player) => (scores[player] ?? 0) === topScore
    );
    const winner = survivors.length === 1 ? survivors[0]! : null;

    return {
      ...current,
      activePlayer: winner === null ? survivors[0]! : nextActivePlayer,
      completedRounds,
      finishTriggered,
      inProgress: winner === null,
      lastMove: nextMomentum,
      lastRoll: roll,
      momentum,
      scores,
      shootoutPlayers: winner === null ? survivors : null,
      shootoutTurnsPlayed: 0,
      winner,
    };
  }

  return {
    ...current,
    activePlayer: nextActivePlayer,
    completedRounds,
    finishTriggered,
    inProgress: true,
    lastMove: nextMomentum,
    lastRoll: roll,
    momentum,
    scores,
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
