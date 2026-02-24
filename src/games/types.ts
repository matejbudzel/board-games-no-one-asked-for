import type { JSX } from 'react';

export type GameDefinition = {
  id: string;
  name: string;
  render: () => JSX.Element;
};
