import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <h1>Pixaia</h1>
        <ul>
          <li><Link href="/">Accueil</Link></li>
          <li><Link href="/upload">Upload</Link></li>
          <li><Link href="/profile">Profil</Link></li>
        </ul>
      </div>
    </nav>
  );
}
