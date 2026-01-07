// Video scraper service - Extracts direct video URLs from embed providers
// This bypasses ads by getting the raw .m3u8 or .mp4 stream

const TIMEOUT = 15000; // 15 second timeout

/**
 * Scrape video URL from vidsrc.to
 * @param {string} mediaId - TMDB ID
 * @param {string} mediaType - 'movie' or 'tv'
 * @param {number} season - Season number (for TV)
 * @param {number} episode - Episode number (for TV)
 * @returns {Promise<string|null>} Direct video URL or null
 */
export const scrapeVidSrc = async (mediaId, mediaType, season = null, episode = null) => {
  try {
    console.log('[VidSrc] Scraping:', { mediaId, mediaType, season, episode });
    
    // Build vidsrc.to embed URL
    let embedUrl;
    if (mediaType === 'tv') {
      embedUrl = `https://vidsrc.to/embed/tv/${mediaId}/${season}/${episode}`;
    } else {
      embedUrl = `https://vidsrc.to/embed/movie/${mediaId}`;
    }

    // Fetch the embed page
    const embedResponse = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://vidsrc.to/',
      },
    });

    const embedHtml = await embedResponse.text();
    
    // Extract data-id from the embed page (vidsrc uses this for their API)
    const dataIdMatch = embedHtml.match(/data-id="([^"]+)"/);
    if (!dataIdMatch) {
      console.log('[VidSrc] Could not find data-id');
      return null;
    }

    const dataId = dataIdMatch[1];
    console.log('[VidSrc] Found data-id:', dataId);

    // Call vidsrc API to get sources
    const sourcesUrl = `https://vidsrc.to/ajax/embed/episode/${dataId}/sources`;
    const sourcesResponse = await fetch(sourcesUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': embedUrl,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const sourcesData = await sourcesResponse.json();
    
    if (!sourcesData.result || sourcesData.result.length === 0) {
      console.log('[VidSrc] No sources found');
      return null;
    }

    // Get the first source ID
    const sourceId = sourcesData.result[0].id;
    console.log('[VidSrc] Using source:', sourceId);

    // Get the actual video URL
    const videoUrl = `https://vidsrc.to/ajax/embed/source/${sourceId}`;
    const videoResponse = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': embedUrl,
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    const videoData = await videoResponse.json();
    
    if (videoData.result && videoData.result.url) {
      const directUrl = videoData.result.url;
      console.log('[VidSrc] ✅ Found video URL:', directUrl);
      return directUrl;
    }

    return null;
  } catch (error) {
    console.error('[VidSrc] Scraping error:', error);
    return null;
  }
};

/**
 * Scrape from vidsrc.me (alternative provider)
 */
export const scrapeVidSrcMe = async (mediaId, mediaType, season = null, episode = null) => {
  try {
    console.log('[VidSrc.me] Scraping:', { mediaId, mediaType, season, episode });
    
    let apiUrl;
    if (mediaType === 'tv') {
      apiUrl = `https://vidsrc.me/embed/${mediaId}/${season}-${episode}`;
    } else {
      apiUrl = `https://vidsrc.me/embed/${mediaId}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const html = await response.text();
    
    // Look for video sources in the page
    const m3u8Match = html.match(/(https?:\/\/[^"'\s]+\.m3u8[^"'\s]*)/);
    const mp4Match = html.match(/(https?:\/\/[^"'\s]+\.mp4[^"'\s]*)/);
    
    if (m3u8Match) {
      console.log('[VidSrc.me] ✅ Found m3u8:', m3u8Match[1]);
      return m3u8Match[1];
    }
    
    if (mp4Match) {
      console.log('[VidSrc.me] ✅ Found mp4:', mp4Match[1]);
      return mp4Match[1];
    }

    return null;
  } catch (error) {
    console.error('[VidSrc.me] Scraping error:', error);
    return null;
  }
};

/**
 * Main scraper function - tries multiple providers in order
 */
export const scrapeVideoUrl = async (mediaId, mediaType, season = null, episode = null) => {
  console.log('🎬 Starting video scraping...', { mediaId, mediaType, season, episode });

  // Try vidsrc.to first (most reliable)
  const vidsrcUrl = await scrapeVidSrc(mediaId, mediaType, season, episode);
  if (vidsrcUrl) {
    return { url: vidsrcUrl, provider: 'vidsrc.to' };
  }

  console.log('⚠️ vidsrc.to failed, trying vidsrc.me...');
  
  // Try vidsrc.me as fallback
  const vidsrcMeUrl = await scrapeVidSrcMe(mediaId, mediaType, season, episode);
  if (vidsrcMeUrl) {
    return { url: vidsrcMeUrl, provider: 'vidsrc.me' };
  }

  console.log('❌ All scrapers failed');
  return null;
};

/**
 * Quick test to see if a video URL is accessible
 */
export const testVideoUrl = async (url) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.log('Video URL test failed:', error.message);
    return false;
  }
};
