import React, { ReactNode, createContext, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { darkTheme, lightTheme } from './theme';
import { muiLightTheme, muiDarkTheme } from './mui-theme';

export const ThemeContext = createContext({
  isDarkTheme: true,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  toggleTheme: () => {},
});

interface ThemeProviderProps {
  children?: ReactNode;
}

export default ({ children }: ThemeProviderProps) => {
  const [dark, setDark] = useState(false);

  const toggleTheme = () => {
    setDark(!dark);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkTheme: dark,
        toggleTheme,
      }}
    >
      <MuiThemeProvider theme={dark ? muiDarkTheme : muiLightTheme}>
        <CssBaseline />
        <ThemeProvider theme={dark ? darkTheme : lightTheme}>{children}</ThemeProvider>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
