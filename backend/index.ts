import { Schema, model, connect } from 'mongoose';
import express from 'express';
import type { Request, Response } from 'express';
import dotenv from "dotenv";

dotenv.config();

const app = express();

interface IUrl {
  originalUrl: string
  code: string
  createdAt: Date
  updatedAt: Date
}

const UrlSchema = new Schema<IUrl>({
  originalUrl: { type: String, required: true },
  code: { type: String, required: true },
  },
  { timestamps: true },
);

const Url = model<IUrl>("Url", UrlSchema);

app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ status: "Success", msg: "Hello World!" });
});

app.post("/shorten", async (req: Request, res: Response) => {
  const originalUrl = req.body.url;
  const urlRegex =
    /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/;

  if (!originalUrl || !originalUrl.match(urlRegex)) {
    res.status(400).json({ error: "Please provide a valid URL" });
    return;
  }
  const existing = await Url.findOne({ originalUrl });
  if (existing) {
    const code = existing.code;
    res.status(200).json({ msg: "URL already exists", originalUrl, code });
  } else {
    const code = Math.random().toString(36).substring(2, 8);
    await Url.create({ originalUrl, code });
    res.status(200).json({ msg: "URL saved successfully", originalUrl, code });
  }
});

app.get("/:code", async (req: Request<{ code: string }>, res: Response) => {
  const { code } = req.params;
  const existingUrl = await Url.findOne({ code });
  if (!existingUrl) {
    res.status(400).json({ error: "Code not found" });
    return;
  }

  const originalUrl = existingUrl.originalUrl;
  if(!originalUrl) return res.status(400).json({ error: "Original URL Not found" });
  res.redirect(302, originalUrl);
});

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
if(!MONGO_URI) throw new Error("MONGO_URI not defined");

connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((e) => console.log(e));
