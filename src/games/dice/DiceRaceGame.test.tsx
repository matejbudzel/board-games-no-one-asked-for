import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { DiceRaceGame } from './DiceRaceGame';

describe('DiceRaceGame', () => {
  it('shows the last die roll value and momentum-based move after rolling', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<DiceRaceGame />);

    fireEvent.change(screen.getByRole('combobox', { name: /copies per card/i }), {
      target: { value: '0' },
    });
    fireEvent.click(screen.getByRole('button', { name: /start race/i }));

    expect(screen.getByText(/last roll:/i)).toHaveTextContent('Last roll: —');
    expect(screen.getByText(/last move:/i)).toHaveTextContent('Last move: —');

    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));

    expect(screen.getByText(/last roll:/i)).toHaveTextContent('Last roll: 4');
    expect(screen.getByText(/last move:/i)).toHaveTextContent('Last move: 1');
    expect(screen.getByText(/last card:/i)).toHaveTextContent('Last card: —');
    expect(screen.getByText(/Player 1: score 1, momentum 1/)).toBeInTheDocument();
  });

  it('waits for a full round before declaring a winner on race length goal', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.9)
      .mockReturnValueOnce(0.9);

    render(<DiceRaceGame />);

    fireEvent.change(screen.getByRole('combobox', { name: /copies per card/i }), {
      target: { value: '0' },
    });
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

    fireEvent.change(screen.getByRole('combobox', { name: /copies per card/i }), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /face 4 momentum effect/i }), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /start race/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));

    expect(screen.getByText(/last move:/i)).toHaveTextContent('Last move: 2');
    expect(screen.getByText(/Player 1: score 2, momentum 2/)).toBeInTheDocument();
  });

  it('supports higher momentum effects and longer race length values', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    render(<DiceRaceGame />);

    fireEvent.change(screen.getByRole('combobox', { name: /copies per card/i }), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /goal type/i }), {
      target: { value: 'length' },
    });

    expect(screen.getByRole('option', { name: '100' })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: /face 4 momentum effect/i }), {
      target: { value: '3' },
    });

    fireEvent.click(screen.getByRole('button', { name: /start race/i }));
    fireEvent.click(screen.getByRole('button', { name: /roll d6/i }));

    expect(screen.getByText(/last move:/i)).toHaveTextContent('Last move: 4');
    expect(screen.getByText(/Player 1: score 4, momentum 4/)).toBeInTheDocument();
  });

  it('runs simulations and shows global stats', () => {
    const randomSpy = vi.spyOn(Math, 'random');
    randomSpy.mockReturnValueOnce(0.9).mockReturnValueOnce(0).mockReturnValue(0.9);

    render(<DiceRaceGame />);

    fireEvent.change(screen.getByRole('combobox', { name: /copies per card/i }), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: /number of simulations/i }), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /players/i }), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByRole('combobox', { name: /goal value/i }), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByRole('button', { name: /run simulations/i }));

    expect(screen.getByText('Global stats')).toBeInTheDocument();
    expect(screen.getByText(/Player 1 wins: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Game 1/i)).toBeInTheDocument();
  });
});
