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

// 📌 Création des dossiers/fichiers si non existants
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([]));

// 📌 Servir les fichiers statiques
app.use("/uploads", express.static(uploadDir));

// 📌 Route de test
app.get("/", (req, res) => {
    res.send("Hello from Pixaia API!");
});

// 📌 Configuration Multer pour l'upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 📌 50MB max par fichier
});

// 📌 Route pour uploader un fichier
app.post("/upload", upload.single("file"), (req, res) => {
    const { title, tags } = req.body;
    if (!req.file || !title || !tags) {
        return res.status(400).json({ error: "Fichier, titre et tags sont obligatoires." });
    }

    const existingData = JSON.parse(fs.readFileSync(dataFile));

    // 📌 Création de l'objet fichier avec métadonnées
    const newFile = {
        id: Date.now(),
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        title,
        tags: tags.split(",").map(tag => tag.trim()),
        uploadedAt: new Date().toISOString(),
        type: req.file.mimetype.startsWith("image") ? "image" : "video", // 📌 Type fichier
        likes: 0,
        comments: []
    };

    existingData.push(newFile);
    fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));

    res.json({ message: "Fichier uploadé avec succès !", file: newFile });
});

// 📌 Route pour récupérer la liste des fichiers AVEC filtrage
app.get('/files', (req, res) => {
    try {
        let filesData = JSON.parse(fs.readFileSync(dataFile));
        const typeFilter = req.query.type;

        if (typeFilter) {
            filesData = filesData.filter(file => file.type === typeFilter);
        }

        res.json({ files: filesData });
    } catch (error) {
        res.status(500).json({ error: 'Impossible de récupérer les fichiers.' });
    }
});

// 📌 Route pour rechercher des fichiers (titre & tags)
app.get("/search", (req, res) => {
    const query = req.query.query.toLowerCase();
    const filesData = JSON.parse(fs.readFileSync(dataFile));
    const filteredFiles = filesData.filter(file =>
      file.title.toLowerCase().includes(query) ||
      file.tags.some(tag => tag.toLowerCase().includes(query))
    );
    res.json({ files: filteredFiles });
  });

  app.get("/filter", (req, res) => {
    const type = req.query.type;
    const filesData = JSON.parse(fs.readFileSync(dataFile));
  
    const filteredFiles = filesData
      .filter(file => {
        if (type === "image") {
          return file.filename.endsWith(".png") || file.filename.endsWith(".jpg") || file.filename.endsWith(".jpeg");
        } else if (type === "video") {
          return file.filename.endsWith(".mp4") || file.filename.endsWith(".webm");
        }
        return false;
      })
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)); // 🔥 tri du plus récent au plus ancien
  
    res.json({ files: filteredFiles });
  });


// 📌 Route pour supprimer un fichier
app.delete("/delete/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "Fichier non trouvé." });
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            return res.status(500).json({ error: "Impossible de supprimer le fichier." });
        }

        // 📌 Suppression dans `uploads.json`
        let existingData = JSON.parse(fs.readFileSync(dataFile));
        existingData = existingData.filter(file => file.filename !== filename);
        fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));

        res.json({ message: "Fichier supprimé avec succès !" });
    });
});

// 📌 Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
