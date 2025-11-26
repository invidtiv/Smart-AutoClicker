import React, { useEffect, useRef } from 'react';

interface ImagePreviewProps {
  dataUrl: string; // Base64 string. For 'png', it includes the data URI prefix. For 'raw', it's just the base64 bytes.
  type: 'png' | 'raw';
  alt: string;
  displayWidth?: string;
  displayHeight?: string;
  pixelWidth?: number; // Required for 'raw' type
  pixelHeight?: number; // Required for 'raw' type
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ 
  dataUrl, 
  type, 
  alt, 
  displayWidth = '100px', 
  displayHeight = '100px',
  pixelWidth,
  pixelHeight
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (type === 'raw' && canvasRef.current && pixelWidth && pixelHeight) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = pixelWidth;
      canvas.height = pixelHeight;

      try {
        const binaryString = window.atob(dataUrl);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Create ImageData. Assume RGBA or similar. 
        // Android Bitmaps are often ARGB_8888. 
        // If the colors look wrong (e.g. blue/red swapped), we might need to shuffle bytes.
        // Let's try standard RGBA first.
        const imageData = ctx.createImageData(pixelWidth, pixelHeight);
        
        // Copy bytes. 
        // Previous attempt swapped B/R (assuming BGRA), but resulted in wrong colors.
        // This suggests the raw data might already be RGBA.
        if (bytes.length === imageData.data.length) {
            imageData.data.set(bytes);
        } else {
            console.warn('Raw image size mismatch.', { expected: imageData.data.length, actual: bytes.length });
            // Attempt to fill what we can
            imageData.data.set(bytes.subarray(0, imageData.data.length));
        }
        
        ctx.putImageData(imageData, 0, 0);
      } catch (e) {
        console.error("Failed to render raw image", e);
      }
    }
  }, [dataUrl, type, pixelWidth, pixelHeight]);

  if (type === 'raw') {
    return (
      <canvas 
        ref={canvasRef} 
        title={alt}
        style={{ 
          width: displayWidth, 
          height: displayHeight, 
          objectFit: 'contain', 
          border: '1px solid #ddd', 
          margin: '5px',
          imageRendering: 'pixelated' // Useful for seeing raw pixels clearly
        }} 
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt={alt}
      style={{ width: displayWidth, height: displayHeight, objectFit: 'contain', border: '1px solid #ddd', margin: '5px' }}
    />
  );
};

export default ImagePreview;
