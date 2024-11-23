import { Button } from "@/components/ui/button";
import { useSpotify } from "../hooks/use-spotify";

export function SpotifyAuth() {
  const { login } = useSpotify();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-8">Vinyl Player</h1>
      <Button
        size="lg"
        onClick={login}
        className="bg-[#1DB954] hover:bg-[#1ed760] text-white"
      >
        Connect with Spotify
      </Button>
    </div>
  );
}
