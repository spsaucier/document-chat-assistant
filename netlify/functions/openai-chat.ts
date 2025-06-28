import { Handler } from '@netlify/functions';

interface OpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RequestBody {
  messages: OpenAIMessage[];
  type?: 'chat' | 'apply-changes';
  documentHtml?: string;
  suggestedChanges?: {
    originalText: string;
    suggestedText: string;
    reasoning?: string;
  };
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  if (!OPENAI_API_KEY) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'OpenAI API key not configured' }),
    };
  }

  try {
    const body: RequestBody = JSON.parse(event.body || '{}');
    const { messages, type = 'chat', documentHtml, suggestedChanges } = body;

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Messages array is required' }),
      };
    }

    // Handle document changes application
    if (type === 'apply-changes' && documentHtml && suggestedChanges) {
      const changeMessages: OpenAIMessage[] = [
        {
          role: 'system',
          content: `You are a precise document editor. You will receive an HTML document and specific text changes to apply.

Your task:
1. Find the EXACT original text in the document
2. Replace it with the suggested text
3. Preserve ALL other formatting and content
4. Return ONLY the complete updated HTML document

CRITICAL: You must respond with ONLY the updated HTML document. No JSON, no explanations, no additional text - just the raw HTML.

The original text to find and replace will be provided as plain text, but you need to find it within the HTML structure and replace it while preserving the HTML formatting around it.`
        },
        {
          role: 'user',
          content: `Please find and replace this text in the document:

FIND THIS EXACT TEXT: "${suggestedChanges.originalText}"
REPLACE WITH: "${suggestedChanges.suggestedText}"

DOCUMENT HTML:
${documentHtml}

Return only the updated HTML document.`
        }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: changeMessages,
          max_tokens: 2000,
          temperature: 0.1, // Lower temperature for more precise edits
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let result = data.choices[0]?.message?.content || 'No response received';

      // Clean up any potential markdown formatting
      result = result.trim();
      if (result.startsWith('```html')) {
        result = result.replace(/^```html\s*/, '').replace(/\s*```$/, '');
      } else if (result.startsWith('```')) {
        result = result.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      return {
        statusCode: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: result }),
      };
    }

    // Handle regular chat messages
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages,
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || 'No response received';

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to process request' 
      }),
    };
  }
};