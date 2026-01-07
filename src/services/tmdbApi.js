// TMDB API Configuration
const API_KEY = "0dcd66e3f671ceaa6fe0c1bc8d0e854d";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

// Helper function to build image URLs
export const getImageUrl = (path, size = "original") => {
  if (!path) return "https://placehold.co/300x450/2C3E50/FFFFFF?text=No+Image";
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

// Helper function to build backdrop URLs
export const getBackdropUrl = (path, size = "original") => {
  if (!path)
    return "https://placehold.co/1280x720/2C3E50/FFFFFF?text=No+Backdrop";
  return `${IMAGE_BASE_URL}/${size}${path}`;
};

// Fetch trending content (mixed movies and TV shows)
export const fetchTrending = async (timeWindow = "week") => {
  try {
    const response = await fetch(
      `${BASE_URL}/trending/all/${timeWindow}?api_key=${API_KEY}`
    );
    const data = await response.json();
    return data.results.map((item) => ({
      id: item.id,
      title: item.title || item.name,
      image: getImageUrl(item.poster_path, "w500"),
      backdrop: getBackdropUrl(item.backdrop_path, "w1280"),
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

// Fetch popular movies
export const fetchPopularMovies = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=${page}`
    );
    const data = await response.json();
    return data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w500"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "N/A",
      type: "movie",
      overview: movie.overview,
    }));
  } catch (error) {
    console.error("Error fetching popular movies:", error);
    return [];
  }
};

// Fetch popular TV shows
export const fetchPopularTVShows = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/tv/popular?api_key=${API_KEY}&page=${page}`
    );
    const data = await response.json();
    return data.results.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w500"),
      backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
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
    return data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w500"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
    return data.results.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w500"),
      backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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
      image: getImageUrl(movie.poster_path, "w500"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "N/A",
      releaseDate: movie.release_date,
      runtime: movie.runtime ? `${movie.runtime} min` : "N/A",
      type: "movie",
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
      image: getImageUrl(show.poster_path, "w500"),
      backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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
          poster: getImageUrl(season.poster_path, "w500"),
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
      poster: getImageUrl(season.poster_path, "w500"),
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
export const searchContent = async (query) => {
  try {
    const response = await fetch(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}&page=1`
    );
    const data = await response.json();
    return data.results
      .filter((item) => item.media_type === "movie" || item.media_type === "tv")
      .map((item) => ({
        id: item.id,
        title: item.title || item.name,
        image: getImageUrl(item.poster_path, "w500"),
        backdrop: getBackdropUrl(item.backdrop_path, "w1280"),
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
    return data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w500"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
    return data.results.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w500"),
      backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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
    return data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w500"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
    return data.results.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w500"),
      backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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

// Fetch movies by genre
export const fetchMoviesByGenre = async (genreId, page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`
    );
    const data = await response.json();
    return data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      image: getImageUrl(movie.poster_path, "w500"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
      rating: movie.vote_average ? movie.vote_average.toFixed(1) : "N/A",
      year: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : "N/A",
      type: "movie",
      overview: movie.overview,
    }));
  } catch (error) {
    console.error("Error fetching movies by genre:", error);
    return [];
  }
};

// Fetch TV shows by genre
export const fetchTVShowsByGenre = async (genreId, page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`
    );
    const data = await response.json();
    return data.results.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w500"),
      backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
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
      image: getImageUrl(movie.poster_path, "w500"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
      image: getImageUrl(movie.poster_path, "w500"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
      image: getImageUrl(show.poster_path, "w500"),
      backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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
      image: getImageUrl(show.poster_path, "w500"),
      backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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

// Fetch multiple pages of movies (for large dataset)
export const fetchAllMovies = async (totalPages = 20) => {
  try {
    const allMovies = [];
    const pagePromises = [];

    // Fetch 20 pages in parallel (400 movies)
    for (let page = 1; page <= totalPages; page++) {
      pagePromises.push(fetchPopularMovies(page));
    }

    const results = await Promise.all(pagePromises);
    results.forEach((pageMovies) => {
      allMovies.push(...pageMovies);
    });

    return allMovies;
  } catch (error) {
    console.error("Error fetching all movies:", error);
    return [];
  }
};

// Fetch multiple pages of TV shows (for large dataset)
export const fetchAllTVShows = async (totalPages = 20) => {
  try {
    const allShows = [];
    const pagePromises = [];

    // Fetch 20 pages in parallel (400 TV shows)
    for (let page = 1; page <= totalPages; page++) {
      pagePromises.push(fetchPopularTVShows(page));
    }

    const results = await Promise.all(pagePromises);
    results.forEach((pageShows) => {
      allShows.push(...pageShows);
    });

    return allShows;
  } catch (error) {
    console.error("Error fetching all TV shows:", error);
    return [];
  }
};

// Fetch anime content (using Animation genre ID: 16 for TV)
export const fetchAnime = async (page = 1) => {
  try {
    const response = await fetch(
      `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_genres=16&with_origin_country=JP&page=${page}&sort_by=popularity.desc`
    );
    const data = await response.json();
    return data.results.map((show) => ({
      id: show.id,
      title: show.name,
      image: getImageUrl(show.poster_path, "w500"),
      backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
    }));
  } catch (error) {
    console.error("Error fetching anime:", error);
    return [];
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
    };

    const config = franchiseConfig[franchise];
    if (!config) {
      return { movies: [], tvShows: [] };
    }

    // Special handling for Marvel - fetch collections
    if (franchise === "Marvel") {
      // Search for all Marvel collections
      const searchTerms = [
        "Marvel",
        "Avengers",
        "Iron Man",
        "Thor",
        "Captain America",
        "Spider-Man",
        "X-Men",
        "Wolverine",
        "Deadpool",
        "Guardians",
        "Ant-Man",
        "Doctor Strange",
        "Black Panther",
        "Venom",
        "Fantastic Four",
        "Blade",
        "Ghost Rider",
        "Punisher",
        "Daredevil",
        "Hulk",
        "Eternals",
        "Shang-Chi",
      ];

      const collectionSearchPromises = searchTerms.map(async (term) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/collection?api_key=${API_KEY}&query=${encodeURIComponent(
              term
            )}`
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

      // Marvel TV Show Keywords/Search
      const marvelTVShows = [
        "WandaVision",
        "The Falcon and the Winter Soldier",
        "Loki",
        "What If",
        "Hawkeye",
        "Moon Knight",
        "Ms. Marvel",
        "She-Hulk",
        "Secret Invasion",
        "Echo",
        "Agatha All Along",
        "Daredevil",
        "Jessica Jones",
        "Luke Cage",
        "Iron Fist",
        "The Defenders",
        "The Punisher",
        "Agents of S.H.I.E.L.D.",
        "Agent Carter",
        "Inhumans",
        "Runaways",
        "Cloak & Dagger",
        "Helstrom",
        "The Gifted",
        "Legion",
        "Hit-Monkey",
        "M.O.D.O.K.",
      ];

      // Search for Marvel TV shows
      const tvSearchPromises = marvelTVShows.map(async (showName) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(
              showName
            )}`
          );
          const data = await response.json();
          return data.results?.[0] || null; // Get first result
        } catch (error) {
          console.error(`Error searching TV show ${showName}:`, error);
          return null;
        }
      });

      const collectionsData = await Promise.all(collectionPromises);
      const tvSearchResults = await Promise.all(tvSearchPromises);
      const collectionMovies = collectionsData.flat();

      // Also fetch general Marvel content
      const moviePromises = [];
      for (let page = 1; page <= 5; page++) {
        const movieParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          ...config.movies,
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 5; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          ...config.tv,
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

      // Combine collection movies with discovered movies and remove duplicates
      const allMovies = [...collectionMovies, ...allMovieResults];
      const uniqueMovies = Array.from(
        new Map(allMovies.map((movie) => [movie.id, movie])).values()
      );

      // Combine searched TV shows with discovered TV shows and remove duplicates
      const searchedTVShows = tvSearchResults.filter((show) => show !== null);
      const allTVShows = [...searchedTVShows, ...allTVResults];
      const uniqueTVShows = Array.from(
        new Map(allTVShows.map((show) => [show.id, show])).values()
      );

      const movies = uniqueMovies.map((movie) => ({
        id: movie.id,
        title: movie.title,
        image: getImageUrl(movie.poster_path, "w500"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
        image: getImageUrl(show.poster_path, "w500"),
        backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
        rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
        year: show.first_air_date
          ? new Date(show.first_air_date).getFullYear()
          : "N/A",
        type: "tv",
        overview: show.overview,
      }));

      return { movies, tvShows };
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
            )}`
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

      const tvSearchPromises = starWarsTVShows.map(async (showName) => {
        try {
          const response = await fetch(
            `${BASE_URL}/search/tv?api_key=${API_KEY}&query=${encodeURIComponent(
              showName
            )}`
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

      // Also fetch general Star Wars content
      const moviePromises = [];
      for (let page = 1; page <= 3; page++) {
        const movieParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          ...config.movies,
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 3; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          ...config.tv,
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
        image: getImageUrl(movie.poster_path, "w500"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
        image: getImageUrl(show.poster_path, "w500"),
        backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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
            )}`
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
            )}`
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
          ...config.movies,
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 3; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          ...config.tv,
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
        image: getImageUrl(movie.poster_path, "w500"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
        image: getImageUrl(show.poster_path, "w500"),
        backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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
            )}`
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
            )}`
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
          ...config.movies,
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 3; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          ...config.tv,
        });
        tvPromises.push(fetch(`${BASE_URL}/discover/tv?${tvParams}`));
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvResponses),
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
        image: getImageUrl(movie.poster_path, "w500"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
        image: getImageUrl(show.poster_path, "w500"),
        backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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
            )}`
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
            )}`
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
          ...config.movies,
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 3; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          ...config.tv,
        });
        tvPromises.push(fetch(`${BASE_URL}/discover/tv?${tvParams}`));
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvResponses),
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
        image: getImageUrl(movie.poster_path, "w500"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
        image: getImageUrl(show.poster_path, "w500"),
        backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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
            )}`
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
            )}`
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
          ...config.movies,
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 2; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          ...config.tv,
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
        image: getImageUrl(movie.poster_path, "w500"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
        image: getImageUrl(show.poster_path, "w500"),
        backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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
            )}`
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
          ...config.movies,
        });
        moviePromises.push(fetch(`${BASE_URL}/discover/movie?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 3; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
          ...config.tv,
        });
        tvPromises.push(fetch(`${BASE_URL}/discover/tv?${tvParams}`));
      }

      const [movieResponses, tvResponses] = await Promise.all([
        Promise.all(moviePromises),
        Promise.all(tvResponses),
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
        image: getImageUrl(movie.poster_path, "w500"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
        image: getImageUrl(show.poster_path, "w500"),
        backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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
            )}`
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
        });
        moviePromises.push(fetch(`${BASE_URL}/movie/popular?${movieParams}`));
      }

      const tvPromises = [];
      for (let page = 1; page <= 2; page++) {
        const tvParams = new URLSearchParams({
          api_key: API_KEY,
          page: page,
          sort_by: "popularity.desc",
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
        image: getImageUrl(movie.poster_path, "w500"),
        backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
        image: getImageUrl(show.poster_path, "w500"),
        backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
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
        ...config.movies,
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
        ...config.tv,
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
      image: getImageUrl(movie.poster_path, "w500"),
      backdrop: getBackdropUrl(movie.backdrop_path, "w1280"),
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
      image: getImageUrl(show.poster_path, "w500"),
      backdrop: getBackdropUrl(show.backdrop_path, "w1280"),
      rating: show.vote_average ? show.vote_average.toFixed(1) : "N/A",
      year: show.first_air_date
        ? new Date(show.first_air_date).getFullYear()
        : "N/A",
      type: "tv",
      overview: show.overview,
    }));

    return { movies, tvShows };
  } catch (error) {
    console.error("Error fetching franchise content:", error);
    return { movies: [], tvShows: [] };
  }
};
