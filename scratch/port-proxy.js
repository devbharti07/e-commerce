const http = require("http");

const server = http.createServer((req, res) => {
  const headers = { ...req.headers, host: "localhost:3001" };
  const options = {
    hostname: "127.0.0.1",
    port: 3001,
    path: req.url,
    method: req.method,
    headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    res.writeHead(502, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Port 3000 proxy error", details: err.message }));
  });

  req.pipe(proxyReq, { end: true });
});

server.listen(3000, "0.0.0.0", () => {
  console.log("Port 3000 -> 3001 proxy active");
});
