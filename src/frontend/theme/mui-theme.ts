import { createTheme, ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from './theme';

// Create MUI theme based on your existing theme colors
export const createMuiTheme = (isDark: boolean) => {
  const baseTheme = isDark ? darkTheme : lightTheme;

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      primary: {
        main: baseTheme.colors.emerald, // #179C65
        light: baseTheme.colors.localLight, // #20B574
        dark: baseTheme.colors.hunter, // #106F48
        contrastText: '#FFFFFF',
      },
      secondary: {
        main: baseTheme.colors.notice, // #FDB366
        light: '#FDC483',
        dark: '#E09A4D',
        contrastText: baseTheme.colors.core,
      },
      background: {
        default: isDark ? '#0A1B1F' : baseTheme.colors.background,
        paper: isDark ? baseTheme.colors.core : '#FFFFFF', // #022C33 for dark
      },
      text: {
        primary: isDark ? baseTheme.colors.balance : '#1A1A1A',
        secondary: baseTheme.colors.textSecondary, // #8B9199
      },
      divider: isDark ? baseTheme.colors.hunter : baseTheme.colors.border,
      // Custom colors for your app
      info: {
        main: baseTheme.colors.remote, // Blue for remote inference
        light: baseTheme.colors.remoteLight,
        dark: '#3A7BC8',
      },
      success: {
        main: baseTheme.colors.local, // Green for local inference
        light: baseTheme.colors.localLight,
        dark: baseTheme.colors.hunter,
      },
    },
    typography: {
      fontFamily: '"Roboto Regular", "Roboto", sans-serif',
      h1: {
        fontFamily: '"Montserrat Bold", "Montserrat", sans-serif',
        fontSize: '2.5rem',
        fontWeight: 700,
      },
      h2: {
        fontFamily: '"Montserrat Bold", "Montserrat", sans-serif',
        fontSize: '2rem',
        fontWeight: 600,
      },
      h3: {
        fontFamily: '"Montserrat SemiBold", "Montserrat", sans-serif',
        fontSize: '1.5rem',
        fontWeight: 600,
      },
      h4: {
        fontFamily: '"Montserrat SemiBold", "Montserrat", sans-serif',
        fontSize: '1.25rem',
        fontWeight: 500,
      },
      h5: {
        fontFamily: '"Roboto Bold", "Roboto", sans-serif',
        fontSize: '1.125rem',
        fontWeight: 500,
      },
      h6: {
        fontFamily: '"Roboto Bold", "Roboto", sans-serif',
        fontSize: '1rem',
        fontWeight: 500,
      },
      body1: {
        fontFamily: '"Roboto Regular", "Roboto", sans-serif',
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontFamily: '"Roboto Regular", "Roboto", sans-serif',
        fontSize: '0.875rem',
        lineHeight: 1.43,
      },
      button: {
        fontFamily: '"Roboto Bold", "Roboto", sans-serif',
        fontSize: '0.875rem',
        fontWeight: 500,
        textTransform: 'none' as const, // Don't uppercase buttons
      },
    },
    shape: {
      borderRadius: 8, // Consistent with modern UI
    },
    components: {
      // Customize MUI components to match your app style
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: '10px 20px',
            fontWeight: 500,
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
          },
          contained: {
            backgroundColor: baseTheme.colors.emerald,
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: baseTheme.colors.hunter,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            backgroundColor: isDark ? baseTheme.colors.core : '#FFFFFF',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontFamily: '"Montserrat Bold", "Montserrat", sans-serif',
            fontSize: '1.25rem',
            fontWeight: 600,
            color: isDark ? baseTheme.colors.balance : baseTheme.colors.core,
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 5,
            height: 10,
            backgroundColor: isDark ? baseTheme.colors.hunter : '#E1E5E9',
          },
          bar: {
            borderRadius: 5,
            backgroundColor: baseTheme.colors.emerald,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.08)',
            backgroundColor: isDark ? baseTheme.colors.core : '#FFFFFF',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? baseTheme.colors.core : baseTheme.colors.emerald,
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? baseTheme.colors.hunter : baseTheme.colors.border}`,
          },
        },
      },
    },
  });
};

// Export both light and dark themes
export const muiLightTheme = createMuiTheme(false);
export const muiDarkTheme = createMuiTheme(true);
