// Utility functions for converting between HTML and Slate format
import { Descendant, Text, Node } from 'slate';
import { CustomElement, CustomText } from '../components/editor/types';

// Convert HTML to Slate value with proper parsing
export const htmlToSlate = (html: string): Descendant[] => {
  console.log('🔄 Converting HTML to Slate:', {
    htmlLength: html.length,
    htmlPreview: html.substring(0, 200) + '...'
  });

  if (!html || html.trim() === '') {
    console.log('📝 Empty HTML, returning default paragraph');
    return [{ type: 'paragraph', children: [{ text: '' }] }];
  }

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  const parseNode = (node: Node): CustomText[] => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      return text ? [{ text }] : [];
    }
    
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      const tagName = element.tagName.toLowerCase();
      
      // Handle inline formatting
      if (['strong', 'b'].includes(tagName)) {
        const children: CustomText[] = [];
        for (const child of Array.from(element.childNodes)) {
          const childTexts = parseNode(child);
          children.push(...childTexts.map(t => ({ ...t, bold: true })));
        }
        return children.length > 0 ? children : [{ text: element.textContent || '', bold: true }];
      }
      
      if (['em', 'i'].includes(tagName)) {
        const children: CustomText[] = [];
        for (const child of Array.from(element.childNodes)) {
          const childTexts = parseNode(child);
          children.push(...childTexts.map(t => ({ ...t, italic: true })));
        }
        return children.length > 0 ? children : [{ text: element.textContent || '', italic: true }];
      }

      if (tagName === 'u') {
        const children: CustomText[] = [];
        for (const child of Array.from(element.childNodes)) {
          const childTexts = parseNode(child);
          children.push(...childTexts.map(t => ({ ...t, underline: true })));
        }
        return children.length > 0 ? children : [{ text: element.textContent || '', underline: true }];
      }

      if (['s', 'strike', 'del'].includes(tagName)) {
        const children: CustomText[] = [];
        for (const child of Array.from(element.childNodes)) {
          const childTexts = parseNode(child);
          children.push(...childTexts.map(t => ({ ...t, strikethrough: true })));
        }
        return children.length > 0 ? children : [{ text: element.textContent || '', strikethrough: true }];
      }

      if (tagName === 'code') {
        const children: CustomText[] = [];
        for (const child of Array.from(element.childNodes)) {
          const childTexts = parseNode(child);
          children.push(...childTexts.map(t => ({ ...t, code: true })));
        }
        return children.length > 0 ? children : [{ text: element.textContent || '', code: true }];
      }
      
      // For other elements, recursively parse children
      const result: CustomText[] = [];
      for (const child of Array.from(element.childNodes)) {
        result.push(...parseNode(child));
      }
      return result;
    }
    
    return [];
  };
  
  const parseElement = (element: HTMLElement): CustomElement[] => {
    const tagName = element.tagName.toLowerCase();
    const results: CustomElement[] = [];
    
    // Get alignment from style
    const style = element.getAttribute('style') || '';
    let align: 'left' | 'center' | 'right' | 'justify' | undefined;
    if (style.includes('text-align: center')) align = 'center';
    else if (style.includes('text-align: right')) align = 'right';
    else if (style.includes('text-align: justify')) align = 'justify';
    
    switch (tagName) {
      case 'h1':
        const h1Children = parseNode(element);
        results.push({
          type: 'heading-one',
          align,
          children: h1Children.length > 0 ? h1Children : [{ text: element.textContent || '' }]
        });
        break;
        
      case 'h2':
        const h2Children = parseNode(element);
        results.push({
          type: 'heading-two',
          align,
          children: h2Children.length > 0 ? h2Children : [{ text: element.textContent || '' }]
        });
        break;

      case 'h3':
        const h3Children = parseNode(element);
        results.push({
          type: 'heading-three',
          align,
          children: h3Children.length > 0 ? h3Children : [{ text: element.textContent || '' }]
        });
        break;
        
      case 'blockquote':
        const blockquoteChildren: CustomText[] = [];
        for (const child of Array.from(element.childNodes)) {
          blockquoteChildren.push(...parseNode(child));
        }
        results.push({
          type: 'block-quote',
          align,
          children: blockquoteChildren.length > 0 ? blockquoteChildren : [{ text: element.textContent || '' }]
        });
        break;

      case 'pre':
        const preChildren = parseNode(element);
        results.push({
          type: 'code-block',
          align,
          children: preChildren.length > 0 ? preChildren : [{ text: element.textContent || '' }]
        });
        break;

      case 'hr':
        results.push({
          type: 'divider',
          children: [{ text: '' }]
        });
        break;
        
      case 'ul':
        const listItems = Array.from(element.querySelectorAll('li'));
        if (listItems.length > 0) {
          const items: CustomElement[] = listItems.map(li => {
            const liChildren = parseNode(li);
            return {
              type: 'list-item',
              children: liChildren.length > 0 ? liChildren : [{ text: li.textContent || '' }]
            };
          });
          results.push({
            type: 'bulleted-list',
            children: items as any
          });
        }
        break;
        
      case 'ol':
        const orderedListItems = Array.from(element.querySelectorAll('li'));
        if (orderedListItems.length > 0) {
          const items: CustomElement[] = orderedListItems.map(li => {
            const liChildren = parseNode(li);
            return {
              type: 'list-item',
              children: liChildren.length > 0 ? liChildren : [{ text: li.textContent || '' }]
            };
          });
          results.push({
            type: 'numbered-list',
            children: items as any
          });
        }
        break;
        
      case 'p':
      case 'div':
      default:
        const textChildren = parseNode(element);
        if (textChildren.length > 0) {
          results.push({
            type: 'paragraph',
            align,
            children: textChildren
          });
        } else if (tagName === 'p') {
          results.push({
            type: 'paragraph',
            align,
            children: [{ text: element.textContent || '' }]
          });
        }
        break;
    }
    
    return results;
  };
  
  const result: Descendant[] = [];
  
  for (const child of Array.from(tempDiv.children)) {
    if (child instanceof HTMLElement) {
      result.push(...parseElement(child));
    }
  }
  
  if (result.length === 0 && tempDiv.textContent) {
    result.push({
      type: 'paragraph',
      children: [{ text: tempDiv.textContent }]
    });
  }
  
  const finalResult = result.length > 0 ? result : [{ type: 'paragraph', children: [{ text: '' }] }];
  
  console.log('✅ HTML to Slate conversion complete:', {
    resultLength: finalResult.length,
    resultPreview: finalResult.slice(0, 2)
  });
  
  return finalResult;
};

// Convert Slate value to HTML
export const slateToHtml = (value: Descendant[]): string => {
  const serialize = (node: Descendant): string => {
    if (Text.isText(node)) {
      let text = node.text || '';
      if (node.code) text = `<code>${text}</code>`;
      if (node.bold) text = `<strong>${text}</strong>`;
      if (node.italic) text = `<em>${text}</em>`;
      if (node.underline) text = `<u>${text}</u>`;
      if (node.strikethrough) text = `<s>${text}</s>`;
      return text;
    }
    
    const children = node.children.map(n => serialize(n)).join('');
    const alignStyle = node.align ? ` style="text-align: ${node.align}"` : '';
    
    switch (node.type) {
      case 'paragraph':
        return `<p${alignStyle}>${children}</p>`;
      case 'heading-one':
        return `<h1${alignStyle}>${children}</h1>`;
      case 'heading-two':
        return `<h2${alignStyle}>${children}</h2>`;
      case 'heading-three':
        return `<h3${alignStyle}>${children}</h3>`;
      case 'block-quote':
        return `<blockquote${alignStyle}><p>${children}</p></blockquote>`;
      case 'code-block':
        return `<pre${alignStyle}><code>${children}</code></pre>`;
      case 'divider':
        return '<hr>';
      case 'bulleted-list':
        return `<ul>${children}</ul>`;
      case 'numbered-list':
        return `<ol>${children}</ol>`;
      case 'list-item':
        return `<li>${children}</li>`;
      default:
        return children;
    }
  };
  
  return value.map(serialize).join('\n');
};