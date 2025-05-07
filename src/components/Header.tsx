
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User } from "@/types";

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onSignup: () => void;
  onLogout: () => void;
}

const Header = ({ user, onLogin, onSignup, onLogout }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="w-full bg-white bg-opacity-90 backdrop-blur-sm shadow-md py-4 px-6 md:px-10">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-0.5">
            <div className="w-4 h-8 bg-uganda-black"></div>
            <div className="w-4 h-8 bg-uganda-yellow"></div>
            <div className="w-4 h-8 bg-uganda-red"></div>
          </div>
          <h1 className="text-2xl font-bold text-uganda-black">
            Fami<span className="text-uganda-red">Roots</span>
          </h1>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm text-gray-600">
                Hello, {user.email.split('@')[0]}
              </span>
              <Button 
                variant="outline" 
                onClick={onLogout}
                className="btn-outline"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={onLogin}
                className="btn-outline"
              >
                Login
              </Button>
              <Button 
                onClick={onSignup}
                className="btn-primary"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-uganda-black"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-lg z-10 py-4 px-6 animate-fade-in">
          <nav className="flex flex-col space-y-3">
            {user ? (
              <>
                <span className="text-sm text-gray-600">
                  Hello, {user.email.split('@')[0]}
                </span>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onLogout();
                    setIsMenuOpen(false);
                  }}
                  className="btn-outline w-full"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    onLogin();
                    setIsMenuOpen(false);
                  }}
                  className="btn-outline w-full"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => {
                    onSignup();
                    setIsMenuOpen(false);
                  }}
                  className="btn-primary w-full"
                >
                  Sign Up
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
