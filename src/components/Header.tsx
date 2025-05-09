import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Navigation } from "@/components/Navigation"; 
import { Menu, Home, Users, Book, User } from "lucide-react";
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

const TreeLogo = () => {
  return (
    <svg width="48" height="40" viewBox="0 0 48 40" className="mr-1">
      {/* Tree Trunk (Black) */}
      <rect x="19" y="16" width="10" height="18" fill="#000000" />
      
      {/* Tree Branches */}
      <polygon 
        points="24,6 10,20 38,20" 
        fill="#FFD700" /* Yellow */
      />
      
      {/* Tree Top */}
      <polygon 
        points="24,2 14,13 34,13" 
        fill="#DC143C" /* Red */
      />
    </svg>
  );
};

const Header = ({ onLogin, onSignup }: HeaderProps) => {
  const { user, signOut } = useAuth();

  return (
    <header className="w-full bg-white bg-opacity-90 backdrop-blur-sm shadow-md py-4 px-6 md:px-10 sticky top-0 z-50">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <TreeLogo />
            <h1 className="text-2xl font-bold text-uganda-black">
              Fami<span className="text-uganda-red">Roots</span>
            </h1>
          </Link>
        </div>
        
        {/* Navigation Menu (Desktop) */}
        <div className="hidden md:block">
          <Navigation />
        </div>

        {/* Desktop Auth Menu */}
        <div className="hidden md:flex items-center space-x-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Hello, {user.email?.split('@')[0]}
              </span>
              <Button 
                variant="outline" 
                onClick={() => signOut()}
                className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
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
                className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle>
                <div className="flex items-center">
                  <TreeLogo />
                  <span>FamiRoots</span>
                </div>
              </SheetTitle>
            </SheetHeader>
            <div className="py-6 flex flex-col space-y-4">
              <Link to="/" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>

              {user && (
                <>
                  <Link to="/family-trees" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100">
                    <Users className="mr-2 h-4 w-4" />
                    Family Trees
                  </Link>
                  <Link to="/tribes" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100">
                    <Book className="mr-2 h-4 w-4" />
                    Tribes & Clans
                  </Link>
                  <Link to="/elders" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100">
                    <User className="mr-2 h-4 w-4" />
                    Elder Database
                  </Link>
                  <Link to="/relationship-analyzer" className="flex items-center px-4 py-2 rounded-md hover:bg-gray-100">
                    <Users className="mr-2 h-4 w-4" />
                    Relationship Analyzer
                  </Link>
                </>
              )}

              <div className="mt-4 pt-4 border-t">
                {user ? (
                  <div className="flex flex-col gap-2">
                    <span className="px-4 text-sm text-gray-600">
                      Hello, {user.email?.split('@')[0]}
                    </span>
                    <Button 
                      variant="outline" 
                      onClick={() => signOut()}
                      className="w-full bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                    >
                      Logout
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      onClick={onLogin}
                      className="w-full bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
                    >
                      Login
                    </Button>
                    <Button 
                      onClick={onSignup}
                      className="w-full bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
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