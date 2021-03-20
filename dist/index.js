"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config/config");
const express_1 = require("./express");
const mongoose = require("mongoose");
const logger_1 = require("./utils/logger");
mongoose.connect(config_1.config['mongoUri'], {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
}).catch((err) => {
    logger_1.Logger.instance.logger?.error('Mongo db connection faild. (%s)', err);
});
mongoose.connection.on('error', () => {
    throw new Error(`unable to connect to database: ${config_1.config['mongoUri']}`);
});
express_1.app.listen(config_1.config['port'], () => {
    logger_1.Logger.instance.logger?.info('Server started on port %s.', config_1.config['port']);
});
