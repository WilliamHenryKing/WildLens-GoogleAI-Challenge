// server/index.js
import path from "path";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: "20mb" }));
app.use(cors());

// IMPORTANT: set this in Cloud Run (GEMINI_API_KEY)
const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_AI_API_KEY ||
  process.env.API_KEY;

if (!apiKey) {
  console.error(
    "GEMINI_API_KEY/GOOGLE_AI_API_KEY/API_KEY is not set. Configure it in Cloud Run."
  );
  // Don't crash the process so the static site still serves, but the /api will 500 until you set the key
}

const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

/**
 * Generic proxy that mirrors the two SDK shapes you use in the frontend:
 * 1) ai.responses.generate(args)           -> mode: "responses.generate"
 * 2) ai.chats.create(...).sendMessage(...) -> mode: "chats.sendMessage"
 *
 * Request body:
 * { mode: "responses.generate", args: {...} }
 * or
 * { mode: "chats.sendMessage", model, config, history, message }
 */
app.post("/api/generate", async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: "Server API key not configured." });
    }

    const { mode } = req.body || {};

    if (mode === "responses.generate") {
      const { args } = req.body;
      const resp = await ai.responses.generate(args);
      // SDK exposes resp.text
      return res.json({ text: resp.text ?? "" });
    }

    if (mode === "chats.sendMessage") {
      const { model, config, history, message } = req.body;
      const chat = ai.chats.create({ model, config, history });
      const resp = await chat.sendMessage({ message });
      return res.json({ text: resp.text ?? "" });
    }

    return res.status(400).json({ error: "Unknown mode." });
  } catch (err) {
    console.error("Proxy error:", err);
    return res.status(500).json({ error: "Proxy call failed." });
  }
});

// Serve the built SPA
app.use(express.static(path.join(__dirname, "..", "dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Server listening on http://0.0.0.0:${port}`);
});
