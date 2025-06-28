import { extractSuggestedChanges } from '../utils/jsonParser';

export interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SuggestedChanges {
  originalText: string;
  suggestedText: string;
  reasoning?: string;
}

// Helper function to extract plain text from HTML
const extractPlainText = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

export class OpenAIService {
  private apiUrl: string;

  constructor() {
    // Use the Netlify function endpoint
    this.apiUrl = '/.netlify/functions/openai-chat';
  }

  async sendMessage(messages: OpenAIMessage[]): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          type: 'chat'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content || 'No response received';
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error instanceof Error ? error : new Error('Failed to get AI response');
    }
  }

  async applyChangesToDocument(documentHtml: string, suggestedChanges: SuggestedChanges): Promise<string> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [], // Not used for apply-changes type
          type: 'apply-changes',
          documentHtml,
          suggestedChanges
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.content;
      
      // Validate that we have HTML content
      if (!result || !result.includes('<') || !result.includes('>')) {
        throw new Error('Invalid HTML response from AI');
      }
      
      return result;
    } catch (error) {
      console.error('Error applying changes:', error);
      throw new Error('Failed to apply changes to document');
    }
  }

  createSystemPrompt(documentContent: string, selectedText?: string): string {
    // Convert HTML content to plain text for the AI
    const plainDocumentContent = extractPlainText(documentContent);
    const plainSelectedText = selectedText ? extractPlainText(selectedText) : undefined;

    let prompt = `You are an intelligent document assistant. You can help users edit, improve, and work with their rich text documents.

FULL DOCUMENT CONTEXT:
"""
${plainDocumentContent}
"""`;

    if (plainSelectedText && plainSelectedText.trim()) {
      prompt += `

SELECTED TEXT (user is asking about this specific portion):
"""
${plainSelectedText}
"""

The user has selected the above text and is asking about it. Please focus your response on this selected text while considering the full document context.

IMPORTANT: If the user is requesting changes, edits, improvements, or replacements to the selected text, you MUST respond with ONLY a JSON object in this exact format:

{
  "type": "text_change",
  "originalText": "${plainSelectedText.replace(/"/g, '\\"')}",
  "suggestedText": "your improved/changed version here",
  "reasoning": "brief explanation of why you made these changes"
}

DO NOT include any other text, explanations, or formatting in your response when providing suggested changes - ONLY the JSON object.

If the user is asking questions, requesting explanations, or not asking for text changes, respond normally with helpful text (not JSON).`;
    }

    prompt += `

When providing regular assistance (not text changes):
1. Consider the full document context
2. Be specific about what should be changed
3. Provide clear explanations
4. Keep suggestions contextually appropriate
5. Consider that the document supports rich text formatting

You can help with:
- Editing and improving text
- Grammar and style corrections
- Content suggestions and expansions
- Restructuring and organization
- Formatting recommendations
- Converting between different text formats
- Answering questions about the content`;

    return prompt;
  }

  // Use the simplified JSON parser
  extractSuggestedChanges(response: string): SuggestedChanges | null {
    return extractSuggestedChanges(response);
  }
}

export const openaiService = new OpenAIService();