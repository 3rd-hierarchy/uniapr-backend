"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryModel = void 0;
const mongoose_1 = require("mongoose");
const history_schema_1 = require("./history.schema");
exports.HistoryModel = mongoose_1.model("History", history_schema_1.HistorySchema);
