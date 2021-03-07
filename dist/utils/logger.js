"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const log4js = require("log4js");
const config_log4js_1 = require("../config/config.log4js");
class Logger {
    constructor() {
        this._logger = null;
        log4js.configure(config_log4js_1.log4jsConfig);
        this._logger = log4js.getLogger();
    }
    get logger() {
        return this._logger;
    }
    get accessLogger() {
        return log4js.connectLogger(log4js.getLogger('web'), {});
    }
    static get instance() {
        if (!this._self) {
            this._self = new Logger();
        }
        return this._self;
    }
}
exports.Logger = Logger;
