import { useState, useCallback } from 'react';
import { Editor, Range } from 'slate';
import { ReactEditor } from 'slate-react';
import { DocumentSelection } from '../types';
import { slateToHtml } from '../utils/slateConversion';

interface SelectionInfo {
  range: Range;
  text: string;
  html: string;
}

export const useEditorSelection = (
  editor: ReactEditor,
  onSelectionChange: (selection: DocumentSelection | null) => void
) => {
  const [selectionInfo, setSelectionInfo] = useState<SelectionInfo | null>(null);
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [highlightKey, setHighlightKey] = useState(0);

  const handleSelectionChange = useCallback(() => {
    const { selection: editorSelection } = editor;
    
    console.log('🎯 Slate selection changed:', {
      hasSelection: !!editorSelection,
      isCollapsed: editorSelection ? Range.isCollapsed(editorSelection) : null,
      isEditorFocused
    });
    
    if (!editorSelection || Range.isCollapsed(editorSelection)) {
      if (isEditorFocused) {
        console.log('🎯 Clearing selection (no selection or collapsed)');
        setSelectionInfo(null);
        onSelectionChange(null);
      }
      return;
    }

    if (isEditorFocused) {
      try {
        const selectedText = Editor.string(editor, editorSelection);
        const selectedFragment = Editor.fragment(editor, editorSelection);
        const selectedHtml = slateToHtml(selectedFragment);
        
        console.log('🎯 New selection captured:', {
          selectedTextLength: selectedText.length,
          selectedTextPreview: selectedText.substring(0, 50) + '...',
          selectedHtmlLength: selectedHtml.length
        });
        
        const newSelectionInfo = {
          range: { ...editorSelection },
          text: selectedText,
          html: selectedHtml,
        };
        
        setSelectionInfo(newSelectionInfo);
        
        onSelectionChange({
          start: 0,
          end: selectedText.length,
          text: selectedHtml,
        });
      } catch (error) {
        console.warn('⚠️ Selection error:', error);
        setSelectionInfo(null);
        onSelectionChange(null);
      }
    }
  }, [editor, onSelectionChange, isEditorFocused]);

  const handleFocus = useCallback(() => {
    console.log('🎯 Slate editor focused');
    setIsEditorFocused(true);
    if (selectionInfo) {
      try {
        setTimeout(() => {
          if (Editor.hasPath(editor, selectionInfo.range.anchor.path) && 
              Editor.hasPath(editor, selectionInfo.range.focus.path)) {
            editor.select(selectionInfo.range);
          }
        }, 10);
      } catch (error) {
        console.warn('⚠️ Focus selection restore error:', error);
      }
    }
  }, [editor, selectionInfo]);

  const handleBlur = useCallback(() => {
    console.log('🎯 Slate editor blurred');
    setIsEditorFocused(false);
    if (editor.selection && !Range.isCollapsed(editor.selection)) {
      try {
        const selectedText = Editor.string(editor, editor.selection);
        const selectedFragment = Editor.fragment(editor, editor.selection);
        const selectedHtml = slateToHtml(selectedFragment);
        
        console.log('🎯 Preserving selection on blur:', {
          selectedTextLength: selectedText.length,
          selectedTextPreview: selectedText.substring(0, 50) + '...'
        });
        
        const newSelectionInfo = {
          range: { ...editor.selection },
          text: selectedText,
          html: selectedHtml,
        };
        
        setSelectionInfo(newSelectionInfo);
        
        onSelectionChange({
          start: 0,
          end: selectedText.length,
          text: selectedHtml,
        });
      } catch (error) {
        console.warn('⚠️ Blur selection error:', error);
      }
    }
  }, [editor, onSelectionChange]);

  const clearSelection = useCallback(() => {
    setSelectionInfo(null);
    onSelectionChange(null);
  }, [onSelectionChange]);

  const updateHighlightKey = useCallback(() => {
    setHighlightKey(prev => prev + 1);
  }, []);

  const validateSelection = useCallback(() => {
    if (selectionInfo) {
      try {
        if (!Editor.hasPath(editor, selectionInfo.range.anchor.path) || 
            !Editor.hasPath(editor, selectionInfo.range.focus.path)) {
          console.log('🎯 Clearing invalid selection');
          clearSelection();
        }
      } catch (error) {
        console.warn('⚠️ Selection validation error:', error);
        clearSelection();
      }
    }
  }, [selectionInfo, editor, clearSelection]);

  return {
    selectionInfo,
    isEditorFocused,
    highlightKey,
    handleSelectionChange,
    handleFocus,
    handleBlur,
    clearSelection,
    updateHighlightKey,
    validateSelection,
  };
};