const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

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
const publicDir = path.join(__dirname, "public");
fs.watch(publicDir, (eventType, filename) => {
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
