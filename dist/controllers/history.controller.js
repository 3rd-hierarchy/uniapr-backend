"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.getPairWeekData = exports.append = void 0;
const history_model_1 = require("../models/history.model");
const history_types_1 = require("../commons/history.types");
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
                [history_types_1.HistorySchemaDefine.DEFI_NAME]: difiName,
                [history_types_1.HistorySchemaDefine.PAIR_ID]: pairId
            }).sort({ [history_types_1.HistorySchemaDefine.CREATED]: -1 }).limit(6);
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
    // const release = await defiSyncher.instance.mutex.acquire()
    try {
        if (!(typeof req.query.name === 'string')) {
            res.status(400).send();
            return;
        }
        const histories = await history_model_1.HistoryModel
            .find({ [history_types_1.HistorySchemaDefine.DEFI_NAME]: req.query.name })
            .sort({ [history_types_1.HistorySchemaDefine.CREATED]: -1 })
            .limit(LIST_COUNT * 2);
        const shurinked = removeDucplicate(histories);
        const sorted = shurinked.sort((a, b) => {
            return b.reserveUSD - a.reserveUSD;
        }).slice(0, LIST_COUNT);
        res.json(sorted);
    }
    catch (err) {
        logger?.error(err);
        res.status(500).send();
    }
    finally {
        // release()
    }
};
exports.list = list;
function removeDucplicate(source) {
    var pairNameArray = [];
    let dist = source.filter((data) => {
        if (pairNameArray.includes(data.pairName)) {
            return false;
        }
        else {
            pairNameArray.push(data.pairName);
            return true;
        }
    });
    return dist;
}
