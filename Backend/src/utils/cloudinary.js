// updated uploadsToCloudinary.js
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

/* ===============================
   CLOUDINARY CONFIG
================================= */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET || process.env.CLOUDINARY_SECR,
});

/* ===============================
   BUFFER → STREAM
================================= */
const bufferToStream = (buffer) => {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

/* ===============================
   UPLOAD FILE
================================= */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetryUpload = (error) => {
  const code = error?.http_code;
  const name = error?.name;
  const message = String(error?.message || '').toLowerCase();

  return (
    code === 499 ||
    code === 500 ||
    name === 'TimeoutError' ||
    message.includes('timeout') ||
    message.includes('socket') ||
    message.includes('econnreset')
  );
};

const uploadOnce = (fileBuffer, folder) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
        timeout: Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS || 120000),
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }, // auto webp/avif optimization
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    bufferToStream(fileBuffer).pipe(uploadStream);
  });

export const uploadsToCloudinary = async (
  fileBuffer,
  folder = 'uploads',
  options = {}
) => {
  const maxRetries = options.maxRetries ?? 2;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      return await uploadOnce(fileBuffer, folder);
    } catch (error) {
      if (attempt === maxRetries || !shouldRetryUpload(error)) {
        console.error('Cloudinary upload error:', error);
        throw error;
      }

      attempt += 1;
      await sleep(400 * attempt);
    }
  }
};

/* ===============================
   DELETE FILE
================================= */
export const deleteFromCloudinary = async (publicId) => {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    throw err;
  }
};
