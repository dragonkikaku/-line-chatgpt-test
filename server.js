import express from "express";
import { Client, middleware } from "@line/bot-sdk";
import OpenAI from "openai";

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new Client(config);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/line", middleware(config), async (req, res) => {
  try {
    const events = req.body.events;
    const results = await Promise.all(events.map(handleEvent));
    return res.status(200).json(results);
  } catch (e) {
    console.error("ERROR:", e);
    return res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return client.replyMessage(event.replyToken, {
      type: "text",
      text: "テキストで話しかけてね！",
    });
  }

  const userMessage = event.message.text;

  const ai = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: userMessage }],
  });

  const reply = ai.choices[0].message.content;

  return client.replyMessage(event.replyToken, {
    type: "text",
    text: reply,
  });
}

export default app;
