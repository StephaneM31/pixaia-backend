import { useState } from "react";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");

  const allowedImageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/webm"];

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (![...allowedImageTypes, ...allowedVideoTypes].includes(selectedFile.type)) {
      alert("Format non autorisé. Veuillez sélectionner une image ou une vidéo.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      alert("Veuillez sélectionner un fichier.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      setUploadMessage(result.message);
      setFile(null);
    } catch (error) {
      console.error("Erreur lors de l'upload :", error);
      setUploadMessage("Erreur lors de l'upload. Réessayez.");
    }
  };

  return (
    <div className="container">
      <h1>Uploader une image ou une vidéo</h1>
      <form onSubmit={handleSubmit} className="upload-form">
        <input type="file" accept="image/*,video/*" onChange={handleFileChange} />
        {file && <p>Fichier sélectionné : <strong>{file.name}</strong></p>}
        <button type="submit">Envoyer</button>
      </form>
      {uploadMessage && <p>{uploadMessage}</p>}
    </div>
  );
}
