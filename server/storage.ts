import { type User, type InsertUser, type Memory, type InsertMemory, type Settings, type InsertSettings, type GoogleToken, type InsertGoogleToken } from "../shared/schema.js";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getMemories(): Promise<Memory[]>;
  createMemory(memory: InsertMemory): Promise<Memory>;
  updateMemory(id: string, memory: Partial<InsertMemory>): Promise<Memory | undefined>;
  deleteMemory(id: string): Promise<void>;

  getSettings(): Promise<Settings>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;

  storeGoogleToken(token: InsertGoogleToken): Promise<GoogleToken>;
  getGoogleToken(userId: string): Promise<GoogleToken | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private memories: Map<string, Memory>;
  private googleTokens: Map<string, GoogleToken>; // Map<userId, GoogleToken> - Simplified for 1:1 relation per user
  private settings: Settings;

  constructor() {
    this.users = new Map();
    this.memories = new Map();
    this.googleTokens = new Map();
    this.settings = {
      id: "default",
      agentName: "Sofia",
      communicationTone: "Objetiva",
      restrictions: [] as string[],
      isActive: true,
      isConnected: true,
      whatsappActive: true,
      scheduleActive: true
    } as Settings;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getMemories(): Promise<Memory[]> {
    return Array.from(this.memories.values());
  }

  async createMemory(insertMemory: InsertMemory): Promise<Memory> {
    const id = randomUUID();
    const memory: Memory = {
      ...insertMemory,
      id,
      createdAt: new Date().toISOString()
    };
    this.memories.set(id, memory);
    return memory;
  }

  async updateMemory(id: string, memoryUpdate: Partial<InsertMemory>): Promise<Memory | undefined> {
    const memory = this.memories.get(id);
    if (!memory) return undefined;

    const updatedMemory = { ...memory, ...memoryUpdate };
    this.memories.set(id, updatedMemory);
    return updatedMemory;
  }

  async deleteMemory(id: string): Promise<void> {
    this.memories.delete(id);
  }

  async getSettings(): Promise<Settings> {
    return this.settings;
  }

  async updateSettings(settingsUpdate: Partial<InsertSettings>): Promise<Settings> {
    this.settings = { ...this.settings, ...settingsUpdate };
    return this.settings;
  }

  async storeGoogleToken(insertToken: InsertGoogleToken): Promise<GoogleToken> {
    const id = randomUUID();
    const token: GoogleToken = {
      ...insertToken,
      expiresIn: insertToken.expiresIn ?? null,
      id,
      createdAt: new Date().toISOString()
    };
    // Store by userId for easy retrieval. If we wanted multiple accounts per user, we'd need a different structure.
    // For now, assuming one Google account per user.
    this.googleTokens.set(insertToken.userId, token);
    return token;
  }

  async getGoogleToken(userId: string): Promise<GoogleToken | undefined> {
    return this.googleTokens.get(userId);
  }
}

export const storage = new MemStorage();
