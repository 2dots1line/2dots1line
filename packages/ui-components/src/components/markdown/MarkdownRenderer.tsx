/**
 * MarkdownRenderer - Atomic component for rendering AI-generated markdown content
 * Based on legacy chat.css formatting but designed for reusability across V7 system
 */

import React from 'react';

import { cn } from '../../utils/cn';

export interface MarkdownRendererProps {
  content: string;
  className?: string;
  variant?: 'chat' | 'artifact' | 'card' | 'dashboard';
  compact?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
  variant = 'chat',
  compact = false
}) => {
  const formattedContent = formatMarkdownContent(content);
  
  const baseClasses = "markdown-content";
  const variantClasses = {
    chat: "markdown-chat",
    artifact: "markdown-artifact", 
    card: "markdown-card",
    dashboard: "markdown-dashboard"
  };
  
  const compactClasses = compact ? "markdown-compact" : "";
  
  return (
    <div 
      className={cn(baseClasses, variantClasses[variant], compactClasses, className)}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};

/**
 * Format markdown content to HTML based on legacy chat.js formatting
 * Supports: bold, italic, lists (nested), paragraphs, line breaks
 */
function formatMarkdownContent(text: string): string {
  if (!text) return '';

  let formattedText = text;

  // Phase 1: Split text into paragraphs and process each one
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length === 0) return '';
  
  // If we have multiple paragraphs, wrap each in <p> tags
  if (paragraphs.length > 1) {
    formattedText = paragraphs.map(p => `<p>${p.trim()}</p>`).join('');
  } else {
    // Single paragraph - check if it contains lists
    const trimmedText = paragraphs[0].trim();
    if (trimmedText.includes('- ') || trimmedText.includes('* ') || /^\d+\.\s/.test(trimmedText)) {
      // Contains lists, don't wrap in p tags
      formattedText = trimmedText;
    } else {
      // Regular text, wrap in p tag
      formattedText = `<p>${trimmedText}</p>`;
    }
  }
  
  // Convert remaining single line breaks to <br>
  formattedText = formattedText.replace(/\n/g, '<br>');
  formattedText = formattedText.replace(/"message-list">/g, '');

  // Phase 2: Process Lists
  formattedText = processLists(formattedText);

  // Phase 3: Inline Formatting
  // Bold text (**...**)
  formattedText = formattedText.replace(/\*\*([^*<>]+)\*\*/g, '<strong>$1</strong>');
  
  // Italic text (*...*) - simplified regex to avoid over-restrictive lookbehind/lookahead
  formattedText = formattedText.replace(/\*([^*<>]+)\*/g, '<em>$1</em>');

  // Phase 4: Cleanup
  formattedText = formattedText.replace(/<ul class="message-list"[^>]*><\/ul>/g, '');
  formattedText = formattedText.replace(/<ol class="message-list"[^>]*><\/ol>/g, '');
  formattedText = formattedText.replace(/<br><br>/g, '<br>');
  formattedText = formattedText.replace(/<\/ul><br>/g, '</ul>');
  formattedText = formattedText.replace(/<\/ol><br>/g, '</ol>');
  
  // Clean up empty paragraphs
  formattedText = formattedText.replace(/<p><\/p>/g, '');
  formattedText = formattedText.replace(/<p>\s*<\/p>/g, '');

  return formattedText;
}

function processLists(text: string): string {
  // Process bullet lists with hierarchy
  const lines = text.split('<br>');
  let result = '';
  let inBulletList = false;
  let indentStack: number[] = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const leadingSpaces = line.search(/\S|$/);
    const currentIndent = Math.floor(leadingSpaces / 2);
    
    const bulletMatch = trimmedLine.match(/^([*-] )(.*)/);
    
    if (bulletMatch) {
      if (!inBulletList) {
        result += '<ul class="message-list">';
        inBulletList = true;
        indentStack = [currentIndent];
      } else {
        if (currentIndent > indentStack[indentStack.length - 1]) {
          result += '<ul class="message-list">';
          indentStack.push(currentIndent);
        } else if (currentIndent < indentStack[indentStack.length - 1]) {
          while (indentStack.length > 0 && currentIndent < indentStack[indentStack.length - 1]) {
            result += '</li></ul>';
            indentStack.pop();
          }
          result += '</li>';
        } else {
          result += '</li>';
        }
      }
      
      result += `<li>${bulletMatch[2]}`;
    } else {
      if (inBulletList) {
        while (indentStack.length > 0) {
          result += '</li></ul>';
          indentStack.pop();
        }
        inBulletList = false;
      }
      
      if (trimmedLine || !result.endsWith('</ul>')) {
        result += line + (index < lines.length - 1 ? '<br>' : '');
      } else {
        result += line;
      }
    }
  });
  
  if (inBulletList) {
    while (indentStack.length > 0) {
      result += '</li></ul>';
      indentStack.pop();
    }
  }
  
  // Process numbered lists similarly
  return processNumberedLists(result);
}

function processNumberedLists(text: string): string {
  const lines = text.split('<br>');
  let result = '';
  let inNumberedList = false;
  let indentStack: number[] = [];
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.includes('<ul') || trimmedLine.includes('<ol') || 
        trimmedLine.includes('</ul>') || trimmedLine.includes('</ol>') ||
        trimmedLine.includes('<li>') || trimmedLine.includes('</li>')) {
      result += line + (index < lines.length - 1 ? '<br>' : '');
      return;
    }
    
    const leadingSpaces = line.search(/\S|$/);
    const currentIndent = Math.floor(leadingSpaces / 2);
    const numberMatch = trimmedLine.match(/^(\d+\.\s)(.*)/);
    
    if (numberMatch) {
      if (!inNumberedList) {
        result += '<ol class="message-list">';
        inNumberedList = true;
        indentStack = [currentIndent];
      } else {
        if (currentIndent > indentStack[indentStack.length - 1]) {
          result += '<ol class="message-list">';
          indentStack.push(currentIndent);
        } else if (currentIndent < indentStack[indentStack.length - 1]) {
          while (indentStack.length > 0 && currentIndent < indentStack[indentStack.length - 1]) {
            result += '</li></ol>';
            indentStack.pop();
          }
          result += '</li>';
        } else {
          result += '</li>';
        }
      }
      
      result += `<li>${numberMatch[2]}`;
    } else {
      if (inNumberedList) {
        while (indentStack.length > 0) {
          result += '</li></ol>';
          indentStack.pop();
        }
        inNumberedList = false;
      }
      
      if (trimmedLine || !result.endsWith('</ol>')) {
        result += line + (index < lines.length - 1 ? '<br>' : '');
      } else {
        result += line;
      }
    }
  });
  
  if (inNumberedList) {
    while (indentStack.length > 0) {
      result += '</li></ol>';
      indentStack.pop();
    }
  }
  
  return result;
}

export default MarkdownRenderer; 