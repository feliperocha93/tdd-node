const request = require("supertest");
const app = require("../../src/app.js");

const MAIN_ROUTE = "/v1/transfers";
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTAwMDAsIm5hbWUiOiJVc2VyICMxIiwibWFpbCI6InVzZXIxQG1haWwuY29tIn0.QMgvo_lPe0Rdxpx7cay_hIkDAbjCK_--VD2fP0NTTqk";

beforeAll(async () => {
  // await app.db.migrate.rollback();
  // await app.db.migrate.latest();
  await app.db.seed.run();
});

test("Deve listar apenas transferências do usuário", async () => {
  const { body, status } = await request(app)
    .get(MAIN_ROUTE)
    .set("authorization", `bearer ${TOKEN}`);

  expect(status).toBe(200);
  expect(body[0].description).toBe("Transfer #1");
});

test.skip("Deve inserir uma transferência com sucesso", async () => {
  const { body, status } = await request(app)
    .post(MAIN_ROUTE)
    .send({
      description: "Regular Transfer",
      user_id: 10000,
      acc_ori_id: 10000,
      acc_dest_id: 10001,
      date: new Date(),
      ammount: 100,
    })
    .set("authorization", `bearer ${TOKEN}`);

  expect(status).toBe(201);
  expect(body.description).toBe("Regular Transfer");

  const transactions = await app
    .db("transactions")
    .where({ transfer_id: body.id });

  expect(transactions).toHaveLength(2);
  expect(transactions[0].description).toBe("Transfer to acc #10001");
  expect(transactions[1].description).toBe("Transfer from acc #10000");
  expect(transactions[0].ammount).toBe("-100.00");
  expect(transactions[1].ammount).toBe("100.00");
  expect(transactions[0].acc_id).toBe(10000);
  expect(transactions[1].acc_id).toBe(10001);
});

describe("Ao salvar uma transferência válida...", () => {
  let transfer_id;
  let income;
  let outcome;

  test("Deve retornar o status 201 e os dados da transferência", async () => {
    const { body, status } = await request(app)
      .post(MAIN_ROUTE)
      .send({
        description: "Regular Transfer",
        user_id: 10000,
        acc_ori_id: 10000,
        acc_dest_id: 10001,
        date: new Date(),
        ammount: 100,
      })
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(201);
    expect(body.description).toBe("Regular Transfer");
    transfer_id = body.id;
  });

  test("As transações equivalentes devem ter sido geradas", async () => {
    const transactions = await app
      .db("transactions")
      .where({ transfer_id })
      .orderBy("ammount");

    expect(transactions).toHaveLength(2);
    [outcome, income] = transactions;
  });

  test("A transação de saída deve ser negativa", async () => {
    expect(outcome.description).toBe("Transfer to acc #10001");
    expect(outcome.ammount).toBe("-100.00");
    expect(outcome.acc_id).toBe(10000);
    expect(outcome.type).toBe("O");
  });

  test("A transação de entrada deve ser positiva", async () => {
    expect(income.description).toBe("Transfer from acc #10000");
    expect(income.ammount).toBe("100.00");
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe("I");
  });

  test("Ambas devem referenciar a transferência que as originou", async () => {
    expect(income.transfer_id).toBe(transfer_id);
    expect(outcome.transfer_id).toBe(transfer_id);
  });
});

describe("Ao tentar salvar uma transferência inválida", () => {
  /**
   * Dado que eu tenho uma transferência inválida
   * Quando eu tentar inserir essa transferência
   * Espero obter uma exception da aplicação
   */

  const transfer = {
    description: "Valid Transfer",
    user_id: 10000,
    acc_ori_id: 10000,
    acc_dest_id: 10001,
    date: new Date(),
    ammount: 100,
  };

  const testTemplate = async (newData, errorMessage) => {
    const { body, status } = await request(app)
      .post(MAIN_ROUTE)
      .send({ ...transfer, ...newData })
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(400);
    expect(body.error).toBe(errorMessage);
  };

  test("Não deve inserir sem descrição", () =>
    testTemplate({ description: null }, "Descrição é um atributo obrigatório"));

  test("Não deve inserir sem valor", () =>
    testTemplate({ ammount: null }, "Valor é um atributo obrigatório"));

  test("Não deve inserir sem data", () =>
    testTemplate({ date: null }, "Data é um atributo obrigatório"));

  test("Não deve inserir sem conta de origem", () =>
    testTemplate(
      { acc_ori_id: null },
      "Conta de origem é um atributo obrigatório"
    ));

  test("Não deve inserir sem conta de destino", () =>
    testTemplate(
      { acc_dest_id: null },
      "Conta de destino é um atributo obrigatório"
    ));

  test("Não deve inserir se as contas de origem e destino forem as mesmas", () =>
    testTemplate(
      { acc_dest_id: transfer.acc_ori_id },
      "As contas devem ser diferentes"
    ));

  test("Não deve inserir se as contas pertencerem a outro usuário", () =>
    testTemplate(
      { acc_ori_id: 10002 },
      "Conta #10002 não pertence ao usuário"
    ));
});

test("Deve retornar uma transferência por ID", async () => {
  const { body, status } = await request(app)
    .get(`${MAIN_ROUTE}/10000`)
    .set("authorization", `bearer ${TOKEN}`);

  expect(status).toBe(200);
  expect(body.description).toBe("Transfer #1");
});

describe("Ao alterar uma transferência válida...", () => {
  let transfer_id;
  let income;
  let outcome;

  test("Deve retornar o status 200 e os dados da transferência", async () => {
    const { body, status } = await request(app)
      .put(`${MAIN_ROUTE}/10000`)
      .send({
        description: "Transfer Updated",
        user_id: 10000,
        acc_ori_id: 10000,
        acc_dest_id: 10001,
        date: new Date(),
        ammount: 500,
      })
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(200);
    expect(body.description).toBe("Transfer Updated");
    expect(body.ammount).toBe("500.00");
    transfer_id = body.id;
  });

  test("As transações equivalentes devem ter sido geradas", async () => {
    const transactions = await app
      .db("transactions")
      .where({ transfer_id })
      .orderBy("ammount");

    expect(transactions).toHaveLength(2);
    [outcome, income] = transactions;
  });

  test("A transação de saída deve ser negativa", async () => {
    expect(outcome.description).toBe("Transfer to acc #10001");
    expect(outcome.ammount).toBe("-500.00");
    expect(outcome.acc_id).toBe(10000);
    expect(outcome.type).toBe("O");
  });

  test("A transação de entrada deve ser positiva", async () => {
    expect(income.description).toBe("Transfer from acc #10000");
    expect(income.ammount).toBe("500.00");
    expect(income.acc_id).toBe(10001);
    expect(income.type).toBe("I");
  });

  test("Ambas devem referenciar a transferência que as originou", async () => {
    expect(income.transfer_id).toBe(transfer_id);
    expect(outcome.transfer_id).toBe(transfer_id);
  });
});

describe("Ao tentar salvar uma transferência inválida", () => {
  /**
   * Dado que eu tenho uma transferência inválida
   * Quando eu tentar inserir essa transferência
   * Espero obter uma exception da aplicação
   */

  const transfer = {
    description: "Valid Transfer",
    user_id: 10000,
    acc_ori_id: 10000,
    acc_dest_id: 10001,
    date: new Date(),
    ammount: 100,
  };

  const testTemplate = async (newData, errorMessage) => {
    const { body, status } = await request(app)
      .put(`${MAIN_ROUTE}/10000`)
      .send({ ...transfer, ...newData })
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(400);
    expect(body.error).toBe(errorMessage);
  };

  test("Não deve inserir sem descrição", () =>
    testTemplate({ description: null }, "Descrição é um atributo obrigatório"));

  test("Não deve inserir sem valor", () =>
    testTemplate({ ammount: null }, "Valor é um atributo obrigatório"));

  test("Não deve inserir sem data", () =>
    testTemplate({ date: null }, "Data é um atributo obrigatório"));

  test("Não deve inserir sem conta de origem", () =>
    testTemplate(
      { acc_ori_id: null },
      "Conta de origem é um atributo obrigatório"
    ));

  test("Não deve inserir sem conta de destino", () =>
    testTemplate(
      { acc_dest_id: null },
      "Conta de destino é um atributo obrigatório"
    ));

  test("Não deve inserir se as contas de origem e destino forem as mesmas", () =>
    testTemplate(
      { acc_dest_id: transfer.acc_ori_id },
      "As contas devem ser diferentes"
    ));

  test("Não deve inserir se as contas pertencerem a outro usuário", () =>
    testTemplate(
      { acc_ori_id: 10002 },
      "Conta #10002 não pertence ao usuário"
    ));
});

describe("Ao remover uma transferência", () => {
  test("Deve retornar o status 204", async () => {
    const { body, status } = await request(app)
      .delete(`${MAIN_ROUTE}/10000`)
      .set("authorization", `bearer ${TOKEN}`);

    expect(status).toBe(204);
  });

  test("O registro deve ter sido removido do banco", async () => {
    const result = await app.db("transfers").where({ id: 10000 });

    expect(result).toHaveLength(0);
  });

  test("As transações associadas devem ter sido removidas", async () => {
    const result = await app.db("transactions").where({ transfer_id: 10000 });

    expect(result).toHaveLength(0);
  });
});

test("Não deve retornar transferência de outro usuário", async () => {
  const { body, status } = await request(app)
    .get(`${MAIN_ROUTE}/10001`)
    .set("authorization", `bearer ${TOKEN}`);

  expect(status).toBe(403);
  expect(body.error).toBe("Este recurso não pertence ao usuário");
});
