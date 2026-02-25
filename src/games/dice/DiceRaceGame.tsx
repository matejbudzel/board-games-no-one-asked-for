import { useMemo, useState } from 'react';
import { DiceRaceSimulationPanel } from './DiceRaceSimulationPanel';
import {
  createInitialState,
  DEFAULT_CARD_RULES,
  DEFAULT_MOMENTUM_EFFECTS,
  GOAL_DEFAULTS,
  getLeaders,
  resolveTurn,
  rollDie,
  type CardCopies,
  type MomentumEffect,
  type RaceGoal,
  type RaceState,
  type SetupState,
} from './diceRaceEngine';

const PLAYER_OPTIONS = [2, 3, 4, 5, 6];
const GOAL_OPTIONS: Record<RaceGoal, number[]> = {
  length: Array.from({ length: 100 }, (_, index) => index + 1),
  rounds: Array.from({ length: 30 }, (_, index) => index + 1),
};
const MOMENTUM_OPTIONS: MomentumEffect[] = [-1, 0, 1, 2, 3];
const CARD_COPY_OPTIONS: CardCopies[] = [0, 1, 2];

export function DiceRaceGame() {
  const [state, setState] = useState<RaceState>(() =>
    createInitialState({
      cards: DEFAULT_CARD_RULES,
      goal: 'rounds',
      goalValue: GOAL_DEFAULTS.rounds,
      momentumEffects: DEFAULT_MOMENTUM_EFFECTS,
      players: 3,
    })
  );

  const leaderText = useMemo(() => {
    const leaders = getLeaders(state.scores);
    return leaders.length === 1
      ? `Player ${leaders[0]! + 1}`
      : leaders.map((playerIndex) => `Player ${playerIndex + 1}`).join(', ');
  }, [state.scores]);

  const updateSetup = (nextSetup: SetupState) => setState(createInitialState(nextSetup));

  return (
    <>
      <section className="card" aria-label="Dice race game">
        <h2>Dice Race (Turn Simulator)</h2>
        <p>Roll, optionally use cards, adjust momentum (0-5), then move.</p>
        <p>
          Players:
          <select
            aria-label="Players"
            disabled={state.inProgress}
            onChange={(event) =>
              updateSetup({ ...state.setup, players: Number(event.target.value) || 3 })
            }
            value={state.setup.players}
          >
            {PLAYER_OPTIONS.map((playerCount) => (
              <option key={playerCount} value={playerCount}>
                {playerCount}
              </option>
            ))}
          </select>
        </p>
        <p>
          Goal:
          <select
            aria-label="Goal type"
            disabled={state.inProgress}
            onChange={(event) => {
              const goal = event.target.value as RaceGoal;
              updateSetup({ ...state.setup, goal, goalValue: GOAL_DEFAULTS[goal] });
            }}
            value={state.setup.goal}
          >
            <option value="rounds">Number of rounds</option>
            <option value="length">Race length (target score)</option>
          </select>
          <select
            aria-label="Goal value"
            disabled={state.inProgress}
            onChange={(event) =>
              updateSetup({ ...state.setup, goalValue: Number(event.target.value) || 1 })
            }
            value={state.setup.goalValue}
          >
            {GOAL_OPTIONS[state.setup.goal].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </p>
        <fieldset disabled={state.inProgress}>
          <legend>Cards setup</legend>
          <label>
            Copies per card
            <select
              aria-label="Copies per card"
              onChange={(event) =>
                updateSetup({
                  ...state.setup,
                  cards: {
                    ...state.setup.cards,
                    copiesPerCard: Number(event.target.value) as CardCopies,
                  },
                })
              }
              value={state.setup.cards.copiesPerCard}
            >
              {CARD_COPY_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Burst move
            <input
              aria-label="Burst move"
              min={1}
              onChange={(event) =>
                updateSetup({
                  ...state.setup,
                  cards: { ...state.setup.cards, burstMove: Number(event.target.value) || 1 },
                })
              }
              type="number"
              value={state.setup.cards.burstMove}
            />
          </label>
          <label>
            Stumble detract
            <input
              aria-label="Stumble detract"
              min={1}
              onChange={(event) =>
                updateSetup({
                  ...state.setup,
                  cards: { ...state.setup.cards, stumbleDetract: Number(event.target.value) || 1 },
                })
              }
              type="number"
              value={state.setup.cards.stumbleDetract}
            />
          </label>
          <label>
            Deep breath boost
            <input
              aria-label="Deep breath boost"
              min={1}
              onChange={(event) =>
                updateSetup({
                  ...state.setup,
                  cards: { ...state.setup.cards, deepBreathBoost: Number(event.target.value) || 1 },
                })
              }
              type="number"
              value={state.setup.cards.deepBreathBoost}
            />
          </label>
        </fieldset>
        <fieldset disabled={state.inProgress}>
          <legend>Momentum effects by die face</legend>
          {Array.from({ length: 6 }, (_, index) => index + 1).map((face) => (
            <label key={face}>
              {face}
              <select
                aria-label={`Face ${face} momentum effect`}
                onChange={(event) =>
                  updateSetup({
                    ...state.setup,
                    momentumEffects: {
                      ...state.setup.momentumEffects,
                      [face]: Number(event.target.value) as MomentumEffect,
                    },
                  })
                }
                value={state.setup.momentumEffects[face]}
              >
                {MOMENTUM_OPTIONS.map((effect) => (
                  <option key={effect} value={effect}>
                    {effect}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </fieldset>
        {!state.inProgress && state.winner === null ? (
          <button
            onClick={() => setState((current) => ({ ...current, inProgress: true }))}
            type="button"
          >
            Start race
          </button>
        ) : null}
        <p>
          Current turn: <strong>Player {state.activePlayer + 1}</strong>
        </p>
        <p>
          Completed rounds: <strong>{state.completedRounds}</strong>
        </p>
        <button
          disabled={!state.inProgress}
          onClick={() => setState((current) => resolveTurn(current, rollDie()))}
          type="button"
        >
          Roll D6
        </button>
        <button
          onClick={() => setState((current) => createInitialState(current.setup))}
          type="button"
        >
          Reset
        </button>
        <ul>
          {state.scores.map((score, index) => {
            const cards = state.playerCards[index] ?? {
              burst: 0,
              deepBreath: 0,
              hailMary: 0,
              secondChance: 0,
              stumble: 0,
            };
            return (
              <li key={index}>
                Player {index + 1}: score {score}, momentum {state.momentum[index]}, cards
                B/H/S/2C/DB {cards.burst}/{cards.hailMary}/{cards.stumble}/{cards.secondChance}/
                {cards.deepBreath}
              </li>
            );
          })}
        </ul>
        <p>
          Last roll: <strong>{state.lastRoll ?? '—'}</strong>
        </p>
        <p>
          Last move: <strong>{state.lastMove ?? '—'}</strong>
        </p>
        <p>
          Last card: <strong>{state.lastCardPlayed ?? '—'}</strong>
        </p>
        <p>Leader: {leaderText}</p>
        {state.shootoutPlayers ? (
          <p>Shootout: Players {state.shootoutPlayers.map((player) => player + 1).join(', ')}</p>
        ) : null}
        {state.winner !== null ? <p>Winner: Player {state.winner + 1}</p> : null}
      </section>
      <DiceRaceSimulationPanel setup={state.setup} />
    </>
  );
}
