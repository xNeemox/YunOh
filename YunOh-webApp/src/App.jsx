import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import HomeView from "./views/HomeView";
import DiscoverView from "./views/DiscoverView";
import FavoritesView from "./views/FavoritesView";
import ProfileView from "./views/ProfileView";
import DetailView from "./views/DetailView";
import BusinessProfileView from "./views/BusinessProfileView";
import LoginView from "./views/LoginView"; // <--- NEW
import RegisterView from "./views/RegisterView"; // <--- NEW
import { supabase } from "./supabaseClient";
import "./views/AuthViews.css"; // <--- NEW: Import CSS for auth views
import "./App.css";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [session, setSession] = useState(null);

  // <--- NEW: State to track if we show 'login' or 'register' when signed out
  const [authViewMode, setAuthViewMode] = useState("login");

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
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
    setSelectedBusinessProfile(null);
  };

  return (
    <div className="desktop-container">
      <div className="phone-frame" data-theme={isDarkMode ? "dark" : "light"}>
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        <main className="app-content">
          {/* --- GATEWAY: If not signed in, show Login or Register view by default --- */}
          {!session ? (
            authViewMode === "login" ? (
              <LoginView
                onBack={() => setAuthViewMode("login")} // or handle guest mode if needed
                onLoginSuccess={(newSession) => setSession(newSession)}
                switchToRegister={() => setAuthViewMode("register")}
              />
            ) : (
              <RegisterView
                onBack={() => setAuthViewMode("login")}
                switchToLogin={() => setAuthViewMode("login")}
              />
            )
          ) : selectedBusinessProfile ? (
            /* Priority 1: Business Profile View */
            <BusinessProfileView
              business={selectedBusinessProfile}
              onBack={() => setSelectedBusinessProfile(null)}
            />
          ) : selectedRestaurant ? (
            /* Priority 2: Detail View */
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
            /* Priority 3: Main Tabbed Feeds */
            <>
              {activeTab === "home" && (
                <HomeView
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onSelectRestaurant={(spot) => setSelectedRestaurant(spot)}
                  onSelectBusinessProfile={(spot) =>
                    setSelectedBusinessProfile(spot)
                  }
                />
              )}
              {activeTab === "discover" && (
                <DiscoverView
                  favorites={favorites}
                  toggleFavorite={toggleFavorite}
                  onSelectRestaurant={(spot) => setSelectedRestaurant(spot)}
                  onSelectBusinessProfile={(spot) =>
                    setSelectedBusinessProfile(spot)
                  }
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
                  }
                />
              )}
              {activeTab === "profile" && (
                <ProfileView
                  session={session}
                  setSession={setSession}
                  onNavigateToLogin={() => setAuthViewMode("login")}
                  onNavigateToRegister={() => setAuthViewMode("register")}
                />
              )}
            </>
          )}
        </main>

        {/* Only show bottom navigation if user is logged in */}
        {session && (
          <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
        )}
      </div>
    </div>
  );
}
