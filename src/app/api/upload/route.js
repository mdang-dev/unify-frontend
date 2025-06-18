import cloudinary from '@/src/configs/cloudinary.config';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const newFiles = formData.getAll('files');

    if (!newFiles || newFiles.length === 0) {
      return NextResponse.json({ files: [] });
    }

    const uploadPromises = newFiles.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'auto', folder: 'uploads' },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve({
                url: result.secure_url,
                file_type: result.format,
                size: result.bytes,
                media_type: result.resource_type.toUpperCase(),
              });
            }
          }
        );

        uploadStream.end(buffer);
      });
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    const allFiles = [...uploadedFiles];

    return NextResponse.json({ files: allFiles });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
