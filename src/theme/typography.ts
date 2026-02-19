import { TextStyle } from 'react-native';
import colors from './colors';

export type TypographyScale = {
  sizes: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    display: number;
  };
  title: TextStyle;
  subtitle: TextStyle;
  body: TextStyle;
  caption: TextStyle;
};

const sizes = {
  xs: 13,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 30,
  display: 34,
};

type Colors = { text: string; textMuted: string };

export function getTypography(c: Colors): TypographyScale {
  return {
    sizes,
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
      color: c.text,
    },
    subtitle: {
      fontSize: 18,
      color: c.textMuted,
    },
    body: {
      fontSize: 16,
      color: c.text,
    },
    caption: {
      fontSize: 13,
      color: c.textMuted,
    },
  };
}

const typography = getTypography(colors);

export default typography;
  