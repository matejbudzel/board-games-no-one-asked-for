type GameSelectorProps = {
  gameId: string;
  options: { id: string; name: string }[];
  onChange: (next: string) => void;
};

export function GameSelector({ gameId, options, onChange }: GameSelectorProps) {
  return (
    <label className="selector" htmlFor="game-selector">
      <span>Game:</span>
      <select
        id="game-selector"
        value={gameId}
        onChange={(event) => {
          onChange(event.target.value);
        }}
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
