import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import HomeView from "./views/HomeView";
import DiscoverView from "./views/DiscoverView";
import FavoritesView from "./views/FavoritesView";
import ProfileView from "./views/ProfileView";
import DetailView from "./views/DetailView"; // <--- ADDED: Import DetailView component
import { supabase } from "./supabaseClient";
import "./App.css";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [session, setSession] = useState(null);

  // <--- ADDED: State to manage the currently selected restaurant for the detail view
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

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

  // <--- ADDED: Helper to reset the detail view when switching tabs via bottom navigation
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedRestaurant(null);
  };

  return (
    <div className="desktop-container">
      <div className="phone-frame" data-theme={isDarkMode ? "dark" : "light"}>
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        <main className="app-content">
          {/* <--- ADDED: If a restaurant is selected, show DetailView. Otherwise, show the active tab feed */}
          {selectedRestaurant ? (
            <DetailView
              restaurant={selectedRestaurant}
              onBack={() => setSelectedRestaurant(null)}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
            />
          ) : (
            <>
              {activeTab === "home" && (
                <HomeView
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onSelectRestaurant={(spot) => setSelectedRestaurant(spot)} // <--- ADDED Prop
                />
              )}
              {activeTab === "discover" && (
                <DiscoverView
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onSelectRestaurant={(spot) => setSelectedRestaurant(spot)} // <--- ADDED Prop
                />
              )}
              {activeTab === "favorites" && (
                <FavoritesView
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  setActiveTab={setActiveTab}
                  onSelectRestaurant={(spot) => setSelectedRestaurant(spot)} // <--- ADDED Prop
                />
              )}
              {activeTab === "profile" && (
                <ProfileView session={session} setSession={setSession} />
              )}
            </>
          )}
        </main>

        <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>
    </div>
  );
}
