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

  app.post("/api/integrations/whatsapp/disconnect", async (req, res) => {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: "Token is required" });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/instance/disconnect`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'token': token
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("WhatsApp Disconnect Error:", error);
      res.status(500).json({ message: "Failed to disconnect" });
    }
  });

  return httpServer;
}
