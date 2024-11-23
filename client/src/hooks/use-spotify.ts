import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

interface SpotifyArtist {
  id: string;
  name: string;
}

export function useSpotify() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([]);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [deviceReady, setDeviceReady] = useState(false);

  useEffect(() => {
    // Load Spotify Web Playback SDK
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Vinyl Player Web Player',
        getOAuthToken: async cb => {
          try {
            const res = await fetch('/api/spotify/token');
            if (!res.ok) throw new Error('Failed to get token');
            const data = await res.json();
            cb(data.token);
          } catch (error) {
            console.error('Failed to get token:', error);
          }
        }
      });

      // Error handling
      player.addListener('initialization_error', ({ message }: { message: string }) => {
        console.error(message);
        toast({
          title: 'Player Error',
          description: 'Failed to initialize player',
          variant: 'destructive',
        });
      });

      player.addListener('authentication_error', ({ message }: { message: string }) => {
        console.error(message);
        toast({
          title: 'Authentication Error',
          description: 'Failed to authenticate with Spotify',
          variant: 'destructive',
        });
      });

      player.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);
        setDeviceReady(true);
        
        // Activate device
        fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session?.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ device_ids: [device_id], play: false }),
        });
      });

      player.connect();
    };

    return () => {
      script.remove();
    };
  }, [toast]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === 'auth-success') {
        queryClient.invalidateQueries({ queryKey: ["spotify-session"] });
      } else if (event.data === 'auth-error') {
        toast({
          title: "Error",
          description: "Authentication failed",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [queryClient, toast]);

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
    mutationFn: async ({ device_id }: { device_id: string }) => {
      const res = await fetch("/api/spotify/toggle-play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id }),
      });
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
        body: JSON.stringify({ artistId, device_id: deviceId }),
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
    deviceReady,
    login,
    searchArtists,
    searchResults,
    togglePlay: () => togglePlayMutation.mutate({ device_id: deviceId! }),
    playRandomTrack: (artistId: string) => playRandomTrackMutation.mutate(artistId),
  };
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: {
      Player: new (config: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
      }) => any;
    };
  }
}
