// src/components/Navigation.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { AuthUser } from "@/context/AuthContext"; // Assuming AuthUser type is exported
import { ChevronDown } from 'lucide-react'; // For dropdown indicator

// Re-using the NavMenuItem/NavLink structure (or define it here if not shared)
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

// Example configuration (can be imported or defined here)
// For desktop, icons are typically not used in the main bar links themselves
const desktopNavMenuConfig: NavMenuItem[] = [
  { path: '/', label: 'Home', requiresAuth: false },
  {
    label: 'Discover',
    requiresAuth: false,
    children: [
      { path: '/tribes', label: 'Tribes & Clans' },
      { path: '/cultural-resources', label: 'Cultural Hub' },
      { path: '/traditions', label: 'Traditions' },
      { path: '/elders', label: 'Clan Elders' },
    ],
  },
  {
    label: 'My FamiRoots',
    requiresAuth: true,
    children: [
      { path: '/family-trees', label: 'My Family Trees' },
      { path: '/profile', label: 'My Profile' },
    ],
  },
  {
    label: 'Tools',
    requiresAuth: true,
    children: [
      { path: '/relationship-analyzer', label: 'Relationship Analyzer' },
      { path: '/dna-test', label: 'DNA Test' },
    ],
  },
];


interface NavigationProps {
  onClose?: () => void; // For mobile sheet compatibility, not strictly needed for desktop
  user?: AuthUser | null;
}

export const Navigation: React.FC<NavigationProps> = ({ onClose = () => {}, user }) => {
  const location = useLocation();

  const getLinkClassName = (path?: string, isSubItem: boolean = false) => {
    return cn(
      "font-medium transition-colors hover:text-uganda-red dark:hover:text-uganda-yellow",
      isSubItem ? "block px-4 py-2 text-sm" : "", // Styling for dropdown items
      location.pathname === path 
        ? "text-uganda-red dark:text-uganda-yellow" 
        : isSubItem ? "text-gray-700 dark:text-gray-300" : "text-uganda-black dark:text-gray-300"
    );
  };

  return (
    <nav className="flex-1">
      <ul className="flex md:items-center flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-1 lg:space-x-2 text-base">
        {desktopNavMenuConfig.map((item, index) => {
          if (item.requiresAuth && !user) {
            return null; // Don't render auth-required items if user is not logged in
          }

          if (item.children && item.children.length > 0) {
            // Filter children based on auth status if necessary (though parent check often suffices)
            const visibleChildren = item.children.filter(child => !child.requiresAuth || (child.requiresAuth && user));
            if (item.requiresAuth && !user && visibleChildren.length === 0 && !item.path) return null; // if parent is auth and no visible children and not a link itself

            return (
              <li key={item.label + index} className="relative group"> {/* Added group for hover effect */}
                <button 
                  className={cn(
                    getLinkClassName(item.path), // Apply link styling if it's also a link
                    "flex items-center space-x-1 px-3 py-2 rounded-md" // Button-like styling
                  )}
                  // If item.path exists, this could be a Link component that also acts as a dropdown trigger
                  // For simplicity, making it a button that reveals dropdown on hover (CSS driven)
                >
                  <span>{item.label}</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:rotate-180" />
                </button>
                {visibleChildren.length > 0 && (
                  <ul className="absolute left-0 mt-1 w-56 origin-top-left bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-20 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-150 ease-in-out min-w-max">
                    {/* Sub-menu items */}
                    {visibleChildren.map((child) => (
                      <li key={child.path}>
                        <Link
                          to={child.path}
                          onClick={onClose}
                          className={cn(getLinkClassName(child.path, true), "hover:bg-gray-100 dark:hover:bg-gray-700")}
                        >
                          {child.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          }

          // Regular link item (no children)
          if (item.path) {
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={cn(getLinkClassName(item.path), "px-3 py-2 rounded-md")} // Added padding for consistency
                >
                  {item.label}
                </Link>
              </li>
            );
          }
          return null; // Should not happen if structured correctly (item with no path and no children)
        })}
      </ul>
    </nav>
  );
};

export default Navigation;
