import React from 'react';
import { ReactEditor } from 'slate-react';
import { Range } from 'slate';

interface HighlightOverlayProps {
  editor: ReactEditor;
  selectionInfo: {
    range: Range;
    text: string;
    html: string;
  } | null;
  isEditorFocused: boolean;
  editableRef: React.RefObject<HTMLDivElement>;
  highlightKey: number;
}

export const HighlightOverlay: React.FC<HighlightOverlayProps> = ({
  editor,
  selectionInfo,
  isEditorFocused,
  editableRef,
  highlightKey,
}) => {
  if (!selectionInfo || isEditorFocused) return null;
  
  try {
    const domRange = ReactEditor.toDOMRange(editor, selectionInfo.range);
    const rects = domRange.getClientRects();
    
    if (rects.length === 0) return null;
    
    const editableElement = editableRef.current;
    if (!editableElement) return null;
    
    const editableRect = editableElement.getBoundingClientRect();
    
    return (
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {Array.from(rects).map((rect, index) => {
          if (rect.width <= 0 || rect.height <= 0) return null;
          
          // Calculate positioning relative to the editable container
          const left = rect.left - editableRect.left;
          const top = rect.top - editableRect.top;
          
          // Check if the highlight rect is within the visible area
          const isVisible = (
            top + rect.height > 0 && 
            top < editableRect.height &&
            left + rect.width > 0 && 
            left < editableRect.width
          );
          
          if (!isVisible) return null;
          
          return (
            <div
              key={`${index}-${highlightKey}`}
              className="absolute"
              style={{
                left: left,
                top: top,
                width: rect.width,
                height: rect.height,
                backgroundColor: 'rgba(59, 130, 246, 0.3)',
                borderRadius: '2px',
              }}
            />
          );
        })}
      </div>
    );
  } catch (error) {
    console.warn('⚠️ Highlight overlay error:', error);
    return null;
  }
};