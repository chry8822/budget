// src/theme/index.ts
import colors from './colors';
import spacing from './spacing';
import typography from './typography';

const theme = {
  colors,
  spacing,
  typography,
};

export type AppTheme = typeof theme;

export default theme;
