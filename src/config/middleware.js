const bodyParser = require("body-parser");
// const knexLogger = require("knex-logger");

// const cors = require("cors");

module.exports = (app) => {
  app.use(bodyParser.json());

  // app.use(cor({ origin: "*" }));
};

// app.use(knexLogger(app.db));
