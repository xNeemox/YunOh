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
import AdminView from "./views/AdminView";
import BusinessRegistrationModal from "./components/BusinessRegistrationModal";
import { supabase } from "./supabaseClient";
import "./views/AuthViews.css";
import "./App.css";

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [session, setSession] = useState(null);

  const [userRole, setUserRole] = useState(null);
  const [authViewMode, setAuthViewMode] = useState("login");

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedBusinessProfile, setSelectedBusinessProfile] = useState(null);

  // Full-page Business Registration view state
  const [isBusinessRegOpen, setIsBusinessRegOpen] = useState(false);

  // Helper function to fetch role from profiles table
  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setUserRole(data.role);
    } else {
      setUserRole("consumer");
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        fetchUserRole(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
      }
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
    setIsBusinessRegOpen(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    setActiveTab("home");
    setAuthViewMode("login");
    setIsBusinessRegOpen(false);
  };

  return (
    <div className="desktop-container">
      <div
        className={`phone-frame ${userRole === "admin" ? "admin-mode" : ""}`}
        data-theme={isDarkMode ? "dark" : "light"}
      >
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        <main className="app-content">
          {!session ? (
            authViewMode === "login" ? (
              <LoginView
                onBack={() => setAuthViewMode("login")}
                onLoginSuccess={(authData) => {
                  setSession(authData.session);
                  setUserRole(authData.role);
                  setActiveTab("home");
                }}
                switchToRegister={() => setAuthViewMode("register")}
              />
            ) : (
              <RegisterView
                onBack={() => setAuthViewMode("login")}
                switchToLogin={() => setAuthViewMode("login")}
              />
            )
          ) : userRole === "admin" ? (
            /* --- FLEXIBLE MOBILE & DESKTOP ADMIN CONTROL CENTER --- */
            <AdminView onSignOut={handleSignOut} />
          ) : isBusinessRegOpen ? (
            /* --- DEDICATED BUSINESS REGISTRATION PAGE --- */
            <BusinessRegistrationModal
              isOpen={isBusinessRegOpen}
              session={session}
              onClose={() => setIsBusinessRegOpen(false)}
              onSubmitSuccess={() => {
                if (session?.user?.id) {
                  fetchUserRole(session.user.id);
                }
                setIsBusinessRegOpen(false);
                setActiveTab("profile");
              }}
            />
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
                  userRole={userRole}
                  onSignOut={handleSignOut}
                  onNavigateToLogin={() => setAuthViewMode("login")}
                  onNavigateToRegister={() => setAuthViewMode("register")}
                  onOpenBusinessRegistration={() => setIsBusinessRegOpen(true)}
                />
              )}
            </>
          )}
        </main>

        {session && userRole !== "admin" && (
          <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
        )}
      </div>
    </div>
  );
}
