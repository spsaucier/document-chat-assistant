// Simplified JSON parsing utilities for OpenAI responses
import { SuggestedChanges } from '../types';

interface ParsedJSON {
  type?: string;
  originalText?: string;
  suggestedText?: string;
  reasoning?: string;
}

// Clean and normalize JSON string
const cleanJsonString = (jsonStr: string): string => {
  return jsonStr
    .trim()
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');
};

// Try to parse JSON with error handling
const tryParseJson = (jsonStr: string): ParsedJSON | null => {
  try {
    const parsed = JSON.parse(jsonStr);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
};

// Extract JSON using regex patterns
const extractJsonWithRegex = (text: string): ParsedJSON | null => {
  const patterns = [
    // Complete JSON objects with text_change type
    /\{\s*"type"\s*:\s*"text_change"[\s\S]*?\}/g,
    // Objects with required fields
    /\{\s*"originalText"[\s\S]*?"suggestedText"[\s\S]*?\}/g,
    // Any complete JSON object
    /\{[\s\S]*?\}/g,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const cleaned = cleanJsonString(match);
        const parsed = tryParseJson(cleaned);
        
        if (parsed && parsed.originalText && parsed.suggestedText) {
          return parsed;
        }
      }
    }
  }

  return null;
};

// Extract key-value pairs manually as fallback
const extractManualKeyValues = (text: string): ParsedJSON | null => {
  const originalTextMatch = text.match(/"originalText"\s*:\s*"([^"]*?)"/);
  const suggestedTextMatch = text.match(/"suggestedText"\s*:\s*"([^"]*?)"/);
  const reasoningMatch = text.match(/"reasoning"\s*:\s*"([^"]*?)"/);

  if (originalTextMatch && suggestedTextMatch) {
    return {
      type: 'text_change',
      originalText: originalTextMatch[1],
      suggestedText: suggestedTextMatch[1],
      reasoning: reasoningMatch ? reasoningMatch[1] : undefined
    };
  }

  return null;
};

// Main function to extract suggested changes from AI response
export const extractSuggestedChanges = (response: string): SuggestedChanges | null => {
  console.log('🔍 Extracting suggested changes from response:', {
    responseLength: response.length,
    responsePreview: response.substring(0, 300) + '...'
  });

  const cleanedResponse = cleanJsonString(response);

  // Try direct parsing first
  const directParsed = tryParseJson(cleanedResponse);
  if (directParsed && directParsed.originalText && directParsed.suggestedText) {
    console.log('✅ Successfully parsed entire response as JSON');
    return {
      originalText: directParsed.originalText,
      suggestedText: directParsed.suggestedText,
      reasoning: directParsed.reasoning
    };
  }

  // Try regex extraction
  const regexParsed = extractJsonWithRegex(response);
  if (regexParsed) {
    console.log('✅ Successfully extracted JSON using regex patterns');
    return {
      originalText: regexParsed.originalText!,
      suggestedText: regexParsed.suggestedText!,
      reasoning: regexParsed.reasoning
    };
  }

  // Try manual extraction as fallback
  const manualParsed = extractManualKeyValues(response);
  if (manualParsed) {
    console.log('✅ Successfully extracted JSON manually');
    return {
      originalText: manualParsed.originalText!,
      suggestedText: manualParsed.suggestedText!,
      reasoning: manualParsed.reasoning
    };
  }

  console.log('ℹ️ No valid suggested changes found, treating as regular text response');
  return null;
};