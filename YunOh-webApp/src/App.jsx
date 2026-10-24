import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import HomeView from "./views/HomeView";
import DiscoverView from "./views/DiscoverView";
import FavoritesView from "./views/FavoritesView";
import ProfileView from "./views/ProfileView";
import DetailView from "./views/DetailView";
import BusinessProfileView from "./views/BusinessProfileView";
import LoginView from "./views/LoginView";
import RegisterView from "./views/RegisterView";
import BusinessRegistrationModal from "./components/BusinessRegistrationModal"; // <--- 1. IMPORT MODAL
import { supabase } from "./supabaseClient";
import "./views/AuthViews.css";
import "./App.css";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [session, setSession] = useState(null);

  const [authViewMode, setAuthViewMode] = useState("login");

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState(null);

  // <--- 2. ADD MODAL STATE HERE
  const [isBusinessRegOpen, setIsBusinessRegOpen] = useState(false);

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
          {!session ? (
            authViewMode === "login" ? (
              <LoginView
                onBack={() => setAuthViewMode("login")}
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
            <BusinessProfileView
              business={selectedBusinessProfile}
              onBack={() => setSelectedBusinessProfile(null)}
            />
          ) : selectedRestaurant ? (
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
                  onOpenBusinessRegistration={() => setIsBusinessRegOpen(true)} // <--- 3. PASS CALLBACK HERE
                />
              )}
            </>
          )}
        </main>

        {/* --- 4. RENDER MODAL AT ROOT LEVEL --- */}
        <BusinessRegistrationModal
          isOpen={isBusinessRegOpen}
          onClose={() => setIsBusinessRegOpen(false)}
          onSubmitSuccess={(formData) => {
            console.log(
              "Registered business data pending manual review:",
              formData,
            );
          }}
        />

        {session && (
          <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
        )}
      </div>
    </div>
  );
}
