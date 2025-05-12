
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";

interface NavigationProps {
  onClose?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({ onClose = () => {} }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/relationship-analyzer', label: 'Relationship Analyzer' },
    { path: '/cultural-resources', label: 'Cultural Resources' },
    { path: '/traditions', label: 'Traditions' },
    { path: '/elders', label: 'Clan Elders' },
    { path: '/dna-test', label: 'DNA Test' },
  ];

  return (
    <nav className="flex-1">
      <ul className="flex md:items-center flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-6 text-base">
        {navItems.map((item) => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              onClick={onClose}
              className={cn(
                "font-medium transition-colors hover:text-uganda-red",
                location.pathname === item.path ? "text-uganda-red" : "text-ugana-black"
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
