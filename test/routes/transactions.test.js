const request = require("supertest");
const app = require("../../src/app.js");
const jwt = require("jwt-simple");

const MAIN_ROUTE = "/v1/transactions";
let user;
let user2;
let acc;
let acc2;

beforeAll(async () => {
  await app.db("transactions").del();
  await app.db("transfers").del();
  await app.db("accounts").del();
  await app.db("users").del();

  const users = await app.db("users").insert(
    [
      {
        name: "User #1",
        mail: "user@mail.com",
        password:
          "$2a$10$Ao7brJV42qmF38d0JvgQ.eiQoUb28ykxv458QmUzGeeHPAHpn2w7W",
      },
      {
        name: "User #2",
        mail: "user2@mail.com",
        password:
          "$2a$10$Ao7brJV42qmF38d0JvgQ.eiQoUb28ykxv458QmUzGeeHPAHpn2w7W",
      },
    ],
    "*"
  );
  [user, user2] = users;
  delete user.password;
  user.token = jwt.encode(user, "Segredo!");

  const accs = await app.db("accounts").insert(
    [
      { name: "Acc #1", user_id: user.id },
      { name: "Acc #2", user_id: user2.id },
    ],
    "*"
  );
  [acc, acc2] = accs;
});

test("Deve listar apenas as transações do usuário", async () => {
  await app.db("transactions").insert([
    {
      description: "T1",
      date: new Date(),
      ammount: 100,
      type: "I",
      acc_id: acc.id,
    },
    {
      description: "T2",
      date: new Date(),
      ammount: 300,
      type: "O",
      acc_id: acc2.id,
    },
  ]);

  const { body, status } = await request(app)
    .get(MAIN_ROUTE)
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(200);
  expect(body).toHaveLength(1);
  expect(body[0].description).toBe("T1");
});

test("Deve inserir uma transação com sucesso", async () => {
  const { body, status } = await request(app)
    .post(MAIN_ROUTE)
    .send({
      description: "New T",
      date: new Date(),
      ammount: 100,
      type: "I",
      acc_id: acc.id,
    })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(201);
  expect(body.acc_id).toBe(acc.id);
  expect(body.ammount).toBe("100.00");
});

test("Transações de entrada devem ser positivas", async () => {
  const { body, status } = await request(app)
    .post(MAIN_ROUTE)
    .send({
      description: "New T",
      date: new Date(),
      ammount: -100,
      type: "I",
      acc_id: acc.id,
    })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(201);
  expect(body.acc_id).toBe(acc.id);
  expect(body.ammount).toBe("100.00");
});

test("Transações de saida devem ser negativas", async () => {
  const { body, status } = await request(app)
    .post(MAIN_ROUTE)
    .send({
      description: "New T",
      date: new Date(),
      ammount: 100,
      type: "O",
      acc_id: acc.id,
    })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(201);
  expect(body.acc_id).toBe(acc.id);
  expect(body.ammount).toBe("-100.00");
});

describe("Ao tentar inserir uma transação inválida", () => {
  let validTransaction;
  beforeAll(() => {
    validTransaction = {
      description: "No ammount",
      date: new Date(),
      ammount: 100,
      type: "I",
      acc_id: acc.id,
    };
  });

  const testTemplate = async (newData, errorMessage) => {
    const { body, status } = await request(app)
      .post(MAIN_ROUTE)
      .send({
        ...validTransaction,
        ...newData,
      })
      .set("authorization", `bearer ${user.token}`);

    expect(status).toBe(400);
    expect(body.error).toBe(errorMessage);
  };

  test("Não deve inserir sem descrição", () =>
    testTemplate({ description: null }, "Descrição é um atributo obrigatório"));

  test("Não deve inserir sem valor", () =>
    testTemplate({ ammount: null }, "Valor é um atributo obrigatório"));

  test("Não deve inserir sem data", () =>
    testTemplate({ date: null }, "Data é um atributo obrigatório"));

  test("Não deve inserir sem conta", () =>
    testTemplate({ acc_id: null }, "Conta é um atributo obrigatório"));

  test("Não deve inserir sem tipo", () =>
    testTemplate({ type: null }, "Tipo é um atributo obrigatório"));

  test("Não deve inserir com tipo inválido", () =>
    testTemplate({ type: "A" }, "Tipo inválido"));
});

test("Deve retornar uma transação por ID", async () => {
  const [transaction] = await app.db("transactions").insert(
    {
      description: "T ID",
      date: new Date(),
      ammount: 100,
      type: "I",
      acc_id: acc.id,
    },
    "*"
  );

  const { body, status } = await request(app)
    .get(`${MAIN_ROUTE}/${transaction.id}`)
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(200);
  expect(body.id).toBe(transaction.id);
  expect(body.description).toBe("T ID");
});

test("Deve alterar uma transação", async () => {
  const [transaction] = await app.db("transactions").insert(
    {
      description: "T Update",
      date: new Date(),
      ammount: 180,
      type: "O",
      acc_id: acc.id,
    },
    "*"
  );

  const { body, status } = await request(app)
    .put(`${MAIN_ROUTE}/${transaction.id}`)
    .send({ description: "T Updated" })
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(200);
  expect(body.description).toBe("T Updated");
});

test("Deve remover uma transação", async () => {
  const [transaction] = await app.db("transactions").insert(
    {
      description: "T Update",
      date: new Date(),
      ammount: 180,
      type: "O",
      acc_id: acc.id,
    },
    "*"
  );

  const { status } = await request(app)
    .delete(`${MAIN_ROUTE}/${transaction.id}`)
    .set("authorization", `bearer ${user.token}`);

  const transactionDeleted = await app
    .db("transactions")
    .where({ id: transaction.id })
    .first();

  expect(status).toBe(204);
  expect(transactionDeleted).toBeUndefined();
});

test("Não deve remover uma transação de outro usuário", async () => {
  const [transaction] = await app.db("transactions").insert(
    {
      description: "T Update",
      date: new Date(),
      ammount: 180,
      type: "O",
      acc_id: acc2.id,
    },
    "*"
  );

  const { body, status } = await request(app)
    .delete(`${MAIN_ROUTE}/${transaction.id}`)
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(403);
  expect(body.error).toBe("Este recurso não pertence ao usuário");
});

test("Não deve remover conta com transação", async () => {
  await app.db("transactions").insert(
    {
      description: "T Update",
      date: new Date(),
      ammount: 180,
      type: "O",
      acc_id: acc.id,
    },
    "*"
  );

  const { status, body } = await request(app)
    .delete(`/v1/accounts/${acc.id}`)
    .set("authorization", `bearer ${user.token}`);

  expect(status).toBe(400);
  expect(body.error).toBe("Essa conta possui transações associadas");
});
