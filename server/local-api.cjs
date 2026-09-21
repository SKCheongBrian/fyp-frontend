const http = require("node:http");
const { execFile } = require("node:child_process");
const { access, mkdtemp, rm, writeFile } = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const defaultJar = path.resolve(__dirname,
  "../../fyp-backend-rewrite/out/artifacts/java_diagram_backend_jar/java-diagram-backend.jar");
const jarPath = path.resolve(process.env.JAVA_BACKEND_JAR || defaultJar);
const java = process.env.JAVA_BIN || (process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, "bin", "java") : "java");
const activeRuns = new Set();

// JDI launches a second JVM. Stop the whole process group, including on timeout.
function stopRun(child) {
  if (!child.pid) return;
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

async function runProgram(program) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "java-visualizer-"));
  try {
    let input = program;
    // The checked-in JAR takes source text; a rebuild of the edited main takes a file.
    if (process.env.JAVA_BACKEND_INPUT === "file") {
      input = path.join(directory, "Input.java");
      await writeFile(input, program, "utf8");
    }
    return await new Promise((resolve, reject) => {
      const child = execFile(java, ["-jar", jarPath, input], {
        cwd: directory,
        detached: true,
        maxBuffer: 16 * 1024 * 1024,
      }, (error, stdout, stderr) => {
        clearTimeout(timer);
        activeRuns.delete(child);
        stopRun(child);
        if (timedOut) return reject(new Error("Java execution timed out after 30 seconds."));
        if (error) return reject(new Error(stderr.trim() || error.message));
        try {
          const result = JSON.parse(stdout);
          if (!result || typeof result.isSuccess !== "boolean" ||
              (result.isSuccess && !Array.isArray(result.stepInfos))) {
            throw new Error("Missing debugger result");
          }
          resolve(result);
        } catch {
          reject(new Error(`The Java backend returned an invalid result. ${stderr.trim()}`));
        }
      });
      activeRuns.add(child);
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        stopRun(child);
      }, 30000);
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function respond(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function createServer(execute = runProgram) {
  return http.createServer(async (req, res) => {
    if (req.method !== "POST" || req.url !== "/run-debugger") {
      return respond(res, 404, { isSuccess: false, errorMessage: "Unknown endpoint" });
    }
    const origin = req.headers.origin;
    const frontendPort = process.env.PORT || "2030";
    if (origin && ![`http://localhost:${frontendPort}`, `http://127.0.0.1:${frontendPort}`].includes(origin)) {
      return respond(res, 403, { isSuccess: false, errorMessage: "Only the local frontend may submit code." });
    }
    if (!req.headers["content-type"]?.startsWith("application/json")) {
      return respond(res, 415, { isSuccess: false, errorMessage: "Expected JSON" });
    }
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 100 * 1024) {
          return respond(res, 413, { isSuccess: false, errorMessage: "Program exceeds 100 KB." });
        }
        chunks.push(chunk);
      }
      let body;
      try {
        body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        return respond(res, 400, { isSuccess: false, errorMessage: "Invalid JSON" });
      }
      if (typeof body?.program !== "string" || !body.program.trim()) {
        return respond(res, 400, { isSuccess: false, errorMessage: "Enter a Java program first." });
      }
      respond(res, 200, await execute(body.program));
    } catch (error) {
      respond(res, 500, { isSuccess: false, errorMessage: error.message });
    }
  });
}

async function startServer() {
  await access(jarPath).catch(() => {
    throw new Error(`Java backend JAR not found: ${jarPath}. Set JAVA_BACKEND_JAR to its location.`);
  });
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(4000, "127.0.0.1", resolve);
  });
  console.log(`Local Java API: http://127.0.0.1:4000 (JAR: ${jarPath})`);
  return server;
}

function stopRuns() {
  for (const child of activeRuns) stopRun(child);
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      stopRuns();
      process.exit(0);
    });
  }
}

module.exports = { createServer, runProgram, startServer, stopRuns };
