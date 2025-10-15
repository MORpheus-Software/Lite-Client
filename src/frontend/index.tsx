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
import { ChatProvider } from './contexts/chat-context';
import { DownloadProvider } from './contexts/download-context';
// import { MetaMaskProvider } from '@metamask/sdk-react';

// modals
// import QrCodeModal from './components/modals/qr-code-modal';

// styles
import './index.css';
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

    // Setup debug logging from backend
    const handleDebugLog = (logData: {
      level: string;
      message: string;
      data?: any;
      timestamp: string;
    }) => {
      const { level, message, data } = logData;

      switch (level) {
        case 'error':
          console.error(`[DEBUG] ${message}`, data);
          break;
        case 'warn':
          console.warn(`[DEBUG] ${message}`, data);
          break;
        case 'info':
        default:
          console.info(`[DEBUG] ${message}`, data);
          break;
      }
    };

    window.backendBridge.debug.onLog(handleDebugLog);

    return () => {
      window.backendBridge.removeAllListeners('debug:log');
    };
  }, []);

  const handleOllamaInit = async () => {
    // Initialize inference manager first
    try {
      await window.backendBridge.inference.getMode(); // This will trigger initialization
    } catch (error) {
      console.warn('Failed to initialize inference manager:', error);
    }

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
        <ChatProvider>
          <DownloadProvider>
            {!isInitialized && <AppInit />}
            {isInitialized && <Main />}
          </DownloadProvider>
        </ChatProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
};

root.render(
  <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <GlobalStyle />
    <AppRoot />
  </HashRouter>,
);
