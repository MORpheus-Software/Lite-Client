import Store from 'electron-store';
import { safeStorage } from 'electron';
import { InferenceConfig, MorpheusAPIConfig } from './types';
import { logger } from './services/logger';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
};

export type Chat = {
  id: string;
  title: string;
  mode: 'local' | 'remote';
  model: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
};

export type SchemaType = {
  modelsPath: string;
  inferenceConfig: InferenceConfig;
  lastUsedLocalModel?: string;
  chats?: { [chatId: string]: Chat };
  currentChatId?: string;
};

const store = new Store<SchemaType>({
  defaults: {
    modelsPath: '',
    inferenceConfig: {
      mode: 'local',
    },
    lastUsedLocalModel: 'orca-mini:latest',
  },
});

export const saveModelPathToStorage = (path: string) => {
  store.set('modelsPath', path);
};

export const getModelPathFromStorage = () => {
  return store.get('modelsPath');
};

export const saveInferenceConfigToStorage = (config: InferenceConfig) => {
  try {
    // If there's a morpheus config with API key, encrypt it
    if (config.morpheusConfig?.apiKey) {
      const secureConfig = { ...config };

      // Encrypt the API key if safeStorage is available
      if (safeStorage.isEncryptionAvailable()) {
        const encryptedApiKey = safeStorage.encryptString(config.morpheusConfig.apiKey);
        secureConfig.morpheusConfig = {
          ...config.morpheusConfig,
          apiKey: encryptedApiKey.toString('base64'),
        };
        // Store encryption flag separately in the config object
        (secureConfig.morpheusConfig as any)._encrypted = true;
        logger.info('API key encrypted and stored securely');
      } else {
        logger.warn('Safe storage not available, storing API key in plain text');
      }

      store.set('inferenceConfig', secureConfig);
    } else {
      store.set('inferenceConfig', config);
    }
  } catch (error) {
    logger.error('Failed to save inference config:', error);
    // Fallback to regular storage
    store.set('inferenceConfig', config);
  }
};

export const getInferenceConfigFromStorage = (): InferenceConfig => {
  try {
    const config = store.get('inferenceConfig');

    // If the API key is encrypted, decrypt it
    if (config?.morpheusConfig?.apiKey && (config.morpheusConfig as any)._encrypted) {
      if (safeStorage.isEncryptionAvailable()) {
        try {
          const encryptedBuffer = Buffer.from(config.morpheusConfig.apiKey, 'base64');
          const decryptedApiKey = safeStorage.decryptString(encryptedBuffer);

          config.morpheusConfig = {
            ...config.morpheusConfig,
            apiKey: decryptedApiKey,
          };
          delete (config.morpheusConfig as any)._encrypted;
          logger.info('API key decrypted successfully');
        } catch (decryptError) {
          logger.error('Failed to decrypt API key:', decryptError);
          // Clear the corrupted config
          config.morpheusConfig = undefined;
        }
      } else {
        logger.warn('Safe storage not available for decryption');
        config.morpheusConfig = undefined;
      }
    }

    return config;
  } catch (error) {
    logger.error('Failed to load inference config:', error);
    return store.get('inferenceConfig');
  }
};

export const saveLastUsedLocalModelToStorage = (model: string) => {
  store.set('lastUsedLocalModel', model);
};

export const getLastUsedLocalModelFromStorage = (): string => {
  return store.get('lastUsedLocalModel') || 'orca-mini:latest';
};

export const clearStore = () => {
  store.clear();
};

// Chat management functions
export const saveChat = (chat: Chat) => {
  const chats = store.get('chats') || {};
  chats[chat.id] = chat;
  store.set('chats', chats);
};

export const getChatById = (chatId: string): Chat | null => {
  const chats = store.get('chats') || {};
  return chats[chatId] || null;
};

export const getAllChats = (): Chat[] => {
  const chats = store.get('chats') || {};
  return Object.values(chats).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
};

export const deleteChat = (chatId: string) => {
  const chats = store.get('chats') || {};
  delete chats[chatId];
  store.set('chats', chats);

  // If this was the current chat, clear current chat ID
  if (store.get('currentChatId') === chatId) {
    store.delete('currentChatId');
  }
};

export const setCurrentChatId = (chatId: string) => {
  store.set('currentChatId', chatId);
};

export const getCurrentChatId = (): string | null => {
  return store.get('currentChatId') || null;
};

export const generateChatId = (): string => {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export const generateMessageId = (): string => {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};
