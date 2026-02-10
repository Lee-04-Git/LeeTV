// TMDB API Configuration
const API_KEY = "0dcd66e3f671ceaa6fe0c1bc8d0e854d";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// Safe JSON parsing helper to prevent "Body has already been read" errors
const safeJsonParse = async (response) => {
  try {
    // Clone the response to avoid body already read errors
    const clonedResponse = response.clone();
    return await clonedResponse.json();
  } catch (error) {
    // If clone fails, try original response
    try {
      return await response.json();
    } catch (e) {
      console.error("Failed to parse JSON response:", e);
      return { results: [] };
    }
  }
};

// Helper function to build image URLs
export const getImageUrl = (path, size = "w342") => {
  if (!path || path === undefined || path === "null")
    return "https://via.placeholder.com/342x513/2C3E50/FFFFFF?text=No+Image";
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

// Helper function to build backdrop URLs
export const getBackdropUrl = (path, size = "w780") => {
  if (!path || path === undefined || path === "null")
    return "https://via.placeholder.com/780x439/2C3E50/FFFFFF?text=No+Backdrop";
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

// Content filter - filters out WWE, sports, ESPN, and adult content
const shouldFilterContent = (item) => {
  if (!item) return true;
  
  const title = (item.title || item.name || "").toLowerCase();
  const overview = (item.overview || "").toLowerCase();
  
  // Filter keywords for WWE, sports, ESPN, and adult content
  const filterKeywords = [
    'wwe', 'wrestling', 'wrestlemania', 'smackdown', 'raw',
    'espn', 'sports center', 'sportscenter', 'nfl', 'nba', 'mlb', 'nhl',
    'football', 'basketball', 'baseball', 'hockey', 'soccer',
    'ufc', 'boxing', 'mma', 'fight night',
    'olympics', 'world cup', 'super bowl',
    'xxx', 'adult', 'erotic', 'porn'
  ];
  
  // Check if title or overview contains filter keywords
  const containsFilteredContent = filterKeywords.some(keyword => 
    title.includes(keyword) || overview.includes(keyword)
  );
  
  // Filter out adult content flag
  if (item.adult === true) return true;
  
  // Filter out documentary genre (ID: 99) which often includes sports
  if (item.genre_ids && item.genre_ids.includes(99)) {
    // Allow if it's clearly not sports-related
    const allowedDocKeywords = ['nature', 'history', 'science', 'art', 'music', 'crime', 'true crime'];
    const isAllowedDoc = allowedDocKeywords.some(keyword => 
      title.includes(keyword) || overview.includes(keyword)
    );
    if (!isAllowedDoc) return true;
  }
  
  return containsFilteredContent;
};

// Fetch trending content (mixed movies and TV shows)
export const fetchTrending = async (timeWindow = "week") => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/all/${timeWindow}?api_key=${API_KEY}`
    );
    const data = await response.json();
    return data.results
      .filter(item => !shouldFilterContent(item))
      .map((item) => ({
        id: item.id,
        title: item.title || item.name,
        image: getImageUrl(item.poster_path, "w342"),
        backdrop: getBackdropUrl(item.backdrop_path, "w780"),
        rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
        year: item.release_date
          ? new Date(item.release_date).getFullYear()
          : item.first_air_date
            ? new Date(item.first_air_date).getFullYear()
            : "N/A",
        type: item.media_type,
        overview: item.overview,
      }));
  } catch (error) {
    console.error("Error fetching trending:", error);
    return [];
  }
};

// Fetch trending TV shows specifically
export const fetchTrendingTVShows = async (timeWindow = "week", limit = 6) => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/tv/${timeWindow}?api_key=${API_KEY}`
    );
    const data = await response.json();
    // Filter out Stranger Things (ID: 66732), sports, WWE, ESPN, and adult content
    const filtered = data.results.filter(show => show.id !== 66732 && !shouldFilterContent(show));
    return filtered.slice(0, limit).map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w342"),
      backdrop: getBackdropUrl(show.backdrop_path, "original"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
      genre_ids: show.genre_ids || [],
    }));
  } catch (error) {
    console.error("Error fetching trending TV shows:", error);
    return [];
  }
};

// Fetch trending movies specifically
export const fetchTrendingMovies = async (timeWindow = "week", limit = 6) => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/movie/${timeWindow}?api_key=${API_KEY}`
    );
    const data = await response.json();
    const filtered = data.results.filter(movie => !shouldFilterContent(movie));
    return filtered.slice(0, limit).map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w342"),
      backdrop: getBackdropUrl(movie.backdrop_path, "original"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "N/A",
      type: "movie",
      overview: movie.overview,
      genre_ids: movie.genre_ids || [],
    }));
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return [];
  }
};

// Fetch popular movies (with explicit adult content filter)
export const fetchPopularMovies = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}&include_adult=false`
    );
    const data = await response.json();
    return data.results
      .filter(movie => !shouldFilterContent(movie))
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
        genre_ids: movie.genre_ids || [],
      }));
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return [];
  }
};

// Fetch popular TV shows (with explicit adult content filter)
export const fetchPopularTVShows = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/popular?api_key=${API_KEY}&page=${page}&include_adult=false`
    );
    const data = await response.json();
    return data.results
      .filter(show => !shouldFilterContent(show))
      .map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
        genre_ids: show.genre_ids || [],
    }));
  } catch (error) {
    console.error("Error fetching popular TV shows:", error);
    return [];
  }
};

// Fetch top rated movies
export const fetchTopRatedMovies = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/top_rated?api_key=${API_KEY}&page=${page}`
    );
    const data = await response.json();
    return data.results
      .filter(movie => !shouldFilterContent(movie))
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));
  } catch (error) {
    console.error("Error fetching top rated movies:", error);
    return [];
  }
};

// Fetch top rated TV shows
export const fetchTopRatedTVShows = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/top_rated?api_key=${API_KEY}&page=${page}`
    );
    const data = await response.json();
    return data.results
      .filter(show => !shouldFilterContent(show))
      .map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));
  } catch (error) {
    console.error("Error fetching top rated TV shows:", error);
    return [];
  }
};

// Fetch movie details
export const fetchMovieDetails = async (movieId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits,videos`
    );
    const movie = await response.json();

    return {
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w342"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
      poster_path: movie.poster_path,
      backdrop_path: movie.backdrop_path,
      vote_average: movie.vote_average,
      release_date: movie.release_date,
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "N/A",
      releaseDate: movie.release_date,
      runtime: movie.runtime ? `${movie.runtime} min` : "N/A",
      type: "movie",
      media_type: "movie",
      overview: movie.overview,
      genres: movie.genres?.map((g) => g.name) || [],
      genreIds: movie.genres?.map((g) => g.id) || [],
      cast:
        movie.credits?.cast?.slice(0, 10).map((person) => ({
          id: person.id,
          name: person.name,
          character: person.character,
          profile: getImageUrl(person.profile_path, "w185"),
        })) || [],
      director:
        movie.credits?.crew?.find((person) => person.job === "Director")
          ?.name || "N/A",
      trailer:
        movie.videos?.results?.find(
          (video) => video.type === "Trailer" && video.site === "YouTube"
        )?.key || null,
    };
  } catch (error) {
    console.error("Error fetching movie details:", error);
    return null;
  }
};

// Fetch TV show details with seasons
export const fetchTVShowDetails = async (showId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${showId}?api_key=${API_KEY}&append_to_response=credits,videos`
    );
    const show = await response.json();

    return {
      id: show.id,
      title: show.name,
      name: show.name,
      image: getImageUrl(show.poster_path, "w342"),
      backdrop: getBackdropUrl(show.backdrop_path, "w780"),
      poster_path: show.poster_path,
      backdrop_path: show.backdrop_path,
      vote_average: show.vote_average,
      first_air_date: show.first_air_date,
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      firstAirDate: show.first_air_date,
      lastAirDate: show.last_air_date,
      numberOfSeasons: show.number_of_seasons,
      numberOfEpisodes: show.number_of_episodes,
      status: show.status,
      type: "tv",
      media_type: "tv",
      overview: show.overview,
      genres: show.genres?.map((g) => g.name) || [],
      genreIds: show.genres?.map((g) => g.id) || [],
      cast:
        show.credits?.cast?.slice(0, 10).map((person) => ({
          id: person.id,
          name: person.name,
          character: person.character,
          profile: getImageUrl(person.profile_path, "w185"),
        })) || [],
      creator: show.created_by?.[0]?.name || "N/A",
      seasons:
        show.seasons?.map((season) => ({
          id: season.id,
          seasonNumber: season.season_number,
          name: season.name,
          episodeCount: season.episode_count,
          airDate: season.air_date,
          poster: getImageUrl(season.poster_path, "w342"),
          overview: season.overview,
        })) || [],
      trailer:
        show.videos?.results?.find(
          (video) => video.type === "Trailer" && video.site === "YouTube"
        )?.key || null,
    };
  } catch (error) {
    console.error("Error fetching TV show details:", error);
    return null;
  }
};

// Fetch season details with episodes
export const fetchSeasonDetails = async (showId, seasonNumber) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${showId}/season/${seasonNumber}?api_key=${API_KEY}`
    );
    const season = await response.json();

    return {
      id: season.id,
      name: season.name,
      overview: season.overview,
      seasonNumber: season.season_number,
      airDate: season.air_date,
      poster: getImageUrl(season.poster_path, "w342"),
      episodes:
        season.episodes?.map((episode) => ({
          id: episode.id,
          episodeNumber: episode.episode_number,
          name: episode.name,
          overview: episode.overview,
          airDate: episode.air_date,
          runtime: episode.runtime ? `${episode.runtime} min` : "N/A",
          stillPath: getBackdropUrl(episode.still_path, "w300"),
          rating: episode.vote_average
            ? episode.vote_average.toFixed(1)
            : "N/A",
        })) || [],
    };
  } catch (error) {
    console.error("Error fetching season details:", error);
    return null;
  }
};

// Search for movies and TV shows
export const searchContent = async (query, mediaType = null) => {
  try {
    // Use specific endpoint if mediaType is provided, otherwise use multi search
    let url;
    if (mediaType === "movie") {
      url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`;
    } else if (mediaType === "tv") {
      url = `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`;
    } else {
      url = `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}&page=1`;
    }

    const response = await fetch(url);
    const data = await response.json();
    
    return data.results
      .filter((item) => {
        // For multi search, filter by media type
        const isValidType = mediaType 
          ? item.media_type === mediaType 
          : (item.media_type === "movie" || item.media_type === "tv");
        
        // For specific searches, media_type might not be set, so infer it
        const type = item.media_type || mediaType;
        
        return isValidType && !shouldFilterContent(item);
      })
      .map((item) => ({
        id: item.id,
        title: item.title || item.name,
        image: getImageUrl(item.poster_path, "w342"),
        backdrop: getBackdropUrl(item.backdrop_path, "w780"),
        rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
        year: item.release_date
          ? new Date(item.release_date).getFullYear()
          : item.first_air_date
            ? new Date(item.first_air_date).getFullYear()
            : "N/A",
        type: item.media_type || mediaType,
        overview: item.overview,
      }));
  } catch (error) {
    console.error("Error searching content:", error);
    return [];
  }
};

// Fetch now playing movies
export const fetchNowPlayingMovies = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=${page}`
    );
    const data = await response.json();
    return data.results
      .filter(movie => !shouldFilterContent(movie))
      .map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w342"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "N/A",
      type: "movie",
      overview: movie.overview,
    }));
  } catch (error) {
    console.error("Error fetching now playing movies:", error);
    return [];
  }
};

// Fetch airing today TV shows
export const fetchAiringTodayTVShows = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/airing_today?api_key=${API_KEY}&page=${page}`
    );
    const data = await response.json();
    return data.results
      .filter(show => !shouldFilterContent(show))
      .map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));
  } catch (error) {
    console.error("Error fetching airing today TV shows:", error);
    return [];
  }
};

// Fetch upcoming movies
export const fetchUpcomingMovies = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&page=${page}`
    );
    const data = await response.json();
    return data.results
      .filter(movie => !shouldFilterContent(movie))
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));
  } catch (error) {
    console.error("Error fetching upcoming movies:", error);
    return [];
  }
};

// Fetch on the air TV shows
export const fetchOnTheAirTVShows = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&page=${page}`
    );
    const data = await response.json();
    return data.results
      .filter(show => !shouldFilterContent(show))
      .map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));
  } catch (error) {
    console.error("Error fetching on the air TV shows:", error);
    return [];
  }
};

// Fetch movies by genre (with explicit adult content filter)
export const fetchMoviesByGenre = async (genreId, page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc&include_adult=false`
    );
    const data = await response.json();
    return data.results
      .filter(movie => !shouldFilterContent(movie))
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
        genre_ids: movie.genre_ids || [],
      }));
  } catch (error) {
    console.error("Error fetching movies by genre:", error);
    return [];
  }
};

// Fetch TV shows by genre (with explicit adult content filter)
export const fetchTVShowsByGenre = async (genreId, page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc&include_adult=false`
    );
    const data = await response.json();
    return data.results
      .filter(show => !shouldFilterContent(show))
      .map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
        genre_ids: show.genre_ids || [],
      }));
  } catch (error) {
    console.error("Error fetching TV shows by genre:", error);
    return [];
  }
};

// Fetch similar movies (TMDB's similar endpoint)
export const fetchSimilarMovies = async (movieId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}&page=1`
    );
    const data = await response.json();
    return data.results.slice(0, 15).map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w342"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "N/A",
      type: "movie",
      overview: movie.overview,
    }));
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    return [];
  }
};

// Fetch recommended movies (TMDB's recommendations endpoint)
export const fetchRecommendedMovies = async (movieId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/${movieId}/recommendations?api_key=${API_KEY}&page=1`
    );
    const data = await response.json();
    return data.results.slice(0, 15).map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w342"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "N/A",
      type: "movie",
      overview: movie.overview,
    }));
  } catch (error) {
    console.error("Error fetching recommended movies:", error);
    return [];
  }
};

// Fetch similar TV shows (TMDB's similar endpoint)
export const fetchSimilarTVShows = async (showId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${showId}/similar?api_key=${API_KEY}&page=1`
    );
    const data = await response.json();
    return data.results.slice(0, 15).map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w342"),
      backdrop: getBackdropUrl(show.backdrop_path, "w780"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
    }));
  } catch (error) {
    console.error("Error fetching similar TV shows:", error);
    return [];
  }
};

// Fetch recommended TV shows (TMDB's recommendations endpoint)
export const fetchRecommendedTVShows = async (showId) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/${showId}/recommendations?api_key=${API_KEY}&page=1`
    );
    const data = await response.json();
    return data.results.slice(0, 15).map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w342"),
      backdrop: getBackdropUrl(show.backdrop_path, "w780"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
    }));
  } catch (error) {
    console.error("Error fetching recommended TV shows:", error);
    return [];
  }
};

// Fetch multiple pages of movies (for large dataset - 3000 movies)
export const fetchAllMovies = async (totalPages = 150) => {
  try {
    const allMovies = [];
    
    // Fetch in batches of 10 pages to avoid overwhelming the API
    const batchSize = 10;
    const numBatches = Math.ceil(totalPages / batchSize);
    
    console.log(`Fetching ${totalPages} pages of movies in ${numBatches} batches...`);
    
    for (let batch = 0; batch < numBatches; batch++) {
      const startPage = batch * batchSize + 1;
      const endPage = Math.min(startPage + batchSize - 1, totalPages);
      const pagePromises = [];
      
      for (let page = startPage; page <= endPage; page++) {
        pagePromises.push(fetchPopularMovies(page));
      }
      
      const results = await Promise.all(pagePromises);
      results.forEach((pageMovies) => {
        allMovies.push(...pageMovies);
      });
      
      console.log(`Batch ${batch + 1}/${numBatches} complete: ${allMovies.length} movies loaded`);
    }
    
    // Remove duplicates by ID
    const uniqueMovies = Array.from(
      new Map(allMovies.map(movie => [movie.id, movie])).values()
    );
    
    console.log(`Fetched ${uniqueMovies.length} unique movies (filtered, no adult content)`);
    return uniqueMovies;
  } catch (error) {
    console.error("Error fetching all movies:", error);
    return [];
  }
};

// Fetch multiple pages of TV shows (for large dataset - 3000 shows)
export const fetchAllTVShows = async (totalPages = 150) => {
  try {
    const allShows = [];
    
    // Fetch in batches of 10 pages to avoid overwhelming the API
    const batchSize = 10;
    const numBatches = Math.ceil(totalPages / batchSize);
    
    console.log(`Fetching ${totalPages} pages of TV shows in ${numBatches} batches...`);
    
    for (let batch = 0; batch < numBatches; batch++) {
      const startPage = batch * batchSize + 1;
      const endPage = Math.min(startPage + batchSize - 1, totalPages);
      const pagePromises = [];
      
      for (let page = startPage; page <= endPage; page++) {
        pagePromises.push(fetchPopularTVShows(page));
      }
      
      const results = await Promise.all(pagePromises);
      results.forEach((pageShows) => {
        allShows.push(...pageShows);
      });
      
      console.log(`Batch ${batch + 1}/${numBatches} complete: ${allShows.length} shows loaded`);
    }
    
    // Remove duplicates by ID
    const uniqueShows = Array.from(
      new Map(allShows.map(show => [show.id, show])).values()
    );
    
    console.log(`Fetched ${uniqueShows.length} unique TV shows (filtered, no adult content)`);
    return uniqueShows;
  } catch (error) {
    console.error("Error fetching all TV shows:", error);
    return [];
  }
};

// Fetch anime content (using Animation genre ID: 16 for TV)
export const fetchAnime = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_origin_country=JP&page=${page}&sort_by=popularity.desc&include_adult=false`
    );
    const data = await response.json();
    return {
      results: data.results.map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      })),
      totalPages: Math.min(data.total_pages, 25), // Cap at 25 pages (500 items)
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error("Error fetching anime:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch all anime (500 items with pagination support)
export const fetchAllAnime = async (targetCount = 500) => {
  try {
    const totalPages = Math.ceil(targetCount / 20); // 20 results per page
    const allAnime = [];

    // Fetch pages in batches of 5 to avoid rate limiting
    for (let batch = 0; batch < Math.ceil(totalPages / 5); batch++) {
      const startPage = batch * 5 + 1;
      const endPage = Math.min(startPage + 4, totalPages);
      const pagePromises = [];

      for (let page = startPage; page <= endPage; page++) {
        pagePromises.push(
          fetch(
            `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_origin_country=JP&page=${page}&sort_by=popularity.desc&include_adult=false`
          ).then((res) => safeJsonParse(res))
        );
      }

      const results = await Promise.all(pagePromises);
      results.forEach((data) => {
        if (data.results) {
          allAnime.push(
            ...data.results.map((show) => ({
              id: show.id,
              title: show.name,
              image: getImageUrl(show.poster_path, "w342"),
              backdrop: getBackdropUrl(show.backdrop_path, "w780"),
              rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
              year: show.first_air_date
                ? new Date(show.first_air_date).getFullYear()
                : "N/A",
              type: "tv",
              overview: show.overview,
            }))
          );
        }
      });
    }

    // Remove duplicates and limit to target count
    const uniqueAnime = Array.from(
      new Map(allAnime.map((item) => [item.id, item])).values()
    );
    return uniqueAnime.slice(0, targetCount);
  } catch (error) {
    console.error("Error fetching all anime:", error);
    return [];
  }
};

// Fetch Netflix content (network ID: 213)
export const fetchNetflix = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=213&page=${page}&sort_by=popularity.desc&include_adult=false`
    );
    const data = await response.json();
    return {
      results: data.results.map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      })),
      totalPages: Math.min(data.total_pages, 15), // Cap at 15 pages (300 items)
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error("Error fetching Netflix content:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch Hulu content (network ID: 453)
export const fetchHulu = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=453&page=${page}&sort_by=popularity.desc&include_adult=false`
    );
    const data = await response.json();
    return {
      results: data.results.map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      })),
      totalPages: Math.min(data.total_pages, 10), // Cap at 10 pages (200 items)
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error("Error fetching Hulu content:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch DC content (company ID: 429 - DC Entertainment)
export const fetchDC = async (page = 1) => {
  try {
    // Fetch both movies and TV shows from DC
    const [moviesResponse, tvResponse] = await Promise.all([
      fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=429&page=${page}&sort_by=popularity.desc&include_adult=false`
      ),
      fetch(
        `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_companies=429&page=${page}&sort_by=popularity.desc&include_adult=false`
      ),
    ]);

    const [moviesData, tvData] = await Promise.all([
      moviesResponse.json(),
      tvResponse.json(),
    ]);

    const movies = moviesData.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w342"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "N/A",
      type: "movie",
      overview: movie.overview,
    }));

    const tvShows = tvData.results.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w342"),
      backdrop: getBackdropUrl(show.backdrop_path, "w780"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
    }));

    // Combine and sort by popularity (rating as proxy)
    const combined = [...movies, ...tvShows].sort(
      (a, b) => parseFloat(b.rating) - parseFloat(a.rating)
    );

    return {
      results: combined,
      totalPages: Math.max(moviesData.total_pages, tvData.total_pages),
      totalResults: moviesData.total_results + tvData.total_results,
    };
  } catch (error) {
    console.error("Error fetching DC content:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch Marvel content - MCU Phase 1-5 content ONLY
export const fetchMarvel = async (page = 1) => {
  try {
    // MCU Phase 1-5 Movie IDs (ONLY official MCU films)
    const mcuMovieIds = [
      // Phase 1
      1726, 1724, 10138, 10195, 1771, 24428,
      // Phase 2
      68721, 76338, 100402, 118340, 99861, 102899,
      // Phase 3
      271110, 284052, 283995, 315635, 284053, 284054, 299536, 363088, 299537, 299534, 429617,
      // Phase 4
      497698, 566525, 524434, 634649, 453395, 616037, 505642, 640146, 447365, 609681,
      // Phase 5
      822119, 986056, 1003596,
    ];

    // MCU Phase 4-5 TV Show IDs (Disney+ series ONLY - no animation)
    const mcuTVShowIds = [
      85271, 88396, 84958, 88329, 92749, 92782, 92783, 114472, 114471,
      114695, 202555, 138501, 194764, 136315, 227417,
    ];

    // Marvel Animation TV IDs - STRICTLY verified Marvel animated series only
    // These are confirmed Marvel productions - no third-party content
    const marvelAnimationTVIds = [
      // Disney+ MCU Animated Series
      91363,   // What If...? (2021) - Marvel Studios
      198178,  // X-Men '97 (2024) - Marvel Animation
      227985,  // Marvel Zombies (2025) - Marvel Studios
      227973,  // Eyes of Wakanda (2025) - Marvel Studios
      219109,  // Your Friendly Neighborhood Spider-Man (2025) - Marvel Animation
      
      // Classic Marvel Animated Series (verified Marvel productions)
      4484,    // X-Men: The Animated Series (1992) - Marvel/Saban
      2108,    // Spider-Man: The Animated Series (1994) - Marvel
      2158,    // X-Men: Evolution (2000) - Marvel
      15260,   // The Spectacular Spider-Man (2008) - Marvel/Sony
      16366,   // Wolverine and the X-Men (2009) - Marvel
      16169,   // The Avengers: Earth's Mightiest Heroes (2010) - Marvel
      
      // Modern Marvel Animated Series (verified Marvel productions)
      41727,   // Ultimate Spider-Man (2012) - Marvel Animation
      57243,   // Avengers Assemble (2013) - Marvel Animation
      60735,   // Hulk and the Agents of S.M.A.S.H. (2013) - Marvel Animation
      62127,   // Guardians of the Galaxy (2015) - Marvel Animation
      67978,   // Spider-Man (2017) - Marvel Animation
      87917,   // M.O.D.O.K. (2021) - Marvel Television
      90446,   // Hit-Monkey (2021) - Marvel Television
      136804,  // Moon Girl and Devil Dinosaur (2023) - Marvel Animation
    ];

    // Marvel Animated Movie IDs - STRICTLY verified Marvel animated films only
    const marvelAnimatedMovieIds = [
      // Spider-Verse Trilogy (Sony/Marvel)
      324857,  // Spider-Man: Into the Spider-Verse (2018)
      751391,  // Spider-Man: Across the Spider-Verse (2023)
      569094,  // Spider-Man: Beyond the Spider-Verse (2026)
      
      // Marvel Direct-to-Video Animated Films
      14609,   // Ultimate Avengers (2006)
      14611,   // Ultimate Avengers 2 (2006)
      14612,   // The Invincible Iron Man (2007)
      14613,   // Doctor Strange: The Sorcerer Supreme (2007)
      17814,   // Next Avengers: Heroes of Tomorrow (2008)
      24238,   // Hulk Vs. (2009)
      29805,   // Planet Hulk (2010)
      44912,   // Thor: Tales of Asgard (2011)
      76492,   // Iron Man & Hulk: Heroes United (2013)
      177572,  // Iron Man & Captain America: Heroes United (2014)
    ];

    // Fox X-Men Movie IDs - ONLY live-action films (animated content blocked)
    const foxXMenMovieIds = [
      36657,   // X-Men (2000)
      36658,   // X2: X-Men United (2003)
      36668,   // X-Men: The Last Stand (2006)
      2080,    // X-Men Origins: Wolverine (2009)
      49538,   // X-Men: First Class (2011)
      76170,   // The Wolverine (2013)
      127585,  // X-Men: Days of Future Past (2014)
      246655,  // X-Men: Apocalypse (2016)
      263115,  // Logan (2017)
      293660,  // Deadpool (2016)
      383498,  // Deadpool 2 (2018)
      340102,  // Dark Phoenix (2019)
      269149,  // The New Mutants (2020)
      533535,  // Deadpool & Wolverine (2024)
    ];

    // Fetch movies
    const moviePromises = mcuMovieIds.map(async (movieId) => {
      try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
        const data = await response.json();
        return data.id ? data : null;
      } catch (error) {
        return null;
      }
    });

    // Fetch TV shows - with validation to block non-MCU content
    const tvPromises = mcuTVShowIds.map(async (showId) => {
      try {
        // Fetch show details with credits to check cast
        const response = await fetch(`${BASE_URL}/tv/${showId}?api_key=${API_KEY}&append_to_response=credits`);
        const data = await response.json();
        if (!data.id) return null;
        
        const title = (data.name || '').toLowerCase();
        const overview = (data.overview || '').toLowerCase();
        const originCountry = data.origin_country || [];
        
        // Block content with Colin Farrell
        const castNames = data.credits?.cast?.map(c => c.name.toLowerCase()) || [];
        const hasColinFarrell = castNames.some(name => 
          name.includes('colin farrell') || name.includes('colin farrel')
        );
        if (hasColinFarrell) return null;
        
        // Block cooking shows
        const cookingKeywords = ['cooking', 'chef', 'kitchen', 'recipe', 'food', 'bake', 'baking', 'culinary', 'restaurant'];
        const isCookingShow = cookingKeywords.some(keyword => 
          title.includes(keyword) || overview.includes(keyword)
        );
        if (isCookingShow) return null;
        
        // Block DC shows
        const dcKeywords = ['batman', 'superman', 'wonder woman', 'justice league', 'dc comics', 'gotham', 'harley quinn', 'joker', 'aquaman', 'flash'];
        const isDCShow = dcKeywords.some(keyword => 
          title.includes(keyword) || overview.includes(keyword)
        );
        if (isDCShow) return null;
        
        // Block Asian shows (Korean, Japanese, Chinese, etc.) - unless it's Marvel content
        const asianCountries = ['KR', 'JP', 'CN', 'TW', 'TH', 'IN', 'PH'];
        const isAsianShow = originCountry.some(country => asianCountries.includes(country));
        const isMarvelContent = title.includes('marvel') || overview.includes('marvel') || 
                                overview.includes('mcu') || overview.includes('avenger');
        if (isAsianShow && !isMarvelContent) return null;
        
        return data;
      } catch (error) {
        return null;
      }
    });

    // Fetch Animation TV - with STRICT Marvel validation using production companies
    const animationPromises = marvelAnimationTVIds.map(async (showId) => {
      try {
        const response = await fetch(`${BASE_URL}/tv/${showId}?api_key=${API_KEY}`);
        const data = await response.json();
        if (!data.id) return null;
        
        const title = (data.name || '').toLowerCase();
        const overview = (data.overview || '').toLowerCase();
        
        // Check production companies for Marvel (420 = Marvel Studios, 7505 = Marvel Entertainment, 13252 = Marvel Animation)
        const productionCompanyIds = data.production_companies?.map(c => c.id) || [];
        const isMarvelProduction = productionCompanyIds.some(id => [420, 7505, 13252, 38679, 2301].includes(id));
        
        // Strict keyword validation for Marvel content
        const marvelKeywords = [
          'marvel', 'spider-man', 'spider man', 'x-men', 'avenger', 'hulk', 
          'iron man', 'wolverine', 'guardians of the galaxy', 'what if',
          'moon girl', 'm.o.d.o.k', 'hit-monkey', 'captain america', 'thor',
          'black panther', 'doctor strange', 'ant-man', 'wakanda'
        ];
        
        const hasMarvelKeyword = marvelKeywords.some(keyword => 
          title.includes(keyword) || overview.includes(keyword)
        );
        
        // Must be either a Marvel production OR have Marvel keywords
        if (!isMarvelProduction && !hasMarvelKeyword) return null;
        
        return data;
      } catch (error) {
        return null;
      }
    });

    // Fetch Animated Movies - with STRICT Marvel validation
    const animatedMoviePromises = marvelAnimatedMovieIds.map(async (movieId) => {
      try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
        const data = await response.json();
        if (!data.id) return null;
        
        const title = (data.title || '').toLowerCase();
        const overview = (data.overview || '').toLowerCase();
        
        // Must be animated (genre 16)
        const isAnimated = data.genres?.some(g => g.id === 16);
        if (!isAnimated) return null;
        
        // Check production companies for Marvel/Sony Spider-Verse
        const productionCompanyIds = data.production_companies?.map(c => c.id) || [];
        const isMarvelProduction = productionCompanyIds.some(id => [420, 7505, 13252, 38679, 2301, 5, 34].includes(id));
        
        // Strict keyword validation for Marvel animated content
        const marvelKeywords = [
          'marvel', 'spider-man', 'spider man', 'spider-verse', 'avenger', 'hulk', 
          'iron man', 'thor', 'captain america', 'doctor strange', 'planet hulk'
        ];
        
        const hasMarvelKeyword = marvelKeywords.some(keyword => 
          title.includes(keyword) || overview.includes(keyword)
        );
        
        // Must be either a Marvel production OR have Marvel keywords
        if (!isMarvelProduction && !hasMarvelKeyword) return null;
        
        return data;
      } catch (error) {
        return null;
      }
    });

    // Fetch X-Men movies - STRICTLY block any animated content
    const xmenPromises = foxXMenMovieIds.map(async (movieId) => {
      try {
        const response = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
        const data = await response.json();
        if (!data.id) return null;
        
        // Block animated movies (genre 16 = Animation)
        const isAnimated = data.genres?.some(g => g.id === 16);
        if (isAnimated) return null;
        
        return data;
      } catch (error) {
        return null;
      }
    });

    const [moviesData, tvShowsData, animationData, animatedMoviesData, xmenData] = await Promise.all([
      Promise.all(moviePromises),
      Promise.all(tvPromises),
      Promise.all(animationPromises),
      Promise.all(animatedMoviePromises),
      Promise.all(xmenPromises),
    ]);

    const validMovies = moviesData.filter(m => m !== null);
    const validTVShows = tvShowsData.filter(s => s !== null);
    const validAnimation = animationData.filter(a => a !== null);
    const validAnimatedMovies = animatedMoviesData.filter(m => m !== null);
    const validXMen = xmenData.filter(x => x !== null);

    const movies = validMovies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w342"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
      type: "movie",
      overview: movie.overview,
    }));

    const tvShows = validTVShows.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w342"),
      backdrop: getBackdropUrl(show.backdrop_path, "w780"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
      type: "tv",
      overview: show.overview,
    }));

    const animation = validAnimation.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w342"),
      backdrop: getBackdropUrl(show.backdrop_path, "w780"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
      type: "tv",
      overview: show.overview,
    }));

    const animatedMovies = validAnimatedMovies.map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w342"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
      type: "movie",
      overview: movie.overview,
    }));

    const xmenMovies = validXMen.map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w342"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
      type: "movie",
      overview: movie.overview,
    }));

    // Combine all and sort by year
    const combined = [...movies, ...tvShows, ...animation, ...animatedMovies, ...xmenMovies].sort((a, b) => (b.year || 0) - (a.year || 0));

    return {
      results: combined,
      totalPages: 1,
      totalResults: combined.length,
    };
  } catch (error) {
    console.error("Error fetching Marvel content:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch Star Wars content (via search)
export const fetchStarWars = async (page = 1) => {
  try {
    // Fetch both movies and TV shows via search
    const [moviesResponse, tvResponse] = await Promise.all([
      fetch(
        `${BASE_URL}/search/movie?api_key=${API_KEY}&query=Star%20Wars&page=${page}&include_adult=false`
      ),
      fetch(
        `${BASE_URL}/search/tv?api_key=${API_KEY}&query=Star%20Wars&page=${page}&include_adult=false`
      ),
    ]);

    const [moviesData, tvData] = await Promise.all([
      moviesResponse.json(),
      tvResponse.json(),
    ]);

    const movies = moviesData.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w342"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "N/A",
      type: "movie",
      overview: movie.overview,
    }));

    const tvShows = tvData.results.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w342"),
      backdrop: getBackdropUrl(show.backdrop_path, "w780"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
    }));

    // Combine and sort by rating
    const combined = [...movies, ...tvShows].sort(
      (a, b) => parseFloat(b.rating) - parseFloat(a.rating)
    );

    return {
      results: combined,
      totalPages: Math.max(moviesData.total_pages, tvData.total_pages),
      totalResults: moviesData.total_results + tvData.total_results,
    };
  } catch (error) {
    console.error("Error fetching Star Wars content:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch HBO Max/Max content (network IDs: 49 - HBO, 3186 - HBO Max)
export const fetchHBOMax = async (page = 1) => {
  try {
    // Fetch from both HBO and HBO Max networks
    const [hboResponse, maxResponse] = await Promise.all([
      fetch(
        `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=49&page=${page}&sort_by=popularity.desc&include_adult=false`
      ),
      fetch(
        `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=3186&page=${page}&sort_by=popularity.desc&include_adult=false`
      ),
    ]);

    const [hboData, maxData] = await Promise.all([
      hboResponse.json(),
      maxResponse.json(),
    ]);

    const hboShows = hboData.results.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w342"),
      backdrop: getBackdropUrl(show.backdrop_path, "w780"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
    }));

    const maxShows = maxData.results.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w342"),
      backdrop: getBackdropUrl(show.backdrop_path, "w780"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
    }));

    // Combine and deduplicate
    const allShows = [...hboShows, ...maxShows];
    const uniqueShows = Array.from(
      new Map(allShows.map((show) => [show.id, show])).values()
    ).sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

    return {
      results: uniqueShows,
      totalPages: Math.max(hboData.total_pages, maxData.total_pages),
      totalResults: hboData.total_results + maxData.total_results,
    };
  } catch (error) {
    console.error("Error fetching HBO Max content:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch Paramount+ content (network ID: 4330)
export const fetchParamountPlus = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=4330&page=${page}&sort_by=popularity.desc&include_adult=false`
    );
    const data = await response.json();
    return {
      results: data.results.map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      })),
      totalPages: Math.min(data.total_pages, 8), // Cap at 8 pages (150 items)
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error("Error fetching Paramount+ content:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch Apple TV+ content (network ID: 2552)
export const fetchAppleTV = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=2552&page=${page}&sort_by=popularity.desc&include_adult=false`
    );
    const data = await response.json();
    return {
      results: data.results.map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      })),
      totalPages: Math.min(data.total_pages, 12), // Cap at 12 pages (~233 items)
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error("Error fetching Apple TV+ content:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch USA Network content (network ID: 30)
export const fetchUSANetwork = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=30&page=${page}&sort_by=popularity.desc&include_adult=false`
    );
    const data = await response.json();
    return {
      results: data.results.map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      })),
      totalPages: Math.min(data.total_pages, 9), // Cap at 9 pages (~166 items)
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error("Error fetching USA Network content:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch The CW content (network ID: 71)
export const fetchTheCW = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=71&page=${page}&sort_by=popularity.desc&include_adult=false`
    );
    const data = await response.json();
    return {
      results: data.results.map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      })),
      totalPages: Math.min(data.total_pages, 10), // Cap at 10 pages (~182 items)
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error("Error fetching The CW content:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch ESPN content (network ID: 29)
export const fetchESPN = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=29&page=${page}&sort_by=popularity.desc&include_adult=false`
    );
    const data = await response.json();
    return {
      results: data.results.map((show) => ({
        id: show.id,
        title: show.name,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      })),
      totalPages: Math.min(data.total_pages, 6), // Cap at 6 pages (~102 items)
      totalResults: data.total_results,
    };
  } catch (error) {
    console.error("Error fetching ESPN content:", error);
    return { results: [], totalPages: 0, totalResults: 0 };
  }
};

// Fetch franchise-specific content
export const fetchFranchiseContent = async (franchise) => {
  try {
    const franchiseConfig = {
      Marvel: {
        movies: { with_companies: "420,7505" }, // Marvel Studios + Marvel Entertainment
        tv: { with_companies: "420,7505" },
      },
      "Star Wars": {
        movies: { with_keywords: 1570 }, // Star Wars keyword
        tv: { with_keywords: 1570 },
      },
      Anime: {
        movies: { with_genres: 16, with_origin_country: "JP" },
        tv: { with_genres: 16, with_origin_country: "JP" },
      },
      Disney: {
        movies: { with_companies: 2 }, // Walt Disney Pictures
        tv: { with_companies: 2 },
      },
      "Disney+": {
        movies: { with_companies: 2 }, // Walt Disney Pictures
        tv: { with_companies: 2 },
      },
      DC: {
        movies: { with_companies: 429 }, // DC Entertainment
        tv: { with_companies: 429 },
      },
      Hulu: {
        movies: { with_networks: 453 }, // Hulu network
        tv: { with_networks: 453 },
      },
      "HBO Max": {
        movies: { with_companies: 174 }, // Warner Bros
        tv: { with_networks: 49 }, // HBO network
      },
      Max: {
        movies: { with_companies: 174 }, // Warner Bros
        tv: { with_networks: 49 }, // HBO network
      },
      "Prime Video": {
        movies: { with_companies: 1024 }, // Amazon Studios
        tv: { with_networks: 1024 },
      },
      "Amazon Prime": {
        movies: { with_companies: 1024 }, // Amazon Studios
        tv: { with_networks: 1024 },
      },
      Netflix: {
        movies: { with_companies: 213 }, // Netflix
        tv: { with_networks: 213 }, // Netflix network
      },
      "Netflix Originals": {
        movies: { with_companies: 213 },
        tv: { with_networks: 213 },
      },
      "Apple TV+": {
        movies: { with_companies: 158414 }, // Apple Studios
        tv: { with_networks: 2552 }, // Apple TV+ network
      },
      Peacock: {
        movies: { with_companies: 3353 },
        tv: { with_networks: 3353 }, // Peacock network
      },
      "Paramount+": {
        movies: { with_companies: 4 }, // Paramount Pictures
        tv: { with_networks: 4330 }, // Paramount+ network
      },
      "Harry Potter": {
        movies: { with_companies: 174 }, // Warner Bros
        tv: { with_companies: 174 },
        collectionId: 1241, // Harry Potter Collection
      },
      "Transformers": {
        movies: { with_keywords: 310 }, // Transformers keyword
        tv: { with_keywords: 310 },
        collectionId: 8650, // Transformers Collection
      },
    };

    const config = franchiseConfig[franchise];
    if (!config) {
      return { movies: [], tvShows: [] };
    }

    // Special handling for Marvel - MCU Phase 1-5 content ONLY
    if (franchise === "Marvel") {
      // MCU Phase 1-5 Movie IDs (ONLY official MCU films - nothing else allowed)
      const mcuMovieIds = [
        // Phase 1
        1726,    // Iron Man (2008)
        1724,    // The Incredible Hulk (2008)
        10138,   // Iron Man 2 (2010)
        10195,   // Thor (2011)
        1771,    // Captain America: The First Avenger (2011)
        24428,   // The Avengers (2012)
        
        // Phase 2
        68721,   // Iron Man 3 (2013)
        76338,   // Thor: The Dark World (2013)
        100402,  // Captain America: The Winter Soldier (2014)
        118340,  // Guardians of the Galaxy (2014)
        99861,   // Avengers: Age of Ultron (2015)
        102899,  // Ant-Man (2015)
        
        // Phase 3
        271110,  // Captain America: Civil War (2016)
        284052,  // Doctor Strange (2016)
        283995,  // Guardians of the Galaxy Vol. 2 (2017)
        315635,  // Spider-Man: Homecoming (2017)
        284053,  // Thor: Ragnarok (2017)
        284054,  // Black Panther (2018)
        299536,  // Avengers: Infinity War (2018)
        363088,  // Ant-Man and the Wasp (2018)
        299537,  // Captain Marvel (2019)
        299534,  // Avengers: Endgame (2019)
        429617,  // Spider-Man: Far From Home (2019)
        
        // Phase 4
        497698,  // Black Widow (2021)
        566525,  // Shang-Chi and the Legend of the Ten Rings (2021)
        524434,  // Eternals (2021)
        634649,  // Spider-Man: No Way Home (2021)
        453395,  // Doctor Strange in the Multiverse of Madness (2022)
        616037,  // Thor: Love and Thunder (2022)
        505642,  // Black Panther: Wakanda Forever (2022)
        640146,  // Ant-Man and the Wasp: Quantumania (2023)
        447365,  // Guardians of the Galaxy Vol. 3 (2023)
        609681,  // The Marvels (2023)
        
        // Phase 5
        822119,  // Captain America: Brave New World (2025)
        986056,  // Thunderbolts* (2025)
        1003596, // The Fantastic Four: First Steps (2025)
      ];

      // MCU Phase 4-5 TV Show IDs (Disney+ series ONLY)
      const mcuTVShowIds = [
        // Phase 4
        85271,   // WandaVision (2021)
        88396,   // The Falcon and the Winter Soldier (2021)
        84958,   // Loki (2021)
        88329,   // Hawkeye (2021)
        92749,   // Moon Knight (2022)
        92782,   // Ms. Marvel (2022)
        92783,   // She-Hulk: Attorney at Law (2022)
        114472,  // The Guardians of the Galaxy Holiday Special (2022)
        114471,  // Werewolf by Night (2022)
        
        // Phase 5
        114695,  // Secret Invasion (2023)
        202555,  // Loki Season 2 (2023)
        138501,  // Echo (2024)
        194764,  // Agatha All Along (2024)
        136315,  // Daredevil: Born Again (2025)
        227417,  // Ironheart (2025)
      ];

      // Marvel Animation IDs - Only verified Marvel animated TV series
      const marvelAnimationTVIds = [
        // Disney+ MCU Animated
        91363,   // What If...? (2021)
        198178,  // X-Men '97 (2024)
        227985,  // Marvel Zombies (2025)
        227973,  // Eyes of Wakanda (2025)
        219109,  // Your Friendly Neighborhood Spider-Man (2025)
        
        // Classic Marvel Animated (verified Marvel productions)
        4484,    // X-Men: The Animated Series (1992)
        2108,    // Spider-Man: The Animated Series (1994)
        2158,    // X-Men: Evolution (2000)
        15260,   // The Spectacular Spider-Man (2008)
        16366,   // Wolverine and the X-Men (2009)
        16169,   // The Avengers: Earth's Mightiest Heroes (2010)
        41727,   // Ultimate Spider-Man (2012)
        57243,   // Avengers Assemble (2013)
        60735,   // Hulk and the Agents of S.M.A.S.H. (2013)
        62127,   // Guardians of the Galaxy (2015)
        67978,   // Spider-Man (2017)
        87917,   // M.O.D.O.K. (2021)
        90446,   // Hit-Monkey (2021)
        136804,  // Moon Girl and Devil Dinosaur (2023)
      ];

      // Marvel Animated Movies - Only verified Marvel animated films
      const marvelAnimatedMovieIds = [
        324857,  // Spider-Man: Into the Spider-Verse (2018)
        751391,  // Spider-Man: Across the Spider-Verse (2023)
        569094,  // Spider-Man: Beyond the Spider-Verse (2026)
        14609,   // Ultimate Avengers (2006)
        14611,   // Ultimate Avengers 2 (2006)
        14612,   // The Invincible Iron Man (2007)
        14613,   // Doctor Strange: The Sorcerer Supreme (2007)
        17814,   // Next Avengers: Heroes of Tomorrow (2008)
        24238,   // Hulk Vs. (2009)
        29805,   // Planet Hulk (2010)
        44912,   // Thor: Tales of Asgard (2011)
        76492,   // Iron Man & Hulk: Heroes United (2013)
        177572,  // Iron Man & Captain America: Heroes United (2014)
      ];

      // Fox X-Men Movie IDs - ONLY live-action films (no animated)
      const foxXMenMovieIds = [
        36657,   // X-Men (2000)
        36658,   // X2: X-Men United (2003)
        36668,   // X-Men: The Last Stand (2006)
        2080,    // X-Men Origins: Wolverine (2009)
        49538,   // X-Men: First Class (2011)
        76170,   // The Wolverine (2013)
        127585,  // X-Men: Days of Future Past (2014)
        246655,  // X-Men: Apocalypse (2016)
        263115,  // Logan (2017)
        293660,  // Deadpool (2016)
        383498,  // Deadpool 2 (2018)
        340102,  // Dark Phoenix (2019)
        269149,  // The New Mutants (2020)
        533535,  // Deadpool & Wolverine (2024)
      ];

      // Sony Spider-Man Universe (SSU) Movie IDs - Venom, Morbius, etc.
      const sonySSUMovieIds = [
        335983,  // Venom (2018)
        580489,  // Venom: Let There Be Carnage (2021)
        526896,  // Morbius (2022)
        634492,  // Madame Web (2024)
        912649,  // Venom: The Last Dance (2024)
        539972,  // Kraven the Hunter (2024)
      ];

      // Sam Raimi Spider-Man Trilogy (Tobey Maguire)
      const raimiSpiderManIds = [
        557,     // Spider-Man (2002)
        558,     // Spider-Man 2 (2004)
        559,     // Spider-Man 3 (2007)
      ];

      // Amazing Spider-Man (Andrew Garfield)
      const amazingSpiderManIds = [
        1930,    // The Amazing Spider-Man (2012)
        102382,  // The Amazing Spider-Man 2 (2014)
      ];

      // Blade Trilogy (Wesley Snipes)
      const bladeTrilogyIds = [
        36647,   // Blade (1998)
        36586,   // Blade II (2002)
        36585,   // Blade: Trinity (2004)
      ];

      // Fantastic Four (Fox) Movie IDs
      const fantasticFourFoxIds = [
        9738,    // Fantastic Four (2005)
        1979,    // Fantastic Four: Rise of the Silver Surfer (2007)
        166424,  // Fantastic Four (2015)
      ];

      // Marvel Netflix/Television TV Show IDs (Pre-Disney+)
      const marvelNetflixTVIds = [
        61889,   // Daredevil (2015-2018)
        38472,   // Jessica Jones (2015-2019)
        62126,   // Luke Cage (2016-2018)
        62127,   // Iron Fist (2017-2018) - Note: same ID as Guardians animated, will be filtered
        62285,   // The Defenders (2017)
        67178,   // The Punisher (2017-2019)
        1403,    // Agents of S.H.I.E.L.D. (2013-2020)
        61550,   // Agent Carter (2015-2016)
        67466,   // Inhumans (2017)
        67026,   // Runaways (2017-2019)
        66190,   // Cloak & Dagger (2018-2019)
      ];

      // Fetch all MCU movies
      const moviePromises = mcuMovieIds.map(async (movieId) => {
        try {
          const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
          );
          const data = await response.json();
          return data.id ? { ...data, category: 'movie' } : null;
        } catch (error) {
          return null;
        }
      });

      // Fetch all MCU TV shows - with validation to block non-MCU content
      const tvPromises = mcuTVShowIds.map(async (showId) => {
        try {
          // Fetch show details with credits to check cast
          const response = await fetch(
            `${BASE_URL}/tv/${showId}?api_key=${API_KEY}&append_to_response=credits`
          );
          const data = await response.json();
          if (!data.id) return null;
          
          const title = (data.name || '').toLowerCase();
          const overview = (data.overview || '').toLowerCase();
          const originCountry = data.origin_country || [];
          
          // Block content with Colin Farrell
          const castNames = data.credits?.cast?.map(c => c.name.toLowerCase()) || [];
          const hasColinFarrell = castNames.some(name => 
            name.includes('colin farrell') || name.includes('colin farrel')
          );
          if (hasColinFarrell) return null;
          
          // Block cooking shows
          const cookingKeywords = ['cooking', 'chef', 'kitchen', 'recipe', 'food', 'bake', 'baking', 'culinary', 'restaurant'];
          const isCookingShow = cookingKeywords.some(keyword => 
            title.includes(keyword) || overview.includes(keyword)
          );
          if (isCookingShow) return null;
          
          // Block DC shows
          const dcKeywords = ['batman', 'superman', 'wonder woman', 'justice league', 'dc comics', 'gotham', 'harley quinn', 'joker', 'aquaman', 'flash'];
          const isDCShow = dcKeywords.some(keyword => 
            title.includes(keyword) || overview.includes(keyword)
          );
          if (isDCShow) return null;
          
          // Block Asian shows (Korean, Japanese, Chinese, etc.) - unless it's Marvel content
          const asianCountries = ['KR', 'JP', 'CN', 'TW', 'TH', 'IN', 'PH'];
          const isAsianShow = originCountry.some(country => asianCountries.includes(country));
          const isMarvelContent = title.includes('marvel') || overview.includes('marvel') || 
                                  overview.includes('mcu') || overview.includes('avenger');
          if (isAsianShow && !isMarvelContent) return null;
          
          return { ...data, category: 'tv' };
        } catch (error) {
          return null;
        }
      });

      // Fetch Marvel Animation TV shows - with STRICT validation using production companies
      const animationPromises = marvelAnimationTVIds.map(async (showId) => {
        try {
          const response = await fetch(
            `${BASE_URL}/tv/${showId}?api_key=${API_KEY}`
          );
          const data = await response.json();
          if (!data.id) return null;
          
          const title = (data.name || '').toLowerCase();
          const overview = (data.overview || '').toLowerCase();
          
          // Check production companies for Marvel (420 = Marvel Studios, 7505 = Marvel Entertainment, 13252 = Marvel Animation)
          const productionCompanyIds = data.production_companies?.map(c => c.id) || [];
          const isMarvelProduction = productionCompanyIds.some(id => [420, 7505, 13252, 38679, 2301].includes(id));
          
          // Strict keyword validation for Marvel content
          const marvelKeywords = [
            'marvel', 'spider-man', 'spider man', 'x-men', 'avenger', 'hulk', 
            'iron man', 'wolverine', 'guardians of the galaxy', 'what if',
            'moon girl', 'm.o.d.o.k', 'hit-monkey', 'captain america', 'thor',
            'black panther', 'doctor strange', 'ant-man', 'wakanda'
          ];
          
          const hasMarvelKeyword = marvelKeywords.some(keyword => 
            title.includes(keyword) || overview.includes(keyword)
          );
          
          // Must be either a Marvel production OR have Marvel keywords
          if (!isMarvelProduction && !hasMarvelKeyword) return null;
          
          return { ...data, category: 'animation' };
        } catch (error) {
          return null;
        }
      });

      // Fetch Marvel Animated Movies - with STRICT validation using production companies
      const animatedMoviePromises = marvelAnimatedMovieIds.map(async (movieId) => {
        try {
          const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
          );
          const data = await response.json();
          if (!data.id) return null;
          
          const title = (data.title || '').toLowerCase();
          const overview = (data.overview || '').toLowerCase();
          
          // Must be animated (genre 16)
          const isAnimated = data.genres?.some(g => g.id === 16);
          if (!isAnimated) return null;
          
          // Check production companies for Marvel/Sony Spider-Verse
          const productionCompanyIds = data.production_companies?.map(c => c.id) || [];
          const isMarvelProduction = productionCompanyIds.some(id => [420, 7505, 13252, 38679, 2301, 5, 34].includes(id));
          
          // Strict keyword validation for Marvel animated content
          const marvelKeywords = [
            'marvel', 'spider-man', 'spider man', 'spider-verse', 'avenger', 'hulk', 
            'iron man', 'thor', 'captain america', 'doctor strange', 'planet hulk'
          ];
          
          const hasMarvelKeyword = marvelKeywords.some(keyword => 
            title.includes(keyword) || overview.includes(keyword)
          );
          
          // Must be either a Marvel production OR have Marvel keywords
          if (!isMarvelProduction && !hasMarvelKeyword) return null;
          
          return { ...data, category: 'animated_movie' };
        } catch (error) {
          return null;
        }
      });

      // Fetch Fox X-Men movies - STRICTLY block any animated content
      const xmenPromises = foxXMenMovieIds.map(async (movieId) => {
        try {
          const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
          );
          const data = await response.json();
          if (!data.id) return null;
          
          // Block animated movies (genre 16 = Animation)
          const isAnimated = data.genres?.some(g => g.id === 16);
          if (isAnimated) return null;
          
          return { ...data, category: 'xmen' };
        } catch (error) {
          return null;
        }
      });

      // Fetch Sony SSU movies
      const sonySSUPromises = sonySSUMovieIds.map(async (movieId) => {
        try {
          const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
          );
          const data = await response.json();
          return data.id ? { ...data, category: 'sony_ssu' } : null;
        } catch (error) {
          return null;
        }
      });

      // Fetch Sam Raimi Spider-Man movies
      const raimiPromises = raimiSpiderManIds.map(async (movieId) => {
        try {
          const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
          );
          const data = await response.json();
          return data.id ? { ...data, category: 'raimi_spiderman' } : null;
        } catch (error) {
          return null;
        }
      });

      // Fetch Amazing Spider-Man movies
      const amazingPromises = amazingSpiderManIds.map(async (movieId) => {
        try {
          const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
          );
          const data = await response.json();
          return data.id ? { ...data, category: 'amazing_spiderman' } : null;
        } catch (error) {
          return null;
        }
      });

      // Fetch Blade Trilogy movies
      const bladePromises = bladeTrilogyIds.map(async (movieId) => {
        try {
          const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
          );
          const data = await response.json();
          return data.id ? { ...data, category: 'blade' } : null;
        } catch (error) {
          return null;
        }
      });

      // Fetch Fantastic Four (Fox) movies
      const fantasticFourPromises = fantasticFourFoxIds.map(async (movieId) => {
        try {
          const response = await fetch(
            `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`
          );
          const data = await response.json();
          return data.id ? { ...data, category: 'fantastic_four' } : null;
        } catch (error) {
          return null;
        }
      });

      // Fetch Marvel Netflix/Television TV shows - filter out Kiefer Sutherland
      const netflixTVPromises = marvelNetflixTVIds.map(async (showId) => {
        try {
          const response = await fetch(
            `${BASE_URL}/tv/${showId}?api_key=${API_KEY}&append_to_response=credits`
          );
          const data = await response.json();
          if (!data.id) return null;
          
          // Block content with Kiefer Sutherland
          const castNames = data.credits?.cast?.map(c => c.name.toLowerCase()) || [];
          const hasKieferSutherland = castNames.some(name => 
            name.includes('kiefer sutherland')
          );
          if (hasKieferSutherland) return null;
          
          return { ...data, category: 'netflix_tv' };
        } catch (error) {
          return null;
        }
      });

      const [moviesData, tvShowsData, animationData, animatedMoviesData, xmenData, sonySSUData, raimiData, amazingData, bladeData, fantasticFourData, netflixTVData] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises),
        Promise.all(animationPromises),
        Promise.all(animatedMoviePromises),
        Promise.all(xmenPromises),
        Promise.all(sonySSUPromises),
        Promise.all(raimiPromises),
        Promise.all(amazingPromises),
        Promise.all(bladePromises),
        Promise.all(fantasticFourPromises),
        Promise.all(netflixTVPromises),
      ]);

      // Filter out null results
      const validMovies = moviesData.filter(m => m !== null);
      const validTVShows = tvShowsData.filter(s => s !== null);
      const validAnimation = animationData.filter(a => a !== null);
      const validAnimatedMovies = animatedMoviesData.filter(m => m !== null);
      const validXMen = xmenData.filter(x => x !== null);
      const validSonySSU = sonySSUData.filter(m => m !== null);
      const validRaimi = raimiData.filter(m => m !== null);
      const validAmazing = amazingData.filter(m => m !== null);
      const validBlade = bladeData.filter(m => m !== null);
      const validFantasticFour = fantasticFourData.filter(m => m !== null);
      const validNetflixTV = netflixTVData.filter(s => s !== null);

      const movies = validMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const tvShows = validTVShows.map((show) => ({
        id: show.id,
        title: show.name || show.title,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));

      const animation = validAnimation.map((show) => ({
        id: show.id,
        title: show.name || show.title,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
        isAnimation: true,
      }));

      const animatedMovies = validAnimatedMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
        isAnimation: true,
      }));

      const xmenMovies = validXMen.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
        isXMen: true,
      }));

      const sonySSUMovies = validSonySSU.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const raimiSpiderMan = validRaimi.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const amazingSpiderMan = validAmazing.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const bladeTrilogy = validBlade.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const fantasticFourMovies = validFantasticFour.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const netflixTVShows = validNetflixTV.map((show) => ({
        id: show.id,
        title: show.name || show.title,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));

      return { 
        movies, 
        tvShows, 
        animation, 
        animatedMovies, 
        xmenMovies,
        sonySSUMovies,
        raimiSpiderMan,
        amazingSpiderMan,
        bladeTrilogy,
        fantasticFourMovies,
        netflixTVShows,
      };
    }

    // Special handling for Harry Potter - fetch collection and filter for Daniel Radcliffe
    if (franchise === "Harry Potter") {
      // Harry Potter Collection ID: 1241
      const collectionId = 1241;
      
      try {
        // Fetch the Harry Potter collection
        const collectionResponse = await fetch(
          `${BASE_URL}/collection/${collectionId}?api_key=${API_KEY}`
        );
        const collectionData = await collectionResponse.json();
        
        if (!collectionData.parts || collectionData.parts.length === 0) {
          return { movies: [], tvShows: [] };
        }
        
        // Fetch detailed info for each movie to check cast for Daniel Radcliffe
        const moviePromises = collectionData.parts.map(async (movie) => {
          try {
            const response = await fetch(
              `${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}&append_to_response=credits`
            );
            const data = await response.json();
            if (!data.id) return null;
            
            // Check if Daniel Radcliffe is in the cast
            const castNames = data.credits?.cast?.map(c => c.name.toLowerCase()) || [];
            const hasDanielRadcliffe = castNames.some(name => 
              name.includes('daniel radcliffe')
            );
            
            // Only include movies with Daniel Radcliffe
            if (!hasDanielRadcliffe) return null;
            
            return data;
          } catch (error) {
            return null;
          }
        });
        
        const moviesData = await Promise.all(moviePromises);
        const validMovies = moviesData.filter(m => m !== null);
        
        const movies = validMovies.map((movie) => ({
          id: movie.id,
          title: movie.title,
          image: getImageUrl(movie.poster_path, "w342"),
          backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
          rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
          year: movie.release_date
            ? new Date(movie.release_date).getFullYear()
            : "N/A",
          type: "movie",
          overview: movie.overview,
        }));
        
        // Sort by release year
        const sortedMovies = movies.sort((a, b) => (a.year || 0) - (b.year || 0));
        
        return { movies: sortedMovies, tvShows: [] };
      } catch (error) {
        console.error("Error fetching Harry Potter collection:", error);
        return { movies: [], tvShows: [] };
      }
    }

    // Special handling for Transformers - fetch collection and TV shows
    if (franchise === "Transformers") {
      try {
        // Transformers Collection ID: 8650
        const collectionId = 8650;
        
        // Fetch the main Transformers collection
        const collectionResponse = await fetch(
          `${BASE_URL}/collection/${collectionId}?api_key=${API_KEY}`
        );
        const collectionData = await collectionResponse.json();
        
        let allMovies = [];
        
        if (collectionData.parts && collectionData.parts.length > 0) {
          // Fetch detailed info for each movie
          const moviePromises = collectionData.parts.map(async (movie) => {
            try {
              const response = await fetch(
                `${BASE_URL}/movie/${movie.id}?api_key=${API_KEY}`
              );
              const data = await response.json();
              if (!data.id) return null;
              return data;
            } catch (error) {
              return null;
            }
          });
          
          const moviesData = await Promise.all(moviePromises);
          allMovies = moviesData.filter(m => m !== null);
        }
        
        // Also search for additional Transformers movies (Bumblebee, animated, etc.)
        const additionalSearchTerms = ["Transformers", "Bumblebee"];
        const additionalMoviePromises = additionalSearchTerms.map(async (term) => {
          try {
            const response = await fetch(
              `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(term)}&include_adult=false`
            );
            const data = await response.json();
            return data.results || [];
          } catch (error) {
            return [];
          }
        });
        
        const additionalResults = await Promise.all(additionalMoviePromises);
        const additionalMovies = additionalResults.flat().filter(movie => {
          const titleLower = movie.title.toLowerCase();
          return titleLower.includes('transformers') || titleLower === 'bumblebee';
        });
        
        // Merge and deduplicate movies
        const existingIds = new Set(allMovies.map(m => m.id));
        for (const movie of additionalMovies) {
          if (!existingIds.has(movie.id)) {
            allMovies.push(movie);
            existingIds.add(movie.id);
          }
        }
        
        const movies = allMovies.map((movie) => ({
          id: movie.id,
          title: movie.title,
          image: getImageUrl(movie.poster_path, "w342"),
          backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
          rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
          year: movie.release_date
            ? new Date(movie.release_date).getFullYear()
            : "N/A",
          type: "movie",
          overview: movie.overview,
        }));
        
        // Fetch Transformers TV shows
        const transformersTVShows = [
          "Transformers: Prime",
          "Transformers: Animated",
          "Transformers: Robots in Disguise",
          "Transformers: Cyberverse",
          "Transformers: War for Cybertron",
          "Transformers: EarthSpark",
          "Beast Wars: Transformers",
          "Transformers: Armada",
          "Transformers: Energon",
          "Transformers: Cybertron",
        ];
        
        const tvSearchPromises = transformersTVShows.map(async (showName) => {
          try {
            const searchResponse = await fetch(
              `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(showName)}&include_adult=false`
            );
            const searchData = await searchResponse.json();
            const show = searchData.results?.[0];
            if (!show) return null;
            
            // Verify it's actually a Transformers show
            const titleLower = show.name.toLowerCase();
            if (!titleLower.includes('transformers') && !titleLower.includes('beast wars')) {
              return null;
            }
            
            return show;
          } catch (error) {
            return null;
          }
        });
        
        const tvSearchResults = await Promise.all(tvSearchPromises);
        const validTVShows = tvSearchResults.filter(s => s !== null);
        
        // Remove duplicate TV shows
        const uniqueTVIds = new Set();
        const uniqueTVShows = validTVShows.filter(show => {
          if (uniqueTVIds.has(show.id)) return false;
          uniqueTVIds.add(show.id);
          return true;
        });
        
        const tvShows = uniqueTVShows.map((show) => ({
          id: show.id,
          title: show.name,
          image: getImageUrl(show.poster_path, "w342"),
          backdrop: getBackdropUrl(show.backdrop_path, "w780"),
          rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
          year: show.first_air_date
            ? new Date(show.first_air_date).getFullYear()
            : "N/A",
          type: "tv",
          overview: show.overview,
        }));
        
        // Sort movies and TV shows by year
        const sortedMovies = movies.sort((a, b) => (a.year || 0) - (b.year || 0));
        const sortedTVShows = tvShows.sort((a, b) => (a.year || 0) - (b.year || 0));
        
        return { movies: sortedMovies, tvShows: sortedTVShows };
      } catch (error) {
        console.error("Error fetching Transformers collection:", error);
        return { movies: [], tvShows: [] };
      }
    }

    // Special handling for Star Wars - fetch collections
    if (franchise === "Star Wars") {
      // Search for all Star Wars collections
      const searchTerms = ["Star Wars"];

      const collectionSearchPromises = searchTerms.map(async (term) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/collection?api_key=${API_KEY}&query=${encodeURIComponent(
              term
            )}&include_adult=false`
          );
          const data = await response.json();
          return data.results || [];
        } catch (error) {
          console.error(`Error searching collections for ${term}:`, error);
          return [];
        }
      });

      const collectionSearchResults = await Promise.all(
        collectionSearchPromises
      );
      const foundCollections = collectionSearchResults.flat();

      // Remove duplicate collections
      const uniqueCollectionIds = [
        ...new Set(foundCollections.map((c) => c.id)),
      ];

      const collectionPromises = uniqueCollectionIds.map(
        async (collectionId) => {
          try {
            const response = await fetch(
              `${BASE_URL}/collection/${collectionId}?api_key=${API_KEY}`
            );
            const data = await response.json();
            return data.parts || [];
          } catch (error) {
            console.error(`Error fetching collection ${collectionId}:`, error);
            return [];
          }
        }
      );

      // Star Wars TV Shows
      const starWarsTVShows = [
        "The Mandalorian",
        "The Book of Boba Fett",
        "Obi-Wan Kenobi",
        "Andor",
        "Ahsoka",
        "The Bad Batch",
        "Star Wars: The Clone Wars",
        "Star Wars Rebels",
        "Star Wars Resistance",
        "Tales of the Jedi",
        "Star Wars: Visions",
        "The Acolyte",
        "Skeleton Crew",
      ];

      // Fetch TV shows with credits to filter out Timothée Chalamet
      const tvSearchPromises = starWarsTVShows.map(async (showName) => {
        try {
          const searchResponse = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(
              showName
            )}&include_adult=false`
          );
          const searchData = await searchResponse.json();
          const show = searchData.results?.[0];
          if (!show) return null;
          
          // Fetch credits to check for Timothée Chalamet
          const creditsResponse = await fetch(
            `${BASE_URL}/tv/${show.id}/credits?api_key=${API_KEY}`
          );
          const creditsData = await creditsResponse.json();
          const castNames = creditsData.cast?.map(c => c.name.toLowerCase()) || [];
          
          // Block content with Timothée Chalamet
          const hasTimotheeChalamet = castNames.some(name => 
            name.includes('timothee chalamet') || name.includes('timothée chalamet')
          );
          if (hasTimotheeChalamet) return null;
          
          return show;
        } catch (error) {
          console.error(`Error searching TV show ${showName}:`, error);
          return null;
        }
      });

      const collectionsData = await Promise.all(collectionPromises);
      const tvSearchResults = await Promise.all(tvSearchPromises);
      const collectionMovies = collectionsData.flat();

      // Fetch movie credits to filter out Timothée Chalamet
      const movieCreditsPromises = collectionMovies.map(async (movie) => {
        try {
          const creditsResponse = await fetch(
            `${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}`
          );
          const creditsData = await creditsResponse.json();
          const castNames = creditsData.cast?.map(c => c.name.toLowerCase()) || [];
          
          // Block content with Timothée Chalamet
          const hasTimotheeChalamet = castNames.some(name => 
            name.includes('timothee chalamet') || name.includes('timothée chalamet')
          );
          if (hasTimotheeChalamet) return null;
          
          return movie;
        } catch (error) {
          return movie; // Keep movie if credits fetch fails
        }
      });

      const filteredCollectionMovies = (await Promise.all(movieCreditsPromises)).filter(m => m !== null);

      // Also fetch general Star Wars content
      const moviePromises = [];
      for (let page = 1; page <= 3; page++) {
        const movieParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.movies || {}),
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 3; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.tv || {}),
        });
        tvPromises.push(fetch(`${BASE_URL}/discover/tv?${tvParams}`));
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises),
      ]);

      const movieDataList = await Promise.all(
        movieResponses.map((res) => res.json())
      );
      const tvDataList = await Promise.all(
        tvResponses.map((res) => res.json())
      );

      const allMovieResults = movieDataList.flatMap(
        (data) => data.results || []
      );
      const allTVResults = tvDataList.flatMap((data) => data.results || []);

      // Filter discover movies for Timothée Chalamet
      const discoverMovieCreditsPromises = allMovieResults.map(async (movie) => {
        try {
          const creditsResponse = await fetch(
            `${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}`
          );
          const creditsData = await creditsResponse.json();
          const castNames = creditsData.cast?.map(c => c.name.toLowerCase()) || [];
          
          const hasTimotheeChalamet = castNames.some(name => 
            name.includes('timothee chalamet') || name.includes('timothée chalamet')
          );
          if (hasTimotheeChalamet) return null;
          
          return movie;
        } catch (error) {
          return movie;
        }
      });

      // Filter discover TV shows for Timothée Chalamet
      const discoverTVCreditsPromises = allTVResults.map(async (show) => {
        try {
          const creditsResponse = await fetch(
            `${BASE_URL}/tv/${show.id}/credits?api_key=${API_KEY}`
          );
          const creditsData = await creditsResponse.json();
          const castNames = creditsData.cast?.map(c => c.name.toLowerCase()) || [];
          
          const hasTimotheeChalamet = castNames.some(name => 
            name.includes('timothee chalamet') || name.includes('timothée chalamet')
          );
          if (hasTimotheeChalamet) return null;
          
          return show;
        } catch (error) {
          return show;
        }
      });

      const filteredDiscoverMovies = (await Promise.all(discoverMovieCreditsPromises)).filter(m => m !== null);
      const filteredDiscoverTV = (await Promise.all(discoverTVCreditsPromises)).filter(s => s !== null);

      const allMovies = [...filteredCollectionMovies, ...filteredDiscoverMovies];
      const uniqueMovies = Array.from(
        new Map(allMovies.map((movie) => [movie.id, movie])).values()
      );

      const searchedTVShows = tvSearchResults.filter((show) => show !== null);
      const allTVShows = [...searchedTVShows, ...filteredDiscoverTV];
      const uniqueTVShows = Array.from(
        new Map(allTVShows.map((show) => [show.id, show])).values()
      );

      const movies = uniqueMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const tvShows = uniqueTVShows.map((show) => ({
        id: show.id,
        title: show.name || show.title,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));

      return { movies, tvShows };
    }

    // Special handling for DC - fetch collections
    if (franchise === "DC") {
      // Search for all DC collections
      const searchTerms = [
        "Batman",
        "Superman",
        "Wonder Woman",
        "Justice League",
        "Aquaman",
        "Flash",
        "Shazam",
        "Suicide Squad",
        "Harley Quinn",
        "Green Lantern",
        "Joker",
        "Dark Knight",
      ];

      const collectionSearchPromises = searchTerms.map(async (term) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/collection?api_key=${API_KEY}&query=${encodeURIComponent(
              term
            )}&include_adult=false`
          );
          const data = await response.json();
          return data.results || [];
        } catch (error) {
          console.error(`Error searching collections for ${term}:`, error);
          return [];
        }
      });

      const collectionSearchResults = await Promise.all(
        collectionSearchPromises
      );
      const foundCollections = collectionSearchResults.flat();

      // Remove duplicate collections
      const uniqueCollectionIds = [
        ...new Set(foundCollections.map((c) => c.id)),
      ];

      const collectionPromises = uniqueCollectionIds.map(
        async (collectionId) => {
          try {
            const response = await fetch(
              `${BASE_URL}/collection/${collectionId}?api_key=${API_KEY}`
            );
            const data = await response.json();
            return data.parts || [];
          } catch (error) {
            console.error(`Error fetching collection ${collectionId}:`, error);
            return [];
          }
        }
      );

      // DC TV Shows
      const dcTVShows = [
        "Arrow",
        "The Flash",
        "Supergirl",
        "Legends of Tomorrow",
        "Batwoman",
        "Black Lightning",
        "Superman & Lois",
        "Stargirl",
        "Gotham",
        "Titans",
        "Doom Patrol",
        "Peacemaker",
        "Pennyworth",
        "The Sandman",
        "Lucifer",
        "Constantine",
        "Swamp Thing",
        "Smallville",
        "Watchmen",
      ];

      const tvSearchPromises = dcTVShows.map(async (showName) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(
              showName
            )}&include_adult=false`
          );
          const data = await response.json();
          return data.results?.[0] || null;
        } catch (error) {
          console.error(`Error searching TV show ${showName}:`, error);
          return null;
        }
      });

      const collectionsData = await Promise.all(collectionPromises);
      const tvSearchResults = await Promise.all(tvSearchPromises);
      const collectionMovies = collectionsData.flat();

      // Also fetch general DC content
      const moviePromises = [];
      for (let page = 1; page <= 3; page++) {
        const movieParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.movies || {}),
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 3; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.tv || {}),
        });
        tvPromises.push(fetch(`${BASE_URL}/discover/tv?${tvParams}`));
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises),
      ]);

      const movieDataList = await Promise.all(
        movieResponses.map((res) => res.json())
      );
      const tvDataList = await Promise.all(
        tvResponses.map((res) => res.json())
      );

      const allMovieResults = movieDataList.flatMap(
        (data) => data.results || []
      );
      const allTVResults = tvDataList.flatMap((data) => data.results || []);

      const allMovies = [...collectionMovies, ...allMovieResults];
      const uniqueMovies = Array.from(
        new Map(allMovies.map((movie) => [movie.id, movie])).values()
      );

      const searchedTVShows = tvSearchResults.filter((show) => show !== null);
      const allTVShows = [...searchedTVShows, ...allTVResults];
      const uniqueTVShows = Array.from(
        new Map(allTVShows.map((show) => [show.id, show])).values()
      );

      const movies = uniqueMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const tvShows = uniqueTVShows.map((show) => ({
        id: show.id,
        title: show.name || show.title,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));

      return { movies, tvShows };
    }

    // Special handling for Disney - fetch collections
    if (franchise === "Disney" || franchise === "Disney+") {
      const searchTerms = [
        "Toy Story",
        "Frozen",
        "Lion King",
        "Aladdin",
        "Beauty and the Beast",
        "Pirates of the Caribbean",
        "Cars",
        "Incredibles",
        "Finding Nemo",
        "Monsters Inc",
        "Ralph",
        "Maleficent",
        "Descendants",
        "High School Musical",
        "Chronicles of Narnia",
        "Tron",
        "National Treasure",
        "Cinderella",
        "Sleeping Beauty",
        "Jungle Book",
        "Peter Pan",
        "101 Dalmatians",
        "Lady and the Tramp",
        "Bambi",
        "Dumbo",
        "Fantasia",
        "Snow White",
        "Alice in Wonderland",
        "Winnie the Pooh",
        "Pocahontas",
        "Mulan",
        "Hercules",
        "Tarzan",
        "Hunchback",
        "Atlantis",
        "Lilo & Stitch",
        "Treasure Planet",
        "Brother Bear",
        "Chicken Little",
        "Meet the Robinsons",
        "Bolt",
        "Tangled",
        "Wreck-It Ralph",
        "Big Hero 6",
        "Zootopia",
        "Moana",
        "Coco",
        "Raya",
        "Encanto",
        "Strange World",
        "Wish",
        "Inside Out",
        "Up",
        "WALL-E",
        "Ratatouille",
        "The Good Dinosaur",
        "Brave",
        "Onward",
        "Soul",
        "Luca",
        "Turning Red",
        "Lightyear",
        "Elemental",
        "A Bug's Life",
        "Princess and the Frog",
        "Fantasia 2000",
        "Emperor's New Groove",
      ];

      const collectionSearchPromises = searchTerms.map(async (term) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/collection?api_key=${API_KEY}&query=${encodeURIComponent(
              term
            )}&include_adult=false`
          );
          const data = await response.json();
          return data.results || [];
        } catch (error) {
          console.error(`Error searching collections for ${term}:`, error);
          return [];
        }
      });

      const collectionSearchResults = await Promise.all(
        collectionSearchPromises
      );
      const foundCollections = collectionSearchResults.flat();

      const uniqueCollectionIds = [
        ...new Set(foundCollections.map((c) => c.id)),
      ];

      const collectionPromises = uniqueCollectionIds.map(
        async (collectionId) => {
          try {
            const response = await fetch(
              `${BASE_URL}/collection/${collectionId}?api_key=${API_KEY}`
            );
            const data = await response.json();
            return data.parts || [];
          } catch (error) {
            console.error(`Error fetching collection ${collectionId}:`, error);
            return [];
          }
        }
      );

      // Disney TV Shows - Originals and Popular Shows
      const disneyTVShows = [
        "The Mandalorian",
        "WandaVision",
        "The Falcon and the Winter Soldier",
        "Loki",
        "Hawkeye",
        "Moon Knight",
        "Ms. Marvel",
        "She-Hulk",
        "Andor",
        "Ahsoka",
        "Percy Jackson and the Olympians",
        "The Muppets",
        "DuckTales",
        "Gravity Falls",
        "Phineas and Ferb",
        "Star vs. the Forces of Evil",
        "The Owl House",
        "Amphibia",
        "Big City Greens",
        "Kim Possible",
        "Recess",
        "Gargoyles",
        "Darkwing Duck",
        "Chip 'n Dale: Rescue Rangers",
        "TaleSpin",
        "Hannah Montana",
        "Lizzie McGuire",
        "That's So Raven",
        "The Suite Life of Zack & Cody",
        "High School Musical: The Musical: The Series",
        "Once Upon a Time",
        "Boy Meets World",
        "Girl Meets World",
        "Even Stevens",
        "The Proud Family",
      ];

      const tvSearchPromises = disneyTVShows.map(async (showName) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(
              showName
            )}&include_adult=false`
          );
          const data = await response.json();
          return data.results?.[0] || null;
        } catch (error) {
          console.error(`Error searching TV show ${showName}:`, error);
          return null;
        }
      });

      const collectionsData = await Promise.all(collectionPromises);
      const tvSearchResults = await Promise.all(tvSearchPromises);
      const collectionMovies = collectionsData.flat();

      const moviePromises = [];
      for (let page = 1; page <= 3; page++) {
        const movieParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.movies || {}),
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 3; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.tv || {}),
        });
        tvPromises.push(fetch(`${BASE_URL}/discover/tv?${tvParams}`));
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises),
      ]);

      const movieDataList = await Promise.all(
        movieResponses.map((res) => res.json())
      );
      const tvDataList = await Promise.all(
        tvResponses.map((res) => res.json())
      );

      const allMovieResults = movieDataList.flatMap(
        (data) => data.results || []
      );
      const allTVResults = tvDataList.flatMap((data) => data.results || []);

      const allMovies = [...collectionMovies, ...allMovieResults];
      const uniqueMovies = Array.from(
        new Map(allMovies.map((movie) => [movie.id, movie])).values()
      );

      const searchedTVShows = tvSearchResults.filter((show) => show !== null);
      const allTVShows = [...searchedTVShows, ...allTVResults];
      const uniqueTVShows = Array.from(
        new Map(allTVShows.map((show) => [show.id, show])).values()
      );

      const movies = uniqueMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const tvShows = uniqueTVShows.map((show) => ({
        id: show.id,
        title: show.name || show.title,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));

      return { movies, tvShows };
    }

    // Special handling for Anime - fetch collections
    if (franchise === "Anime") {
      const searchTerms = [
        "Naruto",
        "Dragon Ball",
        "One Piece",
        "Attack on Titan",
        "Death Note",
        "My Hero Academia",
        "Demon Slayer",
        "Fullmetal Alchemist",
        "Sword Art Online",
        "Tokyo Ghoul",
        "Bleach",
        "Hunter x Hunter",
        "Cowboy Bebop",
        "Steins Gate",
        "Pokemon",
        "Digimon",
        "Sailor Moon",
        "Studio Ghibli",
        "Evangelion",
        "Akira",
        "Ghost in the Shell",
        "Neon Genesis Evangelion",
        "Code Geass",
        "Fate",
        "Jujutsu Kaisen",
        "Chainsaw Man",
        "Spy x Family",
        "Tokyo Revengers",
        "Vinland Saga",
        "Mob Psycho 100",
        "One Punch Man",
        "JoJo's Bizarre Adventure",
        "Made in Abyss",
        "The Promised Neverland",
        "Fire Force",
        "Dr. Stone",
        "Black Clover",
        "That Time I Got Reincarnated as a Slime",
        "Re:Zero",
        "Overlord",
        "Konosuba",
        "No Game No Life",
        "Rising of the Shield Hero",
        "Goblin Slayer",
        "Berserk",
        "Parasyte",
        "Erased",
        "Your Name",
        "Weathering with You",
        "A Silent Voice",
        "Spirited Away",
        "Howl's Moving Castle",
        "Princess Mononoke",
        "My Neighbor Totoro",
        "Kiki's Delivery Service",
        "Castle in the Sky",
        "Ponyo",
        "The Wind Rises",
        "Grave of the Fireflies",
        "Yu-Gi-Oh",
        "Inuyasha",
        "Rurouni Kenshin",
        "One Piece Film",
        "Dragon Ball Super",
        "Boruto",
      ];

      const collectionSearchPromises = searchTerms.map(async (term) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/collection?api_key=${API_KEY}&query=${encodeURIComponent(
              term
            )}&include_adult=false`
          );
          const data = await response.json();
          return data.results || [];
        } catch (error) {
          console.error(`Error searching collections for ${term}:`, error);
          return [];
        }
      });

      const collectionSearchResults = await Promise.all(
        collectionSearchPromises
      );
      const foundCollections = collectionSearchResults.flat();

      const uniqueCollectionIds = [
        ...new Set(foundCollections.map((c) => c.id)),
      ];

      const collectionPromises = uniqueCollectionIds.map(
        async (collectionId) => {
          try {
            const response = await fetch(
              `${BASE_URL}/collection/${collectionId}?api_key=${API_KEY}`
            );
            const data = await response.json();
            return data.parts || [];
          } catch (error) {
            console.error(`Error fetching collection ${collectionId}:`, error);
            return [];
          }
        }
      );

      // Anime TV Shows - Popular Anime Series
      const animeTVShows = [
        "Naruto",
        "Naruto Shippuden",
        "Boruto: Naruto Next Generations",
        "Dragon Ball",
        "Dragon Ball Z",
        "Dragon Ball Super",
        "One Piece",
        "Attack on Titan",
        "Death Note",
        "My Hero Academia",
        "Demon Slayer: Kimetsu no Yaiba",
        "Fullmetal Alchemist: Brotherhood",
        "Sword Art Online",
        "Tokyo Ghoul",
        "Bleach",
        "Hunter x Hunter",
        "Cowboy Bebop",
        "Steins;Gate",
        "Code Geass",
        "Neon Genesis Evangelion",
        "Jujutsu Kaisen",
        "Chainsaw Man",
        "Spy x Family",
        "Tokyo Revengers",
        "Vinland Saga",
        "Mob Psycho 100",
        "One Punch Man",
        "JoJo's Bizarre Adventure",
        "Made in Abyss",
        "The Promised Neverland",
        "Fire Force",
        "Dr. Stone",
        "Black Clover",
        "That Time I Got Reincarnated as a Slime",
        "Re:ZERO -Starting Life in Another World-",
        "Overlord",
        "KonoSuba: God's Blessing on This Wonderful World!",
        "No Game No Life",
        "The Rising of the Shield Hero",
        "Goblin Slayer",
        "Berserk",
        "Parasyte: The Maxim",
        "Erased",
        "Fate/stay night",
        "Fate/Zero",
        "Yu Yu Hakusho",
        "Inuyasha",
        "Rurouni Kenshin",
        "Yu-Gi-Oh!",
        "Sailor Moon",
        "Cardcaptor Sakura",
        "Fruits Basket",
        "Clannad",
        "Angel Beats!",
        "Your Lie in April",
        "Violet Evergarden",
        "A Place Further Than The Universe",
        "Haikyu!!",
        "Kuroko's Basketball",
        "Food Wars! Shokugeki no Soma",
        "The Quintessential Quintuplets",
        "Kaguya-sama: Love is War",
        "Horimiya",
        "My Dress-Up Darling",
      ];

      const tvSearchPromises = animeTVShows.map(async (showName) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(
              showName
            )}&include_adult=false`
          );
          const data = await response.json();
          return data.results?.[0] || null;
        } catch (error) {
          console.error(`Error searching TV show ${showName}:`, error);
          return null;
        }
      });

      const collectionsData = await Promise.all(collectionPromises);
      const tvSearchResults = await Promise.all(tvSearchPromises);
      const collectionMovies = collectionsData.flat();

      const moviePromises = [];
      for (let page = 1; page <= 3; page++) {
        const movieParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.movies || {}),
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 3; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.tv || {}),
        });
        tvPromises.push(fetch(`${BASE_URL}/discover/tv?${tvParams}`));
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises),
      ]);

      const movieDataList = await Promise.all(
        movieResponses.map((res) => res.json())
      );
      const tvDataList = await Promise.all(
        tvResponses.map((res) => res.json())
      );

      const allMovieResults = movieDataList.flatMap(
        (data) => data.results || []
      );
      const allTVResults = tvDataList.flatMap((data) => data.results || []);

      const allMovies = [...collectionMovies, ...allMovieResults];
      const uniqueMovies = Array.from(
        new Map(allMovies.map((movie) => [movie.id, movie])).values()
      );

      const searchedTVShows = tvSearchResults.filter((show) => show !== null);
      const allTVShows = [...searchedTVShows, ...allTVResults];
      const uniqueTVShows = Array.from(
        new Map(allTVShows.map((show) => [show.id, show])).values()
      );

      const movies = uniqueMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const tvShows = uniqueTVShows.map((show) => ({
        id: show.id,
        title: show.name || show.title,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));

      return { movies, tvShows };
    }

    // Special handling for Hulu - fetch collections
    if (franchise === "Hulu") {
      const searchTerms = [
        "Predator",
        "Alien",
        "Die Hard",
        "X-Men",
        "Kingsman",
        "Planet of the Apes",
        "Ice Age",
        "Night at the Museum",
        "Maze Runner",
        "Taken",
        "Home Alone",
        "Alvin and the Chipmunks",
        "Rio",
        "Fantastic Four",
        "Avatar",
      ];

      const collectionSearchPromises = searchTerms.map(async (term) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/collection?api_key=${API_KEY}&query=${encodeURIComponent(
              term
            )}&include_adult=false`
          );
          const data = await response.json();
          return data.results || [];
        } catch (error) {
          console.error(`Error searching collections for ${term}:`, error);
          return [];
        }
      });

      const collectionSearchResults = await Promise.all(
        collectionSearchPromises
      );
      const foundCollections = collectionSearchResults.flat();

      const uniqueCollectionIds = [
        ...new Set(foundCollections.map((c) => c.id)),
      ];

      const collectionPromises = uniqueCollectionIds.map(
        async (collectionId) => {
          try {
            const response = await fetch(
              `${BASE_URL}/collection/${collectionId}?api_key=${API_KEY}`
            );
            const data = await response.json();
            return data.parts || [];
          } catch (error) {
            console.error(`Error fetching collection ${collectionId}:`, error);
            return [];
          }
        }
      );

      // Hulu TV Shows - Originals and Popular Shows
      const huluTVShows = [
        "The Handmaid's Tale",
        "Only Murders in the Building",
        "The Bear",
        "Reservation Dogs",
        "Little Fires Everywhere",
        "Castle Rock",
        "Catch-22",
        "Dopesick",
        "Pam & Tommy",
        "The Dropout",
        "Under the Banner of Heaven",
        "Welcome to Chippendales",
        "Fleishman Is in Trouble",
        "The Act",
        "Ramy",
        "PEN15",
        "Shrill",
        "The Great",
        "Letterkenny",
        "Futurama",
        "Family Guy",
        "Bob's Burgers",
        "Solar Opposites",
        "American Dad",
        "How I Met Your Mother",
        "Brooklyn Nine-Nine",
        "This Is Us",
        "Grey's Anatomy",
        "The X-Files",
        "Buffy the Vampire Slayer",
      ];

      const tvSearchPromises = huluTVShows.map(async (showName) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(
              showName
            )}&include_adult=false`
          );
          const data = await response.json();
          return data.results?.[0] || null;
        } catch (error) {
          console.error(`Error searching TV show ${showName}:`, error);
          return null;
        }
      });

      const collectionsData = await Promise.all(collectionPromises);
      const tvSearchResults = await Promise.all(tvSearchPromises);
      const collectionMovies = collectionsData.flat();

      const moviePromises = [];
      for (let page = 1; page <= 2; page++) {
        const movieParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.movies || {}),
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 2; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.tv || {}),
        });
        tvPromises.push(fetch(`${BASE_URL}/discover/tv?${tvParams}`));
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises),
      ]);

      const movieDataList = await Promise.all(
        movieResponses.map((res) => res.json())
      );
      const tvDataList = await Promise.all(
        tvResponses.map((res) => res.json())
      );

      const allMovieResults = movieDataList.flatMap(
        (data) => data.results || []
      );
      const allTVResults = tvDataList.flatMap((data) => data.results || []);

      const allMovies = [...collectionMovies, ...allMovieResults];
      const uniqueMovies = Array.from(
        new Map(allMovies.map((movie) => [movie.id, movie])).values()
      );

      const searchedTVShows = tvSearchResults.filter((show) => show !== null);
      const allTVShows = [...searchedTVShows, ...allTVResults];
      const uniqueTVShows = Array.from(
        new Map(allTVShows.map((show) => [show.id, show])).values()
      );

      const movies = uniqueMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const tvShows = uniqueTVShows.map((show) => ({
        id: show.id,
        title: show.name || show.title,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));

      return { movies, tvShows };
    }

    // Special handling for HBO Max - fetch collections
    if (franchise === "HBO Max" || franchise === "Max") {
      const searchTerms = [
        "Harry Potter",
        "Lord of the Rings",
        "Hobbit",
        "Matrix",
        "Batman",
        "Superman",
        "Conjuring",
        "DC",
        "Game of Thrones",
        "Dune",
        "Mad Max",
        "Godzilla",
        "King Kong",
      ];

      const collectionSearchPromises = searchTerms.map(async (term) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/collection?api_key=${API_KEY}&query=${encodeURIComponent(
              term
            )}&include_adult=false`
          );
          const data = await response.json();
          return data.results || [];
        } catch (error) {
          console.error(`Error searching collections for ${term}:`, error);
          return [];
        }
      });

      const collectionSearchResults = await Promise.all(
        collectionSearchPromises
      );
      const foundCollections = collectionSearchResults.flat();

      const uniqueCollectionIds = [
        ...new Set(foundCollections.map((c) => c.id)),
      ];

      const collectionPromises = uniqueCollectionIds.map(
        async (collectionId) => {
          try {
            const response = await fetch(
              `${BASE_URL}/collection/${collectionId}?api_key=${API_KEY}`
            );
            const data = await response.json();
            return data.parts || [];
          } catch (error) {
            console.error(`Error fetching collection ${collectionId}:`, error);
            return [];
          }
        }
      );

      const collectionsData = await Promise.all(collectionPromises);
      const collectionMovies = collectionsData.flat();

      const moviePromises = [];
      for (let page = 1; page <= 3; page++) {
        const movieParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.movies || {}),
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 3; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
          ...(config?.tv || {}),
        });
        tvPromises.push(fetch(`${BASE_URL}/discover/tv?${tvParams}`));
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises),
      ]);

      const movieDataList = await Promise.all(
        movieResponses.map((res) => res.json())
      );
      const tvDataList = await Promise.all(
        tvResponses.map((res) => res.json())
      );

      const allMovieResults = movieDataList.flatMap(
        (data) => data.results || []
      );
      const allTVResults = tvDataList.flatMap((data) => data.results || []);

      const allMovies = [...collectionMovies, ...allMovieResults];
      const uniqueMovies = Array.from(
        new Map(allMovies.map((movie) => [movie.id, movie])).values()
      );
      const uniqueTVShows = Array.from(
        new Map(allTVResults.map((show) => [show.id, show])).values()
      );

      const movies = uniqueMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const tvShows = uniqueTVShows.map((show) => ({
        id: show.id,
        title: show.name || show.title,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));

      return { movies, tvShows };
    }

    // Special handling for Prime Video - fetch collections
    if (franchise === "Prime Video" || franchise === "Amazon Prime") {
      const searchTerms = [
        "Jack Ryan",
        "Lord of the Rings",
        "Bosch",
        "Reacher",
        "The Boys",
        "Expanse",
        "Marvelous Mrs Maisel",
        "Rings of Power",
        "Wheel of Time",
        "Jack Reacher",
        "James Bond",
        "Mission Impossible",
      ];

      const collectionSearchPromises = searchTerms.map(async (term) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/collection?api_key=${API_KEY}&query=${encodeURIComponent(
              term
            )}&include_adult=false`
          );
          const data = await response.json();
          return data.results || [];
        } catch (error) {
          console.error(`Error searching collections for ${term}:`, error);
          return [];
        }
      });

      const collectionSearchResults = await Promise.all(
        collectionSearchPromises
      );
      const foundCollections = collectionSearchResults.flat();

      const uniqueCollectionIds = [
        ...new Set(foundCollections.map((c) => c.id)),
      ];

      const collectionPromises = uniqueCollectionIds.map(
        async (collectionId) => {
          try {
            const response = await fetch(
              `${BASE_URL}/collection/${collectionId}?api_key=${API_KEY}`
            );
            const data = await response.json();
            return data.parts || [];
          } catch (error) {
            console.error(`Error fetching collection ${collectionId}:`, error);
            return [];
          }
        }
      );

      const collectionsData = await Promise.all(collectionPromises);
      const collectionMovies = collectionsData.flat();

      // For Prime Video, fetch popular content since TMDB doesn't have specific Prime network filters
      const moviePromises = [];
      for (let page = 1; page <= 2; page++) {
        const movieParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
        });
        moviePromises.push(fetch(`${BASE_URL}/movie/popular?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 2; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          include_adult: "false",
        });
        tvPromises.push(fetch(`${BASE_URL}/tv/popular?${tvParams}`));
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises),
      ]);

      const movieDataList = await Promise.all(
        movieResponses.map((res) => res.json())
      );
      const tvDataList = await Promise.all(
        tvResponses.map((res) => res.json())
      );

      const allMovieResults = movieDataList.flatMap(
        (data) => data.results || []
      );
      const allTVResults = tvDataList.flatMap((data) => data.results || []);

      const allMovies = [...collectionMovies, ...allMovieResults];
      const uniqueMovies = Array.from(
        new Map(allMovies.map((movie) => [movie.id, movie])).values()
      );
      const uniqueTVShows = Array.from(
        new Map(allTVResults.map((show) => [show.id, show])).values()
      );

      const movies = uniqueMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : "N/A",
        type: "movie",
        overview: movie.overview,
      }));

      const tvShows = uniqueTVShows.map((show) => ({
        id: show.id,
        title: show.name || show.title,
        image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));

      return { movies, tvShows };
    }

    // For Marvel, fetch multiple pages to get more content
    const pagesToFetch = franchise === "Marvel" ? 5 : 1;

    // Fetch movies from multiple pages
    const moviePromises = [];
    for (let page = 1; page <= pagesToFetch; page++) {
      const movieParams = new URLSearchParams({
        api_key: API_KEY,
        page: page,
        sort_by: "popularity.desc",
        include_adult: "false",
        ...(config?.movies || {}),
      });
      moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
    }

    // Fetch TV shows from multiple pages
    const tvPromises = [];
    for (let page = 1; page <= pagesToFetch; page++) {
      const tvParams = new URLSearchParams({
        api_key: API_KEY,
        page: page,
        sort_by: "popularity.desc",
        include_adult: "false",
        ...(config?.tv || {}),
      });
      tvPromises.push(fetch(`${BASE_URL}/discover/tv?${tvParams}`));
    }

    const [movieResponses, tvResponses] = await Promise.all([
      Promise.all(moviePromises),
      Promise.all(tvPromises),
    ]);

    const movieDataList = await Promise.all(
      movieResponses.map((res) => res.json())
    );
    const tvDataList = await Promise.all(tvResponses.map((res) => res.json()));

    const allMovieResults = movieDataList.flatMap((data) => data.results || []);
    const allTVResults = tvDataList.flatMap((data) => data.results || []);

    const movies = allMovieResults.map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w342"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "N/A",
      type: "movie",
      overview: movie.overview,
    }));

    const tvShows = allTVResults.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w342"),
      backdrop: getBackdropUrl(show.backdrop_path, "w780"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
    }));

    return { movies, tvShows };
  } catch (error) {
    console.error(
      "Error fetching franchise content franchise:",
      franchise,
      error
    );
    return { movies: [], tvShows: [] };
  }
};


// ===== NEW HOME PAGE FEATURES =====

// Fetch Top 10 trending this week (for numbered Top 10 section)
export const fetchTop10ThisWeek = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/all/week?api_key=${API_KEY}`
    );
    const data = await response.json();
    return data.results.slice(0, 10).map((item, index) => ({
      id: item.id,
      title: item.title || item.name,
      image: getImageUrl(item.poster_path, "w342"),
      backdrop: getBackdropUrl(item.backdrop_path, "w780"),
      rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
      year: item.release_date
        ? new Date(item.release_date).getFullYear()
        : item.first_air_date
          ? new Date(item.first_air_date).getFullYear()
          : "N/A",
      type: item.media_type,
      overview: item.overview,
      rank: index + 1,
    }));
  } catch (error) {
    console.error("Error fetching top 10:", error);
    return [];
  }
};

// Fetch content with trailers for Stories section
export const fetchNewWithTrailers = async () => {
  try {
    // Get recently released movies and TV shows
    const today = new Date();
    const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
    const dateFrom = twoWeeksAgo.toISOString().split('T')[0];
    const dateTo = today.toISOString().split('T')[0];

    const [moviesResponse, tvResponse] = await Promise.all([
      fetch(
        `${BASE_URL}/discover/movie?api_key=${API_KEY}&primary_release_date.gte=${dateFrom}&primary_release_date.lte=${dateTo}&sort_by=popularity.desc`
      ),
      fetch(
        `${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&page=1`
      ),
    ]);

    const [moviesData, tvData] = await Promise.all([
      moviesResponse.json(),
      tvResponse.json(),
    ]);

    // Combine and get top items
    const combined = [
      ...moviesData.results.slice(0, 8).map(m => ({ ...m, media_type: 'movie' })),
      ...tvData.results.slice(0, 8).map(t => ({ ...t, media_type: 'tv' })),
    ];

    // Fetch trailers for each item
    const itemsWithTrailers = await Promise.all(
      combined.slice(0, 12).map(async (item) => {
        try {
          const videoResponse = await fetch(
            `${BASE_URL}/${item.media_type}/${item.id}/videos?api_key=${API_KEY}`
          );
          const videoData = await videoResponse.json();
          const trailer = videoData.results?.find(
            (v) => v.type === "Trailer" && v.site === "YouTube"
          ) || videoData.results?.find(
            (v) => v.type === "Teaser" && v.site === "YouTube"
          ) || videoData.results?.[0];

          return {
            id: item.id,
            title: item.title || item.name,
            image: getImageUrl(item.poster_path, "w342"),
            backdrop: getBackdropUrl(item.backdrop_path, "w780"),
            rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
            year: item.release_date
              ? new Date(item.release_date).getFullYear()
              : item.first_air_date
                ? new Date(item.first_air_date).getFullYear()
                : "N/A",
            type: item.media_type,
            overview: item.overview,
            trailerKey: trailer?.key || null,
          };
        } catch (e) {
          return {
            id: item.id,
            title: item.title || item.name,
            image: getImageUrl(item.poster_path, "w342"),
            backdrop: getBackdropUrl(item.backdrop_path, "w780"),
            rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
            year: item.release_date
              ? new Date(item.release_date).getFullYear()
              : item.first_air_date
                ? new Date(item.first_air_date).getFullYear()
                : "N/A",
            type: item.media_type,
            overview: item.overview,
            trailerKey: null,
          };
        }
      })
    );

    // Filter to only items with trailers
    return itemsWithTrailers.filter(item => item.trailerKey);
  } catch (error) {
    console.error("Error fetching new with trailers:", error);
    return [];
  }
};

// Fetch two featured titles for split hero (excludes Top 10 items)
export const fetchSplitHeroTitles = async (excludeIds = []) => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/all/week?api_key=${API_KEY}`
    );
    const data = await response.json();

    // Filter out items that are in the Top 10 (excludeIds)
    const filteredResults = data.results.filter(
      (item) => !excludeIds.includes(item.id)
    );

    // Use week number to determine which items to show (rotates weekly)
    const weekNumber = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const startIndex = (weekNumber % 5) * 2; // Rotates through available items

    const items = filteredResults.slice(startIndex, startIndex + 2);

    // If not enough items after filtering, take from the beginning
    const finalItems = items.length >= 2 ? items : filteredResults.slice(0, 2);

    return finalItems.map((item) => ({
      id: item.id,
      title: item.title || item.name,
      image: getImageUrl(item.poster_path, "w342"),
      backdrop: getBackdropUrl(item.backdrop_path, "w780"),
      rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
      year: item.release_date
        ? new Date(item.release_date).getFullYear()
        : item.first_air_date
          ? new Date(item.first_air_date).getFullYear()
          : "N/A",
      type: item.media_type,
      overview: item.overview,
    }));
  } catch (error) {
    console.error("Error fetching split hero titles:", error);
    return [];
  }
};

// Fetch a random movie or TV show for "Surprise Me" feature
export const fetchRandomPick = async () => {
  try {
    // Randomly decide between movie or TV show
    const isMovie = Math.random() > 0.5;
    const randomPage = Math.floor(Math.random() * 20) + 1; // Random page 1-20

    const endpoint = isMovie
      ? `${BASE_URL}/discover/movie?api_key=${API_KEY}&page=${randomPage}&sort_by=popularity.desc&vote_count.gte=100&vote_average.gte=6`
      : `${BASE_URL}/discover/tv?api_key=${API_KEY}&page=${randomPage}&sort_by=popularity.desc&vote_count.gte=100&vote_average.gte=6`;

    const response = await fetch(endpoint);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      // Fallback to trending if discover fails
      const trendingResponse = await fetch(
        `${BASE_URL}/trending/all/week?api_key=${API_KEY}`
      );
      const trendingData = await trendingResponse.json();
      const randomIndex = Math.floor(Math.random() * trendingData.results.length);
      const item = trendingData.results[randomIndex];
      
      return {
        id: item.id,
        title: item.title || item.name,
        image: getImageUrl(item.poster_path, "w342"),
        backdrop: getBackdropUrl(item.backdrop_path, "w780"),
        rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
        year: item.release_date
          ? new Date(item.release_date).getFullYear()
          : item.first_air_date
            ? new Date(item.first_air_date).getFullYear()
            : "N/A",
        type: item.media_type,
        overview: item.overview,
      };
    }

    // Pick a random item from results
    const randomIndex = Math.floor(Math.random() * data.results.length);
    const item = data.results[randomIndex];

    return {
      id: item.id,
      title: item.title || item.name,
      image: getImageUrl(item.poster_path, "w342"),
      backdrop: getBackdropUrl(item.backdrop_path, "w780"),
      rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
      year: item.release_date
        ? new Date(item.release_date).getFullYear()
        : item.first_air_date
          ? new Date(item.first_air_date).getFullYear()
          : "N/A",
      type: isMovie ? "movie" : "tv",
      overview: item.overview,
    };
  } catch (error) {
    console.error("Error fetching random pick:", error);
    return null;
  }
};


// Fetch TV shows with upcoming episode information for Stories section
// Strictly shows episodes airing within the next 7 days
export const fetchUpcomingEpisodes = async () => {
  try {
    // Get TV shows that are currently airing - fetch multiple pages for better coverage
    const [page1Response, page2Response] = await Promise.all([
      fetch(`${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&page=1`),
      fetch(`${BASE_URL}/tv/on_the_air?api_key=${API_KEY}&page=2`),
    ]);
    
    const [page1Data, page2Data] = await Promise.all([
      page1Response.json(),
      page2Response.json(),
    ]);

    const allShows = [...(page1Data.results || []), ...(page2Data.results || [])];

    // Get today's date at midnight for accurate comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate date 7 days from now
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    // Get detailed info for each show including next episode
    const showsWithEpisodes = await Promise.all(
      allShows.slice(0, 30).map(async (show) => {
        try {
          const detailResponse = await fetch(
            `${BASE_URL}/tv/${show.id}?api_key=${API_KEY}`
          );
          const detail = await detailResponse.json();

          const nextEpisode = detail.next_episode_to_air;

          // Only include shows with confirmed upcoming episodes
          if (!nextEpisode || !nextEpisode.air_date) return null;

          const airDate = new Date(nextEpisode.air_date);
          airDate.setHours(0, 0, 0, 0);
          
          // Strictly filter: only episodes airing today through 7 days from now
          if (airDate < today || airDate > oneWeekFromNow) return null;

          // Format as actual date: "Jan 15"
          const airDateText = airDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

          const episodeInfo = `S${String(nextEpisode.season_number).padStart(2, '0')}E${String(nextEpisode.episode_number).padStart(2, '0')}`;

          return {
            id: show.id,
            title: show.name,
            image: getImageUrl(show.poster_path, "w342"),
            backdrop: getBackdropUrl(show.backdrop_path, "w780"),
            rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
            year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
            type: "tv",
            overview: nextEpisode.overview || show.overview,
            airDateText,
            airDateRaw: nextEpisode.air_date, // For sorting
            episodeInfo,
            episodeName: nextEpisode.name || '',
            status: detail.status,
          };
        } catch (e) {
          return null;
        }
      })
    );

    // Filter out nulls and sort by air date (soonest first)
    return showsWithEpisodes
      .filter(show => show !== null)
      .sort((a, b) => new Date(a.airDateRaw) - new Date(b.airDateRaw))
      .slice(0, 15); // Limit to 15 shows
  } catch (error) {
    console.error("Error fetching upcoming episodes:", error);
    return [];
  }
};

// Franchise-specific validation rules
const FRANCHISE_VALIDATORS = {
  Marvel: {
    companyIds: [420, 7505, 176762], // Marvel Studios, Marvel Entertainment, Marvel Television
    keywords: ['marvel', 'avengers', 'x-men', 'spider-man', 'iron man', 'thor', 'hulk', 'captain america', 'guardians of the galaxy', 'black panther', 'ant-man', 'doctor strange', 'deadpool', 'wolverine', 'fantastic four', 'daredevil', 'punisher', 'jessica jones', 'luke cage', 'iron fist'],
    excludeKeywords: ['parody', 'xxx', 'porn', 'adult', 'hentai', 'erotic', 'sexy', 'nude', 'naked', 'sex'],
  },
  "Star Wars": {
    companyIds: [1, 4171], // Lucasfilm, Lucasfilm Animation
    keywords: ['star wars', 'jedi', 'sith', 'skywalker', 'mandalorian', 'clone wars', 'rebels', 'force awakens', 'last jedi', 'rise of skywalker', 'rogue one', 'solo', 'andor', 'ahsoka', 'obi-wan', 'boba fett'],
    excludeKeywords: ['parody', 'xxx', 'porn', 'adult', 'hentai', 'erotic', 'sexy', 'nude', 'naked', 'sex'],
  },
  DC: {
    companyIds: [429, 9993, 128064], // DC Entertainment, DC Comics, DC Studios
    keywords: ['batman', 'superman', 'wonder woman', 'justice league', 'aquaman', 'flash', 'shazam', 'suicide squad', 'harley quinn', 'joker', 'green lantern', 'dark knight', 'gotham', 'titans', 'doom patrol', 'peacemaker', 'sandman', 'constantine', 'swamp thing', 'watchmen'],
    excludeKeywords: ['parody', 'xxx', 'porn', 'adult', 'hentai', 'erotic', 'sexy', 'nude', 'naked', 'sex'],
  },
  Disney: {
    companyIds: [2, 3, 6125], // Walt Disney Pictures, Pixar, Walt Disney Animation Studios
    keywords: ['disney', 'pixar', 'frozen', 'moana', 'encanto', 'toy story', 'finding nemo', 'incredibles', 'lion king', 'little mermaid', 'beauty and the beast', 'aladdin', 'tangled', 'zootopia', 'coco', 'up', 'wall-e', 'ratatouille', 'monsters inc', 'cars'],
    excludeKeywords: ['parody', 'xxx', 'porn', 'adult', 'hentai', 'erotic', 'sexy', 'nude', 'naked', 'sex'],
  },
  "Disney+": {
    companyIds: [2, 3, 6125, 420, 1], // Disney, Pixar, Walt Disney Animation, Marvel, Lucasfilm
    keywords: ['disney', 'pixar', 'marvel', 'star wars'],
    excludeKeywords: ['parody', 'xxx', 'porn', 'adult', 'hentai', 'erotic', 'sexy', 'nude', 'naked', 'sex'],
  },
  Netflix: {
    networkIds: [213],
    companyIds: [213], // Netflix
    excludeKeywords: ['parody', 'xxx', 'porn', 'adult', 'hentai', 'erotic', 'sexy', 'nude', 'naked', 'sex'],
  },
  "Netflix Originals": {
    networkIds: [213],
    companyIds: [213],
    excludeKeywords: ['parody', 'xxx', 'porn', 'adult', 'hentai', 'erotic', 'sexy', 'nude', 'naked', 'sex'],
  },
  "HBO Max": {
    networkIds: [49, 3186], // HBO, HBO Max
    companyIds: [174], // Warner Bros
    excludeKeywords: ['parody', 'xxx', 'porn', 'adult', 'hentai', 'erotic', 'sexy', 'nude', 'naked', 'sex'],
  },
  Max: {
    networkIds: [49, 3186],
    companyIds: [174],
    excludeKeywords: ['parody', 'xxx', 'porn', 'adult', 'hentai', 'erotic', 'sexy', 'nude', 'naked', 'sex'],
  },
  Anime: {
    originCountries: ['JP'],
    genres: [16], // Animation
    excludeKeywords: ['hentai', 'xxx', 'porn', 'adult', 'ecchi', 'erotic', 'sexy', 'nude', 'naked', 'sex', 'uncensored'],
  },
};

// Validate if content belongs to franchise
const validateFranchiseContent = (item, franchise, titleLower) => {
  const validator = FRANCHISE_VALIDATORS[franchise];
  if (!validator) return true; // No validator, accept all
  
  // Check for excluded keywords in title
  if (validator.excludeKeywords) {
    for (const keyword of validator.excludeKeywords) {
      if (titleLower.includes(keyword)) {
        return false;
      }
    }
  }
  
  // Check for required keywords in title (if specified)
  if (validator.keywords && validator.keywords.length > 0) {
    const hasKeyword = validator.keywords.some(keyword => 
      titleLower.includes(keyword.toLowerCase())
    );
    if (hasKeyword) return true;
  }
  
  return true; // Default accept if no keyword match required
};

// Helper function to check if content contains adult/inappropriate keywords
const isAdultContent = (item) => {
  const title = (item.title || item.name || '').toLowerCase();
  const overview = (item.overview || '').toLowerCase();
  
  const adultKeywords = [
    'xxx', 'porn', 'adult', 'hentai', 'erotic', 'sexy', 'nude', 'naked', 
    'sex', 'parody', 'ecchi', 'uncensored', 'explicit', 'nsfw', '18+',
    'softcore', 'hardcore', 'fetish', 'bondage', 'stripper'
  ];
  
  for (const keyword of adultKeywords) {
    if (title.includes(keyword) || overview.includes(keyword)) {
      return true;
    }
  }
  
  // Also check the adult flag from TMDB
  if (item.adult === true) {
    return true;
  }
  
  return false;
};

// Fetch structured franchise content with categorized sections and filtering
export const fetchStructuredFranchiseContent = async (franchise) => {
  try {
    const result = await fetchFranchiseContent(franchise);
    const { movies, tvShows } = result;
    const animation = result.animation || []; // Marvel returns animation separately
    const animatedMovies = result.animatedMovies || []; // Marvel animated movies
    const xmenMovies = result.xmenMovies || []; // Marvel returns X-Men separately
    
    if (!movies.length && !tvShows.length && !animation.length && !xmenMovies.length && !animatedMovies.length) {
      return { sections: [] };
    }

    const validator = FRANCHISE_VALIDATORS[franchise];
    
    // Special handling for Marvel - use strict MCU content only
    if (franchise === "Marvel") {
      const sections = [];
      
      // Extract new collections from result
      const sonySSUMovies = result.sonySSUMovies || [];
      const raimiSpiderMan = result.raimiSpiderMan || [];
      const amazingSpiderMan = result.amazingSpiderMan || [];
      const bladeTrilogy = result.bladeTrilogy || [];
      const fantasticFourMovies = result.fantasticFourMovies || [];
      const netflixTVShows = result.netflixTVShows || [];
      
      // Sort movies by year (chronological)
      const sortedMovies = [...movies].sort((a, b) => (a.year || 0) - (b.year || 0));
      
      // Phase 1 (2008-2012)
      const phase1 = sortedMovies.filter(m => m.year >= 2008 && m.year <= 2012);
      if (phase1.length > 0) {
        sections.push({ id: "phase_1", title: "Phase 1 (2008-2012)", data: phase1 });
      }
      
      // Phase 2 (2013-2015)
      const phase2 = sortedMovies.filter(m => m.year >= 2013 && m.year <= 2015);
      if (phase2.length > 0) {
        sections.push({ id: "phase_2", title: "Phase 2 (2013-2015)", data: phase2 });
      }
      
      // Phase 3 (2016-2019)
      const phase3 = sortedMovies.filter(m => m.year >= 2016 && m.year <= 2019);
      if (phase3.length > 0) {
        sections.push({ id: "phase_3", title: "Phase 3 (2016-2019)", data: phase3 });
      }
      
      // Phase 4 (2021-2023)
      const phase4Movies = sortedMovies.filter(m => m.year >= 2021 && m.year <= 2023);
      const phase4Shows = tvShows.filter(s => s.year >= 2021 && s.year <= 2022);
      const phase4 = [...phase4Movies, ...phase4Shows].sort((a, b) => (a.year || 0) - (b.year || 0));
      if (phase4.length > 0) {
        sections.push({ id: "phase_4", title: "Phase 4 (2021-2023)", data: phase4 });
      }
      
      // Phase 5 (2023-2026)
      const phase5Movies = sortedMovies.filter(m => m.year >= 2024 || (m.year === 2023 && !phase4Movies.includes(m)));
      const phase5Shows = tvShows.filter(s => s.year >= 2023);
      const phase5 = [...phase5Movies, ...phase5Shows].sort((a, b) => (a.year || 0) - (b.year || 0));
      if (phase5.length > 0) {
        sections.push({ id: "phase_5", title: "Phase 5 (2023-2026)", data: phase5 });
      }
      
      // All MCU TV Shows (Disney+)
      if (tvShows.length > 0) {
        sections.push({ id: "all_tv", title: "Disney+ Series", data: tvShows });
      }
      
      // Fox X-Men Movies (separate row)
      if (xmenMovies.length > 0) {
        const sortedXMen = [...xmenMovies].sort((a, b) => (a.year || 0) - (b.year || 0));
        sections.push({ id: "xmen", title: "X-Men (Fox)", data: sortedXMen });
      }
      
      // Sony Spider-Man Universe (Venom, Morbius, etc.)
      if (sonySSUMovies.length > 0) {
        const sortedSSU = [...sonySSUMovies].sort((a, b) => (a.year || 0) - (b.year || 0));
        sections.push({ id: "sony_ssu", title: "Sony Spider-Man Universe", data: sortedSSU });
      }
      
      // Sam Raimi Spider-Man Trilogy (Tobey Maguire)
      if (raimiSpiderMan.length > 0) {
        const sortedRaimi = [...raimiSpiderMan].sort((a, b) => (a.year || 0) - (b.year || 0));
        sections.push({ id: "raimi_spiderman", title: "Spider-Man (Tobey Maguire)", data: sortedRaimi });
      }
      
      // Amazing Spider-Man (Andrew Garfield)
      if (amazingSpiderMan.length > 0) {
        const sortedAmazing = [...amazingSpiderMan].sort((a, b) => (a.year || 0) - (b.year || 0));
        sections.push({ id: "amazing_spiderman", title: "Amazing Spider-Man (Andrew Garfield)", data: sortedAmazing });
      }
      
      // Fantastic Four (Fox)
      if (fantasticFourMovies.length > 0) {
        const sortedFF = [...fantasticFourMovies].sort((a, b) => (a.year || 0) - (b.year || 0));
        sections.push({ id: "fantastic_four", title: "Fantastic Four (Fox)", data: sortedFF });
      }
      
      // Marvel Television (Netflix/Pre-Disney+)
      if (netflixTVShows.length > 0) {
        const sortedNetflix = [...netflixTVShows].sort((a, b) => (a.year || 0) - (b.year || 0));
        sections.push({ id: "netflix_tv", title: "Marvel Television (Netflix)", data: sortedNetflix });
      }
      
      return { sections };
    }
    
    // Special handling for Harry Potter
    if (franchise === "Harry Potter") {
      const sections = [];
      
      // Sort movies by year (chronological)
      const sortedMovies = [...movies].sort((a, b) => (a.year || 0) - (b.year || 0));
      
      if (sortedMovies.length > 0) {
        sections.push({ 
          id: "harry_potter_films", 
          title: "Harry Potter Films (Daniel Radcliffe)", 
          data: sortedMovies 
        });
      }
      
      return { sections };
    }
    
    // Special handling for Transformers
    if (franchise === "Transformers") {
      const sections = [];
      
      // Sort movies by year (chronological)
      const sortedMovies = [...movies].sort((a, b) => (a.year || 0) - (b.year || 0));
      
      // Sort TV shows by year (chronological)
      const sortedTVShows = [...tvShows].sort((a, b) => (a.year || 0) - (b.year || 0));
      
      if (sortedMovies.length > 0) {
        sections.push({ 
          id: "transformers_movies", 
          title: "Transformers Movies", 
          data: sortedMovies 
        });
      }
      
      if (sortedTVShows.length > 0) {
        sections.push({ 
          id: "transformers_tv", 
          title: "Transformers TV Series", 
          data: sortedTVShows 
        });
      }
      
      return { sections };
    }
    
    // Special handling for Netflix - fetch 500 titles (250 movies + 250 TV shows) with tabs
    if (franchise === "Netflix" || franchise === "Netflix Originals") {
      const seenMovieIds = new Set();
      const seenTVIds = new Set();
      
      // Target: 250 movies + 250 TV shows = 500 total
      const targetMovies = 250;
      const targetTVShows = 250;
      const pagesNeeded = 25; // 20 per page * 25 = 500, enough buffer for filtering
      
      // Fetch movies and TV shows in parallel
      const moviePromises = [];
      const tvPromises = [];
      
      for (let page = 1; page <= pagesNeeded; page++) {
        moviePromises.push(
          fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=213&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json())
            .then(data => data.results || [])
            .catch(() => [])
        );
        tvPromises.push(
          fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=213&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json())
            .then(data => data.results || [])
            .catch(() => [])
        );
      }
      
      const [movieResults, tvResults] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises)
      ]);
      
      const allMovies = movieResults.flat();
      const allTVShows = tvResults.flat();
      
      // Process and limit to exactly 250 movies
      const processedMovies = allMovies
        .filter(movie => {
          if (seenMovieIds.has(movie.id)) return false;
          seenMovieIds.add(movie.id);
          if (isAdultContent(movie)) return false;
          return true;
        })
        .slice(0, targetMovies)
        .map(movie => ({
          id: movie.id,
          title: movie.title,
          image: getImageUrl(movie.poster_path, "w342"),
          backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
          rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
          year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
          type: "movie",
          overview: movie.overview,
          genre_ids: movie.genre_ids || [],
        }));
      
      // Process and limit to exactly 250 TV shows
      const processedTVShows = allTVShows
        .filter(show => {
          if (seenTVIds.has(show.id)) return false;
          seenTVIds.add(show.id);
          if (isAdultContent(show)) return false;
          return true;
        })
        .slice(0, targetTVShows)
        .map(show => ({
          id: show.id,
          title: show.name,
          image: getImageUrl(show.poster_path, "w342"),
          backdrop: getBackdropUrl(show.backdrop_path, "w780"),
          rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
          year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
          type: "tv",
          overview: show.overview,
          genre_ids: show.genre_ids || [],
        }));
      
      const currentYear = new Date().getFullYear();
      
      // Build MOVIE sections - store ALL matching items for each genre
      const movieSections = [];
      
      // All Movies (for browsing)
      movieSections.push({ id: "netflix_movie_all", title: "All Movies", data: [...processedMovies] });
      
      // Trending Movies (top rated)
      const trendingMovies = [...processedMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
      if (trendingMovies.length > 0) movieSections.push({ id: "netflix_movie_trending", title: "Top Rated Movies", data: trendingMovies });
      
      // New Release Movies
      const newMovies = [...processedMovies].filter(m => m.year >= currentYear - 1).sort((a, b) => (b.year || 0) - (a.year || 0));
      if (newMovies.length > 0) movieSections.push({ id: "netflix_movie_new", title: "New Releases", data: newMovies });
      
      // Action & Thriller Movies
      const actionMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [28, 53].includes(g)));
      if (actionMovies.length > 0) movieSections.push({ id: "netflix_movie_action", title: "Action & Thriller", data: actionMovies });
      
      // Comedy Movies
      const comedyMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [35].includes(g)));
      if (comedyMovies.length > 0) movieSections.push({ id: "netflix_movie_comedy", title: "Comedy", data: comedyMovies });
      
      // Drama Movies
      const dramaMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [18].includes(g)));
      if (dramaMovies.length > 0) movieSections.push({ id: "netflix_movie_drama", title: "Drama", data: dramaMovies });
      
      // Horror Movies
      const horrorMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [27, 9648].includes(g)));
      if (horrorMovies.length > 0) movieSections.push({ id: "netflix_movie_horror", title: "Horror & Mystery", data: horrorMovies });
      
      // Sci-Fi & Fantasy Movies
      const scifiMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [878, 14].includes(g)));
      if (scifiMovies.length > 0) movieSections.push({ id: "netflix_movie_scifi", title: "Sci-Fi & Fantasy", data: scifiMovies });
      
      // Romance Movies
      const romanceMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [10749].includes(g)));
      if (romanceMovies.length > 0) movieSections.push({ id: "netflix_movie_romance", title: "Romance", data: romanceMovies });
      
      // Documentary Movies
      const docMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [99].includes(g)));
      if (docMovies.length > 0) movieSections.push({ id: "netflix_movie_doc", title: "Documentaries", data: docMovies });
      
      // Animation Movies
      const animMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [16].includes(g)));
      if (animMovies.length > 0) movieSections.push({ id: "netflix_movie_animation", title: "Animation", data: animMovies });
      
      // Family Movies
      const familyMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [10751].includes(g)));
      if (familyMovies.length > 0) movieSections.push({ id: "netflix_movie_family", title: "Family", data: familyMovies });
      
      // Crime Movies
      const crimeMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [80].includes(g)));
      if (crimeMovies.length > 0) movieSections.push({ id: "netflix_movie_crime", title: "Crime", data: crimeMovies });
      
      // Build TV SHOW sections - store ALL matching items for each genre
      const tvSections = [];
      
      // All TV Shows
      tvSections.push({ id: "netflix_tv_all", title: "All TV Shows", data: [...processedTVShows] });
      
      // Trending TV Shows (top rated)
      const trendingTV = [...processedTVShows].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
      if (trendingTV.length > 0) tvSections.push({ id: "netflix_tv_trending", title: "Top Rated TV Shows", data: trendingTV });
      
      // New TV Shows
      const newTV = [...processedTVShows].filter(s => s.year >= currentYear - 1).sort((a, b) => (b.year || 0) - (a.year || 0));
      if (newTV.length > 0) tvSections.push({ id: "netflix_tv_new", title: "New Releases", data: newTV });
      
      // Action & Adventure TV
      const actionTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10759, 28].includes(g)));
      if (actionTV.length > 0) tvSections.push({ id: "netflix_tv_action", title: "Action & Adventure", data: actionTV });
      
      // Comedy TV
      const comedyTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [35].includes(g)));
      if (comedyTV.length > 0) tvSections.push({ id: "netflix_tv_comedy", title: "Comedy", data: comedyTV });
      
      // Drama TV
      const dramaTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [18].includes(g)));
      if (dramaTV.length > 0) tvSections.push({ id: "netflix_tv_drama", title: "Drama", data: dramaTV });
      
      // Crime TV
      const crimeTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [80].includes(g)));
      if (crimeTV.length > 0) tvSections.push({ id: "netflix_tv_crime", title: "Crime", data: crimeTV });
      
      // Sci-Fi & Fantasy TV
      const scifiTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10765, 878, 14].includes(g)));
      if (scifiTV.length > 0) tvSections.push({ id: "netflix_tv_scifi", title: "Sci-Fi & Fantasy", data: scifiTV });
      
      // Mystery TV
      const mysteryTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [9648].includes(g)));
      if (mysteryTV.length > 0) tvSections.push({ id: "netflix_tv_mystery", title: "Mystery", data: mysteryTV });
      
      // Documentary TV
      const docTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [99].includes(g)));
      if (docTV.length > 0) tvSections.push({ id: "netflix_tv_doc", title: "Documentaries", data: docTV });
      
      // Animation TV
      const animTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [16].includes(g)));
      if (animTV.length > 0) tvSections.push({ id: "netflix_tv_animation", title: "Animation", data: animTV });
      
      // Reality TV
      const realityTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10764].includes(g)));
      if (realityTV.length > 0) tvSections.push({ id: "netflix_tv_reality", title: "Reality", data: realityTV });
      
      // Kids TV
      const kidsTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10762, 10751].includes(g)));
      if (kidsTV.length > 0) tvSections.push({ id: "netflix_tv_kids", title: "Kids", data: kidsTV });
      
      // Filter out sections with less than 3 items to avoid sparse rows
      const filteredMovieSections = movieSections.filter(s => s.data.length >= 3);
      const filteredTVSections = tvSections.filter(s => s.data.length >= 3);
      
      return { 
        sections: filteredMovieSections,
        movieSections: filteredMovieSections,
        tvSections: filteredTVSections,
        totalMovies: processedMovies.length,
        totalTVShows: processedTVShows.length,
        totalContent: processedMovies.length + processedTVShows.length,
        hasTabs: true
      };
    }
    
    // Special handling for Disney+ - fetch 500 titles (250 movies + 250 TV shows) with tabs
    if (franchise === "Disney+" || franchise === "Disney") {
      const seenMovieIds = new Set();
      const seenTVIds = new Set();
      
      // Disney+ network ID: 2739
      const disneyNetworkId = 2739;
      const disneyCompanyIds = "2|3|6125|420|1";
      
      // Target: 250 movies + 250 TV shows = 500 total
      const targetMovies = 250;
      const targetTVShows = 250;
      const pagesNeeded = 15;
      
      const moviePromises = [];
      const tvPromises = [];
      
      for (let page = 1; page <= pagesNeeded; page++) {
        moviePromises.push(
          fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=${disneyCompanyIds}&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json())
            .then(data => data.results || [])
            .catch(() => [])
        );
        tvPromises.push(
          fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=${disneyNetworkId}&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json())
            .then(data => data.results || [])
            .catch(() => [])
        );
      }
      
      const [movieResults, tvResults] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvPromises)
      ]);
      
      const allMovies = movieResults.flat();
      const allTVShows = tvResults.flat();
      
      // Process and limit to exactly 250 movies
      const processedMovies = allMovies
        .filter(movie => {
          if (seenMovieIds.has(movie.id)) return false;
          seenMovieIds.add(movie.id);
          if (isAdultContent(movie)) return false;
          return true;
        })
        .slice(0, targetMovies)
        .map(movie => ({
          id: movie.id,
          title: movie.title,
          image: getImageUrl(movie.poster_path, "w342"),
          backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
          rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
          year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
          type: "movie",
          overview: movie.overview,
          genre_ids: movie.genre_ids || [],
        }));
      
      // Process and limit to exactly 250 TV shows
      const processedTVShows = allTVShows
        .filter(show => {
          if (seenTVIds.has(show.id)) return false;
          seenTVIds.add(show.id);
          if (isAdultContent(show)) return false;
          return true;
        })
        .slice(0, targetTVShows)
        .map(show => ({
          id: show.id,
          title: show.name,
          image: getImageUrl(show.poster_path, "w342"),
          backdrop: getBackdropUrl(show.backdrop_path, "w780"),
          rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
          year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
          type: "tv",
          overview: show.overview,
          genre_ids: show.genre_ids || [],
        }));
      
      const currentYear = new Date().getFullYear();
      
      // Build MOVIE sections
      const movieSections = [];
      
      const trendingMovies = [...processedMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingMovies.length > 0) movieSections.push({ id: "disney_movie_trending", title: "Trending Movies", data: trendingMovies });
      
      const newMovies = [...processedMovies].filter(m => m.year >= currentYear - 1).sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 20);
      if (newMovies.length > 0) movieSections.push({ id: "disney_movie_new", title: "New on Disney+", data: newMovies });
      
      const classicMovies = [...processedMovies].filter(m => m.year && m.year < 2000 && parseFloat(m.rating) >= 7.0).sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (classicMovies.length > 0) movieSections.push({ id: "disney_movie_classics", title: "Disney Classics", data: classicMovies });
      
      const animMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [16].includes(g))).slice(0, 20);
      if (animMovies.length > 0) movieSections.push({ id: "disney_movie_animation", title: "Animation", data: animMovies });
      
      const familyMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [10751].includes(g))).slice(0, 20);
      if (familyMovies.length > 0) movieSections.push({ id: "disney_movie_family", title: "Family", data: familyMovies });
      
      const actionMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [28, 12].includes(g))).slice(0, 20);
      if (actionMovies.length > 0) movieSections.push({ id: "disney_movie_action", title: "Action & Adventure", data: actionMovies });
      
      const comedyMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [35].includes(g))).slice(0, 20);
      if (comedyMovies.length > 0) movieSections.push({ id: "disney_movie_comedy", title: "Comedy", data: comedyMovies });
      
      const scifiMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [878, 14].includes(g))).slice(0, 20);
      if (scifiMovies.length > 0) movieSections.push({ id: "disney_movie_scifi", title: "Sci-Fi & Fantasy", data: scifiMovies });
      
      const dramaMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaMovies.length > 0) movieSections.push({ id: "disney_movie_drama", title: "Drama", data: dramaMovies });
      
      const docMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [99].includes(g))).slice(0, 20);
      if (docMovies.length > 0) movieSections.push({ id: "disney_movie_doc", title: "Documentaries", data: docMovies });
      
      // Build TV SHOW sections
      const tvSections = [];
      
      const trendingTV = [...processedTVShows].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingTV.length > 0) tvSections.push({ id: "disney_tv_trending", title: "Trending TV Shows", data: trendingTV });
      
      const newTV = [...processedTVShows].filter(s => s.year >= currentYear - 1).sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 20);
      if (newTV.length > 0) tvSections.push({ id: "disney_tv_new", title: "New on Disney+", data: newTV });
      
      const animTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [16].includes(g))).slice(0, 20);
      if (animTV.length > 0) tvSections.push({ id: "disney_tv_animation", title: "Animation", data: animTV });
      
      const familyTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10751, 10762].includes(g))).slice(0, 20);
      if (familyTV.length > 0) tvSections.push({ id: "disney_tv_family", title: "Family", data: familyTV });
      
      const actionTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10759, 28, 12].includes(g))).slice(0, 20);
      if (actionTV.length > 0) tvSections.push({ id: "disney_tv_action", title: "Action & Adventure", data: actionTV });
      
      const comedyTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [35].includes(g))).slice(0, 20);
      if (comedyTV.length > 0) tvSections.push({ id: "disney_tv_comedy", title: "Comedy", data: comedyTV });
      
      const scifiTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10765, 878, 14].includes(g))).slice(0, 20);
      if (scifiTV.length > 0) tvSections.push({ id: "disney_tv_scifi", title: "Sci-Fi & Fantasy", data: scifiTV });
      
      const dramaTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaTV.length > 0) tvSections.push({ id: "disney_tv_drama", title: "Drama", data: dramaTV });
      
      const docTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [99].includes(g))).slice(0, 20);
      if (docTV.length > 0) tvSections.push({ id: "disney_tv_doc", title: "Documentaries", data: docTV });
      
      const realityTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10764].includes(g))).slice(0, 20);
      if (realityTV.length > 0) tvSections.push({ id: "disney_tv_reality", title: "Reality", data: realityTV });
      
      const kidsTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10762].includes(g))).slice(0, 20);
      if (kidsTV.length > 0) tvSections.push({ id: "disney_tv_kids", title: "Kids", data: kidsTV });
      
      return { 
        sections: movieSections,
        movieSections,
        tvSections,
        totalMovies: processedMovies.length,
        totalTVShows: processedTVShows.length,
        totalContent: processedMovies.length + processedTVShows.length,
        hasTabs: true
      };
    }
    

    // Special handling for HBO Max / Max - fetch 500 titles with tabs
    if (franchise === "HBO Max" || franchise === "Max") {
      const seenMovieIds = new Set();
      const seenTVIds = new Set();
      const targetMovies = 250;
      const targetTVShows = 250;
      const pagesNeeded = 15;
      
      const moviePromises = [];
      const tvPromises = [];
      
      for (let page = 1; page <= pagesNeeded; page++) {
        moviePromises.push(
          fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=174&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
        tvPromises.push(
          fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=49|3186&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
      }
      
      const [movieResults, tvResults] = await Promise.all([Promise.all(moviePromises), Promise.all(tvPromises)]);
      const allMovies = movieResults.flat();
      const allTVShows = tvResults.flat();
      
      const processedMovies = allMovies.filter(movie => {
        if (seenMovieIds.has(movie.id)) return false;
        seenMovieIds.add(movie.id);
        if (isAdultContent(movie)) return false;
        return true;
      }).slice(0, targetMovies).map(movie => ({
        id: movie.id, title: movie.title, image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
        type: "movie", overview: movie.overview, genre_ids: movie.genre_ids || [],
      }));
      
      const processedTVShows = allTVShows.filter(show => {
        if (seenTVIds.has(show.id)) return false;
        seenTVIds.add(show.id);
        if (isAdultContent(show)) return false;
        return true;
      }).slice(0, targetTVShows).map(show => ({
        id: show.id, title: show.name, image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
        type: "tv", overview: show.overview, genre_ids: show.genre_ids || [],
      }));
      
      const currentYear = new Date().getFullYear();
      const movieSections = [];
      const tvSections = [];
      
      // Movie sections
      const trendingMovies = [...processedMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingMovies.length > 0) movieSections.push({ id: "max_movie_trending", title: "Trending Movies", data: trendingMovies });
      const newMovies = [...processedMovies].filter(m => m.year >= currentYear - 1).slice(0, 20);
      if (newMovies.length > 0) movieSections.push({ id: "max_movie_new", title: "New Releases", data: newMovies });
      const actionMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [28, 53].includes(g))).slice(0, 20);
      if (actionMovies.length > 0) movieSections.push({ id: "max_movie_action", title: "Action & Thriller", data: actionMovies });
      const comedyMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [35].includes(g))).slice(0, 20);
      if (comedyMovies.length > 0) movieSections.push({ id: "max_movie_comedy", title: "Comedy", data: comedyMovies });
      const dramaMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaMovies.length > 0) movieSections.push({ id: "max_movie_drama", title: "Drama", data: dramaMovies });
      const horrorMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [27, 9648].includes(g))).slice(0, 20);
      if (horrorMovies.length > 0) movieSections.push({ id: "max_movie_horror", title: "Horror & Mystery", data: horrorMovies });
      const scifiMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [878, 14].includes(g))).slice(0, 20);
      if (scifiMovies.length > 0) movieSections.push({ id: "max_movie_scifi", title: "Sci-Fi & Fantasy", data: scifiMovies });
      const docMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [99].includes(g))).slice(0, 20);
      if (docMovies.length > 0) movieSections.push({ id: "max_movie_doc", title: "Documentaries", data: docMovies });
      
      // TV sections
      const trendingTV = [...processedTVShows].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingTV.length > 0) tvSections.push({ id: "max_tv_trending", title: "Trending TV Shows", data: trendingTV });
      const newTV = [...processedTVShows].filter(s => s.year >= currentYear - 1).slice(0, 20);
      if (newTV.length > 0) tvSections.push({ id: "max_tv_new", title: "New Releases", data: newTV });
      const dramaTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaTV.length > 0) tvSections.push({ id: "max_tv_drama", title: "Drama", data: dramaTV });
      const comedyTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [35].includes(g))).slice(0, 20);
      if (comedyTV.length > 0) tvSections.push({ id: "max_tv_comedy", title: "Comedy", data: comedyTV });
      const crimeTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [80].includes(g))).slice(0, 20);
      if (crimeTV.length > 0) tvSections.push({ id: "max_tv_crime", title: "Crime", data: crimeTV });
      const scifiTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10765, 878, 14].includes(g))).slice(0, 20);
      if (scifiTV.length > 0) tvSections.push({ id: "max_tv_scifi", title: "Sci-Fi & Fantasy", data: scifiTV });
      const docTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [99].includes(g))).slice(0, 20);
      if (docTV.length > 0) tvSections.push({ id: "max_tv_doc", title: "Documentaries", data: docTV });
      const realityTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10764].includes(g))).slice(0, 20);
      if (realityTV.length > 0) tvSections.push({ id: "max_tv_reality", title: "Reality", data: realityTV });
      
      return { sections: movieSections, movieSections, tvSections, totalMovies: processedMovies.length, totalTVShows: processedTVShows.length, totalContent: processedMovies.length + processedTVShows.length, hasTabs: true };
    }

    // Special handling for Hulu - fetch 500 titles with tabs
    if (franchise === "Hulu") {
      const seenMovieIds = new Set();
      const seenTVIds = new Set();
      const targetMovies = 250;
      const targetTVShows = 250;
      const pagesNeeded = 15;
      
      const moviePromises = [];
      const tvPromises = [];
      
      for (let page = 1; page <= pagesNeeded; page++) {
        moviePromises.push(
          fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_watch_providers=15&watch_region=US&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
        tvPromises.push(
          fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=453&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
      }
      
      const [movieResults, tvResults] = await Promise.all([Promise.all(moviePromises), Promise.all(tvPromises)]);
      const allMovies = movieResults.flat();
      const allTVShows = tvResults.flat();
      
      const processedMovies = allMovies.filter(movie => {
        if (seenMovieIds.has(movie.id)) return false;
        seenMovieIds.add(movie.id);
        if (isAdultContent(movie)) return false;
        return true;
      }).slice(0, targetMovies).map(movie => ({
        id: movie.id, title: movie.title, image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
        type: "movie", overview: movie.overview, genre_ids: movie.genre_ids || [],
      }));
      
      const processedTVShows = allTVShows.filter(show => {
        if (seenTVIds.has(show.id)) return false;
        seenTVIds.add(show.id);
        if (isAdultContent(show)) return false;
        return true;
      }).slice(0, targetTVShows).map(show => ({
        id: show.id, title: show.name, image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
        type: "tv", overview: show.overview, genre_ids: show.genre_ids || [],
      }));
      
      const currentYear = new Date().getFullYear();
      const movieSections = [];
      const tvSections = [];
      
      const trendingMovies = [...processedMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingMovies.length > 0) movieSections.push({ id: "hulu_movie_trending", title: "Trending Movies", data: trendingMovies });
      const newMovies = [...processedMovies].filter(m => m.year >= currentYear - 1).slice(0, 20);
      if (newMovies.length > 0) movieSections.push({ id: "hulu_movie_new", title: "New Releases", data: newMovies });
      const actionMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [28, 53].includes(g))).slice(0, 20);
      if (actionMovies.length > 0) movieSections.push({ id: "hulu_movie_action", title: "Action & Thriller", data: actionMovies });
      const comedyMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [35].includes(g))).slice(0, 20);
      if (comedyMovies.length > 0) movieSections.push({ id: "hulu_movie_comedy", title: "Comedy", data: comedyMovies });
      const dramaMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaMovies.length > 0) movieSections.push({ id: "hulu_movie_drama", title: "Drama", data: dramaMovies });
      const horrorMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [27].includes(g))).slice(0, 20);
      if (horrorMovies.length > 0) movieSections.push({ id: "hulu_movie_horror", title: "Horror", data: horrorMovies });
      const animMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [16].includes(g))).slice(0, 20);
      if (animMovies.length > 0) movieSections.push({ id: "hulu_movie_animation", title: "Animation", data: animMovies });
      
      const trendingTV = [...processedTVShows].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingTV.length > 0) tvSections.push({ id: "hulu_tv_trending", title: "Trending TV Shows", data: trendingTV });
      const newTV = [...processedTVShows].filter(s => s.year >= currentYear - 1).slice(0, 20);
      if (newTV.length > 0) tvSections.push({ id: "hulu_tv_new", title: "New Releases", data: newTV });
      const dramaTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaTV.length > 0) tvSections.push({ id: "hulu_tv_drama", title: "Drama", data: dramaTV });
      const comedyTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [35].includes(g))).slice(0, 20);
      if (comedyTV.length > 0) tvSections.push({ id: "hulu_tv_comedy", title: "Comedy", data: comedyTV });
      const crimeTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [80].includes(g))).slice(0, 20);
      if (crimeTV.length > 0) tvSections.push({ id: "hulu_tv_crime", title: "Crime", data: crimeTV });
      const realityTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10764].includes(g))).slice(0, 20);
      if (realityTV.length > 0) tvSections.push({ id: "hulu_tv_reality", title: "Reality", data: realityTV });
      const animTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [16].includes(g))).slice(0, 20);
      if (animTV.length > 0) tvSections.push({ id: "hulu_tv_animation", title: "Animation", data: animTV });
      
      return { sections: movieSections, movieSections, tvSections, totalMovies: processedMovies.length, totalTVShows: processedTVShows.length, totalContent: processedMovies.length + processedTVShows.length, hasTabs: true };
    }

    // Special handling for Paramount+ - fetch 500 titles with tabs
    if (franchise === "Paramount+") {
      const seenMovieIds = new Set();
      const seenTVIds = new Set();
      const targetMovies = 250;
      const targetTVShows = 250;
      const pagesNeeded = 15;
      
      const moviePromises = [];
      const tvPromises = [];
      
      for (let page = 1; page <= pagesNeeded; page++) {
        moviePromises.push(
          fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=4&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
        tvPromises.push(
          fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=4330&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
      }
      
      const [movieResults, tvResults] = await Promise.all([Promise.all(moviePromises), Promise.all(tvPromises)]);
      const allMovies = movieResults.flat();
      const allTVShows = tvResults.flat();
      
      const processedMovies = allMovies.filter(movie => {
        if (seenMovieIds.has(movie.id)) return false;
        seenMovieIds.add(movie.id);
        if (isAdultContent(movie)) return false;
        return true;
      }).slice(0, targetMovies).map(movie => ({
        id: movie.id, title: movie.title, image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
        type: "movie", overview: movie.overview, genre_ids: movie.genre_ids || [],
      }));
      
      const processedTVShows = allTVShows.filter(show => {
        if (seenTVIds.has(show.id)) return false;
        seenTVIds.add(show.id);
        if (isAdultContent(show)) return false;
        return true;
      }).slice(0, targetTVShows).map(show => ({
        id: show.id, title: show.name, image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
        type: "tv", overview: show.overview, genre_ids: show.genre_ids || [],
      }));
      
      const currentYear = new Date().getFullYear();
      const movieSections = [];
      const tvSections = [];
      
      const trendingMovies = [...processedMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingMovies.length > 0) movieSections.push({ id: "paramount_movie_trending", title: "Trending Movies", data: trendingMovies });
      const newMovies = [...processedMovies].filter(m => m.year >= currentYear - 1).slice(0, 20);
      if (newMovies.length > 0) movieSections.push({ id: "paramount_movie_new", title: "New Releases", data: newMovies });
      const actionMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [28, 53].includes(g))).slice(0, 20);
      if (actionMovies.length > 0) movieSections.push({ id: "paramount_movie_action", title: "Action & Thriller", data: actionMovies });
      const comedyMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [35].includes(g))).slice(0, 20);
      if (comedyMovies.length > 0) movieSections.push({ id: "paramount_movie_comedy", title: "Comedy", data: comedyMovies });
      const dramaMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaMovies.length > 0) movieSections.push({ id: "paramount_movie_drama", title: "Drama", data: dramaMovies });
      const scifiMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [878, 14].includes(g))).slice(0, 20);
      if (scifiMovies.length > 0) movieSections.push({ id: "paramount_movie_scifi", title: "Sci-Fi & Fantasy", data: scifiMovies });
      const familyMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [10751].includes(g))).slice(0, 20);
      if (familyMovies.length > 0) movieSections.push({ id: "paramount_movie_family", title: "Family", data: familyMovies });
      
      const trendingTV = [...processedTVShows].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingTV.length > 0) tvSections.push({ id: "paramount_tv_trending", title: "Trending TV Shows", data: trendingTV });
      const newTV = [...processedTVShows].filter(s => s.year >= currentYear - 1).slice(0, 20);
      if (newTV.length > 0) tvSections.push({ id: "paramount_tv_new", title: "New Releases", data: newTV });
      const dramaTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaTV.length > 0) tvSections.push({ id: "paramount_tv_drama", title: "Drama", data: dramaTV });
      const crimeTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [80].includes(g))).slice(0, 20);
      if (crimeTV.length > 0) tvSections.push({ id: "paramount_tv_crime", title: "Crime", data: crimeTV });
      const scifiTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10765].includes(g))).slice(0, 20);
      if (scifiTV.length > 0) tvSections.push({ id: "paramount_tv_scifi", title: "Sci-Fi & Fantasy", data: scifiTV });
      const realityTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10764].includes(g))).slice(0, 20);
      if (realityTV.length > 0) tvSections.push({ id: "paramount_tv_reality", title: "Reality", data: realityTV });
      
      return { sections: movieSections, movieSections, tvSections, totalMovies: processedMovies.length, totalTVShows: processedTVShows.length, totalContent: processedMovies.length + processedTVShows.length, hasTabs: true };
    }

    // Special handling for Apple TV+ - fetch 500 titles with tabs
    if (franchise === "Apple TV+") {
      const seenMovieIds = new Set();
      const seenTVIds = new Set();
      const targetMovies = 250;
      const targetTVShows = 250;
      const pagesNeeded = 15;
      
      const moviePromises = [];
      const tvPromises = [];
      
      for (let page = 1; page <= pagesNeeded; page++) {
        moviePromises.push(
          fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=158414&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
        tvPromises.push(
          fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=2552&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
      }
      
      const [movieResults, tvResults] = await Promise.all([Promise.all(moviePromises), Promise.all(tvPromises)]);
      const allMovies = movieResults.flat();
      const allTVShows = tvResults.flat();
      
      const processedMovies = allMovies.filter(movie => {
        if (seenMovieIds.has(movie.id)) return false;
        seenMovieIds.add(movie.id);
        if (isAdultContent(movie)) return false;
        return true;
      }).slice(0, targetMovies).map(movie => ({
        id: movie.id, title: movie.title, image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
        type: "movie", overview: movie.overview, genre_ids: movie.genre_ids || [],
      }));
      
      const processedTVShows = allTVShows.filter(show => {
        if (seenTVIds.has(show.id)) return false;
        seenTVIds.add(show.id);
        if (isAdultContent(show)) return false;
        return true;
      }).slice(0, targetTVShows).map(show => ({
        id: show.id, title: show.name, image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
        type: "tv", overview: show.overview, genre_ids: show.genre_ids || [],
      }));
      
      const currentYear = new Date().getFullYear();
      const movieSections = [];
      const tvSections = [];
      
      const trendingMovies = [...processedMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingMovies.length > 0) movieSections.push({ id: "apple_movie_trending", title: "Trending Movies", data: trendingMovies });
      const newMovies = [...processedMovies].filter(m => m.year >= currentYear - 1).slice(0, 20);
      if (newMovies.length > 0) movieSections.push({ id: "apple_movie_new", title: "New Releases", data: newMovies });
      const dramaMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaMovies.length > 0) movieSections.push({ id: "apple_movie_drama", title: "Drama", data: dramaMovies });
      const comedyMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [35].includes(g))).slice(0, 20);
      if (comedyMovies.length > 0) movieSections.push({ id: "apple_movie_comedy", title: "Comedy", data: comedyMovies });
      const scifiMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [878, 14].includes(g))).slice(0, 20);
      if (scifiMovies.length > 0) movieSections.push({ id: "apple_movie_scifi", title: "Sci-Fi & Fantasy", data: scifiMovies });
      const docMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [99].includes(g))).slice(0, 20);
      if (docMovies.length > 0) movieSections.push({ id: "apple_movie_doc", title: "Documentaries", data: docMovies });
      
      const trendingTV = [...processedTVShows].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingTV.length > 0) tvSections.push({ id: "apple_tv_trending", title: "Trending TV Shows", data: trendingTV });
      const newTV = [...processedTVShows].filter(s => s.year >= currentYear - 1).slice(0, 20);
      if (newTV.length > 0) tvSections.push({ id: "apple_tv_new", title: "New Releases", data: newTV });
      const dramaTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaTV.length > 0) tvSections.push({ id: "apple_tv_drama", title: "Drama", data: dramaTV });
      const comedyTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [35].includes(g))).slice(0, 20);
      if (comedyTV.length > 0) tvSections.push({ id: "apple_tv_comedy", title: "Comedy", data: comedyTV });
      const scifiTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10765, 878].includes(g))).slice(0, 20);
      if (scifiTV.length > 0) tvSections.push({ id: "apple_tv_scifi", title: "Sci-Fi & Fantasy", data: scifiTV });
      const crimeTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [80].includes(g))).slice(0, 20);
      if (crimeTV.length > 0) tvSections.push({ id: "apple_tv_crime", title: "Crime", data: crimeTV });
      
      return { sections: movieSections, movieSections, tvSections, totalMovies: processedMovies.length, totalTVShows: processedTVShows.length, totalContent: processedMovies.length + processedTVShows.length, hasTabs: true };
    }

    // Special handling for The CW - fetch 500 titles with tabs
    if (franchise === "The CW") {
      const seenMovieIds = new Set();
      const seenTVIds = new Set();
      const targetMovies = 100;
      const targetTVShows = 400;
      const pagesNeeded = 15;
      
      const moviePromises = [];
      const tvPromises = [];
      
      for (let page = 1; page <= pagesNeeded; page++) {
        moviePromises.push(
          fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=1957&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
        tvPromises.push(
          fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=71&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
      }
      
      const [movieResults, tvResults] = await Promise.all([Promise.all(moviePromises), Promise.all(tvPromises)]);
      const allMovies = movieResults.flat();
      const allTVShows = tvResults.flat();
      
      const processedMovies = allMovies.filter(movie => {
        if (seenMovieIds.has(movie.id)) return false;
        seenMovieIds.add(movie.id);
        if (isAdultContent(movie)) return false;
        return true;
      }).slice(0, targetMovies).map(movie => ({
        id: movie.id, title: movie.title, image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
        type: "movie", overview: movie.overview, genre_ids: movie.genre_ids || [],
      }));
      
      const processedTVShows = allTVShows.filter(show => {
        if (seenTVIds.has(show.id)) return false;
        seenTVIds.add(show.id);
        if (isAdultContent(show)) return false;
        return true;
      }).slice(0, targetTVShows).map(show => ({
        id: show.id, title: show.name, image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
        type: "tv", overview: show.overview, genre_ids: show.genre_ids || [],
      }));
      
      const currentYear = new Date().getFullYear();
      const movieSections = [];
      const tvSections = [];
      
      const trendingMovies = [...processedMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingMovies.length > 0) movieSections.push({ id: "cw_movie_trending", title: "Trending Movies", data: trendingMovies });
      
      const trendingTV = [...processedTVShows].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingTV.length > 0) tvSections.push({ id: "cw_tv_trending", title: "Trending TV Shows", data: trendingTV });
      const newTV = [...processedTVShows].filter(s => s.year >= currentYear - 1).slice(0, 20);
      if (newTV.length > 0) tvSections.push({ id: "cw_tv_new", title: "New Releases", data: newTV });
      const dramaTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaTV.length > 0) tvSections.push({ id: "cw_tv_drama", title: "Drama", data: dramaTV });
      const scifiTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10765, 878, 14].includes(g))).slice(0, 20);
      if (scifiTV.length > 0) tvSections.push({ id: "cw_tv_scifi", title: "Sci-Fi & Fantasy", data: scifiTV });
      const actionTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10759].includes(g))).slice(0, 20);
      if (actionTV.length > 0) tvSections.push({ id: "cw_tv_action", title: "Action & Adventure", data: actionTV });
      const mysteryTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [9648].includes(g))).slice(0, 20);
      if (mysteryTV.length > 0) tvSections.push({ id: "cw_tv_mystery", title: "Mystery", data: mysteryTV });
      
      return { sections: movieSections.length > 0 ? movieSections : tvSections, movieSections, tvSections, totalMovies: processedMovies.length, totalTVShows: processedTVShows.length, totalContent: processedMovies.length + processedTVShows.length, hasTabs: true };
    }

    // Special handling for USA Network - fetch 500 titles with tabs
    if (franchise === "USA Network") {
      const seenMovieIds = new Set();
      const seenTVIds = new Set();
      const targetMovies = 100;
      const targetTVShows = 400;
      const pagesNeeded = 15;
      
      const moviePromises = [];
      const tvPromises = [];
      
      for (let page = 1; page <= pagesNeeded; page++) {
        moviePromises.push(
          fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_companies=26727&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
        tvPromises.push(
          fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=30&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
      }
      
      const [movieResults, tvResults] = await Promise.all([Promise.all(moviePromises), Promise.all(tvPromises)]);
      const allMovies = movieResults.flat();
      const allTVShows = tvResults.flat();
      
      const processedMovies = allMovies.filter(movie => {
        if (seenMovieIds.has(movie.id)) return false;
        seenMovieIds.add(movie.id);
        if (isAdultContent(movie)) return false;
        return true;
      }).slice(0, targetMovies).map(movie => ({
        id: movie.id, title: movie.title, image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
        type: "movie", overview: movie.overview, genre_ids: movie.genre_ids || [],
      }));
      
      const processedTVShows = allTVShows.filter(show => {
        if (seenTVIds.has(show.id)) return false;
        seenTVIds.add(show.id);
        if (isAdultContent(show)) return false;
        return true;
      }).slice(0, targetTVShows).map(show => ({
        id: show.id, title: show.name, image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
        type: "tv", overview: show.overview, genre_ids: show.genre_ids || [],
      }));
      
      const currentYear = new Date().getFullYear();
      const movieSections = [];
      const tvSections = [];
      
      const trendingMovies = [...processedMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingMovies.length > 0) movieSections.push({ id: "usa_movie_trending", title: "Trending Movies", data: trendingMovies });
      
      const trendingTV = [...processedTVShows].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingTV.length > 0) tvSections.push({ id: "usa_tv_trending", title: "Trending TV Shows", data: trendingTV });
      const newTV = [...processedTVShows].filter(s => s.year >= currentYear - 1).slice(0, 20);
      if (newTV.length > 0) tvSections.push({ id: "usa_tv_new", title: "New Releases", data: newTV });
      const dramaTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [18].includes(g))).slice(0, 20);
      if (dramaTV.length > 0) tvSections.push({ id: "usa_tv_drama", title: "Drama", data: dramaTV });
      const crimeTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [80].includes(g))).slice(0, 20);
      if (crimeTV.length > 0) tvSections.push({ id: "usa_tv_crime", title: "Crime", data: crimeTV });
      const actionTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10759].includes(g))).slice(0, 20);
      if (actionTV.length > 0) tvSections.push({ id: "usa_tv_action", title: "Action & Adventure", data: actionTV });
      const comedyTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [35].includes(g))).slice(0, 20);
      if (comedyTV.length > 0) tvSections.push({ id: "usa_tv_comedy", title: "Comedy", data: comedyTV });
      
      return { sections: movieSections.length > 0 ? movieSections : tvSections, movieSections, tvSections, totalMovies: processedMovies.length, totalTVShows: processedTVShows.length, totalContent: processedMovies.length + processedTVShows.length, hasTabs: true };
    }

    // Special handling for ESPN - fetch sports content with tabs
    if (franchise === "ESPN") {
      const seenMovieIds = new Set();
      const seenTVIds = new Set();
      const targetMovies = 100;
      const targetTVShows = 400;
      const pagesNeeded = 15;
      
      const moviePromises = [];
      const tvPromises = [];
      
      for (let page = 1; page <= pagesNeeded; page++) {
        moviePromises.push(
          fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_keywords=6075&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
        tvPromises.push(
          fetch(`${BASE_URL}/discover/tv?api_key=${API_KEY}&with_networks=29&sort_by=popularity.desc&page=${page}&include_adult=false`)
            .then(res => res.json()).then(data => data.results || []).catch(() => [])
        );
      }
      
      const [movieResults, tvResults] = await Promise.all([Promise.all(moviePromises), Promise.all(tvPromises)]);
      const allMovies = movieResults.flat();
      const allTVShows = tvResults.flat();
      
      const processedMovies = allMovies.filter(movie => {
        if (seenMovieIds.has(movie.id)) return false;
        seenMovieIds.add(movie.id);
        if (isAdultContent(movie)) return false;
        return true;
      }).slice(0, targetMovies).map(movie => ({
        id: movie.id, title: movie.title, image: getImageUrl(movie.poster_path, "w342"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w780"),
        rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
        year: movie.release_date ? new Date(movie.release_date).getFullYear() : "N/A",
        type: "movie", overview: movie.overview, genre_ids: movie.genre_ids || [],
      }));
      
      const processedTVShows = allTVShows.filter(show => {
        if (seenTVIds.has(show.id)) return false;
        seenTVIds.add(show.id);
        if (isAdultContent(show)) return false;
        return true;
      }).slice(0, targetTVShows).map(show => ({
        id: show.id, title: show.name, image: getImageUrl(show.poster_path, "w342"),
        backdrop: getBackdropUrl(show.backdrop_path, "w780"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date ? new Date(show.first_air_date).getFullYear() : "N/A",
        type: "tv", overview: show.overview, genre_ids: show.genre_ids || [],
      }));
      
      const currentYear = new Date().getFullYear();
      const movieSections = [];
      const tvSections = [];
      
      const trendingMovies = [...processedMovies].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingMovies.length > 0) movieSections.push({ id: "espn_movie_trending", title: "Sports Movies", data: trendingMovies });
      const docMovies = [...processedMovies].filter(m => m.genre_ids?.some(g => [99].includes(g))).slice(0, 20);
      if (docMovies.length > 0) movieSections.push({ id: "espn_movie_doc", title: "Sports Documentaries", data: docMovies });
      
      const trendingTV = [...processedTVShows].sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating)).slice(0, 20);
      if (trendingTV.length > 0) tvSections.push({ id: "espn_tv_trending", title: "Trending Shows", data: trendingTV });
      const newTV = [...processedTVShows].filter(s => s.year >= currentYear - 1).slice(0, 20);
      if (newTV.length > 0) tvSections.push({ id: "espn_tv_new", title: "New Shows", data: newTV });
      const docTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [99].includes(g))).slice(0, 20);
      if (docTV.length > 0) tvSections.push({ id: "espn_tv_doc", title: "Documentaries", data: docTV });
      const talkTV = [...processedTVShows].filter(s => s.genre_ids?.some(g => [10767].includes(g))).slice(0, 20);
      if (talkTV.length > 0) tvSections.push({ id: "espn_tv_talk", title: "Talk Shows", data: talkTV });
      
      return { sections: movieSections.length > 0 ? movieSections : tvSections, movieSections, tvSections, totalMovies: processedMovies.length, totalTVShows: processedTVShows.length, totalContent: processedMovies.length + processedTVShows.length, hasTabs: true };
    }


        // Filter movies - remove adult content and unrelated content
    const filteredMovies = movies.filter(movie => {
      const titleLower = (movie.title || '').toLowerCase();
      const overviewLower = (movie.overview || '').toLowerCase();
      
      // Skip adult content using comprehensive check
      if (isAdultContent(movie)) return false;
      
      // Check excluded keywords in title and overview
      if (validator?.excludeKeywords) {
        for (const keyword of validator.excludeKeywords) {
          if (titleLower.includes(keyword) || overviewLower.includes(keyword)) {
            return false;
          }
        }
      }
      
      return true;
    });

    // Filter TV shows - remove adult content and unrelated content
    const filteredTVShows = tvShows.filter(show => {
      const titleLower = (show.title || '').toLowerCase();
      const overviewLower = (show.overview || '').toLowerCase();
      
      // Skip adult content using comprehensive check
      if (isAdultContent(show)) return false;
      
      // Check excluded keywords in title and overview
      if (validator?.excludeKeywords) {
        for (const keyword of validator.excludeKeywords) {
          if (titleLower.includes(keyword) || overviewLower.includes(keyword)) {
            return false;
          }
        }
      }
      
      return true;
    });

    const sections = [];

    // Add movies section if available
    if (filteredMovies.length > 0) {
      // Sort by rating for "Top Rated" section
      const topRatedMovies = [...filteredMovies]
        .filter(m => parseFloat(m.rating) >= 6.0) // Only include well-rated content
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, 20);
      
      // Sort by year for "Recent" section
      const recentMovies = [...filteredMovies]
        .filter(m => m.year && m.year >= 2015) // Recent content only
        .sort((a, b) => (b.year || 0) - (a.year || 0))
        .slice(0, 20);

      if (topRatedMovies.length > 0) {
        sections.push({
          id: "top_rated_movies",
          title: "Top Rated Movies",
          data: topRatedMovies,
        });
      }

      if (recentMovies.length > 0) {
        sections.push({
          id: "recent_movies",
          title: "Recent Movies",
          data: recentMovies,
        });
      }

      // All movies section
      sections.push({
        id: "all_movies",
        title: "All Movies",
        data: filteredMovies,
      });
    }

    // Add TV shows section if available
    if (filteredTVShows.length > 0) {
      // Sort by rating for "Top Rated" section
      const topRatedShows = [...filteredTVShows]
        .filter(s => parseFloat(s.rating) >= 6.0)
        .sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating))
        .slice(0, 20);
      
      // Sort by year for "Recent" section
      const recentShows = [...filteredTVShows]
        .filter(s => s.year && s.year >= 2015)
        .sort((a, b) => (b.year || 0) - (a.year || 0))
        .slice(0, 20);

      if (topRatedShows.length > 0) {
        sections.push({
          id: "top_rated_tv",
          title: "Top Rated TV Shows",
          data: topRatedShows,
        });
      }

      if (recentShows.length > 0) {
        sections.push({
          id: "recent_tv",
          title: "Recent TV Shows",
          data: recentShows,
        });
      }

      // All TV shows section
      sections.push({
        id: "all_tv",
        title: "All TV Shows",
        data: filteredTVShows,
      });
    }

    return { sections };
  } catch (error) {
    console.error("Error fetching structured franchise content:", error);
    return { sections: [] };
  }
};

// Fetch category content with pagination (for "See All" pages)
// Fetches up to 500 titles for a specific category
export const fetchCategoryContent = async (categoryId, categoryType = 'mixed', page = 1, pagesPerLoad = 25) => {
  try {
    const results = [];
    const startPage = (page - 1) * pagesPerLoad + 1;
    const endPage = startPage + pagesPerLoad - 1;
    const maxPage = 25; // TMDB limits to 500 results (25 pages * 20 per page)
    
    const actualEndPage = Math.min(endPage, maxPage);
    
    // Check if it's a genre ID format (e.g., "genre_35")
    const genreMatch = categoryId.match(/^genre_(\d+)$/);
    
    let config;
    if (genreMatch) {
      // Handle genre ID format
      const genreId = parseInt(genreMatch[1], 10);
      const endpoint = categoryType === 'tv' ? 'discover/tv' : 'discover/movie';
      config = {
        endpoint,
        type: categoryType,
        genreId,
      };
    } else {
      // Category mapping for different content types
      const categoryMap = {
        // Movies
        'now_playing': { endpoint: 'movie/now_playing', type: 'movie' },
        'upcoming': { endpoint: 'movie/upcoming', type: 'movie' },
        'top_rated_movies': { endpoint: 'movie/top_rated', type: 'movie' },
        'popular_movies': { endpoint: 'movie/popular', type: 'movie' },
        // TV Shows
        'airing_today': { endpoint: 'tv/airing_today', type: 'tv' },
        'on_the_air': { endpoint: 'tv/on_the_air', type: 'tv' },
        'top_rated_tv': { endpoint: 'tv/top_rated', type: 'tv' },
        'popular_tv': { endpoint: 'tv/popular', type: 'tv' },
        // Genres (movies)
        'action': { endpoint: 'discover/movie', type: 'movie', genreId: 28 },
        'comedy': { endpoint: 'discover/movie', type: 'movie', genreId: 35 },
        'horror': { endpoint: 'discover/movie', type: 'movie', genreId: 27 },
        'romance': { endpoint: 'discover/movie', type: 'movie', genreId: 10749 },
        'thriller': { endpoint: 'discover/movie', type: 'movie', genreId: 53 },
        'sci_fi': { endpoint: 'discover/movie', type: 'movie', genreId: 878 },
        // Genres (TV)
        'drama': { endpoint: 'discover/tv', type: 'tv', genreId: 18 },
        'crime': { endpoint: 'discover/tv', type: 'tv', genreId: 80 },
        'mystery': { endpoint: 'discover/tv', type: 'tv', genreId: 9648 },
        'animation': { endpoint: 'discover/tv', type: 'tv', genreId: 16 },
        // Anime
        'anime': { endpoint: 'discover/tv', type: 'tv', genreId: 16, originCountry: 'JP' },
      };
      
      config = categoryMap[categoryId];
      if (!config) {
        console.warn(`Unknown category: ${categoryId}`);
        return { results: [], hasMore: false };
      }
    }
    
    const pagePromises = [];
    for (let p = startPage; p <= actualEndPage; p++) {
      let url = `${BASE_URL}/${config.endpoint}?api_key=${API_KEY}&page=${p}&sort_by=popularity.desc&include_adult=false`;
      
      if (config.genreId) {
        url += `&with_genres=${config.genreId}`;
      }
      if (config.originCountry) {
        url += `&with_origin_country=${config.originCountry}`;
      }
      
      pagePromises.push(
        fetch(url)
          .then(res => safeJsonParse(res))
          .catch((err) => {
            console.error(`Error fetching page ${p}:`, err);
            return { results: [] };
          })
      );
    }
    
    const responses = await Promise.all(pagePromises);
    
    responses.forEach(data => {
      if (data.results) {
        const mapped = data.results
          .filter(item => !shouldFilterContent(item)) // Apply content filtering
          .map(item => ({
            id: item.id,
            title: item.title || item.name,
            image: getImageUrl(item.poster_path, "w342"),
            backdrop: getBackdropUrl(item.backdrop_path, "w780"),
            rating: item.vote_average ? item.vote_average.toFixed(1) : "N/A",
            year: item.release_date
              ? new Date(item.release_date).getFullYear()
              : item.first_air_date
                ? new Date(item.first_air_date).getFullYear()
                : "N/A",
            type: config.type,
            overview: item.overview,
            poster_path: item.poster_path,
            backdrop_path: item.backdrop_path,
          }));
        results.push(...mapped);
      }
    });
    
    // Remove duplicates
    const uniqueResults = Array.from(
      new Map(results.map(item => [item.id, item])).values()
    );
    
    console.log(`✅ Fetched ${uniqueResults.length} items for ${categoryId} (${categoryType})`);
    
    return {
      results: uniqueResults,
      hasMore: actualEndPage < maxPage,
    };
  } catch (error) {
    console.error("Error fetching category content:", error);
    return { results: [], hasMore: false };
  }
};
