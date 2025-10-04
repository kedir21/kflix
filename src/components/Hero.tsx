import { Movie, tmdb } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { Play, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeroProps {
  movie: Movie;
}

const Hero = ({ movie }: HeroProps) => {
  const navigate = useNavigate();
  const title = movie.title || movie.name || "";
  const rating = Math.round(movie.vote_average * 10);

  return (
    <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${tmdb.getImageUrl(movie.backdrop_path, 'original')})`,
        }}
      >
        <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
        <div className="absolute inset-0" style={{ background: 'var(--gradient-overlay)' }} />
      </div>

      <div className="relative container mx-auto px-4 h-full flex flex-col justify-center max-w-2xl">
        <div className="mb-4 flex items-center gap-4">
          <span className="text-xs md:text-sm tracking-wider text-muted-foreground">PREMIERE SELECTION</span>
          <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-bold rounded">
            {rating}%
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-3 leading-tight">
          {title}
        </h1>

        <p className="text-sm md:text-base text-muted-foreground mb-6 line-clamp-2 max-w-xl">
          {movie.overview}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={() => navigate(`/details/${movie.media_type || 'movie'}/${movie.id}`)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Play className="w-4 h-4" fill="currentColor" />
            Watch Now
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/details/${movie.media_type || 'movie'}/${movie.id}`)}
            className="gap-2 border-2"
          >
            <Info className="w-4 h-4" />
            More Info
          </Button>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-foreground/50 rounded-full" />
        </div>
      </div>
    </div>
  );
};

export default Hero;
