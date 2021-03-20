"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistorySchema = void 0;
const mongoose_1 = require("mongoose");
const history_types_1 = require("../commons/history.types");
exports.HistorySchema = new mongoose_1.Schema({
    [history_types_1.HistorySchemaDefine.PAIR_NAME]: {
        type: String
    },
    [history_types_1.HistorySchemaDefine.DEFI_NAME]: {
        type: String,
    },
    [history_types_1.HistorySchemaDefine.PAIR_ID]: {
        type: String
    },
    [history_types_1.HistorySchemaDefine.RESERVED_USD]: {
        type: Number
    },
    [history_types_1.HistorySchemaDefine.VOLUME_USD]: {
        type: Number
    },
    [history_types_1.HistorySchemaDefine.APR]: {
        type: Number
    },
    [history_types_1.HistorySchemaDefine.APR_WEEK]: {
        type: Number
    },
    [history_types_1.HistorySchemaDefine.CREATED]: {
        type: Date,
        default: () => new Date
    }
}, { capped: { size: 100 * 1024 * 1024, max: 100000 } });
