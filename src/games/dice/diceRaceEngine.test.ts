import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  DEFAULT_MOMENTUM_EFFECTS,
  GOAL_DEFAULTS,
  resolveTurn,
  simulateGame,
  type SetupState,
} from './diceRaceEngine';

const baseSetup: SetupState = {
  goal: 'rounds',
  goalValue: GOAL_DEFAULTS.rounds,
  momentumEffects: DEFAULT_MOMENTUM_EFFECTS,
  players: 3,
};

describe('diceRaceEngine', () => {
  it('moves by adjusted momentum (including zero move)', () => {
    const state = { ...createInitialState(baseSetup), inProgress: true };

    const next = resolveTurn(state, 1);

    expect(next.lastRoll).toBe(1);
    expect(next.lastMove).toBe(0);
    expect(next.scores[0]).toBe(0);
    expect(next.momentum[0]).toBe(0);
  });

  it('simulates turn history and winner for deterministic rolls', () => {
    const setup: SetupState = {
      ...baseSetup,
      goalValue: 1,
      players: 2,
    };

    const values = [0.9, 0];
    let index = 0;
    const random = () => {
      const value = values[index] ?? 0;
      index += 1;
      return value;
    };

    const result = simulateGame(setup, random);

    expect(result.turns).toHaveLength(2);
    expect(result.turns[0]).toMatchObject({ player: 0, roll: 6, momentumAfter: 2, move: 2 });
    expect(result.turns[1]).toMatchObject({ player: 1, roll: 1, momentumAfter: 0, move: 0 });
    expect(result.finalState.winner).toBe(0);
  });
});
