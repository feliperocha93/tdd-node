const request = require("supertest");

const app = require("../../src/app.js");

const MAIN_ROUTE = "/auth";
let user;

const name = "Felipe Rocha";
const mail = `${Date.now()}@mail.com`;
const password = "123456";
const userRequest = { name, mail, password };

beforeAll(async () => {
  const res = await app.services.user.save(userRequest);
  user = { ...res[0] };
});

test("Deve criar usuário via signup", async () => {
  const myMail = userRequest.mail + "2";
  userRequest.mail = myMail;

  const { body, status } = await request(app)
    .post(`${MAIN_ROUTE}/signup`)
    .send(userRequest);

  expect(status).toBe(201);
  expect(body.name).toBe(name);
  expect(body.mail).toBe(myMail);
  expect(body).not.toHaveProperty("password");
});

test("Deve receber token ao logar", async () => {
  const { body, status } = await request(app)
    .post(`${MAIN_ROUTE}/signin`)
    .send({
      mail,
      password,
    });

  expect(status).toBe(200);
  expect(body).toHaveProperty("token");
});

test("Não deve autenticar usuário com senha errada", async () => {
  const { body, status } = await request(app)
    .post(`${MAIN_ROUTE}/signin`)
    .send({
      mail,
      password: "654321",
    });

  expect(status).toBe(400);
  expect(body.error).toBe("Usuário ou senha inválido");
});

test("Não deve autenticar usuário que não existe", async () => {
  const { body, status } = await request(app)
    .post(`${MAIN_ROUTE}/signin`)
    .send({
      mail: `naoexiste.${mail}`,
      password,
    });

  expect(status).toBe(400);
  expect(body.error).toBe("Usuário ou senha inválido");
});

test("Não deve acessar uma rota protegida sem token", async () => {
  const { status } = await request(app).get("/v1/users");

  expect(status).toBe(401);
});
