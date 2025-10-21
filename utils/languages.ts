export interface Dialect {
  id: string;
  name: string;
}

export interface Language {
  id: string;
  name: string;
  dialects: Dialect[];
}

export const languages: Language[] = [
  {
    id: 'english',
    name: 'English',
    dialects: [
      { id: 'american', name: 'American' },
      { id: 'british', name: 'British' },
      { id: 'australian', name: 'Australian' },
    ],
  },
  {
    id: 'arabic',
    name: 'Arabic',
    dialects: [
      { id: 'egyptian', name: 'Egyptian' },
      { id: 'saudi', name: 'Saudi' },
      { id: 'iraqi', name: 'Iraqi' },
    ],
  },
  {
    id: 'farsi',
    name: 'Farsi (Persian)',
    dialects: [
      { id: 'iranian', name: 'Iranian' },
    ],
  },
];
