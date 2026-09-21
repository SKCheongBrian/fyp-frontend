const http = require("node:http");

// Keep API calls on the frontend origin while running Java on the loopback API.
module.exports = function setupProxy(app) {
  if (process.env.REACT_APP_DEBUGGER_URL !== "/run-debugger") return;

  app.post("/run-debugger", (req, res) => {
    const upstream = http.request({
      hostname: "127.0.0.1",
      port: 4000,
      path: "/run-debugger",
      method: "POST",
      headers: { ...req.headers, host: "127.0.0.1:4000" },
    }, (response) => {
      res.writeHead(response.statusCode, response.headers);
      response.pipe(res);
    });
    upstream.on("error", () => {
      if (!res.headersSent) {
        res.status(502).json({
          isSuccess: false,
          errorMessage: "Local Java API is unavailable. Restart the app with npm run start:local.",
        });
      } else {
        res.end();
      }
    });
    req.on("aborted", () => upstream.destroy());
    req.pipe(upstream);
  });
};
