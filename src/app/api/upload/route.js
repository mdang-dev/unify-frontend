import { uploadFile } from '@/src/utils/upload-media.util';
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
      message: 'Upload API is ready (Supabase)',
      timestamp: new Date().toISOString(),
      endpoint: '/api/upload',
      methods: ['GET', 'POST', 'OPTIONS'],
      cors: 'enabled',
      storage: 'supabase'
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

// Enhanced POST method with Supabase Storage
export async function POST(req) {
  console.log('📋 POST request received for file upload (Supabase)');

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

      // File size limit (50MB for Supabase)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        errors.push(`File ${i + 1} (${file.name}): File too large (${file.size} bytes, max: ${maxSize})`);
        continue;
      }

      // File type validation (optional)
      const allowedTypes = ['image/', 'video/', 'audio/'];
      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      if (!isValidType) {
        errors.push(`File ${i + 1} (${file.name}): Unsupported file type (${file.type})`);
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

    // Upload files to Supabase Storage
    const uploadPromises = validFiles.map(async (file, index) => {
      try {
        console.log(`📋 Starting upload for file ${index + 1}: ${file.name}`);

        const result = await uploadFile(file, 'uploads');

        if (result.error) {
          throw new Error(result.error);
        }

        return result.data;
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
      storage: 'supabase',
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error.toString(),
      })
    }, { status: 500 });

    return addCorsHeaders(errorResponse);
  }
}