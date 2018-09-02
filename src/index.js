// Source: https://github.com/Financial-Times/ftdomdelegate

const http = require('http');
const fs = require('fs');
const path = require('path');
const {handleIndex, handleSearch} = require('./handlers');
const urlutil = require('url');
const static = require('node-static');

var fileServer = new static.Server(path.join(__dirname, '../static'));

// Renders a 500 Internal Error page.
function errorHandler(req, res) {
   fileServer.serveFile('../templates/500.html', 500, {}, req, res);
}

// Renders a 404 Not Found page.
function notFoundHandler(req, res) {
   fileServer.serveFile('../templates/404.html', 404, {}, req, res);
}

// Crude HTTP server with path based routing. Will 404 if path does
// not match handlers.
function createServer() {
  return http.createServer(async (req, res) => {
    try {
      const path = urlutil.parse(req.url).pathname;
      switch (path) {
      case '/':
        await handleIndex(req, res);
        break;
      case '/search':
        await handleSearch(req, res);
        break;
      default:
        // Static handler...
        req.addListener('end', function () {
          fileServer.serve(req, res, function (err) {
            if (err && (err.status === 404)) {
              notFoundHandler(req, res);
            }
          });
        }).resume();
      }
    } catch (err) {
      console.error(err);
      errorHandler(req, res);
    }
  });
}

exports.createServer = createServer;

// If this file is the main entrypoint start the server.
if (__filename === require.main.filename) {
  const server = createServer();
  const host = process.env.NODE_ENV === 'production' ? undefined : 'localhost';
  server.listen({host, port: process.env.PORT || 8000}, function () {
    const {port, address} = server.address();
    console.log(`server listening on http://${address}:${port}`);
  });
}
