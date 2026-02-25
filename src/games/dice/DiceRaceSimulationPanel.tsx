import { useMemo, useState } from 'react';
import type { SetupState, SimulationResult } from './diceRaceEngine';
import { getLeaders, simulateGame } from './diceRaceEngine';

type DiceRaceSimulationPanelProps = {
  setup: SetupState;
};

function readSimulationCount(rawValue: string): number {
  const value = Number(rawValue);
  if (Number.isNaN(value) || value < 1) return 1;
  return Math.min(200, Math.floor(value));
}

export function DiceRaceSimulationPanel({ setup }: DiceRaceSimulationPanelProps) {
  const [simulationCount, setSimulationCount] = useState('20');
  const [results, setResults] = useState<SimulationResult[]>([]);

  const stats = useMemo(() => {
    if (results.length === 0) return null;

    const winCounts = Array.from({ length: setup.players }, () => 0);
    let totalRounds = 0;
    let totalTurns = 0;
    let closeGames = 0;

    for (const result of results) {
      const { finalState } = result;
      if (finalState.winner !== null) {
        const winner = finalState.winner;
        winCounts[winner] = (winCounts[winner] ?? 0) + 1;
      }
      totalRounds += finalState.completedRounds;
      totalTurns += result.turns.length;

      const sortedScores = [...finalState.scores].sort((a, b) => b - a);
      const margin = (sortedScores[0] ?? 0) - (sortedScores[1] ?? 0);
      if (margin <= 2) closeGames += 1;
    }

    const averageRounds = totalRounds / results.length;
    const averageTurns = totalTurns / results.length;
    const closeRate = (closeGames / results.length) * 100;

    return { averageRounds, averageTurns, closeRate, winCounts };
  }, [results, setup.players]);

  return (
    <section className="card" aria-label="Dice race simulation">
      <h3>Simulation Lab</h3>
      <p>
        Sim players use card heuristics: burst on 6, save deep-breath for high momentum, auto-block
        bad rolls with second chance/hail mary, and usually stumble the current leader.
      </p>
      <p>
        Number of games:
        <input
          aria-label="Number of simulations"
          max={200}
          min={1}
          onChange={(event) => setSimulationCount(event.target.value)}
          type="number"
          value={simulationCount}
        />
      </p>
      <button
        onClick={() => {
          const count = readSimulationCount(simulationCount);
          setResults(Array.from({ length: count }, () => simulateGame(setup)));
        }}
        type="button"
      >
        Run simulations
      </button>

      {stats ? (
        <>
          <h4>Global stats</h4>
          <ul>
            {stats.winCounts.map((wins, index) => (
              <li key={index}>
                Player {index + 1} wins: {wins} ({Math.round((wins / results.length) * 100)}%)
              </li>
            ))}
            <li>Average rounds: {stats.averageRounds.toFixed(2)}</li>
            <li>Average turns: {stats.averageTurns.toFixed(2)}</li>
            <li>Close-finish rate (≤2 score margin): {stats.closeRate.toFixed(1)}%</li>
          </ul>

          <h4>Game runs ({results.length})</h4>
          {results.map((result, gameIndex) => {
            const leaders = getLeaders(result.finalState.scores);
            const leaderText =
              leaders.length === 1
                ? `Winner: Player ${leaders[0]! + 1}`
                : `Draw leaders: ${leaders.map((player) => player + 1).join(', ')}`;

            return (
              <details key={gameIndex}>
                <summary>
                  Game {gameIndex + 1} · {leaderText} · turns {result.turns.length} · rounds{' '}
                  {result.finalState.completedRounds}
                </summary>
                <ul>
                  {result.turns.map((turn) => (
                    <li key={turn.turn}>
                      T{turn.turn}: P{turn.player + 1} rolled {turn.roll}, momentum{' '}
                      {turn.momentumBefore}→{turn.momentumAfter}, moved {turn.move}, card{' '}
                      {turn.cardPlayed ?? '—'}, scores {turn.scoresAfterTurn.join('/')}
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </>
      ) : null}
    </section>
  );
}
