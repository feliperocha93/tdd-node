const { addDays, subDays } = require("date-fns");

exports.seed = (knex) => {
  // Deletes ALL existing entries
  return knex("users")
    .insert([
      {
        id: 10100,
        name: "User #3",
        mail: "user3@mail.com",
        password:
          "$2a$10$Ao7brJV42qmF38d0JvgQ.eiQoUb28ykxv458QmUzGeeHPAHpn2w7W",
      },
      {
        id: 10101,
        name: "User #4",
        mail: "user4@mail.com",
        password:
          "$2a$10$Ao7brJV42qmF38d0JvgQ.eiQoUb28ykxv458QmUzGeeHPAHpn2w7W",
      },
      {
        id: 10102,
        name: "User #5",
        mail: "user5@mail.com",
        password:
          "$2a$10$Ao7brJV42qmF38d0JvgQ.eiQoUb28ykxv458QmUzGeeHPAHpn2w7W",
      },
    ])
    .then(() =>
      knex("accounts").insert([
        { id: 10100, name: "Acc Saldo Principal", user_id: 10100 },
        { id: 10101, name: "Acc Saldo Secundário", user_id: 10100 },
        { id: 10102, name: "Acc Alternativa 1", user_id: 10101 },
        { id: 10103, name: "Acc Alternativa 2", user_id: 10101 },
        { id: 10104, name: "Acc Geral Principal", user_id: 10102 },
        { id: 10105, name: "Acc Geral Secundário", user_id: 10102 },
      ])
    )
    .then(() =>
      knex("transfers").insert([
        {
          id: 10100,
          description: "Transfer #1",
          user_id: 10102,
          acc_ori_id: 10105,
          acc_dest_id: 10104,
          date: new Date(),
          ammount: 256,
          user_id: 10000,
        },
        {
          id: 10101,
          description: "Transfer #2",
          user_id: 10101,
          acc_ori_id: 10102,
          acc_dest_id: 10103,
          date: new Date(),
          ammount: 512,
          user_id: 10001,
        },
      ])
    )
    .then(() =>
      knex("transactions").insert([
        /*
         ** Transação positiva
         ** Saldo #10104 = 2
         */
        {
          description: "2",
          date: new Date(),
          ammount: 2,
          type: "I",
          acc_id: 10104,
          status: true,
        },
        /*
         ** Transação usuário errado
         ** Saldo #10104 = 2
         */

        {
          description: "2",
          date: new Date(),
          ammount: 4,
          type: "I",
          acc_id: 10102,
          status: true,
        },
        /*
         ** Transação outra conta
         ** Saldo #10104 = 2
         ** Saldo #10105 = 8
         */

        {
          description: "2",
          date: new Date(),
          ammount: 8,
          type: "I",
          acc_id: 10105,
          status: true,
        },
        /*
         ** Transação pendente
         ** Saldo #10104 = 2
         ** Saldo #10105 = 8
         */

        {
          description: "2",
          date: new Date(),
          ammount: 16,
          type: "I",
          acc_id: 10105,
          status: false,
        },
        /*
         ** Transação passada
         ** Saldo #10104 = 34
         ** Saldo #10105 = 8
         */

        {
          description: "2",
          date: subDays(new Date(), 5),
          ammount: 32,
          type: "I",
          acc_id: 10104,
          status: true,
        },
        /*
         ** Transação futura
         ** Saldo #10104 = 34
         ** Saldo #10105 = 8
         */

        {
          description: "2",
          date: addDays(new Date(), 5),
          ammount: 64,
          type: "I",
          acc_id: 10104,
          status: true,
        },
        /*
         ** Transação negativa
         ** Saldo #10104 = -94
         ** Saldo #10105 = 8
         */

        {
          description: "2",
          date: new Date(),
          ammount: -128,
          type: "O",
          acc_id: 10104,
          status: true,
        },
        /*
         ** Transação negativa
         ** Saldo #10104 = 162
         ** Saldo #10105 = -248
         */

        {
          description: "2",
          date: new Date(),
          ammount: 256,
          type: "I",
          acc_id: 10104,
          status: true,
        },
        {
          description: "2",
          date: new Date(),
          ammount: -256,
          type: "O",
          acc_id: 10105,
          status: true,
        },
        /*
         ** Transação negativa
         ** Saldo #10104 = 162
         ** Saldo #10105 = -248
         */

        {
          description: "2",
          date: new Date(),
          ammount: 512,
          type: "I",
          acc_id: 10102,
          status: true,
        },
        {
          description: "2",
          date: new Date(),
          ammount: -512,
          type: "O",
          acc_id: 10103,
          status: true,
        },
      ])
    );
};
