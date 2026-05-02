import '@mui/material/Typography';

declare module '@mui/material/Typography' {
  interface TypographyOwnProps {
    fontWeight?: number | string;
    lineHeight?: number | string;
    fontSize?: number | string;
    fontFamily?: string;
    letterSpacing?: number | string;
    display?: string;
    textAlign?: string;
  }
}
