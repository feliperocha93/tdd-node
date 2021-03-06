const express = require("express");
const ValidationError = require("../errors/ValidationError");

module.exports = (app) => {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      const result = await app.services.balance.getSaldo(req.user.id);
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
};
