import { useEffect, useMemo, useState } from 'react';
import { GameSelector } from './components/GameSelector';
import { gameRegistry } from './games/registry';

const STORAGE_KEY = 'board-games:selected-game';

function getInitialGameId(): string {
  const persisted = localStorage.getItem(STORAGE_KEY);
  const fallback = gameRegistry[0]?.id ?? '';
  return gameRegistry.some((game) => game.id === persisted) ? (persisted ?? fallback) : fallback;
}

export function App() {
  const [gameId, setGameId] = useState<string>(() => getInitialGameId());
  const selectedGame = useMemo(() => gameRegistry.find((game) => game.id === gameId), [gameId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, gameId);
  }, [gameId]);

  return (
    <main className="app-shell">
      <header>
        <h1>Board Games Playground</h1>
        <GameSelector
          gameId={gameId}
          onChange={setGameId}
          options={gameRegistry.map(({ id, name }) => ({ id, name }))}
        />
      </header>
      {selectedGame ? selectedGame.render() : <p>No games available.</p>}
    </main>
  );
}
