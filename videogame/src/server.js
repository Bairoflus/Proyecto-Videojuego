/**
 * Simple HTTP server for serving frontend files during development
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 8080;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Add CORS headers for ES6 module loading
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  // Handle root path
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(302, {
      'Location': '/pages/html/landing.html'
    });
    return res.end();
  }

  // Parse URL for frontend files only - NO API ROUTES
  let filePath;
  if (req.url.startsWith('/pages/') || req.url.startsWith('/assets/') || req.url.startsWith('/utils/') || req.url.startsWith('/classes/') || req.url.startsWith('/constants/')) {
    filePath = path.join(__dirname, req.url);
  } else if (req.url.endsWith('.js') && req.url.split('/').length === 2) {
    // Serve JS files directly from src directory (like main.js)
    // Only matches /filename.js (one slash at beginning + filename)
    filePath = path.join(__dirname, req.url);
  } else {
    // For any other path (including /api/*), return 404
    // API calls should go to backend on port 3000
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('404 Not Found - Frontend server only serves static files', 'utf-8');
    return;
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        const notFoundPath = path.join(__dirname, '..', 'pages', '404.html');
        fs.readFile(notFoundPath, (error, content) => {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(content || '404 Not Found', 'utf-8');
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`, 'utf-8');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}/`);
  console.log(`The game will open at http://localhost:${PORT}/ (landing page)`);
  console.log(`Registration page: http://localhost:${PORT}/pages/html/register.html`);
  console.log(`Login page: http://localhost:${PORT}/pages/html/login.html`);
  console.log(`Game page: http://localhost:${PORT}/pages/html/game.html`);
  console.log(`API requests go to backend on port 3000`);
}); 