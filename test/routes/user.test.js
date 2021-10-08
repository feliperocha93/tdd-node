const request = require("supertest");
const app = require("../../src/app.js");
const jwt = require("jwt-simple");

const mail = `${Date.now()}@mail.com`;
let user;

beforeAll(async () => {
  const res = await app.services.user.save({
    name: "Felipe Rocha",
    mail,
    password: "123456",
  });
  user = { ...res[0] };
  user.token = jwt.encode(user, "Segredo!");
});

test("Deve listar todos os usuários da aplicação", async () => {
  const { status, body } = await request(app)
    .get("/v1/users")
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(200);
  expect(body.length).toBeGreaterThan(0);
});

test.skip("Inserir usuário com sucesso", async () => {
  const { status, body } = await request(app).post("/v1/users").send({
    name: "Felipe Rocha",
    mail,
    password: "123456",
  });

  expect(status).toBe(201);
  expect(body.name).toBe("Felipe Rocha");
  expect(body).not.toHaveProperty("Felipe Rocha");
});

test("Deve armazenar senha criptografada", async () => {
  const { status, body } = await request(app)
    .post("/v1/users")
    .send({
      name: "Felipe Rocha",
      mail: `cripto.${mail}`,
      password: "123456",
    })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(201);

  const { password } = await app.services.user.findOne({ id: body.id });

  expect(password).not.toBeUndefined();
  expect(password).not.toBe("123456");
});

test("Não deve inserir usuário sem nome", async () => {
  const { body, status } = await request(app)
    .post("/v1/users")
    .send({ mail: "teste@mail.com", password: "123456" })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(400);
  expect(body.error).toBe("Nome é um atributo obrigatório");
});

test("Não deve inserir usuário sem email", async () => {
  const { body, status } = await request(app)
    .post("/v1/users")
    .send({ name: "Felipe Rocha", password: "123456" })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(400);
  expect(body.error).toBe("Email é um atributo obrigatório");
});

test("Não deve inserir usuário sem senha", async () => {
  const { body, status } = await request(app)
    .post("/v1/users")
    .send({ name: "Felipe Rocha", mail: "teste@mail.com" })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(400);
  expect(body.error).toBe("Senha é um atributo obrigatório");
});

test("Não deve inserir usuário com email existente", async () => {
  const { status, body } = await request(app)
    .post("/v1/users")
    .send({
      name: "Felipe Rocha",
      mail,
      password: "123456",
    })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(400);
  expect(body.error).toBe("Já existe um usuário com esse email");
});
