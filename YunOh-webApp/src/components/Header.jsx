import React from "react";
import { Sun, Moon } from "lucide-react";
import "./Header.css"; // Import the CSS file for styling

export default function Header({ isDarkMode, toggleTheme }) {
  return (
    <header className="app-header">
      <div className="app-logo">YanOh 🍜</div>
      <button
        className="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label="Toggle theme"
      >
        {isDarkMode ? <Sun size={20} color="#F59E0B" /> : <Moon size={20} />}
      </button>
    </header>
  );
}
