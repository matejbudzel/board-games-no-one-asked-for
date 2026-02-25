import { useMemo, useState } from 'react';
import { DiceRaceSimulationPanel } from './DiceRaceSimulationPanel';
import {
  createInitialState,
  DEFAULT_MOMENTUM_EFFECTS,
  GOAL_DEFAULTS,
  getLeaders,
  resolveTurn,
  rollDie,
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

export function DiceRaceGame() {
  const [state, setState] = useState<RaceState>(() =>
    createInitialState({
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

  const updateMomentumEffect = (face: number, effect: MomentumEffect) => {
    updateSetup({
      ...state.setup,
      momentumEffects: { ...state.setup.momentumEffects, [face]: effect },
    });
  };

  return (
    <>
      <section className="card" aria-label="Dice race game">
        <h2>Dice Race (Turn Simulator)</h2>
        <p>Roll, adjust momentum (0-5), then move by current momentum.</p>
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
          <legend>Momentum effects by die face</legend>
          {Array.from({ length: 6 }, (_, index) => index + 1).map((face) => (
            <label key={face}>
              {face}
              <select
                aria-label={`Face ${face} momentum effect`}
                onChange={(event) =>
                  updateMomentumEffect(face, Number(event.target.value) as MomentumEffect)
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
          {state.scores.map((score, index) => (
            <li key={index}>
              Player {index + 1}: score {score}, momentum {state.momentum[index]}
            </li>
          ))}
        </ul>
        <p>
          Last roll: <strong>{state.lastRoll ?? '—'}</strong>
        </p>
        <p>
          Last move: <strong>{state.lastMove ?? '—'}</strong>
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
