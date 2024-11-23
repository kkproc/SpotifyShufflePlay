import { useRef, MutableRefObject } from "react";

export function useAudioVisualizer(canvasRef: MutableRefObject<HTMLCanvasElement | null>) {
  const audioCtx = useRef<AudioContext>();
  const analyser = useRef<AnalyserNode>();
  const animationFrame = useRef<number>();

  const startVisualization = () => {
    if (!canvasRef.current) return;

    audioCtx.current = new AudioContext();
    analyser.current = audioCtx.current.createAnalyser();
    analyser.current.fftSize = 256;

    const bufferLength = analyser.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    const center = canvas.width / 2;
    const radius = canvas.width * 0.35;

    function draw() {
      animationFrame.current = requestAnimationFrame(draw);

      analyser.current!.getByteFrequencyData(dataArray);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (2 * Math.PI) / bufferLength;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] * 0.5;
        const angle = i * barWidth;

        const x = center + Math.cos(angle) * radius;
        const y = center + Math.sin(angle) * radius;
        const x2 = center + Math.cos(angle) * (radius + barHeight);
        const y2 = center + Math.sin(angle) * (radius + barHeight);

        ctx.beginPath();
        ctx.strokeStyle = `hsl(${(i * 360) / bufferLength}, 100%, 50%)`;
        ctx.lineWidth = 2;
        ctx.moveTo(x, y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }

    draw();
  };

  const stopVisualization = () => {
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }
    if (audioCtx.current) {
      audioCtx.current.close();
    }
  };

  return {
    startVisualization,
    stopVisualization,
  };
}
