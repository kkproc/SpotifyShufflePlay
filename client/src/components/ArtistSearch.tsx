import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useSpotify } from "../hooks/use-spotify";

interface ArtistSearchProps {
  onArtistSelect: (artistId: string) => void;
}

export function ArtistSearch({ onArtistSelect }: ArtistSearchProps) {
  const [query, setQuery] = useState("");
  const { searchArtists, searchResults } = useSpotify();

  return (
    <div className="w-full max-w-md space-y-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an artist..."
          className="flex-1"
        />
        <Button onClick={() => searchArtists(query)}>
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          {searchResults.map((artist) => (
            <Button
              key={artist.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => onArtistSelect(artist.id)}
            >
              {artist.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
