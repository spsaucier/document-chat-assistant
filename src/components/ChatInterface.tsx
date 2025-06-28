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

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      // Set height based on scrollHeight, with min and max constraints
      const newHeight = Math.min(Math.max(textarea.scrollHeight, 60), 120); // Min 60px, max 120px
      textarea.style.height = `${newHeight}px`;
    }
  }, [inputValue]);

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
      {/* Messages Container - Use flex-1 to take remaining space */}
      <div className="flex-1 min-h-0 overflow-hidden h-[calc(100vh-2rem)]">
        <div className="h-full overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
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
            <div className="flex flex-col min-h-full">
              {/* Spacer to push messages to bottom when there are few messages */}
              <div className="flex-1 min-h-0"></div>
              
              <div className="space-y-6">
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
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Error message - Fixed position above input */}
      {error && (
        <div className="flex-shrink-0 mx-6 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
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

      {/* Selected Text Preview - Fixed position above input */}
      {selectedPlainText && (
        <div className="flex-shrink-0 mx-6 mb-3">
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

      {/* Input Section - Fixed at bottom with proper spacing */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white">
        {/* Mobile clear button */}
        {isMobile && messages.length > 0 && (
          <div className="px-6 pt-3 pb-0 flex justify-end">
            <button
              onClick={onClearMessages}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors flex items-center space-x-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear chat</span>
            </button>
          </div>
        )}

        {/* Hint text - moved above input */}
        {selectedText && (
          <div className="px-6 pt-3 pb-0">
            <p className="text-xs text-gray-500">
              💡 Try: "Improve this", "Fix grammar", "Make it more professional"
            </p>
          </div>
        )}
        
        {/* Input form - properly spaced */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedText ? "Ask about the selected text or request changes..." : "Ask your AI assistant anything..."}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                style={{ 
                  minHeight: '60px',
                  maxHeight: '120px',
                  height: '60px' // Initial height
                }}
                disabled={isLoading || applyingChanges}
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading || applyingChanges}
              className="flex-shrink-0 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              style={{ height: '60px', minWidth: '60px' }}
            >
              {isLoading || applyingChanges ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};