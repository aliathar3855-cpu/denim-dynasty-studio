/**
 * Helper to upload multiple image files directly to Cloudinary from the client side.
 * 
 * @param files Array of File objects selected from device
 * @returns Array of uploaded secure Cloudinary URLs
 */
export async function uploadImages(files: File[]): Promise<string[]> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dvja3sd47";
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "denim_upload";
  const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  console.log("Selected file(s) for upload:", files);

  const secureUrls: string[] = [];

  for (const file of files) {
    console.log("Selected file details:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });
    console.log(`Upload start to Cloudinary for file: ${file.name} to URL: ${uploadUrl}`);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Cloudinary upload failed for ${file.name}:`, errorText);
        throw new Error(`Cloudinary upload failed for ${file.name}: ${errorText}`);
      }

      const result = await response.json();
      console.log(`Cloudinary response for ${file.name}:`, result);

      if (result && result.secure_url) {
        console.log(`Secure URL verified for ${file.name}:`, result.secure_url);
        secureUrls.push(result.secure_url);
      } else {
        console.error(`secure_url not found in Cloudinary response for ${file.name}:`, result);
        throw new Error(`Cloudinary response for ${file.name} did not contain secure_url`);
      }
    } catch (err: any) {
      console.error(`Error during uploading file ${file.name}:`, err);
      throw err; // Propagate the error so it doesn't fail silently
    }
  }

  return secureUrls;
}
