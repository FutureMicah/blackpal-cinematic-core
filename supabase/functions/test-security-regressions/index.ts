// Stub host so the edge-functions runtime discovers the test file.
Deno.serve(() => new Response("ok"));
