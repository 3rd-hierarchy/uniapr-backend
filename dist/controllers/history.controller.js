"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.getPairWeekData = exports.append = void 0;
const uniswapSync_1 = require("../batch/uniswapSync");
const history_model_1 = require("../models/history.model");
const history_schema_1 = require("../models/history.schema");
const logger_1 = require("../utils/logger");
const LIST_COUNT = 100;
const logger = logger_1.Logger.instance.logger;
const append = (data) => {
    let history = new history_model_1.HistoryModel(data);
    try {
        history.save();
    }
    catch (err) {
        logger?.error(err);
    }
};
exports.append = append;
const getPairWeekData = async (difiName, pairId) => {
    return new Promise(async (resolve, reject) => {
        try {
            let histories = await history_model_1.HistoryModel.find({
                [history_schema_1.HistorySchemaDefine.DEFI_NAME]: difiName,
                [history_schema_1.HistorySchemaDefine.PAIR_ID]: pairId
            }).sort({ [history_schema_1.HistorySchemaDefine.CREATED]: -1 }).limit(6);
            resolve(histories);
        }
        catch (err) {
            logger?.error(err);
            reject(err);
        }
    });
};
exports.getPairWeekData = getPairWeekData;
const list = async (req, res) => {
    const release = await uniswapSync_1.UniswapSyncher.instance.mutex.acquire();
    try {
        const histories = await history_model_1.HistoryModel.find().sort({ [history_schema_1.HistorySchemaDefine.CREATED]: -1 })
            .limit(LIST_COUNT * 2);
        const sorted = histories.sort((a, b) => {
            return b.reserveUSD - a.reserveUSD;
        }).slice(0, LIST_COUNT);
        res.json({
            list: sorted
        });
    }
    catch (err) {
        logger?.error(err);
        res.status(400).send();
    }
    finally {
        release();
    }
};
exports.list = list;
