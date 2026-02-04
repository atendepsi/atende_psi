import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMemorySchema, insertSettingsSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Memories API
  app.get("/api/memories", async (req, res) => {
    const memories = await storage.getMemories();
    res.json(memories);
  });

  app.post("/api/memories", async (req, res) => {
    try {
      const data = insertMemorySchema.parse(req.body);
      const memory = await storage.createMemory(data);
      res.json(memory);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json(e.errors);
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.put("/api/memories/:id", async (req, res) => {
    try {
      const data = insertMemorySchema.partial().parse(req.body);
      const memory = await storage.updateMemory(req.params.id, data);
      if (!memory) {
        res.status(404).json({ message: "Memory not found" });
        return;
      }
      res.json(memory);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json(e.errors);
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  app.delete("/api/memories/:id", async (req, res) => {
    await storage.deleteMemory(req.params.id);
    res.status(204).end();
  });

  // Settings API
  app.get("/api/settings", async (req, res) => {
    const settings = await storage.getSettings();
    res.json(settings);
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const data = insertSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSettings(data);
      res.json(settings);
    } catch (e) {
      if (e instanceof z.ZodError) {
        res.status(400).json(e.errors);
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // WhatsApp Integration Routes
  const API_BASE = "https://atendepsi.uazapi.com";

  app.get("/api/integrations/whatsapp/status", async (req, res) => {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      res.status(400).json({ message: "Token is required" });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/instance/status`, {
        headers: {
          'Accept': 'application/json',
          'token': token
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("WhatsApp Status Error:", error);
      res.status(500).json({ message: "Failed to fetch status" });
    }
  });

  app.post("/api/integrations/whatsapp/connect", async (req, res) => {
    const { token, phone } = req.body;

    if (!token || !phone) {
      res.status(400).json({ message: "Token and phone are required" });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/instance/connect`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'token': token
        },
        body: JSON.stringify({ phone })
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("WhatsApp Connect Error:", error);
      res.status(500).json({ message: "Failed to initiate connection" });
    }
  });



  // Google Calendar Integration Routes
  const { google } = await import('googleapis');

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // 1. Auth URL generator
  app.get("/api/auth/google", (req, res) => {
    const userId = req.query.userId as string || "test-user-id";
    // We can pass userId in state to retrieve it in callback if session is not persistent across redirects (though session usually is)
    // For now, assuming session works or we pass state.
    const state = JSON.stringify({ userId });

    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline', // CRITICAL for refresh token
      scope: scopes,
      state: state,
      prompt: 'consent' // Force consent to ensure refresh token is returned
    });

    res.json({ url });
  });

  // 2. Callback Handler
  // Matches the path provided by user: /rest/oauth2-credential/callback
  // We also keep a standard api route just in case
  const handleGoogleCallback = async (req: any, res: any) => {
    const { code, state } = req.query;
    console.log("Google Integration Callback Hit. Code Present:", !!code, "State:", state);

    if (!code) {
      return res.status(400).send("No code provided");
    }

    try {
      const { tokens } = await oauth2Client.getToken(code as string);

      // Decode state to get user ID
      let userId = "test-user-id";
      try {
        const decodedState = JSON.parse(state as string);
        if (decodedState.userId) userId = decodedState.userId;
      } catch (e) {
        console.error("Failed to parse state", e);
      }

      // Get user profile to identify the connected account
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const userInfo = await oauth2.userinfo.get();

      if (!tokens.access_token || !tokens.refresh_token) {
        // If no refresh token, we might check if we already have one, or fail. 
        // With prompt='consent', we should get one.
        console.warn("Missing access or refresh token in response");
      }

      await storage.storeGoogleToken({
        userId: userId,
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!, // If undefined, we have a problem for offline access
        email: userInfo.data.email!,
        scope: tokens.scope!,
        expiresIn: tokens.expiry_date ? tokens.expiry_date.toString() : null
      });

      // Redirect back to frontend
      // Assuming frontend matches backend host for dev
      res.redirect("/connections?google_connected=true");
    } catch (error: any) {
      console.error("Google Auth Error Full:", error);
      console.error("Google Auth Error Message:", error?.message);
      if (error.response) {
        console.error("Google Auth Error Response:", JSON.stringify(error.response.data));
      }
      res.redirect(`/connections?google_connected=false&error=auth_failed_${encodeURIComponent(error.message || "unknown")}`);
    }
  };

  app.get("/rest/oauth2-credential/callback", handleGoogleCallback);
  app.get("/api/auth/google/callback", handleGoogleCallback);

  // 3. Status and Events
  app.get("/api/integrations/google/status", async (req, res) => {
    const userId = req.query.userId as string || "test-user-id";
    const token = await storage.getGoogleToken(userId);

    if (!token) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      email: token.email,
      expiresIn: token.expiresIn
    });
  });

  app.get("/api/calendar/events", async (req, res) => {
    const userId = "test-user-id"; // TODO: real auth
    const token = await storage.getGoogleToken(userId);

    if (!token) {
      return res.status(401).json({ message: "Google Calendar not connected" });
    }

    try {
      oauth2Client.setCredentials({
        access_token: token.accessToken,
        refresh_token: token.refreshToken
      });

      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
      });

      res.json(response.data.items);
    } catch (error) {
      console.error("Calendar API Error:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  return httpServer;
}
