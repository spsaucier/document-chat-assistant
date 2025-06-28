import { useState, useCallback } from 'react';
import { ChatMessage, ChatState, extractPlainText, SuggestedChanges } from '../types';
import { openaiService, OpenAIMessage } from '../services/openai';

export const useChat = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
  });

  const sendMessage = useCallback(async (
    message: string,
    documentContent: string,
    selectedText?: string
  ) => {
    // Convert HTML content to plain text for display in chat
    const plainSelectedText = selectedText ? extractPlainText(selectedText) : undefined;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      timestamp: new Date(),
      documentContext: plainSelectedText,
    };

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Pass the raw HTML selectedText to the AI service, not the plain text version
      const systemPrompt = openaiService.createSystemPrompt(documentContent, selectedText);
      
      const openaiMessages: OpenAIMessage[] = [
        { role: 'system', content: systemPrompt },
        ...chatState.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: message },
      ];

      const aiResponse = await openaiService.sendMessage(openaiMessages);

      // Check if the response contains suggested changes
      const suggestedChanges = openaiService.extractSuggestedChanges(aiResponse);

      let displayContent = aiResponse;
      if (suggestedChanges) {
        // If we have suggested changes, show a simple message instead of the JSON
        displayContent = `I've analyzed your selected text and prepared some improvements. You can review the suggested changes below and apply them if you'd like.`;
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: displayContent,
        timestamp: new Date(),
        suggestedChanges: suggestedChanges || undefined,
        changesApplied: false, // Initialize as not applied
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      }));
    }
  }, [chatState.messages]);

  const applyChanges = useCallback(async (
    suggestedChanges: SuggestedChanges,
    documentContent: string,
    messageId: string // Add messageId parameter to track which message was applied
  ): Promise<string> => {
    setChatState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedDocument = await openaiService.applyChangesToDocument(documentContent, suggestedChanges);
      
      // Mark the message as having changes applied
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        messages: prev.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, changesApplied: true }
            : msg
        )
      }));
      
      return updatedDocument;
    } catch (error) {
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to apply changes',
      }));
      throw error;
    }
  }, []);

  const clearMessages = useCallback(() => {
    setChatState({
      messages: [],
      isLoading: false,
      error: null,
    });
  }, []);

  const clearError = useCallback(() => {
    setChatState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...chatState,
    sendMessage,
    applyChanges,
    clearMessages,
    clearError,
  };
};