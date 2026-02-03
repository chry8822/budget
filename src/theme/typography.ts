import { TextStyle } from "react-native";
import colors from "./colors";

// src/theme/typography.ts
type TypographyScale = {
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

const typography: TypographyScale = {
    sizes: {
        xs: 13,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 24,
        xxl: 30,
        display: 34,
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 8,
        color: colors.text,
    },
    subtitle: {
        fontSize: 18,
        color: colors.textMuted,
    },
    body: {
        fontSize: 16,
        color: colors.text,
    },
    caption: {
        fontSize: 13,
        color: colors.textMuted,
    },
};


  
export default typography;
  