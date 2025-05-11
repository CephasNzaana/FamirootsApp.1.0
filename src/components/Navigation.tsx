
import React from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle
} from "@/components/ui/navigation-menu";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { User, Home, Book, FileText, Users } from "lucide-react";

export const Navigation = () => {
  const { user } = useAuth();
  
  return (
    <NavigationMenu className="flex">
      <NavigationMenuList className="bg-white rounded-md shadow-sm">
        <NavigationMenuItem>
          <Link to="/">
            <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "bg-white text-uganda-black hover:bg-white/90 hover:text-uganda-black")}>
              <Home className="mr-2 h-4 w-4" />
              Home
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <Link to="/family-trees">
            <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "bg-white text-uganda-black hover:bg-white/90 hover:text-uganda-black")}>
              <Users className="mr-2 h-4 w-4" />
              Family Trees
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-white text-uganda-black hover:bg-white/90 hover:text-uganda-black">
            <Book className="mr-2 h-4 w-4" />
            Cultural Resources
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link
                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-uganda-yellow/50 to-uganda-red/30 p-6 no-underline outline-none focus:shadow-md"
                    to="/tribes"
                  >
                    <div className="mb-2 mt-4 text-lg font-medium text-uganda-black">
                      Ugandan Tribes & Clans
                    </div>
                    <p className="text-sm leading-tight text-uganda-black">
                      Explore the rich cultural heritage of Uganda's tribal and clan systems
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <ListItem href="/traditions" title="Traditions" icon={<FileText className="h-4 w-4" />}>
                Learn about traditional practices and ceremonies
              </ListItem>
              <ListItem href="/elders" title="Elder Database" icon={<User className="h-4 w-4" />}>
                Access verified clan elders information
              </ListItem>
              <ListItem href="/relationship-analyzer" title="Relationship Analyzer" icon={<Users className="h-4 w-4" />}>
                Discover how family members are related
              </ListItem>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
        
        {user && (
          <NavigationMenuItem>
            <Link to="/user-profile">
              <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), "bg-white text-uganda-black hover:bg-white/90 hover:text-uganda-black")}>
                <User className="mr-2 h-4 w-4" />
                My Profile
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
};

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { icon?: React.ReactNode }
>(({ className, title, children, icon, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-uganda-yellow/30 hover:text-uganda-black focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2 text-sm font-medium leading-none text-uganda-black">
            {icon}
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
