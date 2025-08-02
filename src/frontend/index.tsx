// libs
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

// components
import Main from './components/layout/main';
import AppInit from './components/layout/app-init';
// import ChooseDirectoryModalComponent from './components/modals/choose-directory-modal';

// providers
import ThemeProvider from './theme/theme-provider';
import { AIMessagesProvider } from './contexts';
// import { MetaMaskProvider } from '@metamask/sdk-react';

// modals
// import QrCodeModal from './components/modals/qr-code-modal';

// styles
import GlobalStyle from './theme/index';

// constants
// import { LOGO_METAMASK_BASE64 } from './constants';

// utils
// import { updateQrCode } from './utils/utils';

// events
// import { IpcChannel } from '../events';

// root
const rootElement = document.querySelector('#root') as Element;
const root = createRoot(rootElement);

const AppRoot = () => {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    handleOllamaInit();
  }, []);

  const handleOllamaInit = async () => {
    const ollamaInit = await window.backendBridge.ollama.init();

    if (ollamaInit) {
      // Try to get the last used local model first, fallback to orca-mini:latest
      let modelToInit = 'orca-mini:latest';
      try {
        const lastUsedModel = await window.backendBridge.ollama.getLastUsedLocalModel();
        if (lastUsedModel && lastUsedModel !== 'orca-mini:latest') {
          modelToInit = lastUsedModel;
        }
      } catch (error) {
        console.warn('Could not get last used model, using default:', error);
      }

      const model = await window.backendBridge.ollama.getModel(modelToInit);

      if (model) {
        setIsInitialized(true);

        return;
      } else {
        console.error(`Something went wrong with pulling model ${modelToInit}`);

        // If the stored model failed, try orca-mini:latest as fallback
        if (modelToInit !== 'orca-mini:latest') {
          console.log('Trying fallback model: orca-mini:latest');
          const fallbackModel = await window.backendBridge.ollama.getModel('orca-mini:latest');
          if (fallbackModel) {
            setIsInitialized(true);
            return;
          }
        }
      }
    }

    console.error(`Couldn't initialize Ollama correctly.`);
  };

  return (
    <React.StrictMode>
      <ThemeProvider>
        <AIMessagesProvider>
          {!isInitialized && <AppInit />}
          {isInitialized && <Main />}
        </AIMessagesProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

root.render(
  <HashRouter>
    <GlobalStyle />
    <AppRoot />
  </HashRouter>,
);
