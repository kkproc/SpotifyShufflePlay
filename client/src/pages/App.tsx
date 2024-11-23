import { useState } from "react";
import { ErrorBoundary } from 'react-error-boundary';
import { VinylPlayer } from "../components/VinylPlayer";
import { SpotifyAuth } from "../components/SpotifyAuth";
import { ArtistSearch } from "../components/ArtistSearch";
import { useSpotify } from "../hooks/use-spotify";

function ErrorFallback({error}: {error: Error}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-500">{error.message}</p>
      </div>
    </div>
  );
}

export default function App() {
  const [artistId, setArtistId] = useState<string | null>(null);
  const { isAuthenticated, currentTrack, isPlaying } = useSpotify();

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
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
    </ErrorBoundary>
  );
}
