import { useMemo, useState } from 'react';

type DiceRaceState = {
  activePlayer: number;
  lastRoll: number | null;
  scores: number[];
};

const PLAYER_COUNT = 3;

function createInitialState(): DiceRaceState {
  return {
    activePlayer: 0,
    lastRoll: null,
    scores: Array.from({ length: PLAYER_COUNT }, () => 0),
  };
}

export function DiceRaceGame() {
  const [state, setState] = useState<DiceRaceState>(() => createInitialState());
  const lastRoundLeader = useMemo(() => {
    let leaderIndex = 0;
    let leaderScore = state.scores[0] ?? 0;

    for (const [index, score] of state.scores.entries()) {
      if (score > leaderScore) {
        leaderIndex = index;
        leaderScore = score;
      }
    }

    return leaderIndex;
  }, [state.scores]);

  const rollDice = () => {
    const roll = Math.floor(Math.random() * 6) + 1;
    setState((current) => {
      const scores = [...current.scores];
      scores[current.activePlayer] = (scores[current.activePlayer] ?? 0) + roll;
      return {
        lastRoll: roll,
        scores,
        activePlayer: (current.activePlayer + 1) % PLAYER_COUNT,
      };
    });
  };

  return (
    <section className="card" aria-label="Dice race game">
      <h2>Dice Race (Turn Simulator)</h2>
      <p>Roll once per turn. Highest score wins after any amount of rounds.</p>
      <p>
        Current turn: <strong>Player {state.activePlayer + 1}</strong>
      </p>
      <button onClick={rollDice} type="button">
        Roll D6
      </button>
      <button
        onClick={() => {
          setState(createInitialState());
        }}
        type="button"
      >
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
      <p>Leader: Player {lastRoundLeader + 1}</p>
    </section>
  );
}
