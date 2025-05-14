// src/components/Header.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth, AuthUser } from "@/context/AuthContext"; // Assuming AuthUser type
import { Navigation } from "@/components/Navigation";
import { 
  Menu, Home, Users, Book, User as UserIcon, Briefcase, Settings, 
  GitFork, ShieldQuestion, ListTree, ChevronDown, ChevronRight 
} from "lucide-react"; // Added icons
import { Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils"; // Assuming you have this utility

// Re-using NavMenuItem/NavLink structure for consistency
export interface NavLink {
  path: string;
  label: string;
  icon?: React.ElementType;
  requiresAuth?: boolean;
}

export interface NavMenuItem {
  label: string;
  icon?: React.ElementType;
  path?: string;
  requiresAuth?: boolean;
  children?: NavLink[];
}

// Mobile Nav Config (can be same as desktop or adapted)
const mobileNavMenuConfig: NavMenuItem[] = [
  { path: '/', label: 'Home', icon: Home, requiresAuth: false },
  {
    label: 'Discover',
    icon: Book,
    requiresAuth: false,
    children: [
      { path: '/tribes', label: 'Tribes & Clans', icon: Briefcase },
      { path: '/cultural-resources', label: 'Cultural Hub', icon: Users },
      { path: '/traditions', label: 'Traditions', icon: ListTree },
      { path: '/elders', label: 'Clan Elders', icon: UserIcon },
    ],
  },
  {
    label: 'My FamiRoots',
    icon: Users,
    requiresAuth: true,
    children: [
      { path: '/family-trees', label: 'My Family Trees', icon: ListTree },
      { path: '/profile', label: 'My Profile', icon: UserIcon },
    ],
  },
  {
    label: 'Tools',
    icon: Settings,
    requiresAuth: true,
    children: [
      { path: '/relationship-analyzer', label: 'Relationship Analyzer', icon: GitFork },
      { path: '/dna-test', label: 'DNA Test', icon: ShieldQuestion },
    ],
  },
];

interface HeaderProps {
  onLogin: () => void;
  onSignup: () => void;
}

const Header = ({ onLogin, onSignup }: HeaderProps) => {
  const { user, signOut } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const commonLinkClass = "flex items-center w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm";
  const parentMenuClass = "flex items-center justify-between w-full text-left px-4 py-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium";
  const subMenuLinkClass = "flex items-center w-full text-left pl-10 pr-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-sm";
  const iconClass = "mr-3 h-5 w-5 text-uganda-yellow";

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };

  const renderNavItems = (items: NavMenuItem[], isUserLoggedIn: boolean) => {
    return items.filter(item => !item.requiresAuth || (item.requiresAuth && isUserLoggedIn))
      .map((item, index) => {
        const visibleChildren = item.children?.filter(child => !child.requiresAuth || (child.requiresAuth && isUserLoggedIn));

        if (visibleChildren && visibleChildren.length > 0) {
          return (
            <details key={item.label + index} className="group">
              <summary className={cn(parentMenuClass, "list-none cursor-pointer")}>
                <span className="flex items-center">
                  {item.icon && <item.icon className={iconClass} />}
                  {item.label}
                </span>
                <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
              </summary>
              <div className="pl-4 mt-1 space-y-1">
                {visibleChildren.map(child => (
                  <Link key={child.path} to={child.path} className={subMenuLinkClass} onClick={handleLinkClick}>
                    {child.icon && <child.icon className="mr-2 h-4 w-4 opacity-80" />}
                    {child.label}
                  </Link>
                ))}
              </div>
            </details>
          );
        } else if (item.path) {
          // Top-level item that is a direct link
          return (
            <Link key={item.path} to={item.path} className={commonLinkClass} onClick={handleLinkClick}>
              {item.icon && <item.icon className={iconClass} />}
              {item.label}
            </Link>
          );
        }
        return null;
      });
  };


  return (
    <header className="w-full bg-white bg-opacity-90 backdrop-blur-sm shadow-md py-3 px-4 md:px-8 sticky top-0 z-50 dark:bg-gray-800 dark:bg-opacity-90 dark:shadow-gray-700">
      <div className="flex items-center justify-between max-w-screen-xl mx-auto"> {/* max-w-screen-xl for wider content */}
        <div className="flex items-center space-x-2">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex space-x-0.5">
              <div className="w-3 h-7 md:w-4 md:h-8 bg-uganda-black"></div>
              <div className="w-3 h-7 md:w-4 md:h-8 bg-uganda-yellow"></div>
              <div className="w-3 h-7 md:w-4 md:h-8 bg-uganda-red"></div>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-uganda-black dark:text-white">
              Fami<span className="text-uganda-red">Roots</span>
            </h1>
          </Link>
        </div>
        
        <div className="hidden md:block">
          <Navigation user={user} /> 
        </div>

        <div className="hidden md:flex items-center space-x-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Hello, {user.email?.split('@')[0]}
              </span>
              <Button 
                variant="outline" 
                size="sm"
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
                size="sm"
                onClick={onLogin}
                className="bg-uganda-yellow text-uganda-black hover:bg-uganda-yellow/90"
              >
                Login
              </Button>
              <Button 
                size="sm"
                onClick={onSignup}
                className="bg-uganda-red text-white hover:bg-uganda-red/90"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" className="text-uganda-black dark:text-white">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[320px] bg-white dark:bg-gray-800 p-0 flex flex-col">
            <SheetHeader className="p-4 border-b dark:border-gray-700">
              <SheetTitle className="text-lg font-semibold text-uganda-black dark:text-white text-center">FamiRoots Menu</SheetTitle>
            </SheetHeader>
            <nav className="flex-grow py-4 px-2 space-y-1 overflow-y-auto">
              {renderNavItems(mobileNavMenuConfig, !!user)}
            </nav>
            <div className={`mt-auto p-4 border-t space-y-3 ${user ? 'dark:border-gray-700' : 'dark:border-transparent'}`}>
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
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Header;
