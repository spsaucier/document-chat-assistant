import React, { useCallback } from 'react';
import { Editable, ReactEditor } from 'slate-react';
import { Text, Element } from 'slate';
import { CustomElement, CustomText } from './types';

interface EditorContentProps {
  editor: ReactEditor;
  editableRef: React.RefObject<HTMLDivElement>;
  isEmpty: boolean;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSelectionChange: () => void;
}

export const EditorContent: React.FC<EditorContentProps> = ({
  editor,
  editableRef,
  isEmpty,
  onKeyDown,
  onFocus,
  onBlur,
  onSelectionChange,
}) => {
  // Render leaf
  const renderLeaf = useCallback((props: any) => {
    const { attributes, children, leaf } = props;
    
    let element = children;
    
    if (leaf.bold) {
      element = <strong>{element}</strong>;
    }
    
    if (leaf.italic) {
      element = <em>{element}</em>;
    }

    if (leaf.underline) {
      element = <u>{element}</u>;
    }

    if (leaf.strikethrough) {
      element = <s>{element}</s>;
    }

    if (leaf.code) {
      element = <code className="bg-gray-100 text-red-600 px-1 py-0.5 rounded text-sm font-mono">{element}</code>;
    }
    
    return <span {...attributes}>{element}</span>;
  }, []);

  // Render elements
  const renderElement = useCallback((props: any) => {
    const { attributes, children, element } = props;
    const style = element.align ? { textAlign: element.align } : {};
    
    switch (element.type) {
      case 'heading-one':
        return <h1 {...attributes} style={style} className="text-2xl font-bold mb-4 mt-6">{children}</h1>;
      case 'heading-two':
        return <h2 {...attributes} style={style} className="text-xl font-bold mb-3 mt-5">{children}</h2>;
      case 'heading-three':
        return <h3 {...attributes} style={style} className="text-lg font-semibold mb-2 mt-4">{children}</h3>;
      case 'block-quote':
        return <blockquote {...attributes} style={style} className="border-l-4 border-gray-300 pl-4 italic text-gray-700 mb-3 py-2">{children}</blockquote>;
      case 'code-block':
        return <pre {...attributes} style={style} className="bg-gray-900 text-green-400 p-4 rounded-lg mb-3 overflow-x-auto font-mono text-sm"><code>{children}</code></pre>;
      case 'divider':
        return (
          <div {...attributes} className="my-6">
            <hr className="border-gray-300" />
            {children}
          </div>
        );
      case 'bulleted-list':
        return <ul {...attributes} className="mb-3 pl-6 list-disc">{children}</ul>;
      case 'numbered-list':
        return <ol {...attributes} className="mb-3 pl-6 list-decimal">{children}</ol>;
      case 'list-item':
        return <li {...attributes} className="mb-1">{children}</li>;
      default:
        return <p {...attributes} style={style} className="mb-3">{children}</p>;
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      {isEmpty && (
        <div 
          className="absolute inset-0 p-6 pointer-events-none text-gray-400 whitespace-pre-line"
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            fontFamily: '"Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            zIndex: 1,
          }}
        >
          Start writing your document here...

You can:
• Use the enhanced toolbar for rich formatting
• Try Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline
• Select text to provide context to the AI assistant
• Use headings, lists, quotes, and code blocks for structure
• Align text left, center, right, or justify
• Ask the AI assistant to improve your writing
        </div>
      )}
      
      <div className="relative w-full h-full">
        <Editable
          ref={editableRef}
          className="w-full h-full p-6 overflow-auto focus:outline-none relative z-20"
          style={{
            minHeight: '100%',
            fontSize: '14px',
            lineHeight: '1.6',
          }}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          onBlur={onBlur}
          onSelectionChange={onSelectionChange}
        />
      </div>
    </div>
  );
};