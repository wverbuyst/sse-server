const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = 3000;
let clients = [];

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);

  // SSE endpoint
  if (parsedUrl.pathname === "/events") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    res.write("data: connected\n\n");
    clients.push(res);

    req.on("close", () => {
      clients = clients.filter((client) => client !== res);
    });
    return;
  }

  // Serve static files
  let filePath = path.join(__dirname, parsedUrl.pathname);
  if (!path.extname(filePath)) {
    filePath = path.join(filePath, "index.html");
  }

  fs.readFile(filePath, "utf8", (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end("File not found");
      return;
    }

    // Inject JavaScript
    if (path.extname(filePath) === ".html") {
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
      content = content.replace("</body>", `${injectedScript}</body>`);
    }

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(content, "utf-8");
  });
});

// File watching and sending SSE messages
fs.watch(__dirname, { recursive: true }, (_, filename) => {
  if (filename && filename.endsWith(".html")) {
    console.log(`File changed: ${filename}`);
    clients.forEach((client) => {
      client.write("data: reload\n\n");
    });
  }
});

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
