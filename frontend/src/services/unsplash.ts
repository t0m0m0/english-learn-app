interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    thumb: string;
  };
  alt_description: string | null;
  user?: {
    name: string;
    username: string;
  };
}

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;
const UNSPLASH_API = 'https://api.unsplash.com';

// Cache for images to reduce API calls
const imageCache = new Map<string, UnsplashImage>();

export async function searchImages(query: string): Promise<UnsplashImage[]> {
  // Check cache first
  const cached = imageCache.get(query);
  if (cached) {
    return [cached];
  }

  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('Unsplash API key not set. Using placeholder images.');
    return getPlaceholderImages(query);
  }

  try {
    const response = await fetch(
      `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=squarish`,
      {
        headers: {
          Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();
    const images: UnsplashImage[] = data.results;

    // Cache the first result
    if (images.length > 0) {
      imageCache.set(query, images[0]);
    }

    return images;
  } catch (error) {
    console.error('Error fetching images from Unsplash:', error);
    return getPlaceholderImages(query);
  }
}

export async function getRandomImage(query: string): Promise<UnsplashImage | null> {
  const images = await searchImages(query);
  return images.length > 0 ? images[0] : null;
}

// Placeholder images when API is not available
function getPlaceholderImages(query: string): UnsplashImage[] {
  // Use a placeholder service
  return [
    {
      id: `placeholder-${query}`,
      urls: {
        small: `https://via.placeholder.com/400x400?text=${encodeURIComponent(query)}`,
        regular: `https://via.placeholder.com/800x800?text=${encodeURIComponent(query)}`,
        thumb: `https://via.placeholder.com/200x200?text=${encodeURIComponent(query)}`,
      },
      alt_description: query,
      user: {
        name: 'Placeholder',
        username: 'placeholder',
      },
    },
  ];
}

// Clear cache (useful for memory management)
export function clearImageCache(): void {
  imageCache.clear();
}

// Preload images for a list of words
export async function preloadImages(words: string[]): Promise<void> {
  const uncachedWords = words.filter((word) => !imageCache.has(word));

  // Limit concurrent requests
  const batchSize = 5;
  for (let i = 0; i < uncachedWords.length; i += batchSize) {
    const batch = uncachedWords.slice(i, i + batchSize);
    await Promise.all(batch.map((word) => searchImages(word)));
  }
}
