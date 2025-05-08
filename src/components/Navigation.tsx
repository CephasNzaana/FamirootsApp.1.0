
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
import { User, Home, Book, FileText, Users, Map } from "lucide-react";

export const Navigation = () => {
  const { user } = useAuth();
  
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link to="/">
            <NavigationMenuLink className={navigationMenuTriggerStyle()}>
              <Home className="mr-2 h-4 w-4" />
              Home
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
        
        {user && (
          <>
            <NavigationMenuItem>
              <Link to="/family-trees">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  <Users className="mr-2 h-4 w-4" />
                  Family Trees
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuTrigger>
                <Book className="mr-2 h-4 w-4" />
                Cultural Resources
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <Link
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-uganda-yellow/50 to-uganda-red/30 p-6 no-underline outline-none focus:shadow-md"
                        to="/tribes"
                      >
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Ugandan Tribes & Clans
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
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
                  <ListItem href="/relationship-analyzer" title="Relationship Analyzer" icon={<Map className="h-4 w-4" />}>
                    Discover how family members are related
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </>
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
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="flex items-center gap-2 text-sm font-medium leading-none">
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
