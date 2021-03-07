"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.log4jsConfig = void 0;
exports.log4jsConfig = {
    appenders: {
        console: {
            type: "console"
        }
    },
    categories: {
        default: {
            appenders: ["console"],
            level: "debug"
        },
        web: {
            appenders: ["console"],
            level: "info"
        }
    }
};
