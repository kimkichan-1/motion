import { useRef, useEffect } from 'react';

interface PoseOverlayProps {
  width: number;
  height: number;
  className?: string;
}

export default function PoseOverlay({ width, height, className = '' }: PoseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute top-0 left-0 pointer-events-none ${className}`}
      style={{ width, height }}
    />
  );
}

export function usePoseOverlayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getCanvas = () => canvasRef.current;

  return {
    canvasRef,
    getCanvas
  };
}
