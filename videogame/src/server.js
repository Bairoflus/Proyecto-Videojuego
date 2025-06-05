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

  // Handle root path
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(302, {
      'Location': '/pages/html/landing.html'
    });
    return res.end();
  }

  // Parse URL for other paths
  let filePath;
  if (req.url.startsWith('/pages/') || req.url.startsWith('/assets/') || req.url.startsWith('/utils/') || req.url.startsWith('/classes/') || req.url.startsWith('/constants/')) {
    filePath = path.join(__dirname, req.url);
  } else if (req.url.endsWith('.js') && !req.url.includes('/')) {
    // Serve JS files directly from src directory (like main.js)
    filePath = path.join(__dirname, req.url);
  } else {
    filePath = path.join(__dirname, '..', req.url);
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
}); 