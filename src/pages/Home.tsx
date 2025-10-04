import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Movie, tmdb } from "@/lib/tmdb";
import MobileHeader from "@/components/MobileHeader";
import BottomNav from "@/components/BottomNav";
import Hero from "@/components/Hero";
import MovieCard from "@/components/MovieCard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import InfiniteScroll from "react-infinite-scroll-component";

const Home = () => {
  const [searchParams] = useSearchParams();
  const [timeWindow, setTimeWindow] = useState<'day' | 'week'>('day');
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const mediaType = (searchParams.get("type") as 'movie' | 'tv') || 'all';

  const { data: trendingData, fetchNextPage, hasNextPage, isLoading: trendingLoading } = useInfiniteQuery({
    queryKey: ['trending', mediaType, timeWindow],
    queryFn: ({ pageParam = 1 }) => 
      fetch(`https://api.themoviedb.org/3/trending/${mediaType === 'all' ? 'all' : mediaType}/${timeWindow}?api_key=4f10ec4dbb0a90737737dc9ffd5506c3&page=${pageParam}`)
        .then(res => res.json()),
    getNextPageParam: (lastPage) => lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  const { data: searchData, fetchNextPage: fetchNextSearchPage, hasNextPage: hasNextSearchPage, isLoading: searchLoading } = useInfiniteQuery({
    queryKey: ['search', searchQuery],
    queryFn: ({ pageParam = 1 }) => 
      fetch(`https://api.themoviedb.org/3/search/multi?api_key=4f10ec4dbb0a90737737dc9ffd5506c3&query=${encodeURIComponent(searchQuery)}&page=${pageParam}`)
        .then(res => res.json()),
    getNextPageParam: (lastPage) => lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    enabled: searchQuery.length > 0,
    initialPageParam: 1,
  });

  const { data: movieGenres } = useQuery({
    queryKey: ['genres', 'movie'],
    queryFn: tmdb.getMovieGenres,
  });

  const { data: tvGenres } = useQuery({
    queryKey: ['genres', 'tv'],
    queryFn: tmdb.getTVGenres,
  });

  const genres = [...(movieGenres || []), ...(tvGenres || [])];
  
  const trending = trendingData?.pages.flatMap(page => page.results) || [];
  const searchResults = searchData?.pages.flatMap(page => page.results) || [];
  const displayMovies: Movie[] = searchQuery ? searchResults : trending;
  const heroMovie = trending[0];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearchClick = () => {
    setShowSearch(true);
  };

  const handleSearchClose = () => {
    setShowSearch(false);
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <MobileHeader 
        showSearch={showSearch} 
        onSearchClose={handleSearchClose}
        onSearch={handleSearch}
      />
      <BottomNav onSearchClick={handleSearchClick} />
      
      <div className="pt-14">
        {!searchQuery && heroMovie && <Hero movie={heroMovie} />}

        <div className="container mx-auto px-4 py-6 pb-20">
          {!searchQuery && (
            <div className="flex flex-col gap-3 mb-6">
              <h2 className="text-xl md:text-2xl font-bold">
                {mediaType === 'movie' ? 'Trending Movies' : mediaType === 'tv' ? 'Trending TV Shows' : 'Trending Now'}
              </h2>
              <Tabs value={timeWindow} onValueChange={(v) => setTimeWindow(v as 'day' | 'week')} className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="day">Today</TabsTrigger>
                  <TabsTrigger value="week">This Week</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {searchQuery && (
            <h2 className="text-xl md:text-2xl font-bold mb-6">
              Results for "{searchQuery}"
            </h2>
          )}

          {(trendingLoading || searchLoading) ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
              ))}
            </div>
          ) : (
            <InfiniteScroll
              dataLength={displayMovies.length}
              next={searchQuery ? fetchNextSearchPage : fetchNextPage}
              hasMore={searchQuery ? (hasNextSearchPage || false) : (hasNextPage || false)}
              loader={
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mt-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-[2/3] rounded-xl" />
                  ))}
                </div>
              }
              endMessage={<div className="text-center text-muted-foreground py-8">No more content</div>}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {displayMovies?.map((movie: Movie, index: number) => (
                  <MovieCard key={`${movie.id}-${index}`} movie={movie} genres={genres} />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
