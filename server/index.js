import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
  'http://localhost:8080',
  'http://localhost:8081', 
  'http://localhost:3000'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    port: PORT,
    allowedOrigins 
  });
});

// Proxy endpoint for local LLM API calls
app.all('/api/local/*', async (req, res) => {
  try {
    // Get the target URL from query parameter, header, or environment variable
    const targetUrlParam = req.query.target || req.headers['x-target-url'];
    const localLLMUrl = targetUrlParam || process.env.LOCAL_LLM_URL || 'http://localhost:11434';
    const timeout = parseInt(process.env.LOCAL_LLM_TIMEOUT) || 300000; // 5 minutes default
    
    // Extract the path after /api/local/
    const apiPath = req.path.replace('/api/local', '');
    
    // Handle URLs that already have /v1 or /api/v1 suffix
    let targetUrl;
    if (localLLMUrl.endsWith('/api/v1')) {
      // Remove /v1 from the path since /api/v1 is already in the target URL
      const cleanPath = apiPath.replace('/v1', '');
      targetUrl = `${localLLMUrl}${cleanPath}`;
    } else if (localLLMUrl.endsWith('/v1')) {
      // Remove /v1 from the path since /v1 is already in the target URL
      const cleanPath = apiPath.replace('/v1', '');
      targetUrl = `${localLLMUrl}${cleanPath}`;
    } else {
      targetUrl = `${localLLMUrl}${apiPath}`;
    }
    
    console.log(`[${new Date().toISOString()}] Proxying ${req.method} request to: ${targetUrl}`);
    console.log(`[${new Date().toISOString()}] Original localLLMUrl: ${localLLMUrl}`);
    console.log(`[${new Date().toISOString()}] API path: ${apiPath}`);
    console.log(`[${new Date().toISOString()}] Request body:`, JSON.stringify(req.body, null, 2));
    
    // Forward the request to the local LLM server
    const response = await axios({
      method: req.method,
      url: targetUrl,
      data: req.body,
      headers: {
        ...req.headers,
        host: undefined, // Remove host header to avoid conflicts
        'content-type': 'application/json'
      },
      timeout: timeout,
      maxRedirects: 0,
      validateStatus: () => true // Accept all status codes
    });
    
    // Forward the response back to the client
    res.status(response.status);
    
    // Forward response headers
    Object.keys(response.headers).forEach(key => {
      if (!['content-encoding', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) {
        res.setHeader(key, response.headers[key]);
      }
    });
    
    res.send(response.data);
    
    console.log(`[${new Date().toISOString()}] Response: ${response.status} ${response.statusText}`);
    if (response.status >= 400) {
      console.log(`[${new Date().toISOString()}] Error response body:`, JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Proxy error:`, error.message);
    
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        error: 'Local LLM server connection refused',
        message: 'Please ensure your local LLM server is running',
        details: error.message
      });
    } else if (error.code === 'ECONNRESET') {
      res.status(503).json({
        error: 'Local LLM server connection reset',
        message: 'The local LLM server may have stopped or is overloaded',
        details: error.message
      });
    } else if (error.code === 'ETIMEDOUT') {
      res.status(504).json({
        error: 'Request timeout',
        message: 'The local LLM server took too long to respond',
        timeout: timeout
      });
    } else {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        type: error.constructor.name
      });
    }
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('🚀 SOC1 Analysis Backend Server');
  console.log('================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Local LLM URL: ${process.env.LOCAL_LLM_URL || 'http://localhost:11434'}`);
  console.log(`⏱️  Timeout: ${process.env.LOCAL_LLM_TIMEOUT || 300000}ms`);
  console.log(`🌍 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log('================================\n');
});

// Handle port already in use error
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use!`);
    console.error('💡 Solutions:');
    console.error('   1. Kill the existing process: taskkill /PID <PID> /F');
    console.error('   2. Use a different port by setting PORT environment variable');
    console.error('   3. Find the process using: netstat -ano | findstr :3001');
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});
