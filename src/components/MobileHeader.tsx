import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface MobileHeaderProps {
  showSearch: boolean;
  onSearchClose: () => void;
  onSearch: (query: string) => void;
}

const MobileHeader = ({ showSearch, onSearchClose, onSearch }: MobileHeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  if (!showSearch) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-14 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gradient">K</span>
            <span className="text-xl font-bold">flix</span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b border-border">
      <div className="container mx-auto px-4 h-14 flex items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1">
          <Input
            type="text"
            placeholder="Search movies & TV shows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            autoFocus
          />
        </form>
        <button
          onClick={onSearchClose}
          className="p-2 hover:bg-muted rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default MobileHeader;
