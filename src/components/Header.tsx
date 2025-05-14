// src/components/Header.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Navigation } from "@/components/Navigation"; // For Desktop
import { Menu, Home, Users, Book, User as UserIcon, Briefcase } from "lucide-react"; // Changed User to UserIcon to avoid conflict if needed, added Briefcase as an example
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

interface HeaderProps {
  onLogin: () => void;
  onSignup: () => void;
}

const Header = ({ onLogin, onSignup }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const commonLinkClass = "flex items-center px-4 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200";
  const iconClass = "mr-3 h-5 w-5 text-uganda-yellow"; // Unified icon class

  // Close sheet after navigation
  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  return (
    <header className="w-full bg-white bg-opacity-90 backdrop-blur-sm shadow-md py-4 px-6 md:px-10 sticky top-0 z-50 dark:bg-gray-800 dark:bg-opacity-90 dark:shadow-gray-700">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex space-x-0.5">
              <div className="w-4 h-8 bg-uganda-black"></div>
              <div className="w-4 h-8 bg-uganda-yellow"></div>
              <div className="w-4 h-8 bg-uganda-red"></div>
            </div>
            <h1 className="text-2xl font-bold text-uganda-black dark:text-white">
              Fami<span className="text-uganda-red">Roots</span>
            </h1>
          </Link>
        </div>
        
        {/* Navigation Menu (Desktop) */}
        {/* TODO: You will need to update your separate src/components/Navigation.tsx 
            component to include "Tribes & Clans" and "My Profile" links for the desktop view. */}
        <div className="hidden md:block">
          <Navigation />
        </div>

        {/* Desktop Auth Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Hello, {user.email?.split('@')[0]}
              </span>
              <Button 
                variant="outline" 
                onClick={() => signOut()}
                className="bg-uganda-red text-white hover:bg-uganda-red/80 border-uganda-red dark:bg-uganda-red dark:hover:bg-uganda-red/90"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={onLogin}
                className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
              >
                Login
              </Button>
              <Button 
                onClick={onSignup}
                className="bg-uganda-red text-white hover:bg-uganda-red/90"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-uganda-black dark:text-white">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[320px] bg-white dark:bg-gray-800 p-0">
            <SheetHeader className="p-6 border-b dark:border-gray-700">
              <SheetTitle className="text-xl font-bold text-uganda-black dark:text-white">FamiRoots Menu</SheetTitle>
            </SheetHeader>
            <div className="py-6 flex flex-col space-y-1 px-2">
              <Link to="/" className={commonLinkClass} onClick={handleLinkClick}>
                <Home className={iconClass} />
                Home
              </Link>

              {user && (
                <>
                  <Link to="/family-trees" className={commonLinkClass} onClick={handleLinkClick}>
                    <Users className={iconClass} />
                    Family Trees
                  </Link>
                  <Link to="/tribes" className={commonLinkClass} onClick={handleLinkClick}>
                    <Briefcase className={iconClass} /> {/* Changed icon for variety */}
                    Tribes & Clans
                  </Link>
                  <Link to="/elders" className={commonLinkClass} onClick={handleLinkClick}>
                    <Book className={iconClass} /> {/* Changed icon */}
                    Elder Database
                  </Link>
                  <Link to="/relationship-analyzer" className={commonLinkClass} onClick={handleLinkClick}>
                    <Users className={iconClass} /> {/* Consider GitFork or Network icon */}
                    Relationship Analyzer
                  </Link>
                  <Link to="/profile" className={commonLinkClass} onClick={handleLinkClick}>
                    <UserIcon className={iconClass} /> {/* Added My Profile Link */}
                    My Profile
                  </Link>
                </>
              )}

              <div className={`mt-4 pt-4 border-t px-4 space-y-3 ${user ? 'dark:border-gray-700' : 'dark:border-transparent'}`}>
                {user ? (
                  <div className="flex flex-col gap-3">
                    <span className="px-0 text-sm text-gray-600 dark:text-gray-300">
                      Hello, {user.email?.split('@')[0]}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => { signOut(); handleLinkClick(); }}
                      className="w-full bg-uganda-red text-white hover:bg-uganda-red/80 border-uganda-red dark:bg-uganda-red dark:hover:bg-uganda-red/90"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => { onLogin(); handleLinkClick(); }}
                      className="w-full bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                    >
                      Login
                    </Button>
                    <Button 
                      onClick={() => { onSignup(); handleLinkClick(); }}
                      className="w-full bg-uganda-red text-white hover:bg-uganda-red/90"
                    >
                      Sign Up
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
