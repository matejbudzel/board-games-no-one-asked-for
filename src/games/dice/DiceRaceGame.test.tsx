import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DiceRaceGame } from './DiceRaceGame';

describe('DiceRaceGame', () => {
  it('shows the last die roll value after rolling', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<DiceRaceGame />);

    fireEvent.click(screen.getByRole('button', { name: /start race/i }));

    expect(screen.getByText(/last roll:/i)).toHaveTextContent('Last roll: —');

    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));

    expect(screen.getByText(/last roll:/i)).toHaveTextContent('Last roll: 4');
  });

  it('waits for a full round before declaring a winner on race length goal', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9);

    render(<DiceRaceGame />);

    fireEvent.change(screen.getByRole('combobox', { name: /players/i }), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /goal type/i }), {
      target: { value: 'length' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /goal value/i }), {
      target: { value: '3' },
    });
    fireEvent.click(screen.getByRole('button', { name: /start race/i }));

    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));

    expect(screen.queryByText(/winner:/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));

    expect(screen.getByText('Winner: Player 2')).toBeInTheDocument();
  });
});
