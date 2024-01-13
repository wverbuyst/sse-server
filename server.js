const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// Define the directory for static files
const publicDir = path.join(__dirname, "public");

// Custom middleware to inject JavaScript into HTML files
app.use((req, res, next) => {
  const filePath = path.join(publicDir, req.url);

  if (path.extname(filePath) === ".html") {
    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        next();
        return;
      }

      // Append the JavaScript for live reloading
      const injectedScript = `
            <script>
               const eventSource = new EventSource("/events");
               eventSource.onmessage = function(event) {
                  if (event.data === "reload") {
                     window.location.reload();
                  }
               };
            </script>
         `;

      const modifiedData = data.replace("</body>", `${injectedScript}</body>`);
      res.send(modifiedData);
    });
  } else {
    next();
  }
});

// Serve static files
app.use(express.static(publicDir));

// Middleware to serve static files
app.use(express.static("public"));

// SSE endpoint for sending reload messages to the client
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  // Add this response (client) to the clients array
  clients.push(res);

  // Send a ping event every 10 seconds to keep the connection open
  const intervalId = setInterval(() => {
    res.write("data: ping\n\n");
  }, 10000);

  // Close the connection when client closes it
  req.on("close", () => {
    clearInterval(intervalId);
    clients = clients.filter((client) => client !== res);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Watch for changes in the public directory
fs.watch(publicDir, (_, filename) => {
  if (filename) {
    console.log(`File changed: ${filename}`);
    // Send a reload event to all connected clients
    for (const client of clients) {
      client.write("data: reload\n\n");
    }
  }
});

// Keep track of connected clients
let clients = [];
