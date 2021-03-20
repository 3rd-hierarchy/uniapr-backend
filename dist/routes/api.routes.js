"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express = require("express");
const historyController = require("../controllers/history.controller");
exports.router = express.Router();
exports.router.route('/api/history')
    .get(historyController.list);
