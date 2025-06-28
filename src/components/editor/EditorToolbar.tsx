import React from 'react';
import { Editor, Element, Transforms } from 'slate';
import { ReactEditor } from 'slate-react';
import { 
  Bold, Italic, List, ListOrdered, Quote, Undo, Redo, 
  Underline, Strikethrough, AlignCenter, AlignRight, AlignJustify, 
  Heading1, Heading2, Heading3, Code, Link, Image, Table, 
  SeparatorVertical as Separator, Palette, MoreHorizontal, AlignLeft 
} from 'lucide-react';
import { CustomElement } from './types';

interface EditorToolbarProps {
  editor: ReactEditor;
  showMoreOptions: boolean;
  onToggleMoreOptions: () => void;
}

// Helper functions
const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor);
  return marks ? marks[format as keyof typeof marks] === true : false;
};

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

const isBlockActive = (editor: Editor, format: string) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => !Editor.isEditor(n) && Element.isElement(n) && n.type === format,
    })
  );

  return !!match;
};

const isAlignmentActive = (editor: Editor, alignment: string) => {
  const { selection } = editor;
  if (!selection) return false;

  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: n => !Editor.isEditor(n) && Element.isElement(n) && (n as CustomElement).align === alignment,
    })
  );

  return !!match;
};

const toggleBlock = (editor: Editor, format: string) => {
  const isActive = isBlockActive(editor, format);
  const isList = ['numbered-list', 'bulleted-list'].includes(format);

  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && Element.isElement(n) && ['numbered-list', 'bulleted-list'].includes(n.type),
    split: true,
  });

  const newProperties: Partial<CustomElement> = {
    type: isActive ? 'paragraph' : isList ? 'list-item' : (format as CustomElement['type']),
  };

  Transforms.setNodes<CustomElement>(editor, newProperties);

  if (!isActive && isList) {
    const block: CustomElement = { type: format as 'numbered-list' | 'bulleted-list', children: [] };
    Transforms.wrapNodes(editor, block);
  }
};

const toggleAlignment = (editor: Editor, alignment: 'left' | 'center' | 'right' | 'justify') => {
  const isActive = isAlignmentActive(editor, alignment);
  
  Transforms.setNodes<CustomElement>(
    editor,
    { align: isActive ? undefined : alignment },
    { match: n => !Editor.isEditor(n) && Element.isElement(n) }
  );
};

const insertDivider = (editor: Editor) => {
  const divider: CustomElement = {
    type: 'divider',
    children: [{ text: '' }],
  };
  
  Transforms.insertNodes(editor, divider);
  Transforms.insertNodes(editor, {
    type: 'paragraph',
    children: [{ text: '' }],
  });
};

const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}> = ({ onClick, isActive = false, title, children, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex-shrink-0 p-2 rounded transition-colors ${
      isActive
        ? 'text-blue-600 bg-blue-100'
        : disabled
        ? 'text-gray-400 cursor-not-allowed opacity-50'
        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
    }`}
    title={title}
  >
    {children}
  </button>
);

const ToolbarSeparator: React.FC = () => (
  <div className="flex-shrink-0 w-px h-6 bg-gray-300 mx-2" />
);

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  showMoreOptions,
  onToggleMoreOptions,
}) => {
  const handleFormat = (format: string, type: 'mark' | 'block' | 'alignment') => {
    if (type === 'mark') {
      toggleMark(editor, format);
    } else if (type === 'block') {
      toggleBlock(editor, format);
    } else if (type === 'alignment') {
      toggleAlignment(editor, format as 'left' | 'center' | 'right' | 'justify');
    }
    ReactEditor.focus(editor);
  };

  return (
    <div className="border-b border-gray-100 bg-white">
      {/* Main Toolbar Row */}
      <div className="flex items-center justify-between">
        {/* Scrollable toolbar content */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex items-center space-x-1 p-2 min-w-max">
            {/* History */}
            <ToolbarButton
              onClick={() => editor.undo()}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.redo()}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarSeparator />
            
            {/* Headings */}
            <ToolbarButton
              onClick={() => handleFormat('heading-one', 'block')}
              isActive={isBlockActive(editor, 'heading-one')}
              title="Heading 1"
            >
              <Heading1 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat('heading-two', 'block')}
              isActive={isBlockActive(editor, 'heading-two')}
              title="Heading 2"
            >
              <Heading2 className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat('heading-three', 'block')}
              isActive={isBlockActive(editor, 'heading-three')}
              title="Heading 3"
            >
              <Heading3 className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarSeparator />
            
            {/* Text Formatting */}
            <ToolbarButton
              onClick={() => handleFormat('bold', 'mark')}
              isActive={isMarkActive(editor, 'bold')}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat('italic', 'mark')}
              isActive={isMarkActive(editor, 'italic')}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat('underline', 'mark')}
              isActive={isMarkActive(editor, 'underline')}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat('strikethrough', 'mark')}
              isActive={isMarkActive(editor, 'strikethrough')}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat('code', 'mark')}
              isActive={isMarkActive(editor, 'code')}
              title="Inline Code (Ctrl+`)"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarSeparator />
            
            {/* Alignment */}
            <ToolbarButton
              onClick={() => handleFormat('left', 'alignment')}
              isActive={isAlignmentActive(editor, 'left') || (!isAlignmentActive(editor, 'center') && !isAlignmentActive(editor, 'right') && !isAlignmentActive(editor, 'justify'))}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat('center', 'alignment')}
              isActive={isAlignmentActive(editor, 'center')}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat('right', 'alignment')}
              isActive={isAlignmentActive(editor, 'right')}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat('justify', 'alignment')}
              isActive={isAlignmentActive(editor, 'justify')}
              title="Justify"
            >
              <AlignJustify className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarSeparator />
            
            {/* Lists */}
            <ToolbarButton
              onClick={() => handleFormat('bulleted-list', 'block')}
              isActive={isBlockActive(editor, 'bulleted-list')}
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat('numbered-list', 'block')}
              isActive={isBlockActive(editor, 'numbered-list')}
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolbarButton>
            
            <ToolbarSeparator />
            
            {/* Block Elements */}
            <ToolbarButton
              onClick={() => handleFormat('block-quote', 'block')}
              isActive={isBlockActive(editor, 'block-quote')}
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => handleFormat('code-block', 'block')}
              isActive={isBlockActive(editor, 'code-block')}
              title="Code Block"
            >
              <Code className="w-4 h-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => insertDivider(editor)}
              title="Insert Divider"
            >
              <Separator className="w-4 h-4" />
            </ToolbarButton>
          </div>
        </div>

        {/* More Options Toggle - Fixed on the right */}
        <div className="flex-shrink-0 p-2 border-l border-gray-100">
          <ToolbarButton
            onClick={onToggleMoreOptions}
            isActive={showMoreOptions}
            title="More Options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </ToolbarButton>
        </div>
      </div>

      {/* Extended Options Row */}
      {showMoreOptions && (
        <div className="border-t border-gray-100">
          <div className="overflow-x-auto">
            <div className="flex items-center space-x-1 p-2 min-w-max">
              <span className="text-xs text-gray-500 font-medium mr-3 flex-shrink-0">More Tools:</span>
              
              <ToolbarButton
                onClick={() => {}}
                title="Insert Link (Coming Soon)"
                disabled
              >
                <Link className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {}}
                title="Insert Image (Coming Soon)"
                disabled
              >
                <Image className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {}}
                title="Insert Table (Coming Soon)"
                disabled
              >
                <Table className="w-4 h-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {}}
                title="Text Color (Coming Soon)"
                disabled
              >
                <Palette className="w-4 h-4" />
              </ToolbarButton>
              
              <div className="text-xs text-gray-400 ml-4 flex-shrink-0">
                Additional features coming soon
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};