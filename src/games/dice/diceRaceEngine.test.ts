import { describe, expect, it } from 'vitest';
import {
  createInitialState,
  DEFAULT_CARD_RULES,
  DEFAULT_MOMENTUM_EFFECTS,
  GOAL_DEFAULTS,
  resolveTurn,
  simulateGame,
  type SetupState,
} from './diceRaceEngine';

const baseSetup: SetupState = {
  cards: { ...DEFAULT_CARD_RULES, copiesPerCard: 0 },
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

  it('uses burst on a roll of 6 and resets momentum', () => {
    const setup: SetupState = {
      ...baseSetup,
      cards: { ...DEFAULT_CARD_RULES, burstMove: 8, copiesPerCard: 1 },
      players: 2,
    };
    const state = { ...createInitialState(setup), inProgress: true };

    const next = resolveTurn(state, 6);

    expect(next.scores[0]).toBe(8);
    expect(next.momentum[0]).toBe(0);
    expect(next.lastCardPlayed).toContain('burst');
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
