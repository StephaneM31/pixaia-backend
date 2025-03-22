import { useEffect, useState, useRef } from "react";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faVideo, faArrowUp } from "@fortawesome/free-solid-svg-icons";

Modal.setAppElement("body");

export default function Home() {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [columnWidth, setColumnWidth] = useState(200);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false); // ✅ AJOUT ICI

  const galleryRef = useRef(null);
  const masonryInstance = useRef(null);

  // 📌 Ajuste la largeur des colonnes selon l’écran
  const updateColumnWidth = () => {
    if (window.innerWidth > 1024) {
      setColumnWidth(250);
    } else if (window.innerWidth > 768) {
      setColumnWidth(200);
    } else if (window.innerWidth > 480) {
      setColumnWidth(120);
    } else {
      setColumnWidth(window.innerWidth - 20);
    }
  };

  // 📌 Récupération des fichiers au montage
  useEffect(() => {
    fetch("http://localhost:5000/files")
      .then((response) => response.json())
      .then((data) => {
        const sortedFiles = data.files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
        setFiles(sortedFiles);
        setFilteredFiles(sortedFiles);
      })
      .catch((error) => console.error("Erreur de récupération des fichiers :", error));
  }, []);

  // 📌 Initialisation et mise à jour de Masonry
  useEffect(() => {
    if (!galleryRef.current) return;

    import("masonry-layout").then(({ default: Masonry }) => {
      if (masonryInstance.current) {
        masonryInstance.current.destroy();
      }

      masonryInstance.current = new Masonry(galleryRef.current, {
        itemSelector: ".file-card",
  columnWidth: 220, // ✅ valeur fixe
  gutter: 15,       // ✅ espace horizontal + vertical
  fitWidth: true,   // ✅ important pour centrage de la grille
  horizontalOrder: true,
      });

      const waitForMedia = () => {
        const mediaElements = document.querySelectorAll(".file-card img, .file-card video");
        let loadedCount = 0;

        if (mediaElements.length === 0) {
          masonryInstance.current.layout();
          return;
        }

        mediaElements.forEach((media) => {
          if ((media.tagName === "IMG" && media.complete) || (media.tagName === "VIDEO" && media.readyState === 4)) {
            loadedCount++;
          } else {
            media.onload = media.onloadeddata = () => {
              loadedCount++;
              if (loadedCount === mediaElements.length) {
                setTimeout(() => masonryInstance.current.layout(), 100);
              }
            };
          }
        });

        if (loadedCount === mediaElements.length) {
          setTimeout(() => masonryInstance.current.layout(), 100);
        }
      };

      waitForMedia();
    });

    return () => {
      if (masonryInstance.current) {
        masonryInstance.current.destroy();
      }
    };
  }, [filteredFiles, columnWidth]);

  // 📌 Mise à jour Masonry après redimensionnement
  useEffect(() => {
    const handleResize = () => {
      updateColumnWidth();
      if (masonryInstance.current) {
        masonryInstance.current.layout();
      }

      setTimeout(() => {
        if (masonryInstance.current) {
          masonryInstance.current.layout();
        }
      }, 300);
    };

    window.addEventListener("resize", handleResize);
    updateColumnWidth();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // 📌 Gestion du bouton "Revenir en haut"
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollButton(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 🔍 Fonction de recherche
  const handleSearch = (query) => {
    setSearchQuery(query);
    fetch(`http://localhost:5000/search?query=${query}`)
      .then((response) => response.json())
      .then((data) => setFilteredFiles(data.files))
      .catch((error) => console.error("Erreur de recherche :", error));
  };

  // 🎥📷 Filtrage par type
  const handleFilter = (type) => {
    setFilterType(type);
    fetch(`http://localhost:5000/filter?type=${type}`)
      .then((response) => response.json())
      .then((data) => setFilteredFiles(data.files))
      .catch((error) => console.error("Erreur de filtrage :", error));
  };

  // 🔄 Réinitialiser les filtres
  const resetFilter = () => {
    setSearchQuery("");
    setFilterType("");
    setFilteredFiles(files);
  };

  // 📌 Ouvrir et fermer la modal
  const openModal = (file) => {
    setSelectedFile(file);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setSelectedFile(null);
    setModalIsOpen(false);
  };

  return (
    <div className="container">
      <h1>Bienvenue sur Pixaia 🚀</h1>
      <p>Découvrez les dernières images et vidéos générées par IA.</p>

      {/* 🔍 Barre de recherche */}
      <input
        type="text"
        placeholder="Rechercher un fichier par titre ou hashtag..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="search-bar"
      />

      {/* 🎥📷 Boutons de filtrage */}
      <div className="filter-buttons">
        <button onClick={() => handleFilter("image")} className={filterType === "image" ? "active" : ""}>
          📷 Images
        </button>
        <button onClick={() => handleFilter("video")} className={filterType === "video" ? "active" : ""}>
          🎥 Vidéos
        </button>
        <button onClick={resetFilter} className={!filterType ? "active" : ""}>
          🔄 Tout
        </button>
      </div>

      {/* 📌 Galerie Masonry */}
      <div className="gallery" ref={galleryRef}>
        {filteredFiles.map((file) => (
          <div key={file.id} className="file-card" onClick={() => openModal(file)}>
            {file.filename.endsWith(".mp4") || file.filename.endsWith(".webm") ? (
              <div className="thumbnail video">
                <video
                  src={`http://localhost:5000${file.path}`}
                  width="100%"
                  onMouseEnter={(e) => e.target.play()}
                  onMouseLeave={(e) => e.target.pause()}
                  muted
                  loop
                  style={{ minHeight: "150px" }}
                />
                <span className="icon video">
                  <FontAwesomeIcon icon={faVideo} />
                </span>
              </div>
            ) : (
              <div className="thumbnail image">
                <img src={`http://localhost:5000${file.path}`} alt="Image" width="100%" />
                <span className="icon image">
                  <FontAwesomeIcon icon={faCamera} />
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 🔝 Bouton Retour en haut */}
      {showScrollButton && (
        <button className="scroll-to-top" onClick={scrollToTop}>
          <FontAwesomeIcon icon={faArrowUp} />
        </button>
      )}

      {/* 📌 Modal d'affichage */}
      <Modal isOpen={modalIsOpen} onRequestClose={closeModal} className="modal-content" overlayClassName="overlay">
  <button className="close-button" onClick={closeModal}>✖</button>
  {selectedFile && (
    <>
      <h2>{selectedFile.title || "Aucun titre"}</h2>
      <p className="hashtags">{selectedFile.tags?.map(tag => `#${tag}`).join(" ")}</p>

      {selectedFile.filename.endsWith(".mp4") || selectedFile.filename.endsWith(".webm") ? (
        <video
        src={`http://localhost:5000${selectedFile.path}`}
        controls
        autoPlay
        className="media-content"
      />
    ) : (
      <img
        src={`http://localhost:5000${selectedFile.path}`}
        alt="Image"
        className="media-content"
      />
    )}

      {showConfirm ? (
        <div className="confirm-box">
          <p>Êtes-vous sûr de vouloir supprimer ce fichier ?</p>
          <button className="confirm-btn" onClick={async () => {
            try {
              const response = await fetch(`http://localhost:5000/delete/${selectedFile.filename}`, {
                method: "DELETE",
              });
              if (response.ok) {
                setFiles((prev) => prev.filter((file) => file.filename !== selectedFile.filename));
                setFilteredFiles((prev) => prev.filter((file) => file.filename !== selectedFile.filename));
                closeModal();
              } else {
                console.error("Erreur lors de la suppression !");
              }
            } catch (error) {
              console.error("Erreur lors de la requête :", error);
            } finally {
              setShowConfirm(false);
            }
          }}>
            Oui
          </button>
          <button className="cancel-btn" onClick={() => setShowConfirm(false)}>Non</button>
        </div>
      ) : (
        <button className="delete-btn" onClick={() => setShowConfirm(true)}>🗑 Supprimer</button>
      )}
    </>
  )}
</Modal>
    </div>
  );
}
