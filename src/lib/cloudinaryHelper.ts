/**
 * Injects Cloudinary transformations into an image URL to optimize quality and resolution.
 * If the image is not a Cloudinary URL, it returns it as is.
 * 
 * @param url The raw image URL
 * @param width The target width in pixels
 * @param quality The compression quality (defaults to "auto")
 * @returns The optimized image URL string
 */
export const getOptimizedImageUrl = (url: string, width = 1200, quality = "auto"): string => {
  if (!url) {
    return "/placeholder-product.png";
  }

  // Check if it's a Cloudinary asset
  if (url.includes("res.cloudinary.com")) {
    // Replace "/upload/" with the optimized transformation segment
    // E.g. /upload/ -> /upload/w_800,q_auto,f_auto/
    if (url.includes("/upload/")) {
      return url.replace("/upload/", `/upload/w_${width},q_${quality},f_auto/`);
    }
  }

  return url;
};
