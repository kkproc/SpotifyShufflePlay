import { useState } from "react";
import { VinylPlayer } from "../components/VinylPlayer";
import { SpotifyAuth } from "../components/SpotifyAuth";
import { ArtistSearch } from "../components/ArtistSearch";
import { useSpotify } from "../hooks/use-spotify";

export default function App() {
  const [artistId, setArtistId] = useState<string | null>(null);
  const { isAuthenticated, currentTrack, isPlaying } = useSpotify();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {!isAuthenticated ? (
        <SpotifyAuth />
      ) : (
        <>
          {!artistId ? (
            <ArtistSearch onArtistSelect={setArtistId} />
          ) : (
            <VinylPlayer
              artistId={artistId}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
            />
          )}
        </>
      )}
    </div>
  );
}
