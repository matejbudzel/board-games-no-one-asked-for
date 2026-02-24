import { DiceRaceGame } from './dice/DiceRaceGame';
import { MemoPairsGame } from './memo/MemoPairsGame';
import type { GameDefinition } from './types';

export const gameRegistry: GameDefinition[] = [
  {
    id: 'dice-race',
    name: 'Dice Race',
    render: () => <DiceRaceGame />
  },
  {
    id: 'memo-pairs',
    name: 'Memo Pairs',
    render: () => <MemoPairsGame />
  }
];
