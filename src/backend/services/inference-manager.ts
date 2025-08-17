import { logger } from './logger';
import { InferenceMode, MorpheusAPIConfig } from '../types';
import {
  initializeMorpheusAPI,
  getMorpheusAPI,
  destroyMorpheusAPI,
  MorpheusModel,
} from './morpheus-api';
import { askOllama, getAllLocalModels, getCurrentModel } from './ollama';

// Storage
import {
  getInferenceConfigFromStorage,
  saveInferenceConfigToStorage,
  getLastUsedLocalModelFromStorage,
} from '../storage';

export interface InferenceModel {
  id: string;
  name: string;
  source: 'local' | 'remote';
  size?: string;
  description?: string;
}

export interface InferenceResult {
  response: string;
  source: 'local' | 'remote';
  model: string;
}

class InferenceManager {
  private currentMode: InferenceMode = 'local';
  private morpheusConfig: MorpheusAPIConfig | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Initialization will happen when first accessed
  }

  /**
   * Initialize the manager with configuration from storage
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      const config = await getInferenceConfigFromStorage();
      if (config) {
        this.currentMode = config.mode;
        this.morpheusConfig = config.morpheusConfig || null;

        // Initialize Morpheus API if config exists
        if (this.morpheusConfig && this.morpheusConfig.apiKey) {
          initializeMorpheusAPI(this.morpheusConfig);
          logger.info('Morpheus API initialized with existing config');
        }
      }

      this.isInitialized = true;
      logger.info(`Inference manager initialized in ${this.currentMode} mode`);
    } catch (error) {
      logger.error('Failed to initialize inference manager:', error);
      // Set as initialized even if loading failed to prevent infinite retries
      this.isInitialized = true;
    }
  }

  /**
   * Ensure the manager is initialized before use
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Save configuration to storage
   */
  private async saveConfig() {
    try {
      await saveInferenceConfigToStorage({
        mode: this.currentMode,
        morpheusConfig: this.morpheusConfig || undefined,
      });
    } catch (error) {
      logger.error('Failed to save inference config:', error);
    }
  }

  /**
   * Get current inference mode
   */
  async getInferenceMode(): Promise<InferenceMode> {
    await this.ensureInitialized();
    return this.currentMode;
  }

  /**
   * Set inference mode
   */
  async setInferenceMode(mode: InferenceMode): Promise<void> {
    await this.ensureInitialized();
    this.currentMode = mode;
    await this.saveConfig();
    logger.info(`Inference mode set to: ${mode}`);
  }

  /**
   * Get Morpheus API configuration
   */
  async getMorpheusConfig(): Promise<MorpheusAPIConfig | null> {
    await this.ensureInitialized();
    return this.morpheusConfig;
  }

  /**
   * Set Morpheus API configuration
   */
  async setMorpheusConfig(config: MorpheusAPIConfig): Promise<void> {
    await this.ensureInitialized();
    this.morpheusConfig = config;

    // Destroy existing instance and create new one
    destroyMorpheusAPI();

    if (config.apiKey) {
      initializeMorpheusAPI(config);
    }

    await this.saveConfig();
    logger.info('Morpheus API configuration updated');
  }

  /**
   * Test Morpheus API connection
   */
  async testMorpheusConnection(): Promise<boolean> {
    await this.ensureInitialized();
    const api = getMorpheusAPI();
    if (!api) {
      return false;
    }

    try {
      return await api.testConnection();
    } catch (error) {
      logger.error('Morpheus connection test failed:', error);
      return false;
    }
  }

  /**
   * Get available models from current source
   */
  async getAvailableModels(): Promise<InferenceModel[]> {
    await this.ensureInitialized();
    const models: InferenceModel[] = [];

    // Always include local models
    try {
      const localModelsResponse = await getAllLocalModels();
      const localModelList =
        localModelsResponse.models?.map((model: any) => ({
          id: model.name,
          name: model.name,
          source: 'local' as const,
          size: model.size,
          description: 'Local Ollama model',
        })) || [];
      models.push(...localModelList);
    } catch (error) {
      logger.error('Failed to fetch local models:', error);
    }

    // Include remote models if API is configured
    const api = getMorpheusAPI();
    if (api) {
      try {
        const remoteModels = await api.getModels();
        const remoteModelList = remoteModels.map((model) => ({
          id: model.id,
          name: model.id,
          source: 'remote' as const,
          description: model.tags.join(', '),
        }));
        models.push(...remoteModelList);
      } catch (error) {
        logger.error('Failed to fetch remote models:', error);
      }
    }

    return models;
  }

  /**
   * Ask a question using the current inference mode
   */
  async ask(query: string, model?: string): Promise<InferenceResult> {
    await this.ensureInitialized();
    console.log(
      `[InferenceManager] ask() called with mode: ${this.currentMode}, query: ${query.substring(0, 50)}...`,
    );
    if (this.currentMode === 'remote') {
      console.log('[InferenceManager] Using remote inference');
      return this.askRemote(query, model);
    } else {
      console.log('[InferenceManager] Using local inference');
      return this.askLocal(query, model);
    }
  }

  /**
   * Ask a question using local inference (Ollama)
   */
  private async askLocal(
    query: string,
    model?: string,
    conversationHistory?: any[],
  ): Promise<InferenceResult> {
    console.log('[InferenceManager] askLocal() called');
    try {
      // Use provided model or get stored preferred model or get current model or get first available model
      let targetModel = model;

      if (!targetModel) {
        // Check for stored last used local model
        targetModel = getLastUsedLocalModelFromStorage();

        // Verify the stored model actually exists
        if (targetModel && targetModel !== 'orca-mini:latest') {
          try {
            const localModelsResponse = await getAllLocalModels();
            const modelExists = localModelsResponse.models?.some((m) => m.name === targetModel);
            if (!modelExists) {
              logger.info(`Stored model ${targetModel} not found, falling back`);
              targetModel = undefined;
            }
          } catch (error) {
            logger.warn('Could not verify stored model exists:', error);
            targetModel = undefined;
          }
        }
      }

      if (!targetModel) {
        const currentModel = await getCurrentModel();
        targetModel = currentModel?.name;
      }

      // If still no model, get the first available local model
      if (!targetModel) {
        const localModelsResponse = await getAllLocalModels();
        const firstModel = localModelsResponse.models?.[0];
        targetModel = firstModel?.name;
      }

      // Final fallback - use orca-mini as default
      if (!targetModel) {
        targetModel = 'orca-mini:latest';
        logger.info('No models found, using default: orca-mini:latest');
      }

      // Double-check we have a valid model
      if (!targetModel || targetModel.trim() === '') {
        throw new Error(
          'No valid model available for local inference. Please ensure Ollama models are installed.',
        );
      }

      logger.info(`Using local model: ${targetModel}`);
      console.log(`[InferenceManager] About to call askOllama with model: ${targetModel}`);
      console.log(
        `[InferenceManager] Conversation history: ${conversationHistory?.length || 0} messages`,
      );
      const chatResponse = await askOllama(targetModel, query, conversationHistory);
      console.log('[InferenceManager] askOllama completed successfully');
      console.log('[InferenceManager] Raw chat response:', JSON.stringify(chatResponse, null, 2));
      console.log('[InferenceManager] Chat response content:', chatResponse.message.content);

      // Parse JSON response to extract just the response text
      let responseText = chatResponse.message.content;
      try {
        // First try parsing the entire response as JSON
        const parsedResponse = JSON.parse(responseText.trim());
        if (parsedResponse.response) {
          responseText = parsedResponse.response;
          console.log('[InferenceManager] Extracted response text:', responseText);
        }
      } catch (error) {
        // If that fails, try to extract JSON from within the text
        try {
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsedResponse = JSON.parse(jsonMatch[0]);
            if (parsedResponse.response) {
              responseText = parsedResponse.response;
              console.log(
                '[InferenceManager] Extracted response text from embedded JSON:',
                responseText,
              );
            }
          } else {
            console.log('[InferenceManager] No JSON found, using raw response');
          }
        } catch (innerError) {
          console.log('[InferenceManager] Failed to parse embedded JSON, using raw response');
        }
      }

      return {
        response: responseText,
        source: 'local',
        model: targetModel,
      };
    } catch (error) {
      console.error('[InferenceManager] Local inference failed:', error);
      logger.error('Local inference failed:', error);
      throw new Error('Local inference failed: ' + error.message);
    }
  }

  /**
   * Ask a question using remote inference (Morpheus API) with automatic fallback
   */
  private async askRemote(
    query: string,
    model?: string,
    conversationHistory?: any[],
  ): Promise<InferenceResult> {
    const api = getMorpheusAPI();
    if (!api) {
      logger.warn('Morpheus API not configured, falling back to local mode');
      return this.askLocal(query, model, conversationHistory);
    }

    try {
      // Use provided model or default
      const targetModel = model || this.morpheusConfig?.defaultModel || 'llama-3.3-70b';

      logger.info(`Attempting remote inference with model: ${targetModel}`);

      // Build messages array with conversation history
      const messages: any[] = [];

      // Add conversation history if provided
      if (conversationHistory && conversationHistory.length > 0) {
        logger.info(`Including conversation history: ${conversationHistory.length} messages`);
        for (const historyMessage of conversationHistory) {
          if (historyMessage.role === 'user' || historyMessage.role === 'assistant') {
            messages.push({
              role: historyMessage.role,
              content: historyMessage.content,
            });
          }
        }
      }

      // Add current user message
      messages.push({
        role: 'user',
        content: query,
      });

      // Use the chat method directly instead of ask to support conversation history
      const chatResponse = await api.chat({
        model: targetModel,
        messages: messages,
        temperature: 0.7,
        max_tokens: 2048,
      });

      const responseContent = chatResponse.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response content received from Morpheus API');
      }

      logger.info('Remote inference successful');
      return {
        response: responseContent,
        source: 'remote',
        model: targetModel,
      };
    } catch (error) {
      logger.error('Remote inference failed:', error);

      // Determine if we should fallback based on error type
      const shouldFallback = this.shouldFallbackToLocal(error);

      if (shouldFallback) {
        logger.info('Falling back to local inference due to remote failure');
        try {
          // Use a default local model for fallback instead of the remote model name
          const localFallbackModel =
            (await getLastUsedLocalModelFromStorage()) || 'orca-mini:latest';
          logger.info(`Using local fallback model: ${localFallbackModel}`);
          const localResult = await this.askLocal(query, localFallbackModel, conversationHistory);
          // Add a note to the response indicating fallback
          return {
            ...localResult,
            response:
              localResult.response +
              `\n\n*Note: Responded using local model (${localFallbackModel}) due to remote API unavailability.*`,
          };
        } catch (localError) {
          logger.error('Local fallback also failed:', localError);
          throw new Error(
            'Both remote and local inference failed. Please check your configuration.',
          );
        }
      } else {
        // For authentication/configuration errors, don't fallback
        throw new Error(`Remote inference failed: ${error.message}`);
      }
    }
  }

  /**
   * Determine if we should fallback to local mode based on the error
   */
  private shouldFallbackToLocal(error: any): boolean {
    if (!error) return true;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.response?.status;

    // Don't fallback for authentication/authorization errors
    if (
      errorCode === 401 ||
      errorCode === 403 ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('api key')
    ) {
      return false;
    }

    // Don't fallback for explicit invalid request errors
    if (errorCode === 400 || errorMessage.includes('bad request')) {
      return false;
    }

    // Fallback for network issues, timeouts, server errors
    if (
      errorCode >= 500 ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('network') ||
      errorMessage.includes('econnrefused')
    ) {
      return true;
    }

    // Default to fallback for unknown errors
    return true;
  }

  /**
   * Ask using a specific source (local or remote)
   */
  async askWithSource(
    query: string,
    source: 'local' | 'remote',
    model?: string,
    conversationHistory?: any[],
  ): Promise<InferenceResult> {
    await this.ensureInitialized();
    if (source === 'remote') {
      return this.askRemote(query, model, conversationHistory);
    } else {
      return this.askLocal(query, model, conversationHistory);
    }
  }

  /**
   * Get remote models only
   */
  async getRemoteModels(): Promise<MorpheusModel[]> {
    await this.ensureInitialized();
    const api = getMorpheusAPI();
    if (!api) {
      return [];
    }

    try {
      return await api.getModels();
    } catch (error) {
      logger.error('Failed to fetch remote models:', error);
      return [];
    }
  }
}

// Global instance
let inferenceManagerInstance: InferenceManager | null = null;

export const getInferenceManager = (): InferenceManager => {
  if (!inferenceManagerInstance) {
    inferenceManagerInstance = new InferenceManager();
  }
  return inferenceManagerInstance;
};

export const destroyInferenceManager = (): void => {
  inferenceManagerInstance = null;
};
