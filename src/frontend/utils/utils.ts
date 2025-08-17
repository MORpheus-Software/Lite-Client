import { ModelResponse } from './types';

export const parseResponse = (jsonString: string) => {
  // Assert the type of the parsed object.
  console.log('Raw response:', jsonString);

  // Clean up the JSON string
  let cleanedJson = jsonString.trim();

  // Remove any trailing non-JSON content after the closing brace
  const lastBraceIndex = cleanedJson.lastIndexOf('}');
  if (lastBraceIndex !== -1) {
    cleanedJson = cleanedJson.substring(0, lastBraceIndex + 1);
  }

  // Handle common malformed JSON issues
  cleanedJson = cleanedJson
    .replace(/\n\s*\n/g, '\n') // Remove empty lines
    .replace(/,\s*}/g, '}') // Remove trailing commas
    .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (error) {
    console.error('JSON parse error:', error);
    console.error('Cleaned JSON was:', cleanedJson);

    // If JSON parsing fails, try to extract text manually
    const textMatch = cleanedJson.match(/"response"\s*:\s*"([^"]+)"/);
    if (textMatch) {
      return { response: textMatch[1], action: {} };
    }

    // If it's just empty braces or whitespace, return a helpful message
    if (cleanedJson.trim() === '{}' || cleanedJson.trim() === '') {
      return {
        response:
          "I apologize, but I couldn't generate a proper response. Please try asking your question again.",
        action: {},
      };
    }

    return { response: 'error', action: {} };
  }

  if (isModelResponse(parsed)) {
    return { response: parsed.response, action: parsed.action };
  } else if (typeof parsed === 'object' && parsed !== null) {
    // Try to extract response from various formats
    const obj = parsed as any;

    // Handle nested structures like { "story": { "text": "...", "action": {} } }
    if (obj.story && typeof obj.story === 'object') {
      const story = obj.story;
      if (story.text) {
        return {
          response: story.text,
          action: story.action || {},
        };
      }
    }

    // Handle direct text fields
    if (obj.text) {
      return {
        response: obj.text,
        action: obj.action || {},
      };
    }

    // Handle message field
    if (obj.message) {
      return {
        response: obj.message,
        action: obj.action || {},
      };
    }

    // If it has content but wrong structure, extract what we can
    const keys = Object.keys(obj);
    if (keys.length > 0) {
      // Use the first string value as the response
      for (const key of keys) {
        if (typeof obj[key] === 'string' && obj[key].length > 0) {
          return {
            response: obj[key],
            action: obj.action || {},
          };
        }
      }
    }
  }

  // If all else fails, convert to string
  console.warn('Unexpected response format, converting to string:', parsed);
  return {
    response: typeof parsed === 'string' ? parsed : JSON.stringify(parsed),
    action: {},
  };
};

const isModelResponse = (object: unknown): object is ModelResponse => {
  return (
    typeof object === 'object' && object !== null && 'response' in object && 'action' in object
  );
};
