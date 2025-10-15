import { logger } from './logger';

/**
 * Interface for parsed model data from Ollama search page
 */
export interface ParsedOllamaModel {
  name: string;
  description: string;
  url: string;
  capabilities: string[];
  sizes: string[];
  pullCount: string;
  pullCountNumeric: number;
  lastUpdated: string;
  modifiedAt: string; // ISO date string
  tags: string[];
  digest: string;
  isInstalled: boolean;
}

/**
 * Validation result interface
 */
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Parse the Ollama search page HTML and extract model data using regex
 * @param html - The HTML content from https://ollama.com/search
 * @returns Array of parsed model objects
 */
export function parseOllamaSearchPage(html: string): ParsedOllamaModel[] {
  try {
    const models: ParsedOllamaModel[] = [];

    logger.info('Starting to parse Ollama search page HTML with regex');

    // Find all model containers using regex
    const modelMatches = html.match(/<li[^>]*x-test-model[^>]*>[\s\S]*?<\/li>/g);

    if (!modelMatches) {
      logger.warn('No model containers found in HTML');
      return [];
    }

    modelMatches.forEach((modelHtml, index) => {
      try {
        // Extract model name
        const nameMatch = modelHtml.match(/x-test-search-response-title[^>]*>([^<]+)</);
        const name = nameMatch?.[1]?.trim();

        // Extract description
        const descMatch = modelHtml.match(
          /class="max-w-lg break-words text-neutral-800 text-md"[^>]*>([^<]+)</,
        );
        const description = descMatch?.[1]?.trim();

        // Extract URL
        const urlMatch = modelHtml.match(/href="(\/library\/[^"]+)"/);
        const url = urlMatch?.[1] ? `https://ollama.com${urlMatch[1]}` : '';

        // Extract capabilities
        const capabilityMatches = modelHtml.match(/x-test-capability[^>]*>([^<]+)/g);
        const capabilities: string[] = [];
        if (capabilityMatches) {
          capabilityMatches.forEach((match) => {
            const capability = match
              .replace(/x-test-capability[^>]*>/, '')
              .replace(/<.*$/, '')
              .trim();
            if (capability) capabilities.push(capability);
          });
        }

        // Check for cloud tag
        const cloudMatch = modelHtml.match(/class="[^"]*bg-cyan-50[^"]*"[^>]*>([^<]*cloud[^<]*)</i);
        if (cloudMatch) {
          capabilities.push('cloud');
        }

        // Extract model sizes
        const sizeMatches = modelHtml.match(/x-test-size[^>]*>([^<]+)/g);
        const sizes: string[] = [];
        if (sizeMatches) {
          sizeMatches.forEach((match) => {
            const size = match
              .replace(/x-test-size[^>]*>/, '')
              .replace(/<.*$/, '')
              .trim();
            if (size) sizes.push(size);
          });
        }

        // Extract pull count
        const pullMatch = modelHtml.match(/x-test-pull-count[^>]*>([^<]+)</);
        const pullCount = pullMatch?.[1]?.trim() || '0';
        const pullCountNumeric = parsePullCount(pullCount);

        // Extract last updated
        const updatedMatch = modelHtml.match(/x-test-updated[^>]*>([^<]+)</);
        const lastUpdated = updatedMatch?.[1]?.trim() || 'recently';
        const modifiedAt = parseUpdateTime(lastUpdated);

        // Only add models with required data
        if (name && description && url) {
          const modelData: ParsedOllamaModel = {
            name,
            description,
            url,
            capabilities,
            sizes,
            pullCount,
            pullCountNumeric,
            lastUpdated,
            modifiedAt,
            tags: capabilities, // Use capabilities as tags for compatibility
            digest: generatePlaceholderDigest(name),
            isInstalled: false,
          };

          // Validate the extracted data
          const validation = validateModelData(modelData);
          if (validation.isValid) {
            models.push(modelData);
          } else {
            logger.warn(`Invalid model data for ${name}:`, validation.errors);
          }
        }
      } catch (error) {
        logger.error(`Error parsing model at index ${index}:`, error);
      }
    });

    logger.info(`Successfully parsed ${models.length} models from Ollama search page using regex`);
    return models;
  } catch (error) {
    logger.error('Failed to parse Ollama search page HTML:', error);
    throw new Error(`HTML parsing failed: ${error.message}`);
  }
}

/**
 * Parse update time string to ISO date
 * @param timeStr - Time string like "5 days ago", "2 months ago", "Updated 3 weeks ago"
 * @returns ISO date string
 */
export function parseUpdateTime(timeStr: string): string {
  try {
    if (!timeStr) {
      return new Date().toISOString();
    }

    // Clean the string - remove "Updated" prefix and normalize
    const cleanStr = timeStr
      .toLowerCase()
      .replace(/^updated\s+/, '')
      .replace(/\s+ago$/, '')
      .trim();

    const now = new Date();

    // Parse different time formats
    if (cleanStr.includes('day')) {
      const days = parseInt(cleanStr.match(/(\d+)\s*days?/)?.[1] || '0');
      now.setDate(now.getDate() - days);
    } else if (cleanStr.includes('week')) {
      const weeks = parseInt(cleanStr.match(/(\d+)\s*weeks?/)?.[1] || '0');
      now.setDate(now.getDate() - weeks * 7);
    } else if (cleanStr.includes('month')) {
      const months = parseInt(cleanStr.match(/(\d+)\s*months?/)?.[1] || '0');
      now.setMonth(now.getMonth() - months);
    } else if (cleanStr.includes('year')) {
      const years = parseInt(cleanStr.match(/(\d+)\s*years?/)?.[1] || '0');
      now.setFullYear(now.getFullYear() - years);
    } else if (cleanStr.includes('hour')) {
      const hours = parseInt(cleanStr.match(/(\d+)\s*hours?/)?.[1] || '0');
      now.setHours(now.getHours() - hours);
    } else if (cleanStr.includes('minute')) {
      const minutes = parseInt(cleanStr.match(/(\d+)\s*minutes?/)?.[1] || '0');
      now.setMinutes(now.getMinutes() - minutes);
    } else {
      // If we can't parse it, assume it's recent
      logger.warn(`Could not parse time string: "${timeStr}", using current time`);
    }

    return now.toISOString();
  } catch (error) {
    logger.error(`Error parsing update time "${timeStr}":`, error);
    return new Date().toISOString();
  }
}

/**
 * Parse pull count string to numeric value
 * @param pullStr - Pull count string like "3.5M", "120K", "1.2B"
 * @returns Numeric pull count
 */
export function parsePullCount(pullStr: string): number {
  try {
    if (!pullStr) {
      return 0;
    }

    // Clean the string and extract number with suffix
    const cleanStr = pullStr.toLowerCase().trim();
    const match = cleanStr.match(/(\d+(?:\.\d+)?)\s*([kmb])?/);

    if (!match) {
      logger.warn(`Could not parse pull count: "${pullStr}"`);
      return 0;
    }

    const num = parseFloat(match[1]);
    const suffix = match[2];

    switch (suffix) {
      case 'k':
        return Math.floor(num * 1000);
      case 'm':
        return Math.floor(num * 1000000);
      case 'b':
        return Math.floor(num * 1000000000);
      default:
        return Math.floor(num);
    }
  } catch (error) {
    logger.error(`Error parsing pull count "${pullStr}":`, error);
    return 0;
  }
}

/**
 * Generate a placeholder digest for a model
 * @param modelName - The model name
 * @returns A placeholder SHA256 digest
 */
function generatePlaceholderDigest(modelName: string): string {
  // Create a simple hash-like string based on model name
  const hash = modelName
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    .toString(16)
    .padStart(8, '0');

  return `sha256:${hash}${'0'.repeat(56)}`;
}

/**
 * Validate extracted model data
 * @param model - The parsed model data
 * @returns Validation result with errors if any
 */
export function validateModelData(model: ParsedOllamaModel): ValidationResult {
  const errors: string[] = [];

  // Required fields validation
  if (!model.name || model.name.trim().length === 0) {
    errors.push('Model name is required');
  }

  if (!model.description || model.description.trim().length === 0) {
    errors.push('Model description is required');
  }

  if (!model.url || !model.url.startsWith('https://ollama.com/library/')) {
    errors.push('Valid model URL is required');
  }

  // Data type validation
  if (!Array.isArray(model.capabilities)) {
    errors.push('Capabilities must be an array');
  }

  if (!Array.isArray(model.sizes)) {
    errors.push('Sizes must be an array');
  }

  if (typeof model.pullCountNumeric !== 'number' || model.pullCountNumeric < 0) {
    errors.push('Pull count must be a non-negative number');
  }

  // Date validation
  try {
    new Date(model.modifiedAt);
  } catch {
    errors.push('Modified date must be a valid ISO string');
  }

  // Model name format validation (basic)
  if (model.name && !/^[a-zA-Z0-9\-_.]+$/.test(model.name)) {
    errors.push('Model name contains invalid characters');
  }

  // Size format validation - allow complex formats like 8x7b, 16x17b, e2b
  if (model.sizes.length > 0) {
    const invalidSizes = model.sizes.filter(
      (size) =>
        // Allow formats: 7b, 13B, 3.5b, 8x7b, 16x17b, e2b, etc.
        !/^(?:\d+(?:\.\d+)?(?:x\d+(?:\.\d+)?)?|[a-zA-Z]\d+)[bkmgtBKMGTE]?$/i.test(size),
    );
    if (invalidSizes.length > 0) {
      errors.push(`Invalid size formats: ${invalidSizes.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Transform parsed model data to match the existing app format
 * @param models - Array of parsed models
 * @returns Array of models in the expected format
 */
export function transformToAppFormat(models: ParsedOllamaModel[]): any[] {
  return models.map((model) => ({
    name: model.name,
    description: model.description,
    modifiedAt: model.modifiedAt,
    digest: model.digest,
    tags: model.tags,
    url: model.url,
    isInstalled: model.isInstalled,
    // Additional fields for enhanced functionality
    pullCount: model.pullCount,
    pullCountNumeric: model.pullCountNumeric,
    capabilities: model.capabilities,
    sizes: model.sizes,
    lastUpdated: model.lastUpdated,
  }));
}
