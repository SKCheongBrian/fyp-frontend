# Java Stack and Heap Visualiser

Run the frontend with Node.js 18+:

```sh
npm install
npm start
```

Open http://localhost:2030. Submit Code calls the hosted API at
`https://thisisadi.yoga:2030/run-debugger`. No local Java backend is started.
Production builds use this URL by default too. Set `REACT_APP_DEBUGGER_URL`
before starting or building to override the endpoint.

For local backend testing, with JDK 21 installed, use `npm run start:local`
instead. Open http://127.0.0.1:2030. This starts the frontend and a local API
on 127.0.0.1:4000, and overrides submissions to `/run-debugger`. The development
server proxies those requests to the local API, which invokes the rewrite's JAR.

By default the JAR is loaded from the sibling project:
`../fyp-backend-rewrite/out/artifacts/java_diagram_backend_jar/java-diagram-backend.jar`.
Set `JAVA_BACKEND_JAR` to use another JAR, and `JAVA_BIN` or `JAVA_HOME` to select Java.
The existing JAR accepts source text. If you rebuild the current edited Java entry
point, which accepts a source-file path, use `JAVA_BACKEND_INPUT=file npm run start:local`.

Each submission gets a temporary working directory, cleaned up afterward, and a
30-second execution limit. Submitted Java runs locally with your user permissions;
use this local runner for trusted code. The process-group cleanup uses macOS/Linux.

`npm run start:api` starts only the local API. `npm run build` builds the frontend.
The optional local proxy is for development only.

Checks:

```sh
npm test -- --watchAll=false
npm run test:api
npm run build
```

The API tests include a real execution of the local JAR, requiring JDK 21 and the JAR above.
