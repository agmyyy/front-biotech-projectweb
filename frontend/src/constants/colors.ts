export const colors = {
  aside: '#f6f5f1',
  main: '#fefefe',
  button: '#19430d',
  mainText: '#daeee5',
  mainRate: '#bdddcb',
  li: '#e8e0df',
  green1: '#2c4235',
  green2: '#295b58',
  hover: '#d8d6ce',
} as const;

export type ColorKeys = keyof typeof colors;