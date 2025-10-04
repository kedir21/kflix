import { Home, Film, Tv, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onSearchClick: () => void;
}

const BottomNav = ({ onSearchClick }: BottomNavProps) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const currentType = searchParams.get("type");

  const tabs = [
    { name: "Home", icon: Home, path: "/", active: currentPath === "/" && !currentType },
    { name: "Movies", icon: Film, path: "/?type=movie", active: currentType === "movie" },
    { name: "TV Shows", icon: Tv, path: "/?type=tv", active: currentType === "tv" },
    { name: "Search", icon: Search, onClick: onSearchClick, active: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.active;

          if (tab.onClick) {
            return (
              <button
                key={tab.name}
                onClick={tab.onClick}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 transition-colors",
                  "hover:bg-muted/50 active:bg-muted"
                )}
              >
                <Icon className={cn("w-6 h-6", isActive && "text-primary")} />
                <span className={cn("text-xs", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>
                  {tab.name}
                </span>
              </button>
            );
          }

          return (
            <Link
              key={tab.name}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                "hover:bg-muted/50 active:bg-muted"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "text-primary")} />
              <span className={cn("text-xs", isActive ? "text-primary font-semibold" : "text-muted-foreground")}>
                {tab.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
