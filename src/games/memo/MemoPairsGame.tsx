import { useMemo, useState } from 'react';

type Card = { id: number; symbol: string; matched: boolean };

const SYMBOLS = ['🍎', '🦊', '🌙', '⚽'];

function shuffledDeck(): Card[] {
  const cards = SYMBOLS.flatMap((symbol, index) => [
    { id: index * 2, symbol, matched: false },
    { id: index * 2 + 1, symbol, matched: false }
  ]);

  return cards.sort(() => Math.random() - 0.5);
}

export function MemoPairsGame() {
  const [deck, setDeck] = useState<Card[]>(() => shuffledDeck());
  const [openedIds, setOpenedIds] = useState<number[]>([]);

  const attempts = useMemo(() => Math.floor(openedIds.length / 2), [openedIds.length]);

  const reveal = (card: Card) => {
    if (card.matched || openedIds.includes(card.id) || openedIds.length >= 2) return;

    const nextOpened = [...openedIds, card.id];
    setOpenedIds(nextOpened);

    if (nextOpened.length < 2) return;

    const [firstId, secondId] = nextOpened;
    const first = deck.find((item) => item.id === firstId);
    const second = deck.find((item) => item.id === secondId);

    if (first && second && first.symbol === second.symbol) {
      setDeck((current) =>
        current.map((item) =>
          item.id === first.id || item.id === second.id ? { ...item, matched: true } : item
        )
      );
      setOpenedIds([]);
      return;
    }

    setTimeout(() => setOpenedIds([]), 700);
  };

  return (
    <section className="card" aria-label="Memo pairs game">
      <h2>Memo Pairs</h2>
      <p>Tap 2 cards each turn. Matching symbols stay visible.</p>
      <p>Attempts this round: {attempts}</p>
      <div className="memo-grid">
        {deck.map((card) => {
          const open = card.matched || openedIds.includes(card.id);
          return (
            <button
              key={card.id}
              className="memo-tile"
              onClick={() => reveal(card)}
              type="button"
            >
              {open ? card.symbol : '?'}
            </button>
          );
        })}
      </div>
      <button
        onClick={() => {
          setDeck(shuffledDeck());
          setOpenedIds([]);
        }}
        type="button"
      >
        Shuffle New Round
      </button>
    </section>
  );
}
