const User = require("../models/User");
const express = require("express");
const jwtAuthentication = require('../authentication/JWTAuthentication');
const statusCodes = require("http-status-codes");
const helpers = require('../utils/Helpers');
//const UsersDB = require("../models/UsersDB_FS");
const UsersDB = require("../models/UserDB_MSSQL");
//
const router = express.Router();
const vat =jwtAuthentication.verifyAccessToken;
const getJsonMessage = helpers.getJsonMessage;
//
router.get("/testDB", (req, res, next) => {
  try {
    let udb = new UsersDB();
    udb
      .hasConnection()
      .then((data) => {
        console.log("testDB");
        res.json(getJsonMessage("connection to MSSQL DB is ok"));
      })
      .catch((error) => {
        next(getJsonMessage(error.message, statusCodes.INTERNAL_SERVER_ERROR));
      });
  } catch (error) {
    next(getJsonMessage(error.message, statusCodes.INTERNAL_SERVER_ERROR));
  }
});
//
router.get("/", vat,(req, res, next) => {
  let udb = new UsersDB();
  udb
    .getAll()
    .then(function (data) {
      res.json(data);
    })
    .catch((error) => {
      next(getJsonMessage(error.message, statusCodes.INTERNAL_SERVER_ERROR));
    });
});
//
router.get("/:name", vat,(req, res, next) => {
  let udb = new UsersDB();
  udb
    .get(req.params.name)
    .then(function (data) {
      res.json(data);
    })
    .catch((error) => {
      next(getJsonMessage(error.message, statusCodes.NOT_FOUND));
    });
});
//
router.post("/", vat,(req, res, next) => {
  if (req.body.name && req.body.password) {
    let user = new User(req.body.name, req.body.password);
    let udb = new UsersDB();
    udb
      .add(user)
      .then((user) => {
        res
          .status(statusCodes.CREATED)
          .json(getJsonMessage(`user ${user.name} added`));
      })
      .catch((error) => {
        next(getJsonMessage(error.message, statusCodes.INTERNAL_SERVER_ERROR));
      });
  } else {
    next(getJsonMessage("invalid name or password", statusCodes.BAD_REQUEST));
  }
});
//
router.delete("/", vat,(req, res, next) => {
  let udb = new UsersDB();
  udb
    .delete(req.body.name)
    .then((user) => {
      res.json(getJsonMessage(`user ${user.name} deleted`));
    })
    .catch((error) => {
      next(getJsonMessage(error.message, statusCodes.INTERNAL_SERVER_ERROR));
    });
});
//
module.exports = router;
