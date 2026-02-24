import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';

describe('App', () => {
  it('switches between game modules', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /dice race/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: /game/i }), {
      target: { value: 'memo-pairs' },
    });

    expect(screen.getByRole('heading', { name: /memo pairs/i })).toBeInTheDocument();
  });
});
