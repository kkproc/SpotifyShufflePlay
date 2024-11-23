import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
}

interface SpotifyArtist {
  id: string;
  name: string;
}

export function useSpotify() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([]);

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
    window.location.href = "/api/spotify/login";
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
