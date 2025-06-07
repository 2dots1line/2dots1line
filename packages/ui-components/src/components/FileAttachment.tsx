/**
 * FileAttachment - Atomic component for file attachments and image previews
 * Based on legacy chat.js file handling but designed for V7 reusability
 */

import React, { useState } from 'react';
import { cn } from '../utils/cn';

export interface FileAttachmentProps {
  file: File;
  onRemove?: () => void;
  variant?: 'preview' | 'message' | 'compact';
  showRemoveButton?: boolean;
  onClick?: () => void;
}

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  file,
  onRemove,
  variant = 'preview',
  showRemoveButton = true,
  onClick
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const isImage = file.type.startsWith('image/');

  // Create image URL for preview
  React.useEffect(() => {
    if (isImage && !imageError) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file, isImage, imageError]);

  const handleImageError = () => {
    setImageError(true);
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (isImage && imageUrl) {
      // Default behavior: open image in modal
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80';
      modal.onclick = () => modal.remove();
      
      const img = document.createElement('img');
      img.src = imageUrl;
      img.className = 'max-w-[90vw] max-h-[90vh] object-contain';
      img.onclick = (e) => e.stopPropagation();
      
      const closeButton = document.createElement('button');
      closeButton.innerHTML = '×';
      closeButton.className = 'absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300';
      closeButton.onclick = () => modal.remove();
      
      modal.appendChild(img);
      modal.appendChild(closeButton);
      document.body.appendChild(modal);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const baseClasses = "file-attachment flex items-center";
  const variantClasses = {
    preview: "bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2",
    message: "bg-gray-100 rounded-md p-2 mt-2 max-w-xs",
    compact: "bg-gray-50 rounded px-2 py-1"
  };

  if (isImage && imageUrl && !imageError) {
    return (
      <div className={cn(baseClasses, variantClasses[variant])}>
        <img 
          src={imageUrl}
          alt={file.name}
          className={cn(
            "object-cover rounded cursor-pointer",
            variant === 'preview' && "w-20 h-20 mr-3",
            variant === 'message' && "max-w-[150px] max-h-[100px] mr-2",
            variant === 'compact' && "w-8 h-8 mr-2"
          )}
          onClick={handleClick}
          onError={handleImageError}
        />
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-gray-900 truncate",
            variant === 'compact' && "text-sm"
          )}>
            {file.name}
          </div>
          {variant !== 'compact' && (
            <div className="text-sm text-gray-500">
              {formatFileSize(file.size)}
            </div>
          )}
        </div>
        {showRemoveButton && onRemove && (
          <button
            onClick={onRemove}
            className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Remove file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  // Non-image file display
  return (
    <div className={cn(baseClasses, variantClasses[variant])}>
      <div className={cn(
        "flex-shrink-0 mr-3",
        variant === 'compact' && "mr-2"
      )}>
        <svg 
          className={cn(
            "text-blue-500",
            variant === 'preview' && "w-8 h-8",
            variant === 'message' && "w-6 h-6", 
            variant === 'compact' && "w-4 h-4"
          )} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn(
          "font-medium text-gray-900 truncate",
          variant === 'compact' && "text-sm"
        )}>
          {file.name}
        </div>
        {variant !== 'compact' && (
          <div className="text-sm text-gray-500">
            {formatFileSize(file.size)}
          </div>
        )}
      </div>
      {showRemoveButton && onRemove && (
        <button
          onClick={onRemove}
          className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
          aria-label="Remove file"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default FileAttachment; 