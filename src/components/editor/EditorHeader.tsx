import React from 'react';
import { FileText, Type, AlignLeft, MessageSquare } from 'lucide-react';

interface EditorHeaderProps {
  wordCount: number;
  charCount: number;
  hasSelection: boolean;
  selectedText?: string;
  onToggleMobileChat: () => void;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  wordCount,
  charCount,
  hasSelection,
  selectedText,
  onToggleMobileChat,
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center space-x-2">
        <FileText className="w-5 h-5 text-gray-600" />
        <h2 className="font-semibold text-gray-800">Document Chat Assistant</h2>
      </div>
      <div className="flex items-center space-x-4">
        {/* Hide word count on mobile */}
        <div className="hidden md:flex text-sm text-gray-500 items-center space-x-1">
          <Type className="w-4 h-4" />
          <span>{wordCount} words, {charCount} chars</span>
        </div>
        {hasSelection && (
          <div className="text-sm text-gray-500 flex items-center space-x-1">
            <AlignLeft className="w-4 h-4" />
            <span>Text selected</span>
          </div>
        )}
        
        <button
          onClick={onToggleMobileChat}
          className="lg:hidden bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <MessageSquare className="w-4 h-4" />
          <span>AI Chat</span>
          {selectedText && (
            <div className="bg-blue-400 text-blue-100 text-xs px-2 py-0.5 rounded-full">
              Selected
            </div>
          )}
        </button>
      </div>
    </div>
  );
};