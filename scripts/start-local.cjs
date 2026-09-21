const { spawn } = require("node:child_process");
const { startServer, stopRuns } = require("../server/local-api.cjs");

async function start() {
  const server = await startServer();
  const frontend = spawn(process.execPath, [require.resolve("react-scripts/scripts/start")], {
    stdio: "inherit",
    env: { ...process.env, PORT: process.env.PORT || "2030", HOST: "127.0.0.1", BROWSER: "none", REACT_APP_DEBUGGER_URL: "/run-debugger" },
  });
  let stopping = false;
  function stop(code) {
    if (stopping) return;
    stopping = true;
    stopRuns();
    frontend.kill("SIGTERM");
    server.close();
    process.exit(code);
  }
  frontend.on("error", (error) => {
    console.error(error.message);
    stop(1);
  });
  frontend.on("exit", (code) => stop(code || 0));
  process.on("SIGINT", () => stop(0));
  process.on("SIGTERM", () => stop(0));
}

start().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
