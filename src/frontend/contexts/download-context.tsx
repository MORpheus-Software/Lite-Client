import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  PropsWithChildren,
} from 'react';
import { OllamaChannel } from '../../events';

interface DownloadState {
  modelName: string;
  progress: number;
  status: string;
  isActive: boolean;
  isComplete: boolean;
  error?: string;
}

interface DownloadContextType {
  // Current download state
  currentDownload: DownloadState | null;
  isDownloading: boolean;

  // Download management functions
  startDownload: (modelName: string) => void;
  cancelDownload: () => void;
  clearDownload: () => void;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

export const DownloadProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [currentDownload, setCurrentDownload] = useState<DownloadState | null>(null);

  // Listen for download status updates
  useEffect(() => {
    const handleStatusUpdate = (status: string) => {
      if (!currentDownload?.isActive) return;

      // Parse model name from status messages like "[model-name] downloading 45%"
      const modelMatch = status.match(/^\[([^\]]+)\]/);
      const statusModel = modelMatch ? modelMatch[1] : null;

      // Only process status updates for the current model being downloaded
      if (statusModel && statusModel !== currentDownload.modelName) {
        return;
      }

      // Parse progress from status messages like "downloading 45%"
      const progressMatch = status.match(/(\d+)%/);
      const progress = progressMatch ? parseInt(progressMatch[1], 10) : 0;

      // Check for completion
      const isComplete = status.includes('pulling complete') || progress === 100;

      // Check for errors
      const isError =
        status.toLowerCase().includes('error') || status.toLowerCase().includes('failed');

      // Clean status message by removing model prefix for display
      const cleanStatus = status.replace(/^\[[^\]]+\]\s*/, '');

      setCurrentDownload((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          progress,
          status: cleanStatus,
          isComplete,
          isActive: !isComplete && !isError,
          error: isError ? cleanStatus : undefined,
        };
      });
    };

    window.backendBridge.ollama.onStatusUpdate(handleStatusUpdate);

    return () => {
      window.backendBridge.removeAllListeners(OllamaChannel.OllamaStatusUpdate);
    };
  }, [currentDownload?.isActive]);

  const startDownload = useCallback((modelName: string) => {
    setCurrentDownload({
      modelName,
      progress: 0,
      status: 'Starting download...',
      isActive: true,
      isComplete: false,
    });
  }, []);

  const cancelDownload = useCallback(async () => {
    if (currentDownload?.isActive) {
      try {
        await window.backendBridge.ollama.cancelDownload();
        setCurrentDownload((prev) =>
          prev
            ? {
                ...prev,
                isActive: false,
                status: 'Download cancelled',
                error: 'Download was cancelled by user',
              }
            : null,
        );
      } catch (error) {
        console.error('Failed to cancel download:', error);
        setCurrentDownload((prev) =>
          prev
            ? {
                ...prev,
                isActive: false,
                status: 'Failed to cancel download',
                error: 'Could not cancel download',
              }
            : null,
        );
      }
    }
  }, [currentDownload?.isActive]);

  const clearDownload = useCallback(() => {
    setCurrentDownload(null);
  }, []);

  const isDownloading = currentDownload?.isActive ?? false;

  const contextValue: DownloadContextType = {
    currentDownload,
    isDownloading,
    startDownload,
    cancelDownload,
    clearDownload,
  };

  return <DownloadContext.Provider value={contextValue}>{children}</DownloadContext.Provider>;
};

export const useDownload = () => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
};

export default DownloadContext;
