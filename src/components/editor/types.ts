// Define custom types for our editor
export type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'heading-three' | 'block-quote' | 'bulleted-list' | 'numbered-list' | 'list-item' | 'code-block' | 'divider';
  align?: 'left' | 'center' | 'right' | 'justify';
  children: CustomText[];
};

export type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  backgroundColor?: string;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: import('slate-react').ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}