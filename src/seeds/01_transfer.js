exports.seed = (knex) => {
  return knex("transactions")
    .del()
    .then(() => knex("transfers").del())
    .then(() => knex("accounts").del())
    .then(() => knex("users").del())
    .then(() =>
      knex("users").insert([
        {
          id: 10000,
          name: "User #1",
          mail: "user1@mail.com",
          password:
            "$2a$10$Ao7brJV42qmF38d0JvgQ.eiQoUb28ykxv458QmUzGeeHPAHpn2w7W",
        },
        {
          id: 10001,
          name: "User #2",
          mail: "user2@mail.com",
          password:
            "$2a$10$Ao7brJV42qmF38d0JvgQ.eiQoUb28ykxv458QmUzGeeHPAHpn2w7W",
        },
      ])
    )
    .then(() =>
      knex("accounts").insert([
        { id: 10000, name: "AccO #1", user_id: 10000 },
        { id: 10001, name: "AccD #1", user_id: 10000 },
        { id: 10002, name: "AccO #2", user_id: 10001 },
        { id: 10003, name: "AccD #2", user_id: 10001 },
      ])
    )
    .then(() =>
      knex("transfers").insert([
        {
          id: 10000,
          description: "Transfer #1",
          user_id: 10000,
          acc_ori_id: 10000,
          acc_dest_id: 10001,
          date: new Date(),
          ammount: 100,
          user_id: 10000,
        },
        {
          id: 10001,
          description: "Transfer #2",
          user_id: 10001,
          acc_ori_id: 10002,
          acc_dest_id: 10003,
          date: new Date(),
          ammount: 100,
          user_id: 10001,
        },
      ])
    )
    .then(() =>
      knex("transactions").insert([
        {
          description: "Transfer from AccO #1",
          date: new Date(),
          ammount: 100,
          type: "I",
          acc_id: 10001,
          transfer_id: 10000,
        },
        {
          description: "Transfer from AccD #1",
          date: new Date(),
          ammount: -100,
          type: "O",
          acc_id: 10000,
          transfer_id: 10000,
        },
        {
          description: "Transfer from AccO #2",
          date: new Date(),
          ammount: 100,
          type: "I",
          acc_id: 10003,
          transfer_id: 10001,
        },
        {
          description: "Transfer from AccD #2",
          date: new Date(),
          ammount: -100,
          type: "O",
          acc_id: 10002,
          transfer_id: 10001,
        },
      ])
    );
};
