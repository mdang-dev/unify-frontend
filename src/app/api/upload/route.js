import cloudinary from '@/src/configs/cloudinary.config';
import { NextResponse } from 'next/server';

// CORS headers for React Native compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// Helper function to add CORS headers to response
function addCorsHeaders(response) {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

// OPTIONS method for preflight requests
export async function OPTIONS(req) {
  console.log('📋 OPTIONS request received for upload route');
  return addCorsHeaders(new NextResponse(null, { status: 200 }));
}

// GET method for connectivity testing
export async function GET(req) {
  console.log('📋 GET request received for upload route connectivity test');

  try {
    const response = NextResponse.json({
      status: 'ok',
      message: 'Upload API is ready',
      timestamp: new Date().toISOString(),
      endpoint: '/api/upload',
      methods: ['GET', 'POST', 'OPTIONS'],
      cors: 'enabled'
    });

    return addCorsHeaders(response);
  } catch (error) {
    console.error('❌ Error in GET /api/upload:', error);
    const errorResponse = NextResponse.json(
      {
        error: 'API health check failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );

    return addCorsHeaders(errorResponse);
  }
}

// Enhanced POST method with better error handling and logging
export async function POST(req) {
  console.log('📋 POST request received for file upload');

  try {
    // Log request details for debugging
    const contentType = req.headers.get('content-type') || 'unknown';
    console.log(`📋 Content-Type: ${contentType}`);

    const formData = await req.formData();
    const newFiles = formData.getAll('files');

    console.log(`📋 Number of files received: ${newFiles.length}`);

    if (!newFiles || newFiles.length === 0) {
      console.log('⚠️ No files provided in request');
      const response = NextResponse.json({
        files: [],
        message: 'No files provided'
      });
      return addCorsHeaders(response);
    }

    // Validate files before processing
    const validFiles = [];
    const errors = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      console.log(`📋 Processing file ${i + 1}: ${file.name} (${file.size} bytes, ${file.type})`);

      // Basic file validation
      if (!file.name || file.size === 0) {
        errors.push(`File ${i + 1}: Invalid file (empty or no name)`);
        continue;
      }

      // File size limit (10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        errors.push(`File ${i + 1} (${file.name}): File too large (${file.size} bytes, max: ${maxSize})`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      console.log('❌ No valid files to upload');
      const response = NextResponse.json({
        error: 'No valid files to upload',
        details: errors,
        files: []
      }, { status: 400 });
      return addCorsHeaders(response);
    }

    console.log(`📋 Processing ${validFiles.length} valid files`);

    const uploadPromises = validFiles.map(async (file, index) => {
      try {
        console.log(`📋 Starting upload for file ${index + 1}: ${file.name}`);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: 'auto',
              folder: 'uploads',
              // Add timeout and other options for better reliability
              timeout: 60000, // 60 seconds
            },
            (error, result) => {
              if (error) {
                console.error(`❌ Cloudinary error for file ${file.name}:`, error);
                reject(new Error(`Upload failed for ${file.name}: ${error.message}`));
              } else {
                console.log(`✅ Successfully uploaded file ${file.name} to ${result.secure_url}`);
                resolve({
                  url: result.secure_url,
                  file_type: result.format,
                  size: result.bytes,
                  media_type: result.resource_type.toUpperCase(),
                  original_name: file.name,
                  public_id: result.public_id,
                });
              }
            }
          );

          uploadStream.end(buffer);
        });
      } catch (error) {
        console.error(`❌ Error processing file ${file.name}:`, error);
        throw new Error(`Failed to process ${file.name}: ${error.message}`);
      }
    });

    const uploadResults = await Promise.allSettled(uploadPromises);

    const uploadedFiles = [];
    const uploadErrors = [];

    uploadResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        uploadedFiles.push(result.value);
      } else {
        const fileName = validFiles[index]?.name || `file_${index + 1}`;
        uploadErrors.push(`${fileName}: ${result.reason.message}`);
        console.error(`❌ Upload failed for ${fileName}:`, result.reason);
      }
    });

    console.log(`📋 Upload completed: ${uploadedFiles.length} successful, ${uploadErrors.length} failed`);

    // Return response with both successful uploads and any errors
    const responseData = {
      files: uploadedFiles,
      uploaded_count: uploadedFiles.length,
      total_files: newFiles.length,
    };

    if (uploadErrors.length > 0) {
      responseData.errors = uploadErrors;
      responseData.partial_success = true;
    }

    if (errors.length > 0) {
      responseData.validation_errors = errors;
    }

    const response = NextResponse.json(responseData);
    return addCorsHeaders(response);

  } catch (error) {
    console.error('❌ Critical error in POST /api/upload:', error);

    // Enhanced error logging for debugging
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      cause: error.cause,
    });

    const errorResponse = NextResponse.json({
      error: 'Upload failed',
      message: error.message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.toString(),
      })
    }, { status: 500 });

    return addCorsHeaders(errorResponse);
  }
}
