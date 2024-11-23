import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCw } from "lucide-react";
import { AudioVisualizer } from "./AudioVisualizer";
import { useSpotify } from "../hooks/use-spotify";
import { cn } from "@/lib/utils";

interface VinylPlayerProps {
  artistId: string;
  currentTrack: any;
  isPlaying: boolean;
}

export function VinylPlayer({ artistId, currentTrack, isPlaying }: VinylPlayerProps) {
  const { togglePlay, playRandomTrack } = useSpotify();
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isPlaying) {
      // Set 1-hour timer
      timerRef.current = setTimeout(() => {
        togglePlay();
      }, 3600000);
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <div className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
      {/* Vinyl disc */}
      <div
        className={cn(
          "absolute inset-0 rounded-full bg-black border-4 border-gray-800",
          "transition-transform duration-1000",
          isPlaying && "animate-spin"
        )}
      >
        <div className="absolute inset-[25%] rounded-full bg-gray-900 flex items-center justify-center">
          {/* Center label */}
          <div className="text-center">
            <h2 className="text-sm font-medium text-primary mb-1">
              {currentTrack?.name || "No track playing"}
            </h2>
            <p className="text-xs text-gray-400">
              {currentTrack?.artists?.[0]?.name}
            </p>
          </div>
        </div>
      </div>

      {/* Audio visualizer */}
      {isPlaying && <AudioVisualizer />}

      {/* Control buttons */}
      <div className="absolute inset-0 flex items-center justify-center gap-4">
        <Button
          size="lg"
          variant="secondary"
          className="rounded-full h-16 w-16"
          onClick={togglePlay}
        >
          {isPlaying ? (
            <Pause className="h-8 w-8" />
          ) : (
            <Play className="h-8 w-8" />
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={() => playRandomTrack(artistId)}
        >
          <RotateCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
