export interface ITheme {
  colors: {
    core: string;
    emerald: string;
    hunter: string;
    notice: string;
    balance: string;
    // Inference mode colors
    local: string;
    localLight: string;
    remote: string;
    remoteLight: string;
    // UI colors
    primary: string;
    textSecondary: string;
    background: string;
    border: string;
  };
  layout: {
    topBarHeight: number;
    bottomBarHeight: number;
  };
  fonts: {
    family: {
      primary: {
        regular: string;
        bold: string;
      };
      secondary: {
        regular: string;
        bold: string;
      };
    };
    size: {
      smallest: string;
      small: string;
      medium: string;
      large: string;
    };
  };
}

const common = {
  colors: {
    core: '#022C33',
    emerald: '#179C65',
    hunter: '#106F48',
    notice: '#FDB366',
    balance: '#FFFFFF',
    // Inference mode colors
    local: '#179C65', // Green for local (private)
    localLight: '#20B574', // Lighter green
    remote: '#4A90E2', // Blue for remote (cloud)
    remoteLight: '#5BA2F0', // Lighter blue
    // UI colors
    primary: '#179C65',
    textSecondary: '#8B9199',
    background: '#FFFFFF',
    border: '#E1E5E9',
  },
  layout: {
    topBarHeight: 130,
    bottomBarHeight: 130,
  },
  fonts: {
    size: {
      smallest: '12px',
      small: '14px',
      medium: '20px',
      large: '32px',
    },
  },
};

export const lightTheme: ITheme = {
  layout: common.layout,
  fonts: {
    ...common.fonts,
    family: {
      primary: {
        regular: 'Roboto Regular',
        bold: 'Roboto Bold',
      },
      secondary: {
        regular: 'Montserrat Regular',
        bold: 'Montserrat Bold',
      },
    },
  },
  colors: { ...common.colors },
};

export const darkTheme: ITheme = {
  layout: common.layout,
  fonts: {
    ...common.fonts,
    family: {
      primary: {
        regular: 'Roboto Regular',
        bold: 'Roboto Bold',
      },
      secondary: {
        regular: 'Montserrat Regular',
        bold: 'Montserrat Bold',
      },
    },
  },
  colors: { ...common.colors },
};
