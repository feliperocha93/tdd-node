const app = require("express")();
const consign = require("consign");
const knex = require("knex");
const knexfile = require("../knexfile");
const winston = require("winston");
const uuid = require("uuidv4");

app.db = knex(knexfile[process.env.NODE_ENV]);

app.log = winston.createLogger({
  level: "debug",
  transports: [
    new winston.transports.Console({
      format: winston.format.json({ space: 1 }),
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "warn",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json({ space: 1 })
      ),
    }),
  ],
});

consign({ cwd: "src", verbose: false })
  .include("./config/passport.js")
  .then("./config/middleware.js")
  .then("./services")
  .then("./routes")
  .then("./config/router.js")
  .into(app);

app.get("/", (req, res) => {
  res.status(200).send();
});

app.use((err, req, res, next) => {
  const id = uuid();
  const { name, message } = err;
  if (name === "ValidationError") {
    app.log.error({ id, name, message });
    res.status(400).json({ error: message });
  } else if (name === "RecursoIndevidoError") {
    res.status(403).json({ error: message });
  } else {
    const id = uuid();
    app.log.error({ id, name, message });
    res.status(500).json({ error: "Falha interna" });
  }
  next();
});

// app.db
//   .on("query", ({ sql, bindings }) => {
//     console.log({
//       sql: sql,
//       bindings: bindings ? bindings.join(",") : "",
//     });
//   })
//   .on("query-response", (response) => {
//     console.log(response);
//   })
//   .on("error", (error) => console.log(error));

module.exports = app;
