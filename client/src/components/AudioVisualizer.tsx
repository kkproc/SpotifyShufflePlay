import { useEffect, useRef } from "react";
import { useAudioVisualizer } from "../hooks/use-audio-visualizer";

export function AudioVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { startVisualization, stopVisualization } = useAudioVisualizer(canvasRef);

  useEffect(() => {
    startVisualization();
    return () => stopVisualization();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none"
      width="400"
      height="400"
    />
  );
}
