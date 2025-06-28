export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  documentContext?: string;
  suggestedChanges?: SuggestedChanges;
  changesApplied?: boolean; // New field to track if changes were applied
}

export interface SuggestedChanges {
  originalText: string;
  suggestedText: string;
  reasoning?: string;
}

export interface DocumentSelection {
  start: number;
  end: number;
  text: string;
}

export interface DocumentState {
  content: string;
  selection: DocumentSelection | null;
  version: number;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// Helper function to extract plain text from HTML content
export const extractPlainText = (html: string): string => {
  // Create a temporary div to parse HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

// Helper function to get text length from HTML content
export const getTextLength = (html: string): number => {
  return extractPlainText(html).length;
};