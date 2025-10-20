/**
 * MarkdownRenderer - Atomic component for rendering AI-generated markdown content
 * Based on legacy chat.css formatting but designed for reusability across V7 system
 */

import React from 'react';

import { cn } from '../../utils/cn';
import './markdown.styles.css';

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
  
  // Add click handlers for capsule pills
  React.useEffect(() => {
    const handleCapsuleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      
      // Check if the clicked element or its parent is a capsule pill
      const capsulePill = target.closest('.capsule-pill') as HTMLElement;
      if (capsulePill) {
        event.preventDefault();
        event.stopPropagation();
        
        console.log('Capsule pill clicked:', capsulePill);
        
        if (capsulePill.classList.contains('web-source')) {
          // Open web source in new tab
          const url = capsulePill.getAttribute('data-url');
          console.log('Opening web source:', url);
          if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
          }
        } else if (capsulePill.classList.contains('entity')) {
          // Dispatch custom event for entity modal
          const entityId = capsulePill.getAttribute('data-entity-id');
          const entityType = capsulePill.getAttribute('data-entity-type');
          const displayText = capsulePill.getAttribute('data-display-text');
          
          console.log('Opening entity modal:', { entityId, entityType, displayText });
          
          if (entityId && entityType) {
            const customEvent = new CustomEvent('open-entity-modal', {
              detail: { entityId, entityType, displayText }
            });
            window.dispatchEvent(customEvent);
          }
        }
      }
    };
    
    // Add event listener to the document with capture to ensure it runs early
    document.addEventListener('click', handleCapsuleClick, true);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleCapsuleClick, true);
    };
  }, []);
  
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

  // Phase 0.5: Convert literal \n strings to actual newlines
  formattedText = formattedText.replace(/\\n/g, '\n');

  // Phase 1: Split text into paragraphs and process each one
  const paragraphs = formattedText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
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

  // Phase 0: Extract capsule pills (after paragraph processing)
  const capsulePlaceholders: Array<{ placeholder: string; html: string }> = [];
  formattedText = formattedText.replace(
    /@\[([^\]]+)\]\(([^:)]+):([^)]+)\)/g,
    (match, displayText, identifier, typeOrWeb) => {
      const placeholder = `__CAPSULE_${capsulePlaceholders.length}__`;
      const isWebSource = typeOrWeb === 'web';
      
      const pillHtml = isWebSource
        ? `<span class="capsule-pill web-source" data-url="${identifier}" data-display-text="${displayText}">${displayText}</span>`
        : `<span class="capsule-pill entity" data-entity-id="${identifier}" data-entity-type="${typeOrWeb}" data-display-text="${displayText}">${displayText}</span>`;
      
      capsulePlaceholders.push({ placeholder, html: pillHtml });
      return placeholder;
    }
  );

  // Phase 2: Process Lists
  formattedText = processLists(formattedText);

  // Phase 3: Inline Formatting
  // Images and Videos - must be processed before italic (because of the ! prefix)
  // Video format: ![Video](url.mp4) or ![Video](url.webm)
  formattedText = formattedText.replace(/!\[([^\]]*)\]\(([^)]+\.(?:mp4|webm|ogg))\)/gi, 
    '<video controls class="markdown-video" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;"><source src="$2" type="video/mp4" />Your browser does not support the video tag.</video>');
  
  // Images format: ![alt](url)
  formattedText = formattedText.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="markdown-image" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0;" />');
  
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

  // Phase 5: Restore capsule pills
  capsulePlaceholders.forEach(({ placeholder, html }) => {
    formattedText = formattedText.replace(placeholder, html);
  });

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