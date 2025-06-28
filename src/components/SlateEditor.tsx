import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { createEditor, Descendant, Editor, Transforms, Node } from 'slate';
import { Slate, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { DocumentSelection } from '../types';
import { EditorHeader } from './editor/EditorHeader';
import { EditorToolbar } from './editor/EditorToolbar';
import { EditorContent } from './editor/EditorContent';
import { HighlightOverlay } from './editor/HighlightOverlay';
import { htmlToSlate, slateToHtml } from '../utils/slateConversion';
import { useEditorSelection } from '../hooks/useEditorSelection';

interface SlateEditorProps {
  content: string;
  selection: DocumentSelection | null;
  onContentChange: (content: string) => void;
  onSelectionChange: (selection: DocumentSelection | null) => void;
  hasSelection?: boolean;
  onToggleMobileChat: () => void;
  selectedText?: string;
  onReplaceContent?: (replaceFunction: (newHtml: string) => void) => void;
}

export const SlateEditor: React.FC<SlateEditorProps> = ({
  content,
  selection,
  onContentChange,
  onSelectionChange,
  hasSelection = false,
  onToggleMobileChat,
  selectedText,
  onReplaceContent,
}) => {
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  
  const [value, setValue] = useState<Descendant[]>(() => {
    console.log('🚀 SlateEditor initializing with content:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 100) + '...'
    });
    return htmlToSlate(content);
  });
  
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  
  // Use refs to track the last content to prevent circular updates
  const lastContentRef = useRef(content);
  const isInternalUpdateRef = useRef(false);
  const editableRef = useRef<HTMLDivElement>(null);

  // Use the custom selection hook
  const {
    selectionInfo,
    isEditorFocused,
    highlightKey,
    handleSelectionChange,
    handleFocus,
    handleBlur,
    clearSelection,
    updateHighlightKey,
    validateSelection,
  } = useEditorSelection(editor, onSelectionChange);

  // Content replacement method for AI changes
  const replaceEditorContent = useCallback((newHtml: string) => {
    console.log('🔄 Replacing editor content with new HTML:', {
      newHtmlLength: newHtml.length,
      newHtmlPreview: newHtml.substring(0, 200) + '...'
    });

    const newValue = htmlToSlate(newHtml);
    
    // Use Slate's proper API to replace all content
    Editor.withoutNormalizing(editor, () => {
      // Select the entire document
      const start = Editor.start(editor, []);
      const end = Editor.end(editor, []);
      const fullRange = { anchor: start, focus: end };
      
      console.log('🎯 Selecting entire document for replacement');
      Transforms.select(editor, fullRange);
      
      // Delete all existing content
      console.log('🗑️ Deleting all existing content');
      Transforms.delete(editor);
      
      // Insert the new content
      console.log('📝 Inserting new content');
      Transforms.insertNodes(editor, newValue);
      
      // Move cursor to the start of the document
      const newStart = Editor.start(editor, []);
      Transforms.select(editor, newStart);
    });
    
    // Update our local state
    setValue(newValue);
    
    // Clear any existing selection
    clearSelection();
    
    // Update the ref to prevent circular updates
    lastContentRef.current = newHtml;
    
    console.log('✅ Editor content replacement complete');
  }, [editor, clearSelection]);

  // Expose the replacement method to parent component
  useEffect(() => {
    if (onReplaceContent) {
      console.log('🔗 Providing replacement function to parent component');
      onReplaceContent(replaceEditorContent);
    }
  }, [onReplaceContent, replaceEditorContent]);

  // Update editor value when content prop changes (for external updates)
  useEffect(() => {
    // Only update if content actually changed and it's not from an internal update
    if (content !== lastContentRef.current && !isInternalUpdateRef.current) {
      console.log('🔄 External content change detected, replacing editor content');
      replaceEditorContent(content);
    }
    
    // Reset the internal update flag
    isInternalUpdateRef.current = false;
  }, [content, replaceEditorContent]);

  // Add scroll event listener to update highlights when scrolling
  useEffect(() => {
    const editableElement = editableRef.current;
    if (!editableElement) return;

    const handleScroll = () => {
      updateHighlightKey();
    };

    editableElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      editableElement.removeEventListener('scroll', handleScroll);
    };
  }, [updateHighlightKey]);

  // Update counts
  const updateCounts = useCallback((slateValue: Descendant[]) => {
    const text = slateValue.map(n => Node.string(n)).join('\n');
    setCharCount(text.length);
    setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
  }, []);

  useEffect(() => {
    updateCounts(value);
  }, [value, updateCounts]);

  // Handle value changes
  const handleChange = useCallback((newValue: Descendant[]) => {
    console.log('📝 Slate editor value changed:', {
      newValueLength: newValue.length,
      newValuePreview: newValue.slice(0, 2)
    });
    
    setValue(newValue);
    const htmlContent = slateToHtml(newValue);
    
    console.log('🔄 Converting Slate to HTML:', {
      htmlLength: htmlContent.length,
      htmlPreview: htmlContent.substring(0, 200) + '...'
    });
    
    // Mark this as an internal update to prevent circular updates
    isInternalUpdateRef.current = true;
    lastContentRef.current = htmlContent;
    
    onContentChange(htmlContent);
    updateCounts(newValue);
    
    // Validate selection after content changes
    validateSelection();
  }, [onContentChange, updateCounts, validateSelection]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key) {
        case 'z':
          if (event.shiftKey) {
            event.preventDefault();
            editor.redo();
          } else {
            event.preventDefault();
            editor.undo();
          }
          break;
        case 'y':
          event.preventDefault();
          editor.redo();
          break;
      }
    }
  }, [editor]);

  // Handle selection cleared from toolbar
  const handleSelectionCleared = useCallback(() => {
    console.log('🎯 Toolbar requested selection clear');
    clearSelection();
  }, [clearSelection]);

  // Check if editor is empty for placeholder
  const isEmpty = value.length === 1 && 
    value[0].type === 'paragraph' && 
    value[0].children.length === 1 && 
    value[0].children[0].text === '';

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <EditorHeader
        wordCount={wordCount}
        charCount={charCount}
        selectedText={selectedText}
        onToggleMobileChat={onToggleMobileChat}
      />

      {/* Enhanced Toolbar */}
      <EditorToolbar
        editor={editor}
        showMoreOptions={showMoreOptions}
        onToggleMoreOptions={() => setShowMoreOptions(!showMoreOptions)}
        onSelectionCleared={handleSelectionCleared}
      />

      {/* Editor */}
      <div className="flex-1 relative overflow-hidden">
        <Slate
          editor={editor}
          initialValue={value}
          onChange={handleChange}
        >
          <div className="relative w-full h-full">
            <EditorContent
              editor={editor}
              editableRef={editableRef}
              isEmpty={isEmpty}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onSelectionChange={handleSelectionChange}
            />
            
            <HighlightOverlay
              editor={editor}
              selectionInfo={selectionInfo}
              isEditorFocused={isEditorFocused}
              editableRef={editableRef}
              highlightKey={highlightKey}
            />
          </div>
        </Slate>
        
        {hasSelection && (
          <div className="absolute top-2 right-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full border border-blue-200 z-30">
            Text selected
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">
          Use the enhanced toolbar for rich formatting • Select text to provide context to the AI assistant • Ask for improvements, grammar fixes, and more
        </p>
      </div>
    </div>
  );
};