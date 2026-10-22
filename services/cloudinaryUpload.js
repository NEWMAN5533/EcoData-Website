import  cloudinary  from "../config/cloudinary.js";
import { Readable } from "node:stream";

export function uploadToCloudinary(buffer, options = {}){

  return new Promise((resolve, reject ) => 
    {
    const uploadStream =

    cloudinary.uploader.upload_stream(
      {
      resource_type: options.resource_type || "auto",
      folder: options.folder || "ecodata/products", 
      public_id: options.public_id,
      type: options.type || "upload"
    },

    (error, result) => {
      if(error){
        reject(error);
        return;
      }

      if(!result){
        reject(new Error("Cloudinary returned an empty upload result."));
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

export default cloudinary;
