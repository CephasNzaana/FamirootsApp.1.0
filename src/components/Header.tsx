
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Menu, X, User } from "lucide-react";
import { Navigation } from "@/components/Navigation";
import { useMediaQuery } from "@/hooks/use-mobile";

interface HeaderProps {
  onLogin: () => void;
  onSignup: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogin, onSignup }) => {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-uganda-yellow mr-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-uganda-black"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div>
                <h1 className="font-bold text-xl text-uganda-black">
                  FamiRoots
                </h1>
                <p className="text-xs text-gray-500">
                  Ugandan Family Heritage
                </p>
              </div>
            </Link>
          </div>

          {isMobile ? (
            <div className="flex items-center">
              {!isMenuOpen ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </Button>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="h-6 w-6" />
                  </Button>
                  <div className="fixed inset-0 z-50 bg-white p-4 pt-20">
                    <Navigation onClose={() => setIsMenuOpen(false)} />
                  </div>
                </>
              )}
            </div>
          ) : (
            <Navigation onClose={() => {}} />
          )}

          <div className="flex items-center space-x-2">
            {user ? (
              <div className="flex items-center space-x-2">
                <Link to="/profile">
                  <Button 
                    variant="outline"
                    className="flex items-center space-x-2 bg-white text-uganda-black border-uganda-yellow"
                  >
                    <User size={18} />
                    <span>My Profile</span>
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="text-uganda-red hover:text-uganda-red/90"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={onLogin}
                  className="text-uganda-black hover:text-uganda-black/90"
                >
                  Login
                </Button>
                <Button
                  onClick={onSignup}
                  className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
