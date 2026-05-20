const mongoose = require("mongoose");
const express = require("express");
require("dotenv").config();

const app = express();

const URLSchema = new mongoose.Schema(
  { originalUrl: String, code: String },
  { timestamps: true },
);
const Url = mongoose.model("Url", URLSchema);

app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ status: "Success", msg: "Hello World!" });
});

app.post("/shorten", async (req, res) => {
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

app.get("/:code", async (req, res) => {
  const { code } = req.params;
  const existingUrl = await Url.findOne({ code });
  if (!existingUrl) {
    res.status(400).json({ error: "Code not found" });
    return;
  }
  const originalUrl = existingUrl.originalUrl;
  res.redirect(302, originalUrl);
});

const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((e) => console.log(e));
