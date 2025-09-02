"use client";

import { useState } from 'react';
import type { ShareRequest } from '~/types/share';

interface ShareButtonProps {
  data: ShareRequest;
  className?: string;
}

export function ShareButton({ data, className = "" }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareResult, setShareResult] = useState<{
    success: boolean;
    url?: string;
    shareUrl?: string;
    error?: string;
  } | null>(null);

  const handleShare = async () => {
    setIsSharing(true);
    setShareResult(null);

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json() as {
        success: boolean;
        id?: string;
        url?: string;
        shareUrl?: string;
        error?: string;
      };

      setShareResult(result);

      if (result.success && result.shareUrl) {
        // Copy to clipboard
        await navigator.clipboard.writeText(result.shareUrl);
      }
    } catch (error) {
      setShareResult({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to share response'
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleShare}
        disabled={isSharing}
        className={`bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors ${className}`}
      >
        {isSharing ? 'Sharing...' : '🔗 Share Response'}
      </button>

      {shareResult && (
        <div className={`p-3 rounded-lg text-sm ${
          shareResult.success 
            ? 'bg-green-900/50 border border-green-500 text-green-200' 
            : 'bg-red-900/50 border border-red-500 text-red-200'
        }`}>
          {shareResult.success ? (
            <div>
              <p className="font-medium">✅ Response shared successfully!</p>
              <p className="mt-1">Share URL copied to clipboard:</p>
              <code className="block mt-1 p-2 bg-green-800/30 rounded text-xs break-all">
                {shareResult.shareUrl}
              </code>
            </div>
          ) : (
            <div>
              <p className="font-medium">❌ Failed to share response</p>
              <p className="mt-1">{shareResult.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
