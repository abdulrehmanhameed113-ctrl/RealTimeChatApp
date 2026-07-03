const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

/**
 * Uploads a file (either a buffer or a base64 string) to Cloudinary.
 * @param {Buffer|string} fileSource - The file buffer or base64 data string.
 * @param {string} folder - The folder name in Cloudinary.
 * @returns {Promise<object>} - Resolves with the Cloudinary upload result.
 */
const uploadToCloudinary = (fileSource, folder) => {
    return new Promise((resolve, reject) => {
        if (Buffer.isBuffer(fileSource)) {
            const stream = cloudinary.uploader.upload_stream(
                { folder },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            streamifier.createReadStream(fileSource).pipe(stream);
        } else if (typeof fileSource === "string") {
            cloudinary.uploader.upload(
                fileSource,
                { folder },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
        } else {
            reject(new Error("Invalid file source type. Must be a Buffer or Base64 string."));
        }
    });
};

module.exports = {
    uploadToCloudinary,
};
