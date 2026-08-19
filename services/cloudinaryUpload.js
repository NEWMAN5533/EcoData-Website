import  cloudinary  from "../config/cloudinary.js";
import { Readable } from "node:stream";

export function uploadToCloudinary(buffer, options = {}){
  return new Promise((resolve, reject ) => {
    const uploadStream =
    cloudinary.uploader.upload_stream({
      resource_type: options.resourceType || "auto",
      folder: options.folder || "ecodata/products", 
      public_id: options.publicId,
      type: options.type || "upload"
    },
    (error, result) => {
      if(error){
        reject(error);
        return;
      }
      resolve(result);
    }
  );
  Readable
  .from(buffer)
  .pipe(uploadStream);
  });
}
