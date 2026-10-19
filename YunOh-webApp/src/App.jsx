import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import HomeView from "./views/HomeView";
import DiscoverView from "./views/DiscoverView";
import FavoritesView from "./views/FavoritesView";
import ProfileView from "./views/ProfileView";
import { supabase } from "./supabaseClient";
import "./App.css";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("yunoh_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("yunoh_favorites", JSON.stringify(favorites));
  }, [favorites]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleFavorite = (restaurant) => {
    setFavorites((prevFavorites) => {
      const exists = prevFavorites.some((fav) => fav.id === restaurant.id);
      if (exists) {
        return prevFavorites.filter((fav) => fav.id !== restaurant.id);
      } else {
        return [...prevFavorites, restaurant];
      }
    });
  };

  return (
    <div className="desktop-container">
      <div className="phone-frame" data-theme={isDarkMode ? "dark" : "light"}>
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        <main className="app-content">
          {activeTab === "home" && (
            <HomeView favorites={favorites} toggleFavorite={toggleFavorite} />
          )}
          {activeTab === "discover" && (
            <DiscoverView
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          )}
          {activeTab === "favorites" && (
            <FavoritesView
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              setActiveTab={setActiveTab}
            />
          )}
          {activeTab === "profile" && (
            <ProfileView session={session} setSession={setSession} />
          )}
        </main>

        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
