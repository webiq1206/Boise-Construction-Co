import assert from "node:assert/strict";
import http from "node:http";
import net from "node:net";
import test from "node:test";

test("offline child is sanitized and guarded while mocks still work", async () => {
  assert.equal(process.env.OFFLINE_TEST_SECRET, undefined);
  assert.equal(process.env.NEXT_TELEMETRY_DISABLED, "1");
  assert.match(process.env.NODE_OPTIONS, /offline-network-guard\.cjs/);

  await assert.rejects(
    fetch("https://example.com/secret-value"),
    /blocked an outbound network connection/,
  );
  assert.throws(
    () => http.get("http://example.com/secret-value"),
    /blocked an outbound network connection/,
  );
  assert.throws(
    () => net.createConnection({ host: "example.com", port: 443 }),
    /blocked an outbound network connection/,
  );

  const nativeFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ mocked: true }), {
      headers: { "content-type": "application/json" },
    });
  assert.deepEqual(await (await fetch("https://provider.invalid")).json(), {
    mocked: true,
  });
  globalThis.fetch = nativeFetch;

  const server = http.createServer((_request, response) => response.end("local"));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const body = await new Promise((resolve, reject) => {
    http
      .get(`http://127.0.0.1:${port}`, (response) => {
        let value = "";
        response.on("data", (chunk) => (value += chunk));
        response.on("end", () => resolve(value));
      })
      .on("error", reject);
  });
  server.close();
  assert.equal(body, "local");
});
