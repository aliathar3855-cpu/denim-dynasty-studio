/**
 * Helper to upload multiple image files to Cloudinary via Next.js API route.
 * 
 * @param files Array of File objects selected from device
 * @returns Array of uploaded secure Cloudinary URLs
 */
export async function uploadImages(files: File[]): Promise<string[]> {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to upload images to Cloudinary");
  }

  const result = await response.json();
  return result.urls || [];
}
