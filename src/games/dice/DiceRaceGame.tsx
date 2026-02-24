import { useMemo, useState } from 'react';

type RaceGoal = 'rounds' | 'length';

type SetupState = {
  goal: RaceGoal;
  goalValue: number;
  players: number;
};

type RaceState = {
  activePlayer: number;
  completedRounds: number;
  finishTriggered: boolean;
  inProgress: boolean;
  lastRoll: number | null;
  scores: number[];
  setup: SetupState;
  winner: number | null;
};

const GOAL_DEFAULTS: Record<RaceGoal, number> = {
  rounds: 5,
  length: 20,
};

const PLAYER_OPTIONS = [2, 3, 4, 5, 6];
const GOAL_OPTIONS = Array.from({ length: 30 }, (_, index) => index + 1);

function createInitialState(setup: SetupState): RaceState {
  return {
    activePlayer: 0,
    completedRounds: 0,
    finishTriggered: false,
    inProgress: false,
    lastRoll: null,
    scores: Array.from({ length: setup.players }, () => 0),
    setup,
    winner: null,
  };
}

function getLeaders(scores: number[]): number[] {
  const topScore = Math.max(...scores);
  return scores.flatMap((score, index) => (score === topScore ? index : []));
}

export function DiceRaceGame() {
  const [state, setState] = useState<RaceState>(() =>
    createInitialState({ goal: 'rounds', goalValue: GOAL_DEFAULTS.rounds, players: 3 })
  );

  const leaderText = useMemo(() => {
    const leaders = getLeaders(state.scores);
    return leaders.length === 1
      ? `Player ${leaders[0]! + 1}`
      : leaders.map((playerIndex) => `Player ${playerIndex + 1}`).join(', ');
  }, [state.scores]);

  const updateSetup = (nextSetup: SetupState) => {
    setState(createInitialState(nextSetup));
  };

  const startRace = () => {
    setState((current) => ({ ...current, inProgress: true }));
  };

  const resetRace = () => {
    setState((current) => createInitialState(current.setup));
  };

  const rollDice = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setState((current) => {
      if (!current.inProgress || current.winner !== null) {
        return current;
      }

      const scores = [...current.scores];
      const activePlayer = current.activePlayer;
      scores[activePlayer] = (scores[activePlayer] ?? 0) + roll;

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
        lastRoll: roll,
        scores,
        winner,
      };
    });
  };

  return (
    <section className="card" aria-label="Dice race game">
      <h2>Dice Race (Turn Simulator)</h2>
      <p>Set players and objective, then roll once per turn.</p>
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
          {GOAL_OPTIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </p>
      {!state.inProgress && state.winner === null ? (
        <button onClick={startRace} type="button">
          Start race
        </button>
      ) : null}
      <p>
        Current turn: <strong>Player {state.activePlayer + 1}</strong>
      </p>
      <p>
        Completed rounds: <strong>{state.completedRounds}</strong>
      </p>
      <button disabled={!state.inProgress} onClick={rollDice} type="button">
        Roll D6
      </button>
      <button onClick={resetRace} type="button">
        Reset
      </button>
      <ul>
        {state.scores.map((score, index) => (
          <li key={index}>
            Player {index + 1}: {score}
          </li>
        ))}
      </ul>
      <p>
        Last roll: <strong>{state.lastRoll ?? '—'}</strong>
      </p>
      <p>Leader: {leaderText}</p>
      {state.winner !== null ? <p>Winner: Player {state.winner + 1}</p> : null}
    </section>
  );
}
