import { useState, useEffect, useRef } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Artist {
  id: string;
  name: string;
}

declare global {
  interface Window {
    Spotify: {
      Player: any;
    };
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export function useSpotify() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<Artist[]>([]);
  const playerRef = useRef<any>(null);

  const { data: session } = useQuery({
    queryKey: ["spotify-session"],
    queryFn: async () => {
      const res = await fetch("/api/spotify/session");
      if (!res.ok) return null;
      return res.json();
    },
  });

  const { data: currentTrack } = useQuery({
    queryKey: ["current-track"],
    queryFn: async () => {
      const res = await fetch("/api/spotify/current-track");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!session,
  });

  useEffect(() => {
    const messageHandler = async (event: MessageEvent) => {
      if (event.data === "spotify-login-success") {
        queryClient.invalidateQueries({ queryKey: ["spotify-session"] });
        toast({
          title: "Success",
          description: "Successfully connected to Spotify",
        });
      }
    };

    window.addEventListener("message", messageHandler);
    return () => {
      window.removeEventListener("message", messageHandler);
    };
  }, [queryClient, toast]);

  // Initialize Spotify Web Playback SDK
  useEffect(() => {
    if (!session) return;

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Vinyl Player',
        getOAuthToken: cb => {
          fetch('/api/spotify/session-token')
            .then(res => res.json())
            .then(data => cb(data.token));
        },
        volume: 0.5
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        playerRef.current = player;
      });

      player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
        console.log('Device ID has gone offline', device_id);
        setDeviceId(null);
      });

      player.connect();
    };
  }, [session]);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
    };
  }, []);

  const login = async () => {
    window.open("/api/spotify/login", "_blank", "width=800,height=600");
  };

  const searchArtists = async (query: string) => {
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setSearchResults(data);
      return data;
    } catch (error) {
      console.error("Search failed:", error);
      toast({
        title: "Error",
        description: "Failed to search artists",
        variant: "destructive",
      });
      return [];
    }
  };

  const togglePlayMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/spotify/toggle-play", { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle playback");
      return res.json();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to control playback",
        variant: "destructive",
      });
    },
  });

  const playRandomTrackMutation = useMutation({
    mutationFn: async (artistId: string) => {
      const res = await fetch("/api/spotify/play-random", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      });
      if (!res.ok) throw new Error("Failed to play random track");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-track"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to play random track",
        variant: "destructive",
      });
    },
  });

  return {
    isAuthenticated: !!session,
    currentTrack,
    isPlaying: currentTrack?.is_playing || false,
    login,
    searchArtists,
    searchResults,
    togglePlay: () => togglePlayMutation.mutate(),
    playRandomTrack: (artistId: string) => playRandomTrackMutation.mutate(artistId),
  };
}
