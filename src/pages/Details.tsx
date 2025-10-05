import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { tmdb } from "@/lib/tmdb";
import { Button } from "@/components/ui/button";
// Import Download and Check icons
import { ArrowLeft, Play, Star, X, Monitor, RotateCcw, Settings, ExternalLink, ChevronRight, Film, Calendar, Clock, User, Maximize2, Minimize2, Sparkles, Check, Download, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import BottomNav from "@/components/BottomNav";
import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

// Video providers configuration - VidSrc.CC as default
const VIDEO_PROVIDERS = {
  vidsrccc: {
    name: "VidSrc.CC",
    movie: (id: string) => `https://vidsrc.cc/v2/embed/movie/${id}`,
    tv: (id: string, season: string, episode: string) => 
      `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`,
  },
  cinemaos: {
    name: "CinemaOS",
    movie: (id: string) => `https://cinemaos.tech/player/${id}`,
    tv: (id: string, season: string, episode: string) => 
      `https://cinemaos.tech/player/${id}/${season}/${episode}`,
  },
  vidsrcxyz: {
    name: "VidSrc.XYZ",
    movie: (id: string) => `https://vidsrc.xyz/embed/movie/${id}`,
    tv: (id: string, season: string, episode: string) => 
      `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${season}&episode=${episode}`,
  },
  rive: {
    name: "Rive",
    movie: (id: string) => `https://rivestream.org/embed?type=movie&id=${id}`,
    tv: (id: string, season: string, episode: string) =>
      `https://rivestream.org/embed?type=tv&id=${id}&season=${season}&episode=${episode}`,
  },
};

const Details = () => {
  const { type, id } = useParams<{ type: 'movie' | 'tv'; id: string }>();
  const navigate = useNavigate();
  const [showSearch, setShowSearch] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<keyof typeof VIDEO_PROVIDERS>("cinemaos");
  const [currentSeason, setCurrentSeason] = useState("1");
  const [currentEpisode, setCurrentEpisode] = useState("1");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoadingIframe, setIsLoadingIframe] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const { data: details, isLoading } = useQuery({
    queryKey: ['details', type, id],
    queryFn: () => tmdb.getDetails(type!, parseInt(id!)),
    enabled: !!type && !!id,
  });

  const seasons = details?.seasons || [];

  const { data: episodes, isLoading: episodesLoading } = useQuery({
    queryKey: ['episodes', id, currentSeason],
    queryFn: () => tmdb.getTVEpisodes(parseInt(id!), parseInt(currentSeason)),
    enabled: !!type && type === 'tv' && !!id && !!currentSeason && seasons.length > 0,
  });

  // Function to handle download
  const handleDownload = async () => {
    if (!id) return;

    setIsDownloading(true);
    try {
      let downloadUrl = '';

      if (type === 'movie') {
        downloadUrl = `https://watch.rivestream.app/download?type=movie&id=${id}`;
      } else if (type === 'tv') {
        downloadUrl = `https://watch.rivestream.app/download?type=tv&id=${id}&season=${currentSeason}&episode=${currentEpisode}`;
      }

      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', '');
      link.setAttribute('target', '_blank');
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Fallback: open in new tab if download doesn't trigger
      setTimeout(() => {
        window.open(downloadUrl, '_blank');
      }, 1000);

    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab
      let downloadUrl = '';
      if (type === 'movie') {
        downloadUrl = `https://watch.rivestream.app/download?type=movie&id=${id}`;
      } else if (type === 'tv') {
        downloadUrl = `https://watch.rivestream.app/download?type=tv&id=${id}&season=${currentSeason}&episode=${currentEpisode}`;
      }
      window.open(downloadUrl, '_blank');
    } finally {
      setIsDownloading(false);
    }
  };

  const getVideoUrl = () => {
    if (type === 'movie') {
      return VIDEO_PROVIDERS[selectedProvider].movie(id!);
    } else {
      return VIDEO_PROVIDERS[selectedProvider].tv(id!, currentSeason, currentEpisode);
    }
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  const handleReload = () => {
    if (iframeRef.current) {
      setIsLoadingIframe(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const handleEpisodeClick = (season: string, episode: string) => {
    setCurrentSeason(season);
    setCurrentEpisode(episode);
    setShowPlayer(true);
  };

  useEffect(() => {
    setCurrentEpisode("1");
  }, [currentSeason]);

  useEffect(() => {
    if (showPlayer) {
      resetControlsTimeout();
    }
    if (showPlayer) {
      setIsLoadingIframe(true);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showPlayer, selectedProvider, currentSeason, currentEpisode]);

  // Simplified Video Player Modal without settings
  const VideoPlayerModal = () => (
    <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
      <DialogContent className={`w-full p-0 bg-black border-0 max-w-none overflow-hidden ${
        isFullscreen ? 'h-screen fixed inset-0' : 'h-[85vh] max-h-screen rounded-2xl'
      }`}>
        {/* Header Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => setShowPlayer(false)}
                    className="p-2 bg-black/50 backdrop-blur-sm rounded-xl text-white/90 hover:text-white hover:bg-black/70 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Close video player"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                  <div className="text-white">
                    <p className="font-semibold text-sm truncate max-w-[200px]">
                      {type === 'movie' ? details?.title : `${details?.name}`}
                    </p>
                    {type === 'tv' && (
                      <p className="text-xs text-white/70">S{currentSeason}E{currentEpisode}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                    {VIDEO_PROVIDERS[selectedProvider].name}
                  </Badge>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Container */}
        <div 
          className="flex-1 w-full h-full relative bg-black"
          onClick={resetControlsTimeout}
          onTouchStart={resetControlsTimeout}
        >
          <iframe
            ref={iframeRef}
            src={getVideoUrl()}
            className="w-full h-full border-0"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen"
            title="Video Player"
            onLoad={() => setIsLoadingIframe(false)}
          />
          
          {/* Enhanced Loading Indicator */}
          <AnimatePresence>
            {isLoadingIframe && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none"
              >
                <div className="text-center">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-16 h-16 border-3 border-white/20 border-t-white rounded-full mb-4"
                  />
                  <p className="text-white/80 text-sm font-medium">Loading stream...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Controls - Simplified without settings */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-0 left-0 right-0 z-20 p-4 bg-gradient-to-t from-black/80 to-transparent"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={handleReload}
                    className="p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Reload video stream"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </motion.button>
                </div>
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => window.open(getVideoUrl(), '_blank')}
                    className="px-4 py-3 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all text-sm font-medium flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Open in external browser"
                  >
                    <ExternalLink className="w-4 h-4" />
                    External
                  </motion.button>
                  <motion.button
                    onClick={handleFullscreen}
                    className="p-3 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );

  // Settings Panel Component for Details Page
  const SettingsPanel = () => (
    <AnimatePresence>
      {showSettings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <motion.div 
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            exit={{ y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-black/30 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mt-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-bold text-xl">Player Settings</h3>
              <button 
                onClick={() => setShowSettings(false)} 
                className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                aria-label="Close settings panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Source Selection */}
              <div>
                <label className="text-white font-semibold mb-3 block text-lg">Video Source</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(VIDEO_PROVIDERS).map(([key, provider]) => (
                    <motion.button
                      key={key}
                      onClick={() => setSelectedProvider(key as keyof typeof VIDEO_PROVIDERS)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        selectedProvider === key 
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
                          : 'bg-white/5 text-white/80 hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{provider.name}</span>
                        {selectedProvider === key && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="text-white"
                          >
                            <Check className="w-5 h-5" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* TV Show Controls */}
              {type === 'tv' && seasons.length > 0 && (
                <>
                  <div>
                    <label className="text-white font-semibold mb-3 block text-lg">Season & Episode</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Select value={currentSeason} onValueChange={setCurrentSeason}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select Season" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-white/10">
                          {seasons.map((season: any) => (
                            <SelectItem key={season.id} value={season.season_number.toString()} className="text-white">
                              Season {season.season_number}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={currentEpisode} onValueChange={setCurrentEpisode} disabled={episodesLoading}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select Episode" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-white/10">
                          {episodesLoading ? (
                            <SelectItem value="" disabled className="text-gray-400">Loading...</SelectItem>
                          ) : (
                            (episodes?.episodes?.map((episode: any) => (
                              <SelectItem key={episode.id} value={episode.episode_number.toString()} className="text-white">
                                E{episode.episode_number}
                              </SelectItem>
                            )) ?? <SelectItem value="" disabled>No episodes</SelectItem>)
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Quick Actions */}
              <div>
                <label className="text-white font-semibold mb-3 block text-lg">Quick Actions</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.button
                    onClick={() => window.open(getVideoUrl(), '_blank')}
                    className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl flex items-center justify-between transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Open stream in a new browser tab"
                  >
                    <span className="font-medium">Open in Browser</span>
                    <ExternalLink className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="p-4 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-xl flex items-center justify-between transition-all disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label="Download file"
                  >
                    <span className="font-medium">
                      {isDownloading ? 'Downloading...' : 'Download File'}
                    </span>
                    <Download className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* Current Selection Info */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="text-white font-semibold mb-2">Current Selection</h4>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>Provider: <span className="text-white">{VIDEO_PROVIDERS[selectedProvider].name}</span></p>
                  {type === 'tv' && (
                    <p>Episode: <span className="text-white">S{currentSeason}E{currentEpisode}</span></p>
                  )}
                  <p>Ready to play: <span className="text-green-400">Yes</span></p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 font-inter pb-16 overflow-x-hidden">
      <BottomNav onSearchClick={() => setShowSearch(true)} />
      <VideoPlayerModal />
      
      {/* Enhanced Hero Section */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${tmdb.getImageUrl(details.backdrop_path, 'original')})`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/90" />
        </motion.div>

        {/* Back Button */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute top-4 left-4 z-20"
        >
          <motion.button
            onClick={() => navigate(-1)}
            className="p-3 bg-black/50 backdrop-blur-xl rounded-2xl text-white hover:bg-black/70 transition-all border border-white/10 shadow-2xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Go back"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
        </motion.div>

        {/* Hero Content */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="relative container mx-auto px-4 h-full flex items-end pb-12 z-10"
        >
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end w-full">
            {/* Poster */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0, rotateY: 180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="relative group"
            >
              <div className="relative">
                <img
                  src={tmdb.getImageUrl(details.poster_path)}
                  alt={title}
                  className="w-56 rounded-2xl shadow-2xl border-4 border-white/10 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-2xl" />
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-2 bg-black/70 backdrop-blur-sm px-3 py-2 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-white font-bold text-sm">{rating}</span>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Title and Info */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex-1 space-y-6"
            >
              <div>
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-cinematic font-black mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight">
                  {title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 mb-6 text-base">
                  {year && <span className="text-white/90 font-medium">{year}</span>}
                  {runtime && <span className="text-white/90 font-medium">{runtime} min</span>}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-semibold">{rating}/10</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 mb-8">
                  {details.genres?.map((genre: any, index: number) => (
                    <motion.div
                      key={genre.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Badge className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border border-purple-500/30 px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm">
                        {genre.name}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Action Buttons - Added Download Button */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="flex flex-wrap gap-4"
              >
                <motion.button 
                  onClick={() => setShowPlayer(true)}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 text-lg font-bold flex items-center gap-3 group"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Watch now"
                >
                  <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6" fill="currentColor" />
                  </div>
                  Watch Now
                </motion.button>
                
                {/* Download Button */}
                <motion.button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-600/50 text-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 font-bold flex items-center gap-3 group"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Download file"
                >
                  <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  {isDownloading ? 'Downloading...' : 'Download'}
                </motion.button>
                
                {/* Settings Toggle Button */}
                <motion.button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`px-6 py-4 rounded-2xl border transition-all duration-300 font-medium flex items-center gap-3 ${
                    showSettings 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border-white/20'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Player settings"
                >
                  <Settings className="w-5 h-5" />
                  Settings
                  <motion.div
                    animate={{ rotate: showSettings ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Settings Panel */}
      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <SettingsPanel />
        </div>
      </div>

      {/* Content Section */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-2 mb-8">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl transition-all py-3 font-semibold">Overview</TabsTrigger>
              {type === 'tv' && seasons.length > 0 && <TabsTrigger value="episodes" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl transition-all py-3 font-semibold">Episodes</TabsTrigger>}
              {(details.credits?.cast?.length ?? 0) > 0 && <TabsTrigger value="cast" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-xl transition-all py-3 font-semibold">Cast</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
              >
                <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-white">
                  <Film className="w-8 h-8 text-purple-400" />
                  Storyline
                </h2>
                <p className="text-lg text-gray-300 leading-relaxed text-balance">
                  {details.overview}
                </p>
              </motion.div>
            </TabsContent>

            {type === 'tv' && seasons.length > 0 && (
              <TabsContent value="episodes" className="space-y-8">
                {/* Seasons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
                >
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-white">
                    <Calendar className="w-8 h-8 text-blue-400" />
                    Seasons
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <AnimatePresence>
                      {seasons.map((season: any, index: number) => (
                        <motion.div
                          key={season.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className={`group cursor-pointer rounded-2xl overflow-hidden shadow-2xl border-2 transition-all duration-300 ${
                            season.season_number.toString() === currentSeason 
                              ? 'border-blue-400 scale-105 ring-2 ring-blue-400/20' 
                              : 'border-transparent hover:border-white/30 hover:scale-105'
                          }`}
                          onClick={() => setCurrentSeason(season.season_number.toString())}
                        >
                          <div className="relative">
                            <img
                              src={tmdb.getImageUrl(season.poster_path) || './placeholder.svg'}
                              alt={season.name}
                              className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-4">
                              <p className="font-bold text-white text-sm mb-1">{season.name}</p>
                              <p className="text-xs text-gray-300">{season.episode_count} Episodes</p>
                            </div>
                            {season.season_number.toString() === currentSeason && (
                              <motion.div
                                className="absolute top-3 right-3 bg-blue-500 rounded-full p-1"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              >
                                <ChevronRight className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Episodes */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
                >
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-white">
                    <Play className="w-8 h-8 text-green-400" />
                    Episodes - Season {currentSeason}
                  </h2>
                  {episodesLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/10" />
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
                            className={`group cursor-pointer rounded-2xl overflow-hidden shadow-lg border-2 transition-all duration-300 bg-white/5 backdrop-blur-sm ${
                              episode.episode_number.toString() === currentEpisode 
                                ? 'border-green-400 scale-105 ring-2 ring-green-400/20' 
                                : 'border-transparent hover:border-white/20 hover:scale-105'
                            }`}
                            onClick={() => handleEpisodeClick(currentSeason, episode.episode_number.toString())}
                          >
                            {episode.still_path && (
                              <div className="relative">
                                <img
                                  src={tmdb.getImageUrl(episode.still_path)}
                                  alt={episode.name}
                                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1">
                                  <span className="text-white text-sm font-bold">E{episode.episode_number}</span>
                                </div>
                                <div className="absolute bottom-3 left-3">
                                  <div className="p-2 bg-green-500 rounded-full shadow-lg group-hover:scale-110 transition-transform">
                                    <Play className="w-4 h-4 text-white" fill="currentColor" />
                                  </div>
                                </div>
                              </div>
                            )}
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-white text-sm leading-tight flex-1">{episode.name}</h3>
                              </div>
                              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                                {episode.overview ? episode.overview : 'No description available.'}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-gray-400 text-lg">No episodes available for this season.</p>
                    </div>
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
                  className="bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10"
                >
                  <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-white">
                    <User className="w-8 h-8 text-yellow-400" />
                    Top Cast
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    <AnimatePresence>
                      {details.credits.cast.slice(0, 10).map((actor: any, index: number) => (
                        <motion.div
                          key={actor.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="text-center group cursor-pointer rounded-2xl overflow-hidden shadow-lg bg-white/5 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
                          whileHover={{ scale: 1.05, y: -5 }}
                        >
                          <div className="relative">
                            <img
                              src={tmdb.getImageUrl(actor.profile_path) || './placeholder.svg'}
                              alt={actor.name}
                              className="w-full aspect-square object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                          </div>
                          <div className="p-4">
                            <p className="font-bold text-white text-sm truncate">{actor.name}</p>
                            <p className="text-xs text-gray-400 truncate mt-1">{actor.character}</p>
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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;700;900&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }
        .font-cinematic { font-family: 'Playfair Display', serif; }
        
        /* Enhanced scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #4f46e5 0%, #7c3aed 100%);
        }
        
        /* Mobile optimizations */
        @media (max-width: 768px) {
          button, [role="button"] {
            min-height: 48px;
            min-width: 48px;
          }
        }
        
        /* Line clamp utility */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default Details;