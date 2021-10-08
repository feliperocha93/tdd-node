module.exports = {
  test: {
    client: "pg",
    version: "9.6",
    connection: {
      host: "localhost",
      user: "postgres",
      password: "postgres",
      database: "barriga",
    },
    migrations: {
      directory: "src/migrations",
    },
    seeds: {
      directory: "src/seeds",
    },
  },
  prod: {
    client: "pg",
    version: "",
    connection: {
      host: "ec2-54-172-169-87.compute-1.amazonaws.com",
      user: "qvfznrclbrcgst",
      password: "171152868d023e3c9e50c7812a5c4374226da9fb618b9adab79cf69c571a769f",
      database: "d2kijqt9cmg2f5",
    },
    migrations: {
      directory: "src/migrations",
    },
  },
};
