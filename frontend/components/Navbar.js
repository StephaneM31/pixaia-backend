import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-logo">Pixaia</Link>
      <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </button>
      <ul className={`navbar-links ${menuOpen ? "open" : ""}`}>
        <li><Link href="/">Accueil</Link></li>
        <li><Link href="/upload">Uploader</Link></li>
      </ul>
    </nav>
  );
}
