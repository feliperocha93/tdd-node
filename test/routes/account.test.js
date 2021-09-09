const request = require("supertest");
const app = require("../../src/app.js");
const jwt = require("jwt-simple");

const MAIN_ROUTE = "/v1/accounts";
let user;
let user2;

const mail = `${Date.now()}@mail.com`;

beforeAll(async () => {
  const res = await app.services.user.save({
    name: "Felipe Rocha",
    mail,
    password: "123456",
  });
  user = { ...res[0] };
  user.token = jwt.encode(user, "Segredo!");
  const res2 = await app.services.user.save({
    name: "Felipe Rocha",
    mail: `mail2${mail}`,
    password: "123456",
  });
  user2 = { ...res2[0] };
  user2.token = jwt.encode(user2, "Segredo!");
});

async function insertAccount(name, user_id, params = []) {
  return await app.db("accounts").insert({ name, user_id }, params);
}

test("Deve inserir uma conta com sucesso", async () => {
  const { body, status } = await request(app)
    .post(MAIN_ROUTE)
    .send({ name: "#Acc 1" })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(201);
  expect(body.name).toBe("#Acc 1");
});

test("Não deve inserir uma conta de nome duplicado, para o mesmo usuário", async () => {
  await insertAccount("Acc duplicated", user.id);

  const { body, status } = await request(app)
    .post(MAIN_ROUTE)
    .send({ name: "Acc duplicated" })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(400);
  expect(body.error).toBe("Já existe uma conta com esse nome");
});

test("Não deve inserir uma conta sem nome", async () => {
  const { body, status } = await request(app)
    .post(`${MAIN_ROUTE}`)
    .send({})
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(400);
  expect(body.error).toBe("Nome é um atributo obrigatório");
});

test("Deve listar apenas as contas do usuário", async () => {
  await insertAccount("Acc #1", user.id);
  await insertAccount("Acc #2", user2.id);

  const { body, status } = await request(app)
    .get(MAIN_ROUTE)
    .set("authorization", `bearer ${user2.token}`);

  expect(status).toBe(200);
  expect(body.length).toBe(1);
  expect(body[0].name).toBe("Acc #2");
});

test("Deve retornar uma conta por ID", async () => {
  const [acc] = await insertAccount("Acc List", user.id, ["id"]);
  const { body, status } = await request(app)
    .get(`${MAIN_ROUTE}/${acc.id}`)
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(200);
  expect(body.name).toBe("Acc List");
  expect(body.user_id).toBe(user.id);
});

test("Não deve retornar uma conta de outro usuário", async () => {
  const [acc] = await insertAccount("Acc User #1", user.id, ["id"]);

  const { body, status } = await request(app)
    .get(`${MAIN_ROUTE}/${acc.id}`)
    .set("authorization", `bearer ${user2.token}`);

  expect(status).toBe(403);
  expect(body.error).toBe("Este recurso não pertence ao usuário");
});

test("Deve alterar uma conta", async () => {
  const [acc] = await insertAccount("Acc To Update", user.id, ["id"]);
  const { body, status } = await request(app)
    .put(`${MAIN_ROUTE}/${acc.id}`)
    .send({ name: "Acc To Update" })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(200);
  expect(body.name).toBe("Acc To Update");
});

test("Não deve alterar uma conta de outro usuário", async () => {
  const [acc] = await insertAccount("Acc User #1", user.id, ["id"]);

  const { body, status } = await request(app)
    .put(`${MAIN_ROUTE}/${acc.id}`)
    .send({ name: "update" })
    .set("authorization", `bearer ${user2.token}`);

  expect(status).toBe(403);
  expect(body.error).toBe("Este recurso não pertence ao usuário");
});

test("Deve remover uma conta", async () => {
  const [acc] = await insertAccount("Acc To remove", user.id, ["id"]);
  const { body, status } = await request(app)
    .delete(`${MAIN_ROUTE}/${acc.id}`)
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(204);
});

test("Não deve remover uma conta de outro usuário", async () => {
  const [acc] = await insertAccount("Acc User #1", user.id, ["id"]);

  const { body, status } = await request(app)
    .delete(`${MAIN_ROUTE}/${acc.id}`)
    .set("authorization", `bearer ${user2.token}`);

  expect(status).toBe(403);
  expect(body.error).toBe("Este recurso não pertence ao usuário");
});
