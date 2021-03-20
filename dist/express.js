"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express = require("express");
const body_parser_1 = require("body-parser");
const compress = require("compression");
// import * as cors from 'cors'
const helmet = require("helmet");
const path = require("path");
const api_routes_1 = require("./routes/api.routes");
const logger_1 = require("./utils/logger");
exports.app = express();
const CURRENT_WORKING_DIR = process.cwd();
exports.app.use('/dist', express.static(path.join(CURRENT_WORKING_DIR, 'dist/client')));
exports.app.use(body_parser_1.json());
exports.app.use(body_parser_1.urlencoded({ extended: true }));
exports.app.use(compress());
exports.app.use(helmet());
// app.use(cors())
exports.app.use(logger_1.Logger.instance.accessLogger);
exports.app.use('/', api_routes_1.router);
exports.app.use((err, req, res, next) => {
    if (err) {
        res.status(400).json({ "error": err.name + ": " + err.message });
        console.log(err);
    }
});
exports.app.get('*', (req, res) => {
    res.setHeader("Content-Security-Policy", "script-src 'self' 'unsafe-inline' apis.google.com www.gstatic.com www.googletagmanager.com");
    res.status(200).sendFile(path.join(CURRENT_WORKING_DIR, 'dist/client/index.html'));
});
