"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistorySchema = exports.HistorySchemaDefine = void 0;
const mongoose_1 = require("mongoose");
var HistorySchemaDefine;
(function (HistorySchemaDefine) {
    HistorySchemaDefine.ID = '_id';
    HistorySchemaDefine.DEFI_NAME = 'defiName';
    HistorySchemaDefine.PAIR_NAME = 'pairName';
    HistorySchemaDefine.PAIR_ID = 'pairId';
    HistorySchemaDefine.RESERVED_USD = 'reserveUSD';
    HistorySchemaDefine.VOLUME_USD = 'volumeUSD';
    HistorySchemaDefine.APR = 'apr';
    HistorySchemaDefine.APR_WEEK = 'aprWeek';
    HistorySchemaDefine.CREATED = 'created';
})(HistorySchemaDefine = exports.HistorySchemaDefine || (exports.HistorySchemaDefine = {}));
exports.HistorySchema = new mongoose_1.Schema({
    [HistorySchemaDefine.PAIR_NAME]: {
        type: String
    },
    [HistorySchemaDefine.DEFI_NAME]: {
        type: String,
    },
    [HistorySchemaDefine.PAIR_ID]: {
        type: String
    },
    [HistorySchemaDefine.RESERVED_USD]: {
        type: Number
    },
    [HistorySchemaDefine.VOLUME_USD]: {
        type: Number
    },
    [HistorySchemaDefine.APR]: {
        type: Number
    },
    [HistorySchemaDefine.APR_WEEK]: {
        type: Number
    },
    [HistorySchemaDefine.CREATED]: {
        type: Date,
        default: () => new Date
    }
}, { capped: { size: 100 * 1024 * 1024, max: 100000 } });
