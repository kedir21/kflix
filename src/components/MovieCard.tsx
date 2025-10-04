import { Movie, tmdb } from "@/lib/tmdb";
import { Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  movie: Movie;
  genres: Array<{ id: number; name: string }>;
}

const MovieCard = ({ movie, genres }: MovieCardProps) => {
  const navigate = useNavigate();
  const title = movie.title || movie.name || "";
  const rating = movie.vote_average.toFixed(1);
  const date = movie.release_date || movie.first_air_date || "";
  const year = date ? new Date(date).getFullYear() : "";
  
  // Keep up to two matching genres and keep id+name so we can key by id
  const movieGenres = genres
    .filter((g) => movie.genre_ids.slice(0, 2).includes(g.id))
    .slice(0, 2)
    .map((g) => ({ id: g.id, name: g.name }));

  const handleClick = () => {
    const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
    navigate(`/details/${mediaType}/${movie.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="group relative cursor-pointer card-hover rounded-xl overflow-hidden bg-card"
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={tmdb.getImageUrl(movie.poster_path)}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'var(--gradient-card)' }}
        />
        
        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
          <Star className="w-4 h-4 fill-secondary text-secondary" />
          <span className="text-sm font-semibold">{rating}</span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex flex-wrap gap-2 mb-2">
            {movieGenres.map((genre) => (
              <Badge key={genre.id} variant="secondary" className="text-xs">
                {genre.name}
              </Badge>
            ))}
          </div>
          <h3 className="font-semibold text-base mb-1 line-clamp-1">{title}</h3>
          <p className="text-sm text-muted-foreground">{year}</p>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
