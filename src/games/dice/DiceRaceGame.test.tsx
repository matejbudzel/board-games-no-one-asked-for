import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DiceRaceGame } from './DiceRaceGame';

describe('DiceRaceGame', () => {
  it('shows the last die roll value and momentum-based move after rolling', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<DiceRaceGame />);

    fireEvent.click(screen.getByRole('button', { name: /start race/i }));

    expect(screen.getByText(/last roll:/i)).toHaveTextContent('Last roll: —');
    expect(screen.getByText(/last move:/i)).toHaveTextContent('Last move: —');

    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));

    expect(screen.getByText(/last roll:/i)).toHaveTextContent('Last roll: 4');
    expect(screen.getByText(/last move:/i)).toHaveTextContent('Last move: 1');
    expect(screen.getByText('Player 1: score 1, momentum 1')).toBeInTheDocument();
  });

  it('waits for a full round before declaring a winner on race length goal', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9)
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

    expect(screen.queryByText(/winner:/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));

    expect(screen.getByText('Winner: Player 1')).toBeInTheDocument();
  });

  it('allows customizing die-face momentum effects', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<DiceRaceGame />);

    fireEvent.change(screen.getByRole('combobox', { name: /face 4 momentum effect/i }), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /start race/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));

    expect(screen.getByText(/last move:/i)).toHaveTextContent('Last move: 2');
    expect(screen.getByText('Player 1: score 2, momentum 2')).toBeInTheDocument();
  });
});
