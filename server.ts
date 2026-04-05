import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import session from "express-session";
import cookieParser from "cookie-parser";
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { users, moods, journals, settings, userStats } from './src/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB with persistent path for Render
const dbPath = process.env.RENDER ? '/var/data/sqlite.db' : 'sqlite.db';
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

// Create tables if they don't exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    joined_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS moods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    score INTEGER NOT NULL,
    label TEXT NOT NULL,
    note TEXT,
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS journals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    notifications INTEGER DEFAULT 1,
    anonymous_mode INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS user_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
    streak INTEGER DEFAULT 0,
    total_check_ins INTEGER DEFAULT 0,
    last_check_in_date INTEGER
  );
`);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  const PORT = process.env.PORT || 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || 'mindguide-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
  }));

  // Auth Routes
  app.post("/api/auth/signup", async (req, res) => {
    const { username, email, password } = req.body;
    try {
      const [newUser] = await db.insert(users).values({
        username,
        email,
        password, // In real app, hash this!
        joinedAt: Date.now()
      }).returning();
      
      // @ts-ignore
      req.session.userId = newUser.id;
      res.json(newUser);
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const [user] = await db.select().from(users).where(and(eq(users.email, email), eq(users.password, password)));
    
    if (user) {
      // @ts-ignore
      req.session.userId = user.id;
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    // @ts-ignore
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    res.json(user);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.post("/api/data/clear", async (req, res) => {
    // @ts-ignore
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    
    await db.delete(moods).where(eq(moods.userId, userId));
    await db.delete(journals).where(eq(journals.userId, userId));
    res.json({ success: true });
  });

  // Helper to generate mock data
  const generateMockMoods = (userId: number) => {
    const moodsList: any[] = [];
    const now = Date.now();
    const labels = ['Great', 'Good', 'Okay', 'Down', 'Stressed'];
    for (let i = 1; i <= 7; i++) {
      moodsList.push({
        id: -i,
        userId: userId,
        score: Math.floor(Math.random() * 5) + 1,
        label: labels[Math.floor(Math.random() * labels.length)],
        note: "Mock mood entry " + i,
        timestamp: now - (i * 24 * 60 * 60 * 1000)
      });
    }
    return moodsList;
  };

  const generateMockJournals = (userId: number) => {
    const journalsList: any[] = [];
    const now = Date.now();
    for (let i = 1; i <= 5; i++) {
      journalsList.push({
        id: -i,
        userId: userId,
        content: JSON.stringify({
          title: "Mock Journal " + i,
          type: 'reflection',
          thoughts: "This is a mock journal entry " + i
        }),
        timestamp: now - (i * 48 * 60 * 60 * 1000)
      });
    }
    return journalsList;
  };

  // Mood Routes
  app.get("/api/moods", async (req, res) => {
    // @ts-ignore
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    
    const userMoods = await db.select().from(moods).where(eq(moods.userId, userId)).orderBy(desc(moods.timestamp));
    const mockMoods = generateMockMoods(userId);
    res.json([...userMoods, ...mockMoods]);
  });

  app.post("/api/moods", async (req, res) => {
    // @ts-ignore
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    
    const { score, label, note } = req.body;
    const [newMood] = await db.insert(moods).values({
      userId,
      score,
      label,
      note,
      timestamp: Date.now()
    }).returning();
    
    // Update user stats
    const today = new Date().toDateString();
    const todayTimestamp = new Date(today).getTime();
    
    let [currentStats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    
    if (!currentStats) {
      await db.insert(userStats).values({
        userId,
        streak: 1,
        totalCheckIns: 1,
        lastCheckInDate: todayTimestamp
      });
    } else {
      const lastCheckInDate = new Date(currentStats.lastCheckInDate).toDateString();
      let newStreak = currentStats.streak;
      
      if (lastCheckInDate !== today) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastCheckInDate === yesterday.toDateString()) {
          newStreak = (currentStats.streak || 0) + 1;
        } else {
          newStreak = 1;
        }
      }
      
      await db.update(userStats)
        .set({
          streak: newStreak,
          totalCheckIns: (currentStats.totalCheckIns || 0) + 1,
          lastCheckInDate: todayTimestamp
        })
        .where(eq(userStats.userId, userId));
    }
    
    res.json(newMood);
  });

  // Journal Routes
  app.get("/api/journals", async (req, res) => {
    // @ts-ignore
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    
    const userJournals = await db.select().from(journals).where(eq(journals.userId, userId)).orderBy(desc(journals.timestamp));
    const mockJournals = generateMockJournals(userId);
    res.json([...userJournals, ...mockJournals]);
  });

  app.post("/api/journals", async (req, res) => {
    // @ts-ignore
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    
    const { content } = req.body;
    const [newJournal] = await db.insert(journals).values({
      userId,
      content,
      timestamp: Date.now()
    }).returning();
    
    // Update user stats
    const today = new Date().toDateString();
    const todayTimestamp = new Date(today).getTime();
    
    let [currentStats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    
    if (!currentStats) {
      await db.insert(userStats).values({
        userId,
        streak: 1,
        totalCheckIns: 1,
        lastCheckInDate: todayTimestamp
      });
    } else {
      const lastCheckInDate = new Date(currentStats.lastCheckInDate).toDateString();
      let newStreak = currentStats.streak;
      
      if (lastCheckInDate !== today) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastCheckInDate === yesterday.toDateString()) {
          newStreak = (currentStats.streak || 0) + 1;
        } else {
          newStreak = 1;
        }
      }
      
      await db.update(userStats)
        .set({
          streak: newStreak,
          totalCheckIns: (currentStats.totalCheckIns || 0) + 1,
          lastCheckInDate: todayTimestamp
        })
        .where(eq(userStats.userId, userId));
    }
    
    res.json(newJournal);
  });

  // User Stats Routes
  app.get("/api/user-stats", async (req, res) => {
    // @ts-ignore
    const userId = req.session.userId;
    if (!userId) return res.status(401).json({ error: "Not logged in" });
    
    let [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    
    if (!stats) {
      [stats] = await db.insert(userStats).values({
        userId,
        streak: 0,
        totalCheckIns: 0,
        lastCheckInDate: null
      }).returning();
    }
    
    const userMoods = await db.select().from(moods).where(eq(moods.userId, userId));
    const userJournals = await db.select().from(journals).where(eq(journals.userId, userId));
    
    const totalReflections = userJournals.length;
    const totalCheckIns = userMoods.length;
    
    res.json({
      id: stats.id,
      userId: stats.userId,
      streak: stats.streak || 0,
      totalCheckIns: totalCheckIns,
      totalReflections: totalReflections,
      lastCheckInDate: stats.lastCheckInDate
    });
  });

  // WebSocket peer matching
  interface WaitingUser {
    ws: WebSocket;
    id: string;
    topic: string;
    format: string;
    intent: string;
    identity: string;
    timer: NodeJS.Timeout;
  }

  const waitingUsers: WaitingUser[] = [];
  const activeRooms = new Map<string, Set<WebSocket>>();
  const socketToRoom = new Map<WebSocket, string>();

  wss.on("connection", (ws) => {
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "join") {
          const { topic, format, intent, identity } = message;
          
          const matchIndex = waitingUsers.findIndex(u => 
            u.topic === topic && 
            u.format === format && 
            (u.intent !== intent || topic === 'General')
          );

          if (matchIndex !== -1) {
            const matchedUser = waitingUsers.splice(matchIndex, 1)[0];
            clearTimeout(matchedUser.timer);

            const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(7)}`;
            const room = new Set([ws, matchedUser.ws]);
            activeRooms.set(roomId, room);
            socketToRoom.set(ws, roomId);
            socketToRoom.set(matchedUser.ws, roomId);

            ws.send(JSON.stringify({ 
              type: "match", 
              roomId, 
              peerIdentity: matchedUser.identity 
            }));
            
            matchedUser.ws.send(JSON.stringify({ 
              type: "match", 
              roomId, 
              peerIdentity: identity 
            }));
          } else {
            const timer = setTimeout(() => {
              const idx = waitingUsers.findIndex(u => u.ws === ws);
              if (idx !== -1) {
                waitingUsers.splice(idx, 1);
                ws.send(JSON.stringify({ type: "no_users" }));
              }
            }, 45000);

            waitingUsers.push({ ws, id: Math.random().toString(36).substring(7), topic, format, intent, identity, timer });
            ws.send(JSON.stringify({ type: "waiting" }));
          }
        }

        if (message.type === "chat") {
          const { roomId, text, identity } = message;
          const room = activeRooms.get(roomId);
          if (room) {
            const chatMsg = JSON.stringify({ type: "chat", text, identity, id: Date.now().toString() });
            room.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(chatMsg);
              }
            });
          }
        }
      } catch (e) {
        console.error("WS Message Error:", e);
      }
    });

    ws.on("close", () => {
      const idx = waitingUsers.findIndex(u => u.ws === ws);
      if (idx !== -1) {
        clearTimeout(waitingUsers[idx].timer);
        waitingUsers.splice(idx, 1);
      }

      const roomId = socketToRoom.get(ws);
      if (roomId) {
        const room = activeRooms.get(roomId);
        if (room) {
          room.delete(ws);
          socketToRoom.delete(ws);
          if (room.size === 0) {
            activeRooms.delete(roomId);
          } else {
            room.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "peer_left" }));
              }
            });
          }
        }
      }
    });
  });

  // Serve static files in production
  if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  } else {
    // Vite middleware for development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  server.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(` WebSocket server is ready`);
    console.log(`Database path: ${dbPath}`);
  });
}

startServer().catch(console.error);