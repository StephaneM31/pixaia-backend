const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// 📌 Dossier où stocker les fichiers uploadés (Défini AVANT son utilisation)
const uploadDir = path.join(__dirname, "uploads");
const dataFile = path.join(__dirname, "uploads.json"); // 📌 Fichier pour stocker les métadonnées

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([]));

// 📌 Servir les fichiers statiques
app.use("/uploads", express.static(uploadDir));

// 📌 Route de test (API existante)
app.get("/", (req, res) => {
    res.send("Hello from Pixaia API!");
});

// 📌 Configuration de Multer pour l’upload des fichiers
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Renomme le fichier avec un timestamp unique
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 📌 Limite de 50MB par fichier
});

// 📌 Route pour uploader un fichier AVEC titre et tags
app.post("/upload", upload.single("file"), (req, res) => {
    const { title, tags } = req.body;

    if (!req.file || !title || !tags) {
        return res.status(400).json({ error: "Fichier, titre et tags sont obligatoires." });
    }

    // Charger les données existantes
    const existingData = JSON.parse(fs.readFileSync(dataFile));

    // Ajouter un nouvel objet avec métadonnées
    const newFile = {
        id: Date.now(),
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        title,
        tags: tags.split(",").map(tag => tag.trim()), // Convertir en tableau
        uploadedAt: new Date().toISOString(),
        likes: 0,
        comments: []
    };

    existingData.push(newFile);

    // Sauvegarder les données mises à jour
    fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));

    res.json({ message: "Fichier uploadé avec succès !", file: newFile });
});

// 📌 Route pour récupérer la liste des fichiers AVEC leurs métadonnées
app.get("/files", (req, res) => {
    try {
        const filesData = JSON.parse(fs.readFileSync(dataFile));
        res.json({ files: filesData });
    } catch (error) {
        res.status(500).json({ error: "Impossible de récupérer les fichiers." });
    }
});

// 📌 Route pour supprimer un fichier
app.delete("/delete/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    console.log("Tentative de suppression du fichier :", filePath); // Debug

    if (!fs.existsSync(filePath)) {
        console.error("Erreur : Fichier non trouvé !");
        return res.status(404).json({ error: "Fichier non trouvé." });
    }

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error("Erreur lors de la suppression :", err);
            return res.status(500).json({ error: "Impossible de supprimer le fichier." });
        }

        // 📌 Supprimer aussi l'entrée dans `uploads.json`
        let existingData = JSON.parse(fs.readFileSync(dataFile));
        existingData = existingData.filter(file => file.filename !== filename);
        fs.writeFileSync(dataFile, JSON.stringify(existingData, null, 2));

        console.log("Fichier supprimé avec succès !");
        res.json({ message: "Fichier supprimé avec succès !" });
    });
});

// 📌 Démarrer le serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));
