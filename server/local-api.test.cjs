const assert = require("node:assert/strict");
const { test } = require("node:test");
const { createServer, runProgram } = require("./local-api.cjs");

test("local HTTP submission executes the rewrite JAR and returns memory snapshots", async (t) => {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/run-debugger`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://127.0.0.1:2030" },
    body: JSON.stringify({ program: `public class Main {
  public static void main(String[] args) {
    int value = 1;
    value = 2;
    System.out.println(value);
  }
}` }),
  });
  const result = await response.json();
  assert.equal(response.status, 200, JSON.stringify(result));
  assert.equal(result.isSuccess, true, JSON.stringify(result));
  assert.ok(result.stepInfos.length > 1);
  const variables = result.stepInfos.flatMap(step =>
    step.stackInfo.stackFrames.flatMap(frame => frame.localVariables));
  assert.ok(variables.some(variable => variable.name === "value" && String(variable.value) === "2"));
});

test("the rewrite returns compilation diagnostics", async () => {
  const result = await runProgram(`public class Main {
  public static void main(String[] args) {
    int value = "not an integer";
  }
}`);
  assert.equal(result.isSuccess, false);
  assert.match(result.errorMessage, /incompatible types/);
});

test("rejects invalid requests and foreign origins before executing Java", async (t) => {
  let executions = 0;
  const server = createServer(async () => { executions++; });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = `http://127.0.0.1:${server.address().port}/run-debugger`;
  for (const [body, headers, status] of [
    ["{", { "Content-Type": "application/json" }, 400],
    [JSON.stringify({ program: " " }), { "Content-Type": "application/json" }, 400],
    [JSON.stringify({ program: "class Main {}" }), { "Content-Type": "text/plain" }, 415],
    [JSON.stringify({ program: "class Main {}" }), { "Content-Type": "application/json", Origin: "https://example.com" }, 403],
  ]) {
    const response = await fetch(url, { method: "POST", headers, body });
    assert.equal(response.status, status);
    assert.equal((await response.json()).isSuccess, false);
  }
  assert.equal(executions, 0);
});

test("execution failures become readable API errors", async (t) => {
  const server = createServer(async () => { throw new Error("Java is unavailable"); });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/run-debugger`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ program: "class Main {}" }),
  });
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { isSuccess: false, errorMessage: "Java is unavailable" });
});
