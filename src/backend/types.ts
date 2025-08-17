import { IpcMainEvent } from 'electron';

export type OllamaQuestion = {
  model: string;
  query: string;
};

export type InferenceMode = 'local' | 'remote';

export interface MorpheusAPIConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface InferenceConfig {
  mode: InferenceMode;
  morpheusConfig?: MorpheusAPIConfig;
}

export interface IpcMainEventExtended extends IpcMainEvent {
  status: string;
}
