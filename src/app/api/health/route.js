export async function GET() {
  try {
    // ✅ OPTIMIZED: Simple health check endpoint
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version,
      platform: process.platform,
      arch: process.arch
    };

    return Response.json(healthStatus, { status: 200 });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
} 