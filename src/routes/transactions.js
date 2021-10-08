const express = require("express");
const RecursoIndevidoError = require("../errors/RecursoIndevidoError");

module.exports = (app) => {
  const router = express.Router();

  router.param("id", async (req, res, next) => {
    try {
      const transactions = await app.services.transaction.find(req.user.id, {
        "transactions.id": req.params.id,
      });
      if (transactions.length > 0) {
        next();
      } else {
        throw new RecursoIndevidoError();
      }
    } catch (error) {
      next(error);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const result = await app.services.transaction.find(req.user.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const result = await app.services.transaction.save(req.body);
      res.status(201).json(result[0]);
    } catch (error) {
      next(error);
    }
  });

  router.get("/:id", async (req, res, next) => {
    try {
      const result = await app.services.transaction.findOne({
        id: req.params.id,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.put("/:id", async (req, res, next) => {
    const { body, params } = req;
    try {
      const result = await app.services.transaction.update(params.id, body);
      res.status(200).json(result[0]);
    } catch (error) {
      next(error);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    const { params } = req;
    try {
      await app.services.transaction.remove(params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
};
