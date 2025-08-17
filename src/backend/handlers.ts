import { dialog } from 'electron';

import { IpcChannel } from './../events';
import {
  loadOllama,
  stopOllama,
  getAllLocalModels,
  askOllama,
  getOrPullModel,
  getAvailableModelsFromRegistry,
  checkDiskSpaceForModel,
  getDiskSpaceInfo,
  getCurrentModel,
  deleteModel,
  pullAndReplaceModel,
} from './services/ollama';
import { getInferenceManager } from './services/inference-manager';
import { OllamaQuestion, InferenceMode, MorpheusAPIConfig } from './types';
import {
  saveModelPathToStorage,
  getModelPathFromStorage,
  saveLastUsedLocalModelToStorage,
  getLastUsedLocalModelFromStorage,
} from './storage';
import ChatManager from './services/chat-manager';
import { logger } from './services/logger';

export const initOllama = async (_: Electron.IpcMainEvent) => {
  try {
    const ollamaLoaded = await loadOllama();

    return ollamaLoaded;
  } catch (err) {
    handleError(err);

    return false;
  }
};

export const stopOllamaServe = async () => {
  await stopOllama();
};

export const getAllModels = async (_: Electron.IpcMainEvent) => {
  try {
    const models = await getAllLocalModels();

    return models;
    // event.reply(OllamaChannel.OllamaGetAllModels, models);
  } catch (err) {
    handleError(err);
  }
};

export const getModel = async (_: Electron.IpcMainEvent, model: string) => {
  try {
    const response = await getOrPullModel(model);

    return response;
  } catch (err) {
    handleError(err);
  }
};

export const askOlama = async (_: Electron.IpcMainEvent, { model, query }: OllamaQuestion) => {
  try {
    const response = await askOllama(model, query);

    return response;
  } catch (err) {
    handleError(err);
  }
};

export const getModelsFolderPath = async (_: Electron.IpcMainEvent) => {
  return getModelPathFromStorage();
};

export const setModelFolderPath = async (_: Electron.IpcMainEvent) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
  });

  if (result.filePaths) {
    saveModelPathToStorage(result.filePaths[0]);
  }

  return true;
};

// New handler for registry models with scroll loading and search/sort support
export const getAvailableModelsFromRegistryHandler = async (
  _: Electron.IpcMainEvent,
  offset = 0,
  limit = 20,
  searchQuery?: string,
  sortBy?: string,
  sortOrder?: string,
) => {
  try {
    const models = await getAvailableModelsFromRegistry(
      searchQuery,
      sortBy as
        | 'name'
        | 'downloads'
        | 'pulls'
        | 'updated_at'
        | 'last_updated'
        | 'created_at'
        | undefined,
      sortOrder as 'asc' | 'desc' | undefined,
    );
    return models;
  } catch (err) {
    handleError(err);
    return [];
  }
};

// Cache-related handlers removed - models are always fetched fresh

export const checkDiskSpaceForModelHandler = async (_: any, modelSize: number) => {
  try {
    return await checkDiskSpaceForModel(modelSize);
  } catch (error) {
    logger.error('Error checking disk space for model:', error);
    throw error;
  }
};

export const getDiskSpaceInfoHandler = async () => {
  try {
    return await getDiskSpaceInfo();
  } catch (error) {
    logger.error('Error getting disk space info:', error);
    throw error;
  }
};

export const getCurrentModelHandler = async () => {
  try {
    return await getCurrentModel();
  } catch (error) {
    logger.error('Error getting current model:', error);
    throw error;
  }
};

export const saveLastUsedLocalModelHandler = async (_: Electron.IpcMainEvent, model: string) => {
  try {
    saveLastUsedLocalModelToStorage(model);
    logger.info(`Saved last used local model: ${model}`);
  } catch (error) {
    logger.error('Error saving last used local model:', error);
    throw error;
  }
};

export const getLastUsedLocalModelHandler = async (_: Electron.IpcMainEvent) => {
  try {
    return getLastUsedLocalModelFromStorage();
  } catch (error) {
    logger.error('Error getting last used local model:', error);
    throw error;
  }
};

export const deleteModelHandler = async (_: any, modelName: string) => {
  try {
    return await deleteModel(modelName);
  } catch (error) {
    logger.error('Error deleting model:', error);
    throw error;
  }
};

export const pullAndReplaceModelHandler = async (_: any, modelName: string) => {
  try {
    const success = await pullAndReplaceModel(modelName);
    return success;
  } catch (err) {
    handleError(err);
    return false;
  }
};

const handleError = (err: Error) => {
  console.error(err);

  // log with winston here
};

// =====================================
// Inference Management Handlers
// =====================================

export const getInferenceModeHandler = async (_: Electron.IpcMainEvent) => {
  try {
    const manager = getInferenceManager();
    return await manager.getInferenceMode();
  } catch (err) {
    handleError(err);
    return 'local'; // Default fallback
  }
};

export const setInferenceModeHandler = async (_: Electron.IpcMainEvent, mode: InferenceMode) => {
  try {
    const manager = getInferenceManager();
    await manager.setInferenceMode(mode);
    return true;
  } catch (err) {
    handleError(err);
    return false;
  }
};

export const getMorpheusConfigHandler = async (_: Electron.IpcMainEvent) => {
  try {
    const manager = getInferenceManager();
    return await manager.getMorpheusConfig();
  } catch (err) {
    handleError(err);
    return null;
  }
};

export const setMorpheusConfigHandler = async (
  _: Electron.IpcMainEvent,
  config: MorpheusAPIConfig,
) => {
  try {
    const manager = getInferenceManager();
    await manager.setMorpheusConfig(config);
    return true;
  } catch (err) {
    handleError(err);
    return false;
  }
};

export const testMorpheusConnectionHandler = async (_: Electron.IpcMainEvent) => {
  try {
    const manager = getInferenceManager();
    return await manager.testMorpheusConnection();
  } catch (err) {
    handleError(err);
    return false;
  }
};

// =====================================
// Morpheus API Handlers
// =====================================

export const getMorpheusModelsHandler = async (_: Electron.IpcMainEvent) => {
  try {
    const manager = getInferenceManager();
    const morpheusModels = await manager.getRemoteModels();

    // Map MorpheusModel to RemoteModel format expected by frontend
    return morpheusModels.map((model) => ({
      id: model.id,
      blockchainID: model.blockchainID,
      tags: model.tags,
      isFavorite: false,
    }));
  } catch (err) {
    handleError(err);
    return [];
  }
};

export const askMorpheusHandler = async (
  _: Electron.IpcMainEvent,
  query: string,
  model?: string,
) => {
  try {
    const manager = getInferenceManager();
    const result = await manager.askWithSource(query, 'remote', model);
    return result.response;
  } catch (err) {
    handleError(err);
    throw err;
  }
};

// =====================================
// Unified Inference Handler
// =====================================

export const askAIHandler = async (
  _: Electron.IpcMainEvent,
  query: string,
  model?: string,
  forceSource?: 'local' | 'remote',
) => {
  try {
    const manager = getInferenceManager();

    let result;
    if (forceSource) {
      result = await manager.askWithSource(query, forceSource, model);
    } else {
      result = await manager.ask(query, model);
    }

    return {
      response: result.response,
      source: result.source,
      model: result.model,
    };
  } catch (err) {
    handleError(err);
    throw err;
  }
};

export const getAvailableInferenceModelsHandler = async (_: Electron.IpcMainEvent) => {
  try {
    const manager = getInferenceManager();
    return await manager.getAvailableModels();
  } catch (err) {
    handleError(err);
    return [];
  }
};

// =====================================
// Chat Management Handlers
// =====================================

let chatManager: ChatManager | null = null;

const getChatManager = () => {
  if (!chatManager) {
    chatManager = new ChatManager();
  }
  return chatManager;
};

export const createChatHandler = async (
  _: Electron.IpcMainEvent,
  mode: 'local' | 'remote',
  model: string,
  title?: string,
) => {
  try {
    const manager = getChatManager();
    return manager.createChat(mode, model, title);
  } catch (err) {
    handleError(err);
    throw err;
  }
};

export const getChatsHandler = async (_: Electron.IpcMainEvent) => {
  try {
    const manager = getChatManager();
    return manager.getChats();
  } catch (err) {
    handleError(err);
    return [];
  }
};

export const getChatHandler = async (_: Electron.IpcMainEvent, chatId: string) => {
  try {
    const manager = getChatManager();
    return manager.getChat(chatId);
  } catch (err) {
    handleError(err);
    return null;
  }
};

export const getCurrentChatHandler = async (_: Electron.IpcMainEvent) => {
  try {
    const manager = getChatManager();
    return manager.getCurrentChat();
  } catch (err) {
    handleError(err);
    return null;
  }
};

export const switchToChatHandler = async (_: Electron.IpcMainEvent, chatId: string) => {
  try {
    const manager = getChatManager();
    return manager.switchToChat(chatId);
  } catch (err) {
    handleError(err);
    return false;
  }
};

export const deleteChatHandler = async (_: Electron.IpcMainEvent, chatId: string) => {
  try {
    const manager = getChatManager();
    return manager.deleteChat(chatId);
  } catch (err) {
    handleError(err);
    return false;
  }
};

export const sendChatMessageHandler = async (
  _: Electron.IpcMainEvent,
  chatId: string,
  message: string,
) => {
  try {
    const manager = getChatManager();
    return await manager.sendMessage(chatId, message);
  } catch (err) {
    handleError(err);
    throw err;
  }
};

export const updateChatTitleHandler = async (
  _: Electron.IpcMainEvent,
  chatId: string,
  title: string,
) => {
  try {
    const manager = getChatManager();
    return manager.updateChatTitle(chatId, title);
  } catch (err) {
    handleError(err);
    return false;
  }
};

export const migrateChatHandler = async (
  _: Electron.IpcMainEvent,
  messages: any[],
  mode: 'local' | 'remote',
  model: string,
) => {
  try {
    const manager = getChatManager();
    return manager.migrateExistingChat(messages, mode, model);
  } catch (err) {
    handleError(err);
    throw err;
  }
};

// Scrape and return model info (no modal window)
export const getModelInfoHandler = async (
  _: Electron.IpcMainEvent,
  modelUrl: string,
  modelName: string,
) => {
  try {
    const { scrapeModelInfo } = await import('./services/ollama');
    const modelInfo = await scrapeModelInfo(modelUrl, modelName);
    return { success: true, data: modelInfo };
  } catch (error) {
    handleError(error);
    return { success: false, error: error.message };
  }
};

// Get local model info using ollama show command
export const getLocalModelInfoHandler = async (_: Electron.IpcMainEvent, modelName: string) => {
  try {
    const { getLocalModelDetails } = await import('./services/ollama');
    const ollamaResponse = await getLocalModelDetails(modelName);

    return { success: true, data: ollamaResponse };
  } catch (error) {
    handleError(error);
    return { success: false, error: error.message };
  }
};
