const express = require("express");
const jwt = require("jwt-simple");
const bcrypt = require("bcrypt-nodejs");
const ValidationError = require("../errors/ValidationError");

//TODO: Tornar uma constante global
const secret = "Segredo!";

module.exports = (app) => {
  const router = express.Router();

  router.post("/signin", async (req, res, next) => {
    try {
      const user = await app.services.user.findOne({
        mail: req.body.mail,
      });
      const password = user !== undefined ? user.password : "";
      if (!!password && bcrypt.compareSync(req.body.password, password)) {
        delete user.password;
        const token = jwt.encode(user, secret);
        res.status(200).json({ token });
      } else {
        throw new ValidationError("Usuário ou senha inválido");
      }
    } catch (error) {
      next(error);
    }
  });

  router.post("/signup", async (req, res, next) => {
    try {
      const result = await app.services.user.save(req.body);
      res.status(201).json(result[0]);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
