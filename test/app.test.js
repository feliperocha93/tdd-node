const request = require("supertest");

const app = require("../src/app.js");

test("Deve responder na raiz", async () => {
  const { status } = await request(app).get("/");
  expect(status).toBe(200);
});
