import { ChatResponse, GenerateResponse, ListResponse, ModelResponse } from 'ollama';

export type InferenceMode = 'local' | 'remote';

export interface MorpheusAPIConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface InferenceResult {
  response: string;
  source: 'local' | 'remote';
  model: string;
}

export interface InferenceModel {
  id: string;
  name: string;
  source: 'local' | 'remote';
  size?: string;
  description?: string;
}

export interface DiskSpaceInfo {
  free: number;
  freeGB: string;
  total: number;
  totalGB: string;
  used: number;
  usedGB: string;
  error?: any;
}

export interface DiskSpaceForModel {
  hasEnoughSpace: boolean;
  freeSpace: number;
  freeSpaceGB: string;
  requiredSpaceGB: string;
  modelSize: number;
  error?: any;
}

export interface BackendBridge {
  main: {
    init: () => Promise<boolean>;
    onInit: (callback: (result: boolean) => void) => void;
    sendInit: () => void;
    getFolderPath: () => Promise<string>;
    setFolderPath: () => Promise<boolean>;
    close: () => void;
    minimize: () => void;
  };
  ollama: {
    init: () => Promise<boolean>;
    onStatusUpdate: (callback: (status: string) => void) => void;
    question: ({ model, query }: OllamaQuestion) => Promise<ChatResponse>;
    onAnswer: (callback: (response: ChatResponse) => void) => void;
    getAllModels: () => Promise<ListResponse>;
    getModel: (model: string) => Promise<ModelResponse>;
    getAvailableModelsFromRegistry: (
      searchQuery?: string,
      sortBy?: 'name' | 'downloads' | 'pulls' | 'updated_at' | 'last_updated' | 'created_at',
      sortOrder?: 'asc' | 'desc',
    ) => Promise<RegistryModel[]>;
    checkDiskSpaceForModel: (modelSize: number) => Promise<DiskSpaceForModel>;
    getDiskSpaceInfo: () => Promise<DiskSpaceInfo>;
    getCurrentModel: () => Promise<any>;
    saveLastUsedLocalModel: (model: string) => Promise<void>;
    getLastUsedLocalModel: () => Promise<string>;
    deleteModel: (modelName: string) => Promise<boolean>;
    pullAndReplaceModel: (modelName: string) => Promise<boolean>;

    getModelInfo: (modelUrl: string, modelName: string) => Promise<any>;
    getLocalModelInfo: (modelName: string) => Promise<any>;
  };
  inference: {
    getMode: () => Promise<InferenceMode>;
    setMode: (mode: InferenceMode) => Promise<boolean>;
    getMorpheusConfig: () => Promise<MorpheusAPIConfig | null>;
    setMorpheusConfig: (config: MorpheusAPIConfig) => Promise<boolean>;
    testMorpheusConnection: () => Promise<boolean>;
  };
  morpheus: {
    getModels: () => Promise<any[]>;
    question: (query: string, model?: string) => Promise<string>;
  };
  ai: {
    ask: (
      query: string,
      model?: string,
      forceSource?: 'local' | 'remote',
    ) => Promise<InferenceResult>;
    getModels: () => Promise<InferenceModel[]>;
  };
  chat: {
    create: (mode: 'local' | 'remote', model: string, title?: string) => Promise<Chat>;
    getAll: () => Promise<Chat[]>;
    get: (chatId: string) => Promise<Chat | null>;
    getCurrent: () => Promise<Chat | null>;
    switchTo: (chatId: string) => Promise<boolean>;
    delete: (chatId: string) => Promise<boolean>;
    sendMessage: (chatId: string, message: string) => Promise<string>;
    updateTitle: (chatId: string, title: string) => Promise<boolean>;
    migrate: (messages: any[], mode: 'local' | 'remote', model: string) => Promise<Chat>;
  };
  removeAllListeners: (channel: string) => void;
}

// New type for registry models
export interface RegistryModel {
  name: string;
  description: string;
  modifiedAt: string;
  digest: string;
  tags: string[];
  url?: string;
  isInstalled: boolean;
  isDefault?: boolean;
}

// Chat types (importing from frontend types)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  mode: 'local' | 'remote';
  model: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

declare global {
  interface Window {
    backendBridge: BackendBridge;
  }
}
