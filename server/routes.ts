import { Express } from "express";
import { setupSpotifyRoutes } from "./spotify";

export function registerRoutes(app: Express) {
  setupSpotifyRoutes(app);
}
