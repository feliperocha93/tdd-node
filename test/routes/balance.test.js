const request = require("supertest");
const app = require("../../src/app.js");
const { addDays, subDays } = require("date-fns");

const MAIN_ROUTE = "/v1/balance";
const TRANSACTION_ROUTE = "/v1/transactions";
const TRANSFER_ROUTE = "/v1/transfers";
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEwMTAwIiwibmFtZSI6IlVzZXIgIzMiLCJtYWlsIjoidXNlcjNAbWFpbC5jb20ifQ.kq65elChkjODMW_PAWGloR-CjsL1dB9eyyT6a4hZGas";
const TOKEN_GERAL =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAxMDIsIm5hbWUiOiJVc2VyICM1IiwibWFpbCI6InVzZXI1QG1haWwuY29tIn0.h1wvHEq-Ij_uqPhRh3m9W97fX-WTYRITjQRpur48iYg ";

beforeAll(async () => {
  await app.db.seed.run();
});

describe("Ao calcular o saldo do usuário", () => {
  test("Deve retornar apenas as contas com alguma transação", async () => {
    const { body, status } = await request(app)
      .get(MAIN_ROUTE)
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(200);
    expect(body).toHaveLength(0);
  });

  test("Deve adicionar valores de entrada", async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .send({
        description: "1",
        date: new Date(),
        ammount: 100,
        type: "I",
        acc_id: 10100,
        status: true,
      })
      .set("authorization", `bearer ${TOKEN}`);

    const { body, status } = await request(app)
      .get(MAIN_ROUTE)
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(10100);
    expect(body[0].sum).toBe("100.00");
  });

  test("Deve subtrair valores de saída", async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .send({
        description: "1",
        date: new Date(),
        ammount: 200,
        type: "O",
        acc_id: 10100,
        status: true,
      })
      .set("authorization", `bearer ${TOKEN}`);

    const { body, status } = await request(app)
      .get(MAIN_ROUTE)
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(10100);
    expect(body[0].sum).toBe("-100.00");
  });

  test("Não deve considerar transações pendentes", async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .send({
        description: "1",
        date: new Date(),
        ammount: 200,
        type: "O",
        acc_id: 10100,
        status: false,
      })
      .set("authorization", `bearer ${TOKEN}`);

    const { body, status } = await request(app)
      .get(MAIN_ROUTE)
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe(10100);
    expect(body[0].sum).toBe("-100.00");
  });

  test("Não deve considerar saldo de contas distintas", async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .send({
        description: "1",
        date: new Date(),
        ammount: 50,
        type: "I",
        acc_id: 10101,
        status: true,
      })
      .set("authorization", `bearer ${TOKEN}`);

    const { body, status } = await request(app)
      .get(MAIN_ROUTE)
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe(10100);
    expect(body[0].sum).toBe("-100.00");
    expect(body[1].id).toBe(10101);
    expect(body[1].sum).toBe("50.00");
  });

  test("Não deve considerar contas de outros usuários", async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .send({
        description: "1",
        date: new Date(),
        ammount: 200,
        type: "O",
        acc_id: 10102,
        status: true,
      })
      .set("authorization", `bearer ${TOKEN}`);

    const { body, status } = await request(app)
      .get(MAIN_ROUTE)
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe(10100);
    expect(body[0].sum).toBe("-100.00");
    expect(body[1].id).toBe(10101);
    expect(body[1].sum).toBe("50.00");
  });

  test("Deve considerar uma transação passada", async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .send({
        description: "1",
        date: subDays(new Date(), 5),
        ammount: 250,
        type: "I",
        acc_id: 10100,
        status: true,
      })
      .set("authorization", `bearer ${TOKEN}`);

    const { body, status } = await request(app)
      .get(MAIN_ROUTE)
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe(10100);
    expect(body[0].sum).toBe("150.00");
    expect(body[1].id).toBe(10101);
    expect(body[1].sum).toBe("50.00");
  });

  test("Não deve considerar uma transação futura", async () => {
    await request(app)
      .post(TRANSACTION_ROUTE)
      .send({
        description: "1",
        date: addDays(new Date(), 5),
        ammount: 250,
        type: "I",
        acc_id: 10100,
        status: true,
      })
      .set("authorization", `bearer ${TOKEN}`);

    const { body, status } = await request(app)
      .get(MAIN_ROUTE)
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe(10100);
    expect(body[0].sum).toBe("150.00");
    expect(body[1].id).toBe(10101);
    expect(body[1].sum).toBe("50.00");
  });

  test("Deve considerar transferências", async () => {
    await request(app)
      .post(TRANSFER_ROUTE)
      .send({
        description: "Transfer #1",
        acc_ori_id: 10100,
        acc_dest_id: 10101,
        date: new Date(),
        ammount: 250,
      })
      .set("authorization", `bearer ${TOKEN}`);

    const { body, status } = await request(app)
      .get(MAIN_ROUTE)
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].id).toBe(10100);
    expect(body[0].sum).toBe("-100.00");
    expect(body[1].id).toBe(10101);
    expect(body[1].sum).toBe("300.00");
  });
});

test("Deve calcular saldo das contas do usuário", async () => {
  const { body, status } = await request(app)
    .get(MAIN_ROUTE)
    .set("authorization", `bearer ${TOKEN_GERAL}`);

  expect(status).toBe(200);
  expect(body).toHaveLength(2);
  expect(body[0].id).toBe(10104);
  expect(body[0].sum).toBe("162.00");
  expect(body[1].id).toBe(10105);
  expect(body[1].sum).toBe("-248.00");
});
