import { useState } from "react";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false); // 📌 Gère l'état du bouton

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !title || !tags) {
      setMessage("Veuillez sélectionner un fichier et remplir le titre et les tags.");
      return;
    }

    setIsUploading(true); // 📌 Désactive le bouton pendant l'upload

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("tags", tags);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Fichier uploadé avec succès !");
        setFile(null);
        setTitle("");
        setTags("");
      } else {
        setMessage(`Erreur : ${data.error}`);
      }
    } catch (error) {
      setMessage("Erreur lors de l'upload.");
    } finally {
      setIsUploading(false); // 📌 Réactive le bouton après l'upload
    }
  };

  return (
    <div className="container">
      <h1>Uploader un fichier</h1>

      <label>
        Titre :
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nom du fichier"
        />
      </label>

      <label>
        Tags (séparés par des virgules) :
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="ex: art, digital, IA"
        />
      </label>

      <label>
        Sélectionnez un fichier :
        <input type="file" onChange={handleFileChange} />
      </label>

      {/* 📌 Bouton désactivé pendant l'upload */}
      <button onClick={handleUpload} disabled={isUploading}>
        {isUploading ? "Envoi en cours..." : "Uploader"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}
