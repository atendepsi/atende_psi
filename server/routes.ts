import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertMemorySchema, insertSettingsSchema } from "../shared/schema.js";
import { z } from "zod";
import { google } from "googleapis";

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
  let oauth2Client: any = null;

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    const missing = [];
    if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
    if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
    if (!process.env.GOOGLE_REDIRECT_URI) missing.push("GOOGLE_REDIRECT_URI");
    console.warn(`Google Calendar Env Vars missing: ${missing.join(", ")}. Integration disabled.`);
  } else {
    try {
      oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );
    } catch (err) {
      console.error("Failed to initialize Google OAuth2:", err);
    }
  }

  // 1. Auth URL generator
  app.get("/api/auth/google", (req, res) => {
    if (!oauth2Client) {
      const missing = [];
      if (!process.env.GOOGLE_CLIENT_ID) missing.push("GOOGLE_CLIENT_ID");
      if (!process.env.GOOGLE_CLIENT_SECRET) missing.push("GOOGLE_CLIENT_SECRET");
      if (!process.env.GOOGLE_REDIRECT_URI) missing.push("GOOGLE_REDIRECT_URI");
      return res.status(503).json({
        message: "Google Integration not configured on server.",
        missing_vars: missing
      });
    }

    try {
      const userId = req.query.userId as string || "test-user-id";
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
    } catch (error) {
      console.error("Error generating auth url", error);
      res.status(500).json({ message: "Failed to generate auth url" });
    }
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

      // We cannot save to Supabase Backend without Service Role Key due to RLS.
      // We will pass the tokens to the frontend via URL parameters, 
      // where the authenticated user (client-side) can save them to their own profile.

      const params = new URLSearchParams();
      params.append("google_connected", "true");
      params.append("access_token", tokens.access_token!);
      params.append("refresh_token", tokens.refresh_token!);
      params.append("email", userInfo.data.email!);
      params.append("expiry_date", tokens.expiry_date ? tokens.expiry_date.toString() : "");

      res.redirect(`/connections?${params.toString()}`);
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

  // 3. Events API (Authenticated via Supabase JWT)
  app.get("/api/calendar/events", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    try {
      // Use the client-side Anon Key for the backend to act on behalf of the user
      // We assume VITE_SUPABASE_ANON_KEY is available or hardcoded in shared/schema if needed, 
      // but usually it's best to grab from env.
      const sbUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
      const sbKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

      if (!sbUrl || !sbKey) {
        // Fallback if env vars are missing (development/local hardcoded check)
        // The user mentioned keys aren't dynamic, so we might need to rely on what's available.
        // Using the fallback from client/src/lib/supabase.ts if visible? No, can't import easily.
        // We will proceed hoping envs are set or storage has it (but storage is memory).
        return res.status(500).json({ message: "Server misconfiguration: Missing Supabase URL/Key" });
      }

      const { createClient } = await import("@supabase/supabase-js");

      // Create a client scoped to the user's JWT
      const supabaseScoped = createClient(sbUrl, sbKey, {
        global: {
          headers: {
            Authorization: authHeader // Pass the Bearer token
          }
        }
      });

      // Fetch user's profile to get tokens using RLS
      // Create a dedicated OAuth2 client for this request to avoid race conditions
      // and to handle token refresh events specifically for this user.
      const requestAuthClient = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      requestAuthClient.setCredentials({
        access_token: profile.google_access_token,
        refresh_token: profile.google_refresh_token
      });

      // Handle automatic token refresh events
      requestAuthClient.on('tokens', async (tokens) => {
        console.log("Token Refresh Event Triggered for user:", profile.id || "unknown");

        // Prepare update object
        const updates: any = {};
        if (tokens.access_token) updates.google_access_token = tokens.access_token;
        if (tokens.refresh_token) updates.google_refresh_token = tokens.refresh_token;

        if (Object.keys(updates).length > 0) {
          console.log("Persisting fresh tokens to Supabase...");
          try {
            // Note: 'profile.id' wasn't selected in the query above, we need to fix the select or use userId if available from somewhere else?
            // The query was: .select('google_access_token, google_refresh_token').single();
            // Profiles table ID is the user ID usually.
            // Let's rely on supabaseScoped which is scoped to auth.uid() == id policy?
            // Actually RLS policies usually enforce "id = auth.uid()".
            // So updating any row where id=auth.uid() is fine.
            // But we need the ID to target the row in .eq('id', ...). 
            // Wait, the select didn't return ID. I MUST fix the select first to include ID.
            // OR just use the fact that the client is scoped? 
            // But .update() requires a filter usually.
            // Let's assume the previous step (view_file) showed I didn't select ID.
            // I will fix the select in this replacement too.

            // Actually, I can't easily change the lines above this block with a single contiguous replace unless I expand the range.
            // The previous view_file showed lines 260-320. The select is at line 297.
            // So I should include line 297 in the target range to fix the select.
          } catch (e) {
            console.error("Failed to persist refreshed tokens:", e);
          }
        }
      });

      // FIXING THE SELECT IN THIS BLOCK REQUIRES EXPANDING THE RANGE UPWARDS
      // BUT I CAN'T DO THAT IF I ALREADY COMMITTED TO A START LINE.
      // Wait, I am generating the tool call now. I can set StartLine to 297.

      // Let's do a larger replace to include the select.


    } catch (error: any) {
      console.error("Calendar API Error:", error);
      // Handle the case where the access token is expired and googleapis tried to refresh
      if (error.code === 401) {
        res.status(401).json({ message: "Authentication failed with Google", detail: error.message });
      } else {
        res.status(500).json({ message: "Failed to fetch events", detail: error.message });
      }
    }
  });

  return httpServer;
}
