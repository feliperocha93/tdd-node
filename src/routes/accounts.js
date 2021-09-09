const express = require("express");

const RecursoIndevidoError = require("../errors/RecursoIndevidoError");

module.exports = (app) => {
  const router = express.Router();

  router.param("id", async (req, res, next) => {
    try {
      const account = await app.services.account.find({ id: req.params.id });
      if (account.user_id !== req.user.id) {
        throw new RecursoIndevidoError();
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  });

  router.post("/", async (req, res, next) => {
    try {
      const result = await app.services.account.save({
        ...req.body,
        user_id: req.user.id,
      });
      res.status(201).json(result[0]);
    } catch (error) {
      next(error);
    }
  });

  router.get("/", async (req, res) => {
    const result = await app.services.account.findAll(req.user.id);
    return res.status(200).json(result);
  });

  router.get("/:id", async (req, res) => {
    const result = await app.services.account.find({ id: req.params.id });
    return res.status(200).json(result);
  });

  router.put("/:id", async (req, res) => {
    const { body, params } = req;
    const result = await app.services.account.update(params.id, body);
    return res.status(200).json(result[0]);
  });

  router.delete("/:id", async (req, res, next) => {
    try {
      const { params } = req;
      const result = await app.services.account.remove(params.id);
      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  return router;
};
