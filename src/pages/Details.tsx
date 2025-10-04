import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tmdb } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Star, X, Monitor, RotateCcw, Settings, ExternalLink, ChevronRight, Film, Calendar, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Video providers configuration
const VIDEO_PROVIDERS = {
  cinemaos: {
    name: "CinemaOS",
    movie: (id: string) => `https://cinemaos.tech/player/${id}`,
    tv: (id: string, season: string, episode: string) => 
      `https://cinemaos.tech/player/${id}/${season}/${episode}`,
  },
  vidsrccc: {
    name: "VidSrc.CC",
    movie: (id: string) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id: string, season: string, episode: string) => 
      `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
  },
  vidsrcxyz: {
    name: "VidSrc.XYZ",
    movie: (id: string) => `https://vidsrc.xyz/embed/movie/${id}`,
    tv: (id: string, season: string, episode: string) => 
      `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
  },
};

const Details = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<keyof typeof VIDEO_PROVIDERS>("cinemaos");
  const [currentSeason, setCurrentSeason] = useState("1");
  const [currentEpisode, setCurrentEpisode] = useState("1");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const { data: details, isLoading } = useQuery({
    queryKey: ['details', type, id],
    queryFn: () => tmdb.getDetails(type!, parseInt(id!)),
    enabled: !!type && !!id,
  });

  // Use details.seasons directly (already fetched in getDetails)
  const seasons = details?.seasons || [];

  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ['episodes', id, currentSeason],
    queryFn: () => tmdb.getTVEpisodes(parseInt(id!), parseInt(currentSeason)),
    enabled: !!type && type === 'tv' && !!id && !!currentSeason && seasons.length > 0,
  });

  const getVideoUrl = () => {
    if (type === 'movie') {
      return VIDEO_PROVIDERS[selectedProvider].movie(id!);
    } else {
      return VIDEO_PROVIDERS[selectedProvider].tv(id!, currentSeason, currentEpisode);
    }
  };

  const handleFullscreen = () => {
    if (iframeRef.current?.requestFullscreen) {
      iframeRef.current.requestFullscreen();
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  // Reset episode to 1 when season changes
  useEffect(() => {
    setCurrentEpisode("1");
  }, [currentSeason]);

  const VideoPlayerModal = () => (
    <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
      <DialogContent className="w-full h-screen sm:h-[80vh] p-0 bg-gradient-to-b from-black via-gray-900 to-black border-0 max-w-none">
        <DialogHeader className="p-4 border-b border-gray-800/50 backdrop-blur-sm bg-black/20">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2 text-xl sm:text-2xl font-cinematic">
              <Play className="w-5 h-5" />
              {type === 'movie' ? details?.title : `${details?.name} - S${currentSeason}E${currentEpisode}`}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <motion.Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReload} 
                className="text-white hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RotateCcw className="w-4 h-4" />
              </motion.Button>
              <motion.Button 
                variant="ghost" 
                size="sm" 
                onClick={handleFullscreen} 
                className="text-white hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Monitor className="w-4 h-4" />
              </motion.Button>
              <motion.Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPlayer(false)} 
                className="text-white hover:bg-white/10 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
              </motion.Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col">
          <Tabs defaultValue="player" className="flex-1 flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-2 bg-black/20 backdrop-blur-sm border-b border-gray-800/50">
              <TabsTrigger value="player" className="data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Player</TabsTrigger>
              <TabsTrigger value="sources" className="data-[state=active]:bg-white/10 data-[state=active]:text-white transition-all">Sources</TabsTrigger>
            </TabsList>
            
            <TabsContent value="player" className="flex-1 p-0 m-0 relative overflow-hidden">
              <div className="relative w-full h-full bg-black">
                <iframe
                  ref={iframeRef}
                  src={getVideoUrl()}
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="autoplay; encrypted-media; fullscreen"
                  title="Video Player"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              </div>
            </TabsContent>

            <TabsContent value="sources" className="p-4 sm:p-6 bg-black/10 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card className="bg-card/80 backdrop-blur-sm border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Film className="w-5 h-5" />
                      Select Provider
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedProvider} onValueChange={(value: keyof typeof VIDEO_PROVIDERS) => setSelectedProvider(value)}>
                      <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-gray-700">
                        {Object.entries(VIDEO_PROVIDERS).map(([key, provider]) => (
                          <SelectItem key={key} value={key} className="text-white">
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {type === 'tv' && seasons.length > 0 && (
                  <>
                    <Card className="bg-card/80 backdrop-blur-sm border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Calendar className="w-5 h-5" />
                          Season
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Select value={currentSeason} onValueChange={setCurrentSeason}>
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                            {seasons.map((season: any) => (
                              <SelectItem key={season.id} value={season.season_number.toString()} className="text-white">
                                Season {season.season_number} - {season.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>

                    <Card className="bg-card/80 backdrop-blur-sm border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Play className="w-5 h-5" />
                          Episode
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Select value={currentEpisode} onValueChange={setCurrentEpisode} disabled={episodesLoading}>
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-gray-700">
                              {episodesLoading ? (
                                <SelectItem value="" disabled className="text-gray-500">Loading episodes...</SelectItem>
                              ) : (
                                (episodes?.episodes?.map((episode: any) => (
                                  <SelectItem key={episode.id} value={episode.episode_number.toString()} className="text-white">
                                    E{episode.episode_number}: {episode.name}
                                  </SelectItem>
                                )) ?? <SelectItem value="" disabled>No episodes available</SelectItem>)
                              )}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  </>
                )}

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <Button 
                    onClick={() => window.open(getVideoUrl(), '_blank')}
                    className="w-full gap-2 bg-transparent hover:bg-white/10 border-white/20 text-white"
                    variant="outline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in External Player
                  </Button>
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[60vh] relative">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!details) return null;

  const title = details.title || details.name;
  const rating = details.vote_average.toFixed(1);
  const releaseDate = details.release_date || details.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : "";
  const runtime = details.runtime || details.episode_run_time?.[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 font-inter pb-16 overflow-x-hidden">
      <BottomNav onSearchClick={() => setShowSearch(true)} />
      <VideoPlayerModal />
      
      <div className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${tmdb.getImageUrl(details.backdrop_path, 'original')})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
        </motion.div>

        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-4 left-4 z-10"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="bg-black/50 backdrop-blur-sm text-white hover:bg-white/10 transition-all border-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </Button>
        </motion.div>

        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative container mx-auto px-4 h-full flex items-end pb-8 z-10"
        >
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end w-full">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <img
                src={tmdb.getImageUrl(details.poster_path)}
                alt={title}
                className="w-48 md:w-56 rounded-xl shadow-2xl border-4 border-white/10 hover:shadow-3xl transition-all duration-300"
              />
            </motion.div>
            
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex-1"
            >
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-cinematic font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm md:text-base">
                <motion.div 
                  className="flex items-center gap-2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{rating}</span>
                </motion.div>
                {year && <span className="text-white/80">{year}</span>}
                {runtime && <span className="text-white/80">{runtime} min</span>}
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {details.genres?.map((genre: any, index: number) => (
                  <motion.div
                    key={genre.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Badge variant="secondary" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
                      {genre.name}
                    </Badge>
                  </motion.div>
                ))}
              </div>

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white gap-2 shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-8 py-3"
                  onClick={() => setShowPlayer(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                  Watch Now
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <div className="container mx-auto px-4 py-6 pb-20 -mt-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-black/20 backdrop-blur-sm border border-gray-700 rounded-xl p-1 mb-6">
              <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">Overview</TabsTrigger>
              {type === 'tv' && seasons.length > 0 && <TabsTrigger value="episodes" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">Episodes</TabsTrigger>}
              {(details.credits?.cast?.length ?? 0) > 0 && <TabsTrigger value="cast" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg transition-all">Cast</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2 text-white">
                  <Film className="w-6 h-6" />
                  Overview
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed text-balance">
                  {details.overview}
                </p>
              </motion.div>
            </TabsContent>

            {type === 'tv' && seasons.length > 0 && (
              <TabsContent value="episodes" className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2 text-white">
                    <Calendar className="w-6 h-6" />
                    Seasons
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
                    <AnimatePresence>
                      {seasons.map((season: any, index: number) => (
                        <motion.div
                          key={season.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`group cursor-pointer rounded-xl overflow-hidden shadow-lg border-2 transition-all duration-300 ${
                            season.season_number.toString() === currentSeason 
                              ? 'border-primary scale-105 shadow-2xl' 
                              : 'border-transparent hover:border-gray-600 hover:scale-105'
                          }`}
                          onClick={() => setCurrentSeason(season.season_number.toString())}
                        >
                          <img
                            src={tmdb.getImageUrl(season.poster_path) || '/placeholder.svg'}
                            alt={season.name}
                            className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="p-3 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 w-full">
                            <p className="font-semibold text-white text-sm">{season.name}</p>
                            <p className="text-xs text-gray-300">{season.episode_count} Episodes</p>
                          </div>
                          {season.season_number.toString() === currentSeason && (
                            <motion.div
                              className="absolute top-2 right-2"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            >
                              <ChevronRight className="w-5 h-5 text-primary" />
                            </motion.div>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2 text-white">
                    <Play className="w-6 h-6" />
                    Episodes - Season {currentSeason}
                  </h2>
                  {episodesLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : episodes && episodes.episodes && episodes.episodes.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AnimatePresence>
                        {episodes.episodes.map((episode: any, index: number) => (
                          <motion.div
                            key={episode.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className={`group cursor-pointer rounded-xl overflow-hidden shadow-lg border-2 transition-all duration-300 bg-card/80 backdrop-blur-sm ${
                              episode.episode_number.toString() === currentEpisode 
                                ? 'border-primary scale-105 shadow-2xl' 
                                : 'border-transparent hover:border-gray-600 hover:scale-105'
                            }`}
                            onClick={() => setCurrentEpisode(episode.episode_number.toString())}
                          >
                            {episode.still_path && (
                              <img
                                src={tmdb.getImageUrl(episode.still_path)}
                                alt={episode.name}
                                className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            )}
                            <div className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-white">{episode.name}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  episode.episode_number.toString() === currentEpisode 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-gray-700 text-gray-300'
                                }`}>
                                  E{episode.episode_number}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400 leading-relaxed">
                                {episode.overview ? episode.overview.substring(0, 120) + '...' : 'No description available.'}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No episodes available for this season.</p>
                  )}
                </motion.div>
              </TabsContent>
            )}

            {(details.credits?.cast?.length ?? 0) > 0 && (
              <TabsContent value="cast" className="space-y-6">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center gap-2 text-white">
                    <User className="w-6 h-6" />
                    Top Cast
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <AnimatePresence>
                      {details.credits.cast.slice(0, 10).map((actor: any, index: number) => (
                        <motion.div
                          key={actor.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="text-center group cursor-pointer rounded-xl overflow-hidden shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
                          whileHover={{ scale: 1.05 }}
                        >
                          <img
                            src={tmdb.getImageUrl(actor.profile_path) || '/placeholder.svg'}
                            alt={actor.name}
                            className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="p-3">
                            <p className="font-semibold text-white text-sm truncate">{actor.name}</p>
                            <p className="text-xs text-gray-400 truncate">{actor.character}</p>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;700;900&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-cinematic { font-family: 'Playfair Display', serif; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeInUp { animation: fadeInUp 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Details;