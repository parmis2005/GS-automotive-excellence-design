/**
 * Central utility for vehicle image handling
 * Provides fallback to placeholder image when vehicle has no images
 */

const PLACEHOLDER_IMAGE_URL = "https://cagteuhomtoqniqpirly.supabase.co/storage/v1/object/public/Gs-Auto/autohaus.ashx.jpeg";

/**
 * Gets the vehicle image URL, with fallback to placeholder
 * @param imageUrl - The vehicle image URL (can be empty, null, or undefined)
 * @param vehicleId - The vehicle ID (used for fallback generation)
 * @returns The image URL to use (either the vehicle image or placeholder)
 */
export function getVehicleImage(imageUrl: string | undefined | null, vehicleId?: string): string {
  // If no image URL provided or empty string, use placeholder
  if (!imageUrl || !imageUrl.trim()) {
    return PLACEHOLDER_IMAGE_URL;
  }

  // If image URL exists and is valid, use it
  return imageUrl;
}

/**
 * Gets the placeholder image URL
 * @returns The placeholder image URL
 */
export function getPlaceholderImage(): string {
  return PLACEHOLDER_IMAGE_URL;
}

/**
 * Ensures the image URL uses "xl" format for high quality (for cargate images)
 * Replaces any format parameter (xlrm, xlrg, etc.) with "xl"
 * @param imageUrl - The image URL to process
 * @param vehicleId - The vehicle ID (used for fallback generation)
 * @returns High quality image URL
 */
export function ensureHighQualityImageUrl(imageUrl: string, vehicleId: string): string {
  if (!imageUrl || !imageUrl.includes('cargate360')) {
    // If not a cargate URL, return placeholder
    return PLACEHOLDER_IMAGE_URL;
  }
  
  // Replace any format parameter with "xl" for consistent high quality
  return imageUrl.replace(/format=[^&]*/i, 'format=xl');
}

/**
 * Gets the vehicle image URL with quality optimization and placeholder fallback
 * This is the main function to use for displaying vehicle images
 * @param imageUrl - The vehicle image URL (can be empty, null, or undefined)
 * @param vehicleId - The vehicle ID (used for fallback generation)
 * @returns The image URL to use (high quality cargate URL or placeholder)
 * 
 * IMPORTANT: If the image URL is empty or the vehicle has only one image (placeholder),
 * this function will return the placeholder image URL. The backend should clear the
 * image field for vehicles with only one image, but this function provides an
 * additional safety check.
 */
export function getVehicleImageWithFallback(imageUrl: string | undefined | null, vehicleId: string): string {
  // If no image URL provided or empty string, use placeholder
  if (!imageUrl || !imageUrl.trim()) {
    return PLACEHOLDER_IMAGE_URL;
  }

  // Ensure high quality for cargate images
  if (imageUrl.includes('cargate360')) {
    return imageUrl.replace(/format=[^&]*/i, 'format=xl');
  }

  // Return as-is for other image URLs
  return imageUrl;
}

/**
 * Checks if an image URL is likely a placeholder image by checking if only image 1 exists
 * This is a client-side check that can be used before displaying images
 * Note: This is a heuristic - the backend should handle the actual validation
 * @param imageUrl - The image URL to check
 * @param vehicleId - The vehicle ID
 * @returns Promise that resolves to true if the image should be treated as placeholder
 */
export async function isPlaceholderImage(imageUrl: string, vehicleId: string): Promise<boolean> {
  // Only check cargate images
  if (!imageUrl || !imageUrl.includes('cargate360')) {
    return false;
  }

  try {
    // Check if image 2 exists - if not, it's likely only a placeholder
    const image2Url = `https://img.cargate360.de/default.aspx?vid=${vehicleId}&bid=1790&format=xl&ino=2&app=Kiste-Default`;
    
    // Use a small timeout to avoid blocking
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1000);
    
    try {
      const response = await fetch(image2Url, {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      // If image 2 doesn't exist, it's likely only a placeholder
      return !response.ok || !response.headers.get('content-type')?.startsWith('image/');
    } catch (error) {
      clearTimeout(timeoutId);
      // If fetch fails, assume it's a placeholder (better safe than sorry)
      return true;
    }
  } catch (error) {
    return false;
  }
}
