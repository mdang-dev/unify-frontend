import cloudinary from '@/src/configs/cloudinary.config';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Check if Cloudinary is properly configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary environment variables are not configured');
      return NextResponse.json({ 
        error: 'File upload service is not configured. Please contact support.' 
      }, { status: 500 });
    }

    const formData = await req.formData();
    const newFiles = formData.getAll('files');

    if (!newFiles || newFiles.length === 0) {
      return NextResponse.json({ files: [] });
    }

    const uploadPromises = newFiles.map(async (file) => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'uploads' },
            (error, result) => {
              if (error) {
                console.error('Cloudinary upload error:', error);
                reject(new Error(`Failed to upload file: ${error.message}`));
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
      } catch (fileError) {
        console.error('File processing error:', fileError);
        throw new Error(`Failed to process file: ${fileError.message}`);
      }
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    const allFiles = [...uploadedFiles];

    return NextResponse.json({ files: allFiles });
  } catch (error) {
    console.error('Upload API Error:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Upload failed';
    let statusCode = 500;
    
    if (error.message.includes('Cloudinary')) {
      errorMessage = 'File upload service error';
      statusCode = 503;
    } else if (error.message.includes('process file')) {
      errorMessage = 'File processing error';
      statusCode = 400;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
  }
}
