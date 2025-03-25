import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function FileDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [file, setFile] = useState(null);

  useEffect(() => {
    if (!id) return;
    fetch("http://localhost:5000/files")
      .then((response) => response.json())
      .then((data) => {
        const foundFile = data.files.find((file) => file.id.toString() === id);
        setFile(foundFile);
      })
      .catch((error) => console.error("Erreur de récupération du fichier :", error));
  }, [id]);

  if (!file) return <p>Chargement...</p>;

  return (
    <div className="container">
      <h1>{file.title}</h1>
      <p>Tags : {file.tags.join(", ")}</p>

      {file.filename.endsWith(".mp4") || file.filename.endsWith(".webm") ? (
        <video src={`http://localhost:5000${file.path}`} controls width="400" />
      ) : (
        <img src={`http://localhost:5000${file.path}`} alt={file.title} width="400" />
      )}

      <style jsx>{`
        .container {
          text-align: center;
        }
      `}</style>
    </div>
  );
}
