import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import HomeView from "./views/HomeView";
import DiscoverView from "./views/DiscoverView";
import FavoritesView from "./views/FavoritesView";
import ProfileView from "./views/ProfileView";
import DetailView from "./views/DetailView";
import BusinessProfileView from "./views/BusinessProfileView"; // <--- NEW: Import BusinessProfileView
import { supabase } from "./supabaseClient";
import "./App.css";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [session, setSession] = useState(null);

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // <--- NEW: State to manage when a user is viewing a business storefront profile
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState(null);

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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedRestaurant(null);
    setSelectedBusinessProfile(null); // <--- NEW: Reset business profile on tab switch
  };

  return (
    <div className="desktop-container">
      <div className="phone-frame" data-theme={isDarkMode ? "dark" : "light"}>
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        <main className="app-content">
          {/* <--- NEW: Priority 1: If a business profile is open, show BusinessProfileView */}
          {selectedBusinessProfile ? (
            <BusinessProfileView
              business={selectedBusinessProfile}
              onBack={() => setSelectedBusinessProfile(null)}
            />
          ) : selectedRestaurant ? (
            /* Priority 2: If a restaurant detail is open, show DetailView */
            <DetailView
              restaurant={selectedRestaurant}
              onBack={() => setSelectedRestaurant(null)}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              onSelectBusinessProfile={(spot) =>
                setSelectedBusinessProfile(spot)
              }
            />
          ) : (
            /* Priority 3: Otherwise, show the active tab feed */
            <>
              {activeTab === "home" && (
                <HomeView
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onSelectRestaurant={(spot) => setSelectedRestaurant(spot)}
                  onSelectBusinessProfile={(spot) =>
                    setSelectedBusinessProfile(spot)
                  } // <--- NEW Prop
                />
              )}
              {activeTab === "discover" && (
                <DiscoverView
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onSelectRestaurant={(spot) => setSelectedRestaurant(spot)}
                  onSelectBusinessProfile={(spot) =>
                    setSelectedBusinessProfile(spot)
                  } // <--- NEW Prop
                />
              )}
              {activeTab === "favorites" && (
                <FavoritesView
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  setActiveTab={setActiveTab}
                  onSelectRestaurant={(spot) => setSelectedRestaurant(spot)}
                  onSelectBusinessProfile={(spot) =>
                    setSelectedBusinessProfile(spot)
                  } // <--- NEW Prop
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
