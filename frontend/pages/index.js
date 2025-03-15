import { useEffect, useState } from "react";

export default function Home() {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = () => {
    fetch("http://localhost:5000/files")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Réponse du serveur incorrecte !");
        }
        return response.json();
      })
      .then((data) => setFiles(data.files))
      .catch((error) => console.error("Erreur de récupération des fichiers :", error));
  };

  const handleDelete = (filename) => {
    console.log("Suppression demandée pour :", filename); // Debug

    if (!window.confirm("Voulez-vous vraiment supprimer ce fichier ?")) return;

    fetch(`http://localhost:5000/delete/${filename}`, { method: "DELETE" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors de la suppression !");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data.message);
        fetchFiles(); // Rafraîchir la liste après suppression
      })
      .catch((error) => console.error("Erreur lors de la suppression :", error));
};
  return (
    <div className="container">
      <h1>Bienvenue sur Pixaia 🚀</h1>
      <p>Découvrez les dernières images et vidéos générées par IA.</p>

      <h2>Fichiers Récents</h2>
      {files.length === 0 ? (
        <p>Aucun fichier uploadé pour l'instant.</p>
      ) : (
        <ul className="file-list">
          {files.map((file, index) => (
            <li key={index} className="file-item">
              {file.endsWith(".mp4") || file.endsWith(".webm") ? (
                <video src={`http://localhost:5000/uploads/${file}`} controls width="300" />
              ) : (
                <img src={`http://localhost:5000/uploads/${file}`} alt={file} width="150" />
              )}
              <button className="delete-btn" onClick={() => handleDelete(file)}>🗑 Supprimer</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
