import { useState, useCallback } from "react";
import { 
  compressImage, 
  compressImages, 
  getCompressionStats,
  formatFileSize,
  type CompressionOptions, 
  type CompressionResult 
} from "@/lib/imageCompression";
import { supabase } from "@/integrations/supabase/client";

interface UseImageCompressionOptions {
  defaultQuality?: number;
  defaultMaxWidth?: number;
  defaultMaxHeight?: number;
}

export function useImageCompression(options: UseImageCompressionOptions = {}) {
  const [isCompressing, setIsCompressing] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [lastStats, setLastStats] = useState<ReturnType<typeof getCompressionStats> | null>(null);
  const [compressionSettings, setCompressionSettings] = useState<CompressionOptions>({
    quality: options.defaultQuality ?? 0.8,
    maxWidth: options.defaultMaxWidth ?? 1200,
    maxHeight: options.defaultMaxHeight ?? 1200,
    mimeType: "image/webp",
  });

  // Load settings from admin_settings
  const loadAdminSettings = useCallback(async () => {
    try {
      const { data: settings } = await supabase
        .from("admin_settings")
        .select("key, value")
        .in("key", [
          "IMAGE_COMPRESSION_QUALITY",
          "IMAGE_MAX_WIDTH",
          "IMAGE_MAX_HEIGHT",
          "IMAGE_FORMAT"
        ]);

      if (settings) {
        const newSettings = { ...compressionSettings };
        
        settings.forEach((setting) => {
          switch (setting.key) {
            case "IMAGE_COMPRESSION_QUALITY":
              newSettings.quality = parseFloat(setting.value || "0.8");
              break;
            case "IMAGE_MAX_WIDTH":
              newSettings.maxWidth = parseInt(setting.value || "1200", 10);
              break;
            case "IMAGE_MAX_HEIGHT":
              newSettings.maxHeight = parseInt(setting.value || "1200", 10);
              break;
            case "IMAGE_FORMAT":
              newSettings.mimeType = (setting.value as "image/webp" | "image/jpeg" | "image/png") || "image/webp";
              break;
          }
        });

        setCompressionSettings(newSettings);
      }
    } catch (error) {
      console.error("Error loading compression settings:", error);
    }
  }, []);

  const compressSingle = useCallback(async (
    file: File, 
    customOptions?: Partial<CompressionOptions>
  ): Promise<CompressionResult> => {
    setIsCompressing(true);
    setProgress({ completed: 0, total: 1 });

    try {
      const result = await compressImage(file, {
        ...compressionSettings,
        ...customOptions,
      });
      
      setLastStats(getCompressionStats([result]));
      setProgress({ completed: 1, total: 1 });
      
      return result;
    } finally {
      setIsCompressing(false);
    }
  }, [compressionSettings]);

  const compressMultiple = useCallback(async (
    files: File[], 
    customOptions?: Partial<CompressionOptions>
  ): Promise<CompressionResult[]> => {
    setIsCompressing(true);
    setProgress({ completed: 0, total: files.length });

    try {
      const results = await compressImages(
        files, 
        { ...compressionSettings, ...customOptions },
        (completed, total) => setProgress({ completed, total })
      );
      
      setLastStats(getCompressionStats(results));
      
      return results;
    } finally {
      setIsCompressing(false);
    }
  }, [compressionSettings]);

  return {
    compressSingle,
    compressMultiple,
    isCompressing,
    progress,
    lastStats,
    compressionSettings,
    setCompressionSettings,
    loadAdminSettings,
    formatFileSize,
  };
}
