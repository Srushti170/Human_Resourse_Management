// import { v2 as cloudinary } from "cloudinary";
// import fs from "fs"

// cloudinary.config({ 
//     cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//     api_key: process.env.CLOUDINARY_API_KEY, 
//     api_secret: process.env.CLOUDINARY_API_SECRET 
// });



// const uploadOnCloudinary = async (localFilePath) => {
//     try{
//         if(!localFilePath) return null;
//         // upload the file on cloudinary
//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: "auto"
//         })
//         // file has been uploaded successfully 
//         console.log("file has been uploaded successfully", response.url)
//         return response;
//     }
//     catch(error){
//         fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
//         return null;
//     }
// }

// export {uploadOnCloudinary}

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError";
import {extractPublicId} from "cloudinary-build-url"
import { response } from "express";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            // console.log("❌ No file path found");
            return null;
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // console.log("☁️ Cloudinary Upload Success:", response.url);

        // DELETE FILE AFTER UPLOAD
        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        // console.log("❌ Cloudinary upload error:", error.message);

        // delete file even if upload fails
        fs.unlinkSync(localFilePath);

        return null;
    }
};

const deleteOnCloudinary = async(image) => {
    try{
        if(!image){
            throw new ApiError(404, "Image Invalid")
        }

        const publicId = extractPublicId(image)

        const response = await cloudinary.uploader.destroy(publicId)
        if(response.result != 'ok'){
            throw new ApiError(400, "Old image deletion failed on cloudinary")
        }

        return 1;
    }
    catch(error){
        return null;
    }
}

export { uploadOnCloudinary, deleteOnCloudinary };
