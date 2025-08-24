'use client';

import EnhancedMedia from './enhanced-media';

const MessageContent = ({ fileUrls, isOptimistic, isUploading, onMediaLoad, messagesEndRef }) => {



  const handleMediaLoad = () => {
    if (onMediaLoad && messagesEndRef?.current) {
      onMediaLoad(messagesEndRef);
    }
  };

  // Render file attachments
  const renderFileAttachments = () => {
    if (!fileUrls?.length) return null;

    return (
      <div className="mb-3 mt-2 flex flex-wrap gap-2 flex-col items-end transition-all duration-300 ease-in-out relative">
        {fileUrls.map((fileUrl, fileIndex) => {
          // Check if this is a new enhanced format with metadata
          if (typeof fileUrl === 'object' && fileUrl.url) {
            // Enhanced format with metadata
            return (
              <div key={fileIndex} className="flex flex-col items-start">
                <EnhancedMedia
                  fileUrl={fileUrl.url}
                  fileName={fileUrl.name || 'File'}
                  fileType={fileUrl.type || 'application/octet-stream'}
                  thumbnailUrl={fileUrl.thumbnailUrl}
                  base64Data={fileUrl.base64Data}
                  variants={fileUrl.variants || {}}
                  onLoad={handleMediaLoad}
                  onError={() => {/* Error handled silently */}}
                  maxWidth="500px"
                  maxHeight="400px"
                  lazyLoad={true}
                />
                {fileUrl.compressionRatio && (
                  <div className="text-xs text-gray-500 mt-1">
                    Compressed: {fileUrl.compressionRatio}% smaller
                  </div>
                )}
                {isOptimistic && (
                  <div className="text-xs text-green-400 italic mt-1 font-medium">
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-gray-400 dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-gray-600 dark:text-gray-400">Uploading...</span>
                      </div>
                    ) : (
                      "✅ File attached"
                    )}
                  </div>
                )}
              </div>
            );
          }
          
          // Legacy format - direct URL string
          if (typeof fileUrl === 'string') {
            // Handle uploading status strings smoothly
            if (fileUrl.startsWith('Uploading ')) {
              return (
                <div key={fileIndex} className="flex flex-col items-start">
                  <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="w-4 h-4 border-2 border-gray-400 dark:border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{fileUrl}</span>
                  </div>
                  {isOptimistic && (
                    <div className="text-xs text-green-400 italic mt-1 font-medium">
                      {isUploading ? (
                        <span className="text-gray-600 dark:text-gray-400">⏳ Uploading...</span>
                      ) : (
                        "✅ File attached"
                      )}
                    </div>
                  )}
                </div>
              );
            }
            
            const fileName = fileUrl.split('/').pop().split('?')[0];
            const fileExtension = fileName.split('.').pop().toLowerCase();
            
            return (
              <div key={fileIndex} className="flex flex-col items-start">
                <EnhancedMedia
                  fileUrl={fileUrl}
                  fileName={fileName}
                  fileType={fileExtension}
                  onLoad={handleMediaLoad}
                  onError={() => {/* Error handled silently */}}
                  maxWidth="500px"
                  maxHeight="400px"
                  lazyLoad={true}
                />
                {isOptimistic && (
                  <div className="text-xs text-green-400 italic mt-1 font-medium">
                    {isUploading ? (
                      <span className="text-gray-600 dark:text-gray-400">⏳ Uploading...</span>
                    ) : (
                      "✅ File attached"
                    )}
                  </div>
                )}
              </div>
            );
          }
          
          // Fallback for unknown format
          return null;
        })}
      </div>
    );
  };

  return (
    <>
      {renderFileAttachments()}
    </>
  );
};

export default MessageContent; 
