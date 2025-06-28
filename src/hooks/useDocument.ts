import { useState, useCallback } from 'react';
import { DocumentState, DocumentSelection, extractPlainText } from '../types';

export const useDocument = (initialContent: string = '') => {
  const [documentState, setDocumentState] = useState<DocumentState>({
    content: initialContent,
    selection: null,
    version: 0,
  });

  const updateContent = useCallback((content: string) => {
    console.log('📝 Document updateContent called with:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 200) + '...',
      currentVersion: documentState.version
    });
    
    setDocumentState(prev => ({
      ...prev,
      content,
      version: prev.version + 1,
    }));
  }, [documentState.version]);

  const updateSelection = useCallback((selection: DocumentSelection | null) => {
    console.log('🎯 Document updateSelection called with:', selection);
    setDocumentState(prev => ({
      ...prev,
      selection,
    }));
  }, []);

  const replaceSelection = useCallback((newText: string) => {
    console.log('🔄 Document replaceSelection called with:', {
      newText,
      currentSelection: documentState.selection
    });
    
    if (!documentState.selection) {
      console.warn('⚠️ No selection to replace');
      return;
    }

    const { start, end } = documentState.selection;
    const plainContent = extractPlainText(documentState.content);
    
    const newContent = 
      plainContent.slice(0, start) + 
      newText + 
      plainContent.slice(end);

    console.log('🔄 Replacing selection:', {
      originalLength: plainContent.length,
      newLength: newContent.length,
      replacedText: plainContent.slice(start, end),
      newText
    });

    updateContent(newContent);
    updateSelection(null);
  }, [documentState.content, documentState.selection, updateContent, updateSelection]);

  const insertText = useCallback((text: string, position?: number) => {
    const plainContent = extractPlainText(documentState.content);
    const insertPos = position ?? plainContent.length;
    const newContent = 
      plainContent.slice(0, insertPos) + 
      text + 
      plainContent.slice(insertPos);

    console.log('➕ Document insertText called:', {
      text,
      position: insertPos,
      originalLength: plainContent.length,
      newLength: newContent.length
    });

    updateContent(newContent);
  }, [documentState.content, updateContent]);

  // Force update the content (used when applying AI changes)
  const forceUpdateContent = useCallback((content: string) => {
    console.log('🚀 Document forceUpdateContent called with:', {
      contentLength: content.length,
      contentPreview: content.substring(0, 200) + '...',
      currentVersion: documentState.version
    });
    
    setDocumentState(prev => ({
      ...prev,
      content,
      selection: null, // Clear selection when forcing update
      version: prev.version + 1,
    }));
  }, [documentState.version]);

  return {
    ...documentState,
    updateContent,
    updateSelection,
    replaceSelection,
    insertText,
    forceUpdateContent,
  };
};