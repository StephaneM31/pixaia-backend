const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 📌 Dossiers et fichiers de stockage
const uploadDir = path.join(__dirname, "uploads");
const dataFile = path.join(__dirname, "uploads.json");

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([]));

// 📌 Servir les fichiers statiques
app.use("/uploads", express.static(uploadDir));

// 📌 Route de test
app.get("/", (req, res) => {
  res.send("✅ Backend Pixaia is running!");
});

// 📌 Multer pour upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// 📌 Upload
app.post("/upload", upload.single("file"), (req, res) => {
  const { title, tags } = req.body;
  if (!req.file || !title || !tags) {
    return res
      .status(400)
      .json({ error: "Fichier, titre et tags sont obligatoires." });
  }

  const existingData = JSON.parse(fs.readFileSync(dataFile));
  const newFile = {
    id: Date.now(),
    filename: req.file.filename,
    path: `/uploads/${req.file.filename}`,
    title,
    tags: tags.split(",").map((tag) => tag.trim()),
    uploadedAt: new Date().toISOString(),
    type: req.file.mimetype.startsWith("image") ? "image" : "video",
    likes: 0,
    comments: [],
  };

  existingData.push(newFile);
  fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));
  res.json({ message: "✅ Upload réussi !", file: newFile });
});

// 📌 Liste fichiers (option type)
app.get("/files", (req, res) => {
  try {
    let filesData = JSON.parse(fs.readFileSync(dataFile));
    const typeFilter = req.query.type;

    if (typeFilter) {
      filesData = filesData.filter((file) => file.type === typeFilter);
    }

    res.json({ files: filesData });
  } catch (err) {
    res.status(500).json({ error: "Erreur lecture fichiers." });
  }
});

// 📌 Recherche
app.get("/search", (req, res) => {
  const query = req.query.query?.toLowerCase();
  const filesData = JSON.parse(fs.readFileSync(dataFile));
  const results = filesData.filter(
    (file) =>
      file.title.toLowerCase().includes(query) ||
      file.tags.some((tag) => tag.toLowerCase().includes(query))
  );
  res.json({ files: results });
});

// 📌 Filtres
app.get("/filter", (req, res) => {
  const type = req.query.type;
  const filesData = JSON.parse(fs.readFileSync(dataFile));
  const filtered = filesData
    .filter((file) => {
      if (type === "image") {
        return /\.(png|jpg|jpeg)$/i.test(file.filename);
      } else if (type === "video") {
        return /\.(mp4|webm)$/i.test(file.filename);
      }
      return false;
    })
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  res.json({ files: filtered });
});

// 📌 Supprimer
app.delete("/delete/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Fichier non trouvé." });
  }

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: "Erreur suppression fichier." });
    }

    let existingData = JSON.parse(fs.readFileSync(dataFile));
    existingData = existingData.filter((f) => f.filename !== filename);
    fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));

    res.json({ message: "✅ Fichier supprimé." });
  });
});

// ✅ Port dynamique (Render ou localhost)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Serveur actif sur le port ${PORT}`);
});
