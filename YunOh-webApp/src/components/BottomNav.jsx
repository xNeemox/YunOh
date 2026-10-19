import React from "react";
import { Home, Compass, Heart, User } from "lucide-react";
import "./BottomNav.css"; // Import the CSS file for styling

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-nav">
      <button
        className={`nav-item ${activeTab === "home" ? "active" : ""}`}
        onClick={() => setActiveTab("home")}
      >
        <Home size={22} />
        <span>Home</span>
      </button>

      <button
        className={`nav-item ${activeTab === "discover" ? "active" : ""}`}
        onClick={() => setActiveTab("discover")}
      >
        <Compass size={22} />
        <span>Discover</span>
      </button>

      <button
        className={`nav-item ${activeTab === "favorites" ? "active" : ""}`}
        onClick={() => setActiveTab("favorites")}
      >
        <Heart size={22} />
        <span>Favorites</span>
      </button>

      <button
        className={`nav-item ${activeTab === "profile" ? "active" : ""}`}
        onClick={() => setActiveTab("profile")}
      >
        <User size={22} />
        <span>Profile</span>
      </button>
    </nav>
  );
}
