// src/components/Navigation.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { AuthUser } from "@/context/AuthContext"; // Assuming AuthUser type is exported from your AuthContext

interface NavigationProps {
  onClose?: () => void;
  user?: AuthUser | null; // Accept user prop to show/hide links
}

export const Navigation: React.FC<NavigationProps> = ({ onClose = () => {}, user }) => {
  const location = useLocation();
  
  const baseNavItems = [
    { path: '/', label: 'Home' },
    { path: '/tribes', label: 'Tribes & Clans' }, // Added
    { path: '/cultural-resources', label: 'Cultural Resources' },
    { path: '/traditions', label: 'Traditions' },
    { path: '/elders', label: 'Clan Elders' },
  ];

  const authenticatedNavItems = [
    { path: '/family-trees', label: 'Family Trees' },
    { path: '/relationship-analyzer', label: 'Relationship Analyzer' },
    { path: '/dna-test', label: 'DNA Test' },
    { path: '/profile', label: 'My Profile' }, // Added
  ];

  const navItems = user ? [...baseNavItems, ...authenticatedNavItems] : baseNavItems;

  // You might want a specific order for all items if user is logged in:
  const orderedNavItems = [
    { path: '/', label: 'Home', requiresAuth: false },
    { path: '/tribes', label: 'Tribes & Clans', requiresAuth: false },
    { path: '/cultural-resources', label: 'Cultural Resources', requiresAuth: false },
    { path: '/traditions', label: 'Traditions', requiresAuth: false },
    { path: '/elders', label: 'Clan Elders', requiresAuth: false },
    { path: '/family-trees', label: 'Family Trees', requiresAuth: true },
    { path: '/relationship-analyzer', label: 'Relationship Analyzer', requiresAuth: true },
    { path: '/dna-test', label: 'DNA Test', requiresAuth: true },
    { path: '/profile', label: 'My Profile', requiresAuth: true },
  ];

  const itemsToDisplay = orderedNavItems.filter(item => !item.requiresAuth || (item.requiresAuth && user));


  return (
    <nav className="flex-1">
      <ul className="flex md:items-center flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-4 lg:space-x-6 text-base"> {/* Adjusted spacing slightly */}
        {itemsToDisplay.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              onClick={onClose}
              className={cn(
                "font-medium transition-colors hover:text-uganda-red dark:hover:text-uganda-yellow",
                location.pathname === item.path 
                  ? "text-uganda-red dark:text-uganda-yellow" 
                  : "text-uganda-black dark:text-gray-300" // Corrected typo and added dark mode text
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
};

// Also export as default for compatibility
export default Navigation;
