const API_KEY = '4f10ec4dbb0a90737737dc9ffd5506c3';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';

export interface Movie {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  media_type?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export const tmdb = {
  getTrending: async (mediaType: 'movie' | 'tv' | 'all', timeWindow: 'day' | 'week' = 'day') => {
    const response = await fetch(
      `${BASE_URL}/trending/${mediaType}/${timeWindow}?api_key=${API_KEY}`
    );
    const data = await response.json();
    return data.results;
  },

  search: async (query: string, mediaType: 'movie' | 'tv' | 'multi' = 'multi') => {
    const response = await fetch(
      `${BASE_URL}/search/${mediaType}?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    return data.results;
  },

  getDetails: async (mediaType: 'movie' | 'tv', id: number) => {
    const response = await fetch(
      `${BASE_URL}/${mediaType}/${id}?api_key=${API_KEY}&append_to_response=credits,videos`
    );
    return response.json();
  },

  getMovieGenres: async () => {
    const response = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
    const data = await response.json();
    return data.genres;
  },

  getTVGenres: async () => {
    const response = await fetch(`${BASE_URL}/genre/tv/list?api_key=${API_KEY}`);
    const data = await response.json();
    return data.genres;
  },

  getImageUrl: (path: string, size: 'w500' | 'original' = 'w500') => {
    if (!path) return './placeholder.svg';
    return `${IMAGE_BASE_URL}/${size}${path}`;
  },
  async getTVEpisodes(id: number, season: number) {
  const res = await fetch(`https://api.themoviedb.org/3/tv/${id}/season/${season}?api_key=${API_KEY}&language=en-US`);
  return res.json();
}
};
