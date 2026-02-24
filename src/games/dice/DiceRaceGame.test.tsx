import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DiceRaceGame } from './DiceRaceGame';

describe('DiceRaceGame', () => {
  it('shows the last die roll value after rolling', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<DiceRaceGame />);

    expect(screen.getByText(/last roll:/i)).toHaveTextContent('Last roll: —');

    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));

    expect(screen.getByText(/last roll:/i)).toHaveTextContent('Last roll: 4');
  });
});
