import { useEffect, useState, useRef } from "react";
import Modal from "react-modal";

Modal.setAppElement("body"); // Pour éviter un avertissement Next.js

export default function Home() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const galleryRef = useRef(null);
  const masonryInstance = useRef(null);

  useEffect(() => {
    fetch("http://localhost:5000/files")
      .then((response) => response.json())
      .then((data) => {
        const sortedFiles = data.files.sort((a, b) => b.filename.localeCompare(a.filename));
        setFiles(sortedFiles);
      })
      .catch((error) => console.error("Erreur de récupération des fichiers :", error));
  }, []);

  useEffect(() => {
    if (!galleryRef.current) return;

    import("masonry-layout").then(({ default: Masonry }) => {
      setTimeout(() => {
        if (masonryInstance.current) {
          masonryInstance.current.destroy();
        }

        masonryInstance.current = new Masonry(galleryRef.current, {
          itemSelector: ".file-card",
          columnWidth: 200,
          percentPosition: true,
          fitWidth: true,
          horizontalOrder: true,
        });
      }, 100);
    });
  }, [files]);

  // 📌 Ouvre la modal et stocke l'image sélectionnée
  const openModal = (file) => {
    setSelectedFile(file);
    setModalIsOpen(true);
  };

  // 📌 Ferme la modal
  const closeModal = () => {
    setSelectedFile(null);
    setModalIsOpen(false);
  };

  // 📌 Supprime un fichier (backend)
  const handleDelete = async () => {
    if (!selectedFile) return;
    try {
      const response = await fetch(`http://localhost:5000/delete/${selectedFile.filename}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFiles(prevFiles => prevFiles.filter(file => file.filename !== selectedFile.filename));
        closeModal(); // Fermer la modal après suppression
      } else {
        console.error("Erreur lors de la suppression !");
      }
    } catch (error) {
      console.error("Erreur lors de la requête :", error);
    }
  };

  return (
    <div className="container">
      <h1>Bienvenue sur Pixaia 🚀</h1>
      <p>Découvrez les dernières images et vidéos générées par IA.</p>

      <div className="gallery" ref={galleryRef}>
        {files.map((file) => (
          <div key={file.id} className="file-card" onClick={() => openModal(file)}>
            {file.filename.endsWith(".mp4") || file.filename.endsWith(".webm") ? (
              <div className="thumbnail video">
                <video src={`http://localhost:5000${file.path}`} width="200" />
                <span className="icon">🎥</span>
              </div>
            ) : (
              <div className="thumbnail image">
                <img src={`http://localhost:5000${file.path}`} alt="Image" width="200" />
                <span className="icon">📷</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 📌 Modal d'affichage du fichier sélectionné */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Détail du fichier"
        className="modal-content"
        overlayClassName="overlay"
      >
        <button className="close-button" onClick={closeModal}>✖</button>
        {selectedFile && (
          <>
            <h2>{selectedFile.title || "Aucun titre"}</h2>
            <p className="hashtags">
              {Array.isArray(selectedFile.tags)
                ? selectedFile.tags.map(tag => `#${tag.trim()}`).join(" ")
                : (typeof selectedFile.tags === "string" ? selectedFile.tags.split(",").map(tag => `#${tag.trim()}`).join(" ") : "Aucun hashtag")
              }
            </p>
            {selectedFile.filename.endsWith(".mp4") || selectedFile.filename.endsWith(".webm") ? (
              <video src={`http://localhost:5000${selectedFile.path}`} controls className="media-content" />
            ) : (
              <img src={`http://localhost:5000${selectedFile.path}`} alt="Image" className="media-content" />
            )}
            {/* 📌 Bouton de suppression */}
            <button className="delete-btn" onClick={handleDelete}>🗑 Supprimer</button>
          </>
        )}
      </Modal>

      <style jsx>{`
        .gallery {
          width: 100%;
          max-width: 1200px;
          margin: auto;
        }

        .file-card {
          width: 200px;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .file-card:hover {
          transform: scale(1.05);
        }

        .thumbnail {
          display: inline-block;
          width: 100%;
        }

        .thumbnail img, .thumbnail video {
          width: 100%;
          height: auto;
          object-fit: cover;
          border-radius: 5px;
        }

        /* 📌 Modal Styling */
        .overlay {
          background: rgba(0, 0, 0, 0.6);
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          background: white;
          padding: 20px;
          border-radius: 10px;
          width: 50%;
          max-width: 600px;
          min-width: 300px;
          height: auto;
          max-height: 80vh;
          text-align: center;
          position: relative;
          box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.3);
        }

        .close-button {
          position: absolute;
          top: 10px;
          right: 15px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: black;
        }

        .close-button:hover {
          color: red;
        }

        .media-content {
          max-width: 100%;
          max-height: 60vh;
          object-fit: contain;
          border-radius: 5px;
        }

        .hashtags {
          font-size: 14px;
          color: #555;
          margin-top: 5px;
        }

        /* 📌 Bouton supprimer */
        .delete-btn {
          margin-top: 10px;
          background: red;
          color: white;
          border: none;
          padding: 10px 15px;
          cursor: pointer;
          border-radius: 5px;
          font-size: 16px;
        }

        .delete-btn:hover {
          background: darkred;
        }
      `}</style>
    </div>
  );
}
