import { Express } from "express";
import session from "express-session";

// Declare session interface
declare module 'express-session' {
  interface SessionData {
    spotifyToken?: string;
  }
}

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_REDIRECT_URI = process.env.REPLIT_DOMAINS?.split(",")[0] + "/api/spotify/callback";

export function setupSpotifyRoutes(app: Express) {
  app.use(session({
    secret: process.env.REPL_ID || "vinyl-player-secret",
    resave: false,
    saveUninitialized: false,
  }));

  app.get("/api/spotify/login", (req, res) => {
    const scope = "streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state";
    res.redirect(`https://accounts.spotify.com/authorize?${new URLSearchParams({
      response_type: "code",
      client_id: SPOTIFY_CLIENT_ID!,
      scope,
      redirect_uri: SPOTIFY_REDIRECT_URI,
    })}`);
  });

  app.get("/api/spotify/callback", async (req, res) => {
    const code = req.query.code as string;
    if (!code) {
      return res.status(400).send("Authorization code is required");
    }

    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: SPOTIFY_REDIRECT_URI,
        }),
      });

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.access_token) {
        throw new Error("No access token received");
      }

      req.session.spotifyToken = data.access_token;
      res.redirect("/");
    } catch (error) {
      console.error("Authentication failed:", error);
      res.status(500).send("Authentication failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  });

  app.get("/api/spotify/session", (req, res) => {
    if (req.session.spotifyToken) {
      res.json({ authenticated: true });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  app.get("/api/spotify/search", async (req, res) => {
    if (!req.session.spotifyToken) {
      return res.status(401).send("Not authenticated with Spotify");
    }

    const query = req.query.q as string;
    if (!query) {
      return res.status(400).send("Search query is required");
    }
    
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/search?type=artist&q=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${req.session.spotifyToken}`,
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.artists?.items) {
        throw new Error("Invalid response format from Spotify API");
      }

      res.json(data.artists.items);
    } catch (error) {
      console.error("Search failed:", error);
      res.status(500).send("Search failed: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  });

  app.post("/api/spotify/play-random", async (req, res) => {
    const { artistId } = req.body;

    try {
      // Get artist's top tracks
      const tracksResponse = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`,
        {
          headers: {
            Authorization: `Bearer ${req.session.spotifyToken}`,
          },
        }
      );

      const tracksData = await tracksResponse.json();
      const randomTrack = tracksData.tracks[Math.floor(Math.random() * tracksData.tracks.length)];

      // Start playback
      await fetch("https://api.spotify.com/v1/me/player/play", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${req.session.spotifyToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: [randomTrack.uri],
        }),
      });

      res.json(randomTrack);
    } catch (error) {
      res.status(500).send("Failed to play track");
    }
  });

  app.post("/api/spotify/toggle-play", async (req, res) => {
    try {
      const stateResponse = await fetch("https://api.spotify.com/v1/me/player", {
        headers: {
          Authorization: `Bearer ${req.session.spotifyToken}`,
        },
      });

      const playerState = await stateResponse.json();
      const endpoint = playerState.is_playing ? "pause" : "play";

      await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${req.session.spotifyToken}`,
        },
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).send("Failed to toggle playback");
    }
  });

  app.get("/api/spotify/current-track", async (req, res) => {
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
        headers: {
          Authorization: `Bearer ${req.session.spotifyToken}`,
        },
      });

      if (response.status === 204) {
        res.json(null);
        return;
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).send("Failed to get current track");
    }
  });
}
