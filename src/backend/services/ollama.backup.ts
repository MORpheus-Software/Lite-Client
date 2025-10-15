import { app, ipcMain } from 'electron';
import { Ollama } from 'ollama';
import { execFile, ChildProcess } from 'child_process';
import fs from 'fs';
import { sendOllamaStatusToRenderer } from '..';
import { MOR_PROMPT } from './prompts';
import path from 'path';
import checkDiskSpace from 'check-disk-space';
import axios from 'axios';
import { parseOllamaSearchPage, transformToAppFormat } from './ollama-scraper';

// events
import { IpcMainChannel } from '../../events';
import {
  createDirectoryElevated,
  executeCommandElevated,
  getExecutablePathByPlatform,
  killProcess,
  runDelayed,
} from './system';

// storage
import { getModelPathFromStorage } from '../storage';
import { logger } from './logger';

// constants
const DEFAULT_OLLAMA_URL = 'http://127.0.0.1:11434/';

// No caching for models - always fetch fresh data

// commands
export const SERVE_OLLAMA_CMD = 'ollama serve';
export const WSL_SERVE_OLLAMA_CMD = 'wsl ollama serve';

// ollama instance
let ollama: Ollama;
let ollamaProcess: ChildProcess | null;

export const loadOllama = async () => {
  let runningInstance = await isOllamaInstanceRunning();

  if (runningInstance) {
    // connect to local instance
    ollama = new Ollama({
      host: DEFAULT_OLLAMA_URL,
    });

    await sendOllamaStatusToRenderer(
      `local instance of ollama is running and connected at ${DEFAULT_OLLAMA_URL}`,
    );

    return true;
  }

  const customAppData = getModelPathFromStorage();
  runningInstance = await packedExecutableOllamaSpawn(customAppData);

  if (runningInstance) {
    // connect to local instance
    ollama = new Ollama({
      host: DEFAULT_OLLAMA_URL,
    });

    await sendOllamaStatusToRenderer(
      `local instance of ollama is running and connected at ${DEFAULT_OLLAMA_URL}`,
    );

    return true;
  }

  ipcMain.emit(IpcMainChannel.Error, `Couldn't start Ollama locally.`);

  return false;
};

export const isOllamaInstanceRunning = async (url?: string): Promise<boolean> => {
  try {
    const usedUrl = url ?? DEFAULT_OLLAMA_URL;

    await sendOllamaStatusToRenderer(`checking if ollama instance is running at ${usedUrl}`);

    const ping = await fetch(usedUrl);

    return ping.status === 200;
  } catch (err) {
    return false;
  }
};

export const packedExecutableOllamaSpawn = async (customDataPath?: string) => {
  await sendOllamaStatusToRenderer(`trying to spawn locally installed ollama`);

  try {
    spawnLocalExecutable(customDataPath);
  } catch (err) {
    console.error(err);
  }

  return await runDelayed(isOllamaInstanceRunning, 10000);
};

export const devRunLocalWSLOllama = (customDataPath?: string) => {
  executeCommandElevated(
    WSL_SERVE_OLLAMA_CMD,
    customDataPath ? { OLLAMA_MODELS: customDataPath } : undefined,
  );
};

export const spawnLocalExecutable = async (customDataPath?: string) => {
  try {
    const { executablePath, appDataPath } = getOllamaExecutableAndAppDataPath(customDataPath);

    if (!fs.existsSync(appDataPath)) {
      createDirectoryElevated(appDataPath);
    }

    const env = {
      ...process.env,
      OLLAMA_MODELS: appDataPath,
    };

    ollamaProcess = execFile(executablePath, ['serve'], { env }, (err, stdout, stderr) => {
      if (err) {
        throw new Error(`exec error: ${err.message}`);
      }

      if (stderr) {
        throw new Error(`stderr: ${stderr}`);
      }
    });
  } catch (err) {
    logger.error(err);
  }
};

export const getOllamaExecutableAndAppDataPath = (
  customDataPath?: string,
): {
  executablePath: string;
  appDataPath: string;
} => {
  const appDataPath = customDataPath || app.getPath('userData');
  const executablePath = getExecutablePathByPlatform();

  return {
    executablePath,
    appDataPath,
  };
};

/**
 * Warm up a model by loading it into memory (no response needed)
 */
export const warmUpModel = async (model: string): Promise<void> => {
  if (!ollama) {
    logger.warn('Cannot warm up model - Ollama not initialized');
    return;
  }

  try {
    logger.info(`Warming up model: ${model}`);

    // Create a timeout wrapper for the warmup operation
    const warmupPromise = ollama.chat({
      model,
      messages: [{ role: 'user', content: 'hello' }],
      keep_alive: '10m',
    });

    // Set a generous 60-second timeout for warmup
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Model warmup timeout')), 60000);
    });

    await Promise.race([warmupPromise, timeoutPromise]);
    logger.info(`Model ${model} warmed up successfully`);
  } catch (error) {
    if (error.message === 'Model warmup timeout') {
      logger.warn(`Model ${model} warmup timed out after 60 seconds`);
    } else {
      logger.warn(`Failed to warm up model ${model}:`, error);
    }
  }
};

export const askOllama = async (model: string, message: string, conversationHistory?: any[]) => {
  console.log(`[askOllama] Called with model: ${model}, message length: ${message.length}`);
  console.log(`[askOllama] Conversation history length: ${conversationHistory?.length || 0}`);
  console.log(`[askOllama] Ollama instance exists: ${!!ollama}`);

  if (!ollama) {
    console.error('[askOllama] Ollama instance is not initialized!');
    throw new Error('Ollama instance is not initialized');
  }

  try {
    // Build messages array with conversation history
    const messages: any[] = [
      {
        role: 'system',
        content: MOR_PROMPT,
      },
    ];

    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      // Convert chat messages to Ollama format and add to messages
      for (const historyMessage of conversationHistory) {
        if (historyMessage.role === 'user' || historyMessage.role === 'assistant') {
          messages.push({
            role: historyMessage.role,
            content: historyMessage.content,
          });
        }
      }
    }

    // Add the current user message
    messages.push({
      role: 'user',
      content: message,
    });

    console.log(`[askOllama] Sending ${messages.length} messages to model`);

    const result = await ollama.chat({
      model,
      messages,
      keep_alive: '10m', // Keep model loaded for 10 minutes to avoid reload delays
    });
    console.log('[askOllama] Chat completed successfully');
    return result;
  } catch (error) {
    console.error('[askOllama] Error during chat:', error);
    throw error;
  }
};

export const getOrPullModel = async (model: string) => {
  await installModelWithStatus(model);

  // init the model on pull to load into memory
  await ollama.chat({ model });

  return findModel(model);
};

export const installModelWithStatus = async (model: string) => {
  const stream = await ollama.pull({
    model,
    stream: true,
  });

  for await (const part of stream) {
    if (part.digest) {
      let percent = 0;

      if (part.completed && part.total) {
        percent = Math.round((part.completed / part.total) * 100);

        await sendOllamaStatusToRenderer(`[${model}] ${part.status} ${percent}%`);
      }
    } else {
      await sendOllamaStatusToRenderer(`[${model}] ${part.status}`);
    }
  }
};

export const cancelDownload = async () => {
  if (ollama) {
    try {
      await ollama.abort();
      await sendOllamaStatusToRenderer('Download cancelled by user');
    } catch (error) {
      // AbortError is expected when abort() is called successfully
      if (error instanceof Error && error.name === 'AbortError') {
        await sendOllamaStatusToRenderer('Download cancelled by user');
      } else {
        console.error('Error cancelling download:', error);
        throw error;
      }
    }
  }
};

export const findModel = async (model: string) => {
  const allModels = await ollama.list();

  return allModels.models.find((m) => m.name.toLowerCase().includes(model));
};

export const getAllLocalModels = async () => {
  return await ollama.list();
};

export const stopOllama = async () => {
  if (!ollamaProcess) {
    return;
  }

  killProcess(ollamaProcess);

  ollamaProcess.removeAllListeners();
  ollamaProcess = null;
};

// ============================================================================
// MODEL REGISTRY FUNCTIONS
// ============================================================================

// REMOVED: Legacy ollamadb.dev implementation
// ollamadb.dev is permanently unavailable - no longer supported

// ACTIVE IMPLEMENTATION: Fetch models from official Ollama search page
// This function scrapes https://ollama.com/search for official model data
// NO CACHING - Always fetches fresh data
export const getAvailableModelsFromRegistry = async (
  searchQuery?: string,
  sortBy?:
    | 'name'
    | 'downloads'
    | 'pulls'
    | 'updated_at'
    | 'last_updated'
    | 'created_at'
    | 'popular'
    | 'newest',
  sortOrder?: 'asc' | 'desc',
) => {
  try {
    logger.info('Fetching models from official Ollama.com (NO CACHE)', {
      searchQuery,
      sortBy,
      sortOrder,
    });

    // Build URL for Ollama search
    let url = 'https://ollama.com/search';
    const params = new URLSearchParams();

    if (searchQuery && searchQuery.trim()) {
      params.append('q', searchQuery.trim());
    }

    // Map sort options to Ollama's format
    if (sortBy === 'newest' || sortBy === 'updated_at' || sortBy === 'last_updated') {
      params.append('sort', 'newest');
    }
    // Popular/pulls/downloads is default, no param needed

    if (params.toString()) {
      url += '?' + params.toString();
    }

    logger.info(`Scraping Ollama search page: ${url}`);

    // Use Axios for Electron compatibility (NO CACHING)
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Morpheus-Client/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 10000,
    });

    const html = response.data;
    logger.info(`Fetched ${(html.length / 1024).toFixed(2)} KB of HTML from Ollama.com`);

    // Parse with our scraper
    const parsedModels = parseOllamaSearchPage(html);
    logger.info(`Parsed ${parsedModels.length} models from HTML`);

    // Transform to app format
    const transformedModels = transformToAppFormat(parsedModels);

    logger.info(`Successfully scraped ${transformedModels.length} models from Ollama.com`);
    return transformedModels;
  } catch (error) {
    logger.error('CRITICAL: Failed to scrape Ollama.com and no fallback available:', error);

    // ollamadb.dev is permanently gone - no fallback possible
    // Return empty array to prevent app crash, but log the critical error
    logger.error('Model browsing unavailable - Ollama.com scraping failed');

    // Could implement emergency fallback to hardcoded popular models list
    // For now, return empty to fail gracefully
    return [];
  }
};

// No cache functions needed - models are always fetched fresh

// Function to check if there's enough disk space for a model
export const checkDiskSpaceForModel = async (modelSize: number) => {
  try {
    const appDataPath = app.getPath('userData');
    const diskSpace = await checkDiskSpace(appDataPath);

    const hasEnoughSpace = diskSpace.free > modelSize;
    const freeSpaceGB = (diskSpace.free / (1024 * 1024 * 1024)).toFixed(2);
    const requiredSpaceGB = (modelSize / (1024 * 1024 * 1024)).toFixed(2);

    return {
      hasEnoughSpace,
      freeSpace: diskSpace.free,
      freeSpaceGB,
      requiredSpaceGB,
      modelSize,
    };
  } catch (err) {
    logger.error('Failed to check disk space:', err);
    return {
      hasEnoughSpace: false,
      freeSpace: 0,
      freeSpaceGB: '0',
      requiredSpaceGB: '0',
      modelSize,
      error: err,
    };
  }
};

// Function to get disk space information for display
export const getDiskSpaceInfo = async () => {
  try {
    const appDataPath = app.getPath('userData');
    const diskSpace = await checkDiskSpace(appDataPath);

    return {
      free: diskSpace.free,
      freeGB: (diskSpace.free / (1024 * 1024 * 1024)).toFixed(2),
      total: diskSpace.size,
      totalGB: (diskSpace.size / (1024 * 1024 * 1024)).toFixed(2),
      used: diskSpace.size - diskSpace.free,
      usedGB: ((diskSpace.size - diskSpace.free) / (1024 * 1024 * 1024)).toFixed(2),
    };
  } catch (err) {
    logger.error('Failed to get disk space info:', err);
    return {
      free: 0,
      freeGB: '0',
      total: 0,
      totalGB: '0',
      used: 0,
      usedGB: '0',
      error: err,
    };
  }
};

// Function to get the currently loaded model using /api/ps endpoint
export const getCurrentModel = async () => {
  try {
    // Use the /api/ps endpoint to get currently running/loaded models
    const response = await fetch(`${DEFAULT_OLLAMA_URL}api/ps`);

    if (!response.ok) {
      logger.warn(`Failed to fetch running models: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Return the first running model if any exist
    if (data.models && data.models.length > 0) {
      return data.models[0];
    }

    return null;
  } catch (err) {
    logger.error('Failed to get current model:', err);
    return null;
  }
};

// Function to delete a model
export const deleteModel = async (modelName: string) => {
  try {
    await ollama.delete({ model: modelName });
    logger.info(`Successfully deleted model: ${modelName}`);
    return true;
  } catch (err) {
    logger.error(`Failed to delete model ${modelName}:`, err);
    return false;
  }
};

// Function to pull and replace current model
export const pullAndReplaceModel = async (newModelName: string) => {
  try {
    // First, pull the new model
    await installModelWithStatus(newModelName);

    // Then replace the current model
    const success = await window.backendBridge.ollama.pullAndReplaceModel(newModelName);
    return success;
  } catch (error) {
    logger.error('Failed to pull and replace model:', error);
    return false;
  }
};

// Get local model details using ollama.show() command
export const getLocalModelDetails = async (modelName: string) => {
  try {
    if (!ollama) {
      throw new Error('Ollama is not initialized');
    }

    const response = await ollama.show({ model: modelName });

    // Log the response to see actual structure
    logger.info(`Ollama show response for ${modelName}:`, JSON.stringify(response, null, 2));

    // Cast to any to bypass TypeScript interface limitations
    const anyResponse = response as any;

    // Build parameters object including ALL fields from ollama show response
    const parameters: Record<string, string> = {};

    // Keep existing friendly name mappings
    if (anyResponse.family) parameters['Architecture'] = anyResponse.family;
    if (anyResponse.parameter_size) parameters['Parameters'] = anyResponse.parameter_size;
    if (anyResponse.quantization_level) parameters['Quantization'] = anyResponse.quantization_level;
    if (anyResponse.system) parameters['System prompt'] = anyResponse.system;

    // Add all other fields from the response dynamically
    const excludedFields = [
      'family',
      'parameter_size',
      'quantization_level',
      'system',
      'parameters',
    ];
    Object.keys(anyResponse).forEach((key) => {
      if (!excludedFields.includes(key) && anyResponse[key] != null) {
        const value = anyResponse[key];
        // Convert objects/arrays to JSON strings for display
        const displayValue =
          typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
        // Capitalize first letter of key for display
        const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
        parameters[displayKey] = displayValue;
      }
    });

    // Handle parameters field specially to extract stop tokens properly
    if (anyResponse.parameters) {
      const stopTokens = anyResponse.parameters
        .split('\n')
        .filter((line: string) => line.includes('stop'));
      if (stopTokens.length > 0) {
        parameters['Stop tokens'] = stopTokens.join(', ').replace(/stop\s+/g, '');
      }
      // Also include raw parameters for completeness
      parameters['Raw parameters'] = anyResponse.parameters;
    }

    return {
      name: modelName,
      description: 'Local model - use ollama run ' + modelName + ' to interact',
      tags: [], // ollama show doesn't provide tags in response
      examples: [], // ollama show doesn't provide examples in response
      parameters,
      url: '', // ollama show doesn't provide URLs
    };
  } catch (error) {
    logger.error(`Failed to get local model details for ${modelName}:`, error);
    throw error;
  }
};

// Scrape model information from Ollama website
export const scrapeModelInfo = async (modelUrl: string, modelName: string) => {
  logger.info(`Scraping model info for: ${modelName} from ${modelUrl}`);

  try {
    const response = await fetch(modelUrl, {
      headers: {
        'User-Agent': 'Morpheus-Client/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch model page: ${response.status}`);
    }

    const html = await response.text();

    // Parse model information from HTML
    const modelInfo = {
      name: modelName,
      description: extractDescription(html),
      tags: extractTags(html),
      examples: extractExamples(html),
      parameters: extractParameters(html),
      url: modelUrl,
    };

    logger.info(`Scraped model info for ${modelName}:`, modelInfo);
    return modelInfo;
  } catch (error) {
    logger.error(`Failed to scrape model info for ${modelName}:`, error);
    throw error;
  }
};

// Helper functions to extract data from HTML
function extractDescription(html: string): string {
  // Look for description in meta tags or main content
  const metaDescMatch = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,
  );
  if (metaDescMatch) {
    return metaDescMatch[1];
  }

  // Fallback: look for description in page content
  const descMatch = html.match(/<p[^>]*class=["'][^"']*description[^"']*["'][^>]*>([^<]*)</i);
  if (descMatch) {
    return descMatch[1].trim();
  }

  return 'No description available';
}

function extractTags(html: string): string[] {
  const tags: string[] = [];

  // Look for tags in various formats
  const tagMatches = html.matchAll(/<span[^>]*class=["'][^"']*tag[^"']*["'][^>]*>([^<]*)</gi);
  for (const match of tagMatches) {
    const tag = match[1].trim();
    if (tag && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  return tags;
}

function extractExamples(html: string): string[] {
  const examples: string[] = [];

  // Look for code blocks or example sections
  const codeMatches = html.matchAll(/<code[^>]*>([^<]*)</gi);
  for (const match of codeMatches) {
    const example = match[1].trim();
    if (example && example.length > 10 && !examples.includes(example)) {
      examples.push(example);
    }
  }

  return examples.slice(0, 3); // Limit to 3 examples
}

function extractParameters(html: string): Record<string, string> {
  const params: Record<string, string> = {};

  // Look for parameter information
  const sizeMatch = html.match(/([0-9.]+[BMG])/i);
  if (sizeMatch) {
    params.size = sizeMatch[1];
  }

  const familyMatch = html.match(/family["']?\s*:\s*["']?([^"',\s}]+)/i);
  if (familyMatch) {
    params.family = familyMatch[1];
  }

  return params;
}
