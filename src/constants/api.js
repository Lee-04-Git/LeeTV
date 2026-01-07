import Constants from "expo-constants";

// Access environment variables
const TMDB_API_KEY =
  Constants.expoConfig?.extra?.tmdbApiKey || "0dcd66e3f671ceaa6fe0c1bc8d0e854d";
const TMDB_BASE_URL =
  Constants.expoConfig?.extra?.tmdbBaseUrl || "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE_URL =
  Constants.expoConfig?.extra?.tmdbImageBaseUrl || "https://image.tmdb.org/t/p";

// Image sizes
export const IMAGE_SIZES = {
  backdrop: {
    small: "w300",
    medium: "w780",
    large: "w1280",
    original: "original",
  },
  poster: {
    small: "w185",
    medium: "w342",
    large: "w500",
    original: "original",
  },
  profile: {
    small: "w45",
    medium: "w185",
    large: "h632",
    original: "original",
  },
};

// API endpoints
export const API_ENDPOINTS = {
  // Movies
  popularMovies: "/movie/popular",
  topRatedMovies: "/movie/top_rated",
  nowPlayingMovies: "/movie/now_playing",
  upcomingMovies: "/movie/upcoming",
  movieDetails: (id) => `/movie/${id}`,
  movieCredits: (id) => `/movie/${id}/credits`,
  movieVideos: (id) => `/movie/${id}/videos`,

  // TV Shows
  popularTV: "/tv/popular",
  topRatedTV: "/tv/top_rated",
  onTheAirTV: "/tv/on_the_air",
  airingTodayTV: "/tv/airing_today",
  tvDetails: (id) => `/tv/${id}`,
  tvCredits: (id) => `/tv/${id}/credits`,
  tvVideos: (id) => `/tv/${id}/videos`,

  // Search
  search: "/search/multi",
  searchMovies: "/search/movie",
  searchTV: "/search/tv",
  searchPeople: "/search/person",

  // Trending
  trendingAll: "/trending/all/day",
  trendingMovies: "/trending/movie/day",
  trendingTV: "/trending/tv/day",
};

// Helper function to build API URL
export const buildApiUrl = (endpoint, params = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.append("api_key", TMDB_API_KEY);

  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key]);
    }
  });

  return url.toString();
};

// Helper function to build image URL
export const buildImageUrl = (path, type = "poster", size = "medium") => {
  if (!path) return null;
  const sizeValue = IMAGE_SIZES[type]?.[size] || IMAGE_SIZES.poster.medium;
  return `${TMDB_IMAGE_BASE_URL}/${sizeValue}${path}`;
};

// Export configuration
export default {
  TMDB_API_KEY,
  TMDB_BASE_URL,
  TMDB_IMAGE_BASE_URL,
};
