import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatMessage as ChatMessageType, SuggestedChanges } from '../types';
import { Send, MessageSquare, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { extractPlainText } from '../types';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  isLoading: boolean;
  error: string | null;
  selectedText?: string;
  onSendMessage: (message: string) => void;
  onApplyChanges: (suggestedChanges: SuggestedChanges, messageId: string) => Promise<void>;
  onClearMessages: () => void;
  onClearError: () => void;
  isMobile?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isLoading,
  error,
  selectedText,
  onSendMessage,
  onApplyChanges,
  onClearMessages,
  onClearError,
  isMobile = false,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [applyingChanges, setApplyingChanges] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleApplyChanges = async (suggestedChanges: SuggestedChanges, messageId: string) => {
    setApplyingChanges(true);
    try {
      await onApplyChanges(suggestedChanges, messageId);
    } catch (error) {
      console.error('Failed to apply changes:', error);
    } finally {
      setApplyingChanges(false);
    }
  };

  // Extract plain text from selected HTML for preview
  const selectedPlainText = selectedText ? extractPlainText(selectedText) : '';

  return (
    <div className="h-full flex flex-col bg-white" data-chat-interface>
      {/* Messages Container */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageSquare className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-center mb-2">Start a conversation with your AI assistant</p>
              <p className="text-sm text-center opacity-75">
                Select text in your document to provide context for better assistance
              </p>
              {selectedText && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    💡 Try asking about your selected text:
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• "Improve this text"</li>
                    <li>• "Make this more professional"</li>
                    <li>• "Fix grammar and style"</li>
                    <li>• "Rewrite this section"</li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  onApplyChanges={handleApplyChanges}
                  isApplyingChanges={applyingChanges}
                />
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block bg-gray-100 text-gray-600 p-3 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-pulse">
                          {selectedText ? 'Analyzing selected text...' : 'Thinking...'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error message */}
        {error && (
          <div className="flex-shrink-0 mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={onClearError}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Selected Text Preview */}
        {selectedPlainText && (
          <div className="flex-shrink-0 mx-4 mb-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs font-medium text-blue-800 mb-2">Selected text context:</div>
              <div 
                className="text-sm text-blue-700 relative overflow-hidden"
                style={{ 
                  maxHeight: '4.5rem', // ~3 lines at 1.5rem line-height
                  lineHeight: '1.5rem'
                }}
              >
                <div className="whitespace-pre-wrap break-words">
                  {selectedPlainText}
                </div>
                {/* Fade to white at bottom if content overflows */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-blue-50 to-transparent pointer-events-none"
                  style={{
                    display: selectedPlainText.length > 150 ? 'block' : 'none' // Show fade for longer text
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200">
          {/* Mobile clear button */}
          {isMobile && messages.length > 0 && (
            <div className="mb-3 flex justify-end">
              <button
                onClick={onClearMessages}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear chat</span>
              </button>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedText ? "Ask about the selected text or request changes..." : "Ask your AI assistant anything..."}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={isMobile ? 2 : 1}
                disabled={isLoading || applyingChanges}
              />
              {selectedText && (
                <p className="text-xs text-gray-500 mt-1">
                  💡 Try: "Improve this", "Fix grammar", "Make it more professional"
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || applyingChanges}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1"
            >
              {isLoading || applyingChanges ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};