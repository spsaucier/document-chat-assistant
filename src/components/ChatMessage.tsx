import React from 'react';
import { ChatMessage as ChatMessageType } from '../types';
import { User, Bot, Clock, FileText, Wand2, ArrowRight, CheckCircle } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onApplyChanges?: (suggestedChanges: any, messageId: string) => void; // Updated to include messageId
  isApplyingChanges?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  onApplyChanges,
  isApplyingChanges = false 
}) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? 'bg-blue-500 text-white' 
          : 'bg-gray-200 text-gray-600'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      {/* Message content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block max-w-full ${isUser ? 'text-right' : ''}`}>
          {/* Main message bubble */}
          <div className={`p-3 rounded-lg ${
            isUser
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {/* Document context indicator */}
            {message.documentContext && (
              <div className={`mb-2 p-2 rounded text-xs border-l-2 ${
                isUser 
                  ? 'bg-blue-400 border-blue-300' 
                  : 'bg-gray-200 border-gray-400'
              }`}>
                <div className="flex items-center space-x-1 mb-1">
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <span className="font-medium">Selected text:</span>
                </div>
                <div className="font-mono text-xs opacity-90 break-words">
                  "{message.documentContext.length > 100 
                    ? message.documentContext.substring(0, 100) + '...' 
                    : message.documentContext}"
                </div>
              </div>
            )}
            
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          </div>

          {/* Suggested Changes UI */}
          {message.suggestedChanges && !isUser && (
            <div className={`mt-3 border rounded-lg overflow-hidden ${
              message.changesApplied 
                ? 'border-green-300 bg-green-50' 
                : 'border-green-200 bg-green-50'
            }`}>
              {/* Header */}
              <div className={`px-3 py-2 border-b ${
                message.changesApplied 
                  ? 'bg-green-200 border-green-300' 
                  : 'bg-green-100 border-green-200'
              }`}>
                <div className="flex items-center space-x-2">
                  {message.changesApplied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-700" />
                      <span className="text-sm font-medium text-green-800">Changes Applied Successfully</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Suggested Changes</span>
                    </>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-3">
                {/* Before/After Preview */}
                <div className="space-y-3">
                  {/* Original Text */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Original:</div>
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-800">
                      <span className="line-through opacity-75">
                        {message.suggestedChanges.originalText}
                      </span>
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>

                  {/* Suggested Text */}
                  <div>
                    <div className="text-xs font-medium text-gray-600 mb-1">Suggested:</div>
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-800">
                      {message.suggestedChanges.suggestedText}
                    </div>
                  </div>

                  {/* Reasoning */}
                  {message.suggestedChanges.reasoning && (
                    <div>
                      <div className="text-xs font-medium text-gray-600 mb-1">Reasoning:</div>
                      <div className="text-xs text-gray-600 italic">
                        {message.suggestedChanges.reasoning}
                      </div>
                    </div>
                  )}
                </div>

                {/* Apply Button or Applied Status */}
                <div className="mt-4 pt-3 border-t border-green-200">
                  {message.changesApplied ? (
                    <div className="w-full bg-green-200 text-green-800 py-2 px-4 rounded-lg flex items-center justify-center space-x-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Changes have been applied to your document</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => onApplyChanges?.(message.suggestedChanges, message.id)}
                      disabled={isApplyingChanges}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
                    >
                      {isApplyingChanges ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Applying Changes...</span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4" />
                          <span>Apply Changes</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className={`flex items-center space-x-1 mt-1 text-xs text-gray-500 ${
          isUser ? 'justify-end' : ''
        }`}>
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>{message.timestamp.toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};