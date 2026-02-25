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

  it('starts a shootout with only tied leaders once round limit is reached', () => {
    const setup: SetupState = {
      ...baseSetup,
      goalValue: 1,
      players: 3,
    };

    let state = { ...createInitialState(setup), inProgress: true };
    state = resolveTurn(state, 1);
    state = resolveTurn(state, 6);
    state = resolveTurn(state, 6);

    expect(state.scores).toEqual([0, 2, 2]);
    expect(state.shootoutPlayers).toEqual([1, 2]);
    expect(state.activePlayer).toBe(1);
    expect(state.winner).toBeNull();
    expect(state.inProgress).toBe(true);
  });

  it('drops trailing shootout players after each shootout round', () => {
    const setup: SetupState = {
      ...baseSetup,
      goalValue: 1,
      players: 4,
    };

    let state = { ...createInitialState(setup), inProgress: true };
    state.scores = [50, 50, 50, 43];
    state.momentum = [1, 1, 1, 1];
    state.completedRounds = 1;
    state.finishTriggered = true;
    state.shootoutPlayers = [0, 1, 2];
    state.activePlayer = 0;

    state = resolveTurn(state, 4);
    state = resolveTurn(state, 5);
    state = resolveTurn(state, 5);

    expect(state.scores).toEqual([51, 52, 52, 43]);
    expect(state.shootoutPlayers).toEqual([1, 2]);
    expect(state.activePlayer).toBe(1);
    expect(state.winner).toBeNull();
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
