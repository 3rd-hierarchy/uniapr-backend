"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniswapSyncher = void 0;
const graphql_request_1 = require("graphql-request");
const worker_threads_1 = require("worker_threads");
const logger_1 = require("../utils/logger");
const path = require("path");
const async_mutex_1 = require("async-mutex");
const history_controller_1 = require("../controllers/history.controller");
const history_schema_1 = require("../models/history.schema");
const mongoose = require("mongoose");
const config_1 = require("../config/config");
const DEFI_NAME = "UniswapV2";
const UNISWAP_ENDPOINT = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";
const ETH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks";
class UniswapSyncher {
    constructor() {
        this._mutex = new async_mutex_1.Mutex();
        this._logger = logger_1.Logger.instance.logger;
    }
    get mutex() {
        return this._mutex;
    }
    static get instance() {
        if (!this._self) {
            this._self = new UniswapSyncher();
        }
        return this._self;
    }
    static schedule() {
        if (!this._self) {
            this._self = new UniswapSyncher();
        }
        // test
        new worker_threads_1.Worker(path.join(__dirname, 'worker.js'), { execArgv: [] });
    }
    static async process() {
        if (!this._self) {
            this._self = new UniswapSyncher();
        }
        mongoose.connect(config_1.config['mongoUri'], {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        }).catch((err) => {
            logger_1.Logger.instance.logger?.error('Mongo db connection faild. (%s)', err);
        });
        const release = await this._self._mutex.acquire();
        try {
            await this._self.processInternal();
        }
        finally {
            release();
        }
    }
    async processInternal() {
        const time = new Date().getTime();
        const currentTime = Math.floor(time / 1000);
        const oneDayAgoTime = currentTime - 24 * 60 * 60;
        let ethBlockInfo;
        try {
            ethBlockInfo = await this.getEthTransactionInfo(oneDayAgoTime);
        }
        catch (err) {
            this._logger?.error("Faild get eth blog info. err = " + err);
            return;
        }
        let pairs;
        try {
            pairs = await this.getTopLiquidPairs();
        }
        catch (err) {
            this._logger?.error("Faild get pairs info. err = " + err);
            return;
        }
        pairs.pairs.map(async (value) => {
            let pairData;
            try {
                pairData = await Promise.all([
                    this.getPairData(value.id, ethBlockInfo.blocks[0].number),
                    this.getPairData(value.id)
                ]);
            }
            catch (err) {
                this._logger?.error("Faild get pair. err = " + err);
                return;
            }
            if (pairData.length < 2) {
                this._logger?.error("Invalid pair length");
                return;
            }
            const volumeUSD = parseFloat(pairData[1].pair.volumeUSD);
            if (volumeUSD <= 0) {
                return;
            }
            const baseVolume = parseFloat(pairData[0].pair.volumeUSD);
            const currentVolume = parseFloat(pairData[1].pair.volumeUSD);
            const volume = currentVolume - baseVolume;
            const reservedUSD = parseFloat(pairData[1].pair.reserveUSD);
            var appendData = {
                [history_schema_1.HistorySchemaDefine.DEFI_NAME]: DEFI_NAME,
                [history_schema_1.HistorySchemaDefine.RESERVED_USD]: parseFloat(pairData[1].pair.reserveUSD),
                [history_schema_1.HistorySchemaDefine.VOLUME_USD]: volume,
                [history_schema_1.HistorySchemaDefine.PAIR_ID]: value.id,
                [history_schema_1.HistorySchemaDefine.PAIR_NAME]: pairData[0].pair.token0.symbol + "-" + pairData[0].pair.token1.symbol,
                [history_schema_1.HistorySchemaDefine.APR]: this.getAnnualInterest(reservedUSD, volume),
                [history_schema_1.HistorySchemaDefine.APR_WEEK]: -1
            };
            var aprWeak = -1;
            try {
                aprWeak = await this.getAprWeek(value.id, appendData);
            }
            catch (err) {
            }
            appendData.aprWeek = aprWeak;
            history_controller_1.append(appendData);
        });
    }
    async getPairData(pair, block = undefined) {
        const endpoint = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";
        return new Promise((resolve, reject) => {
            var blockNumber = "";
            if (block) {
                blockNumber = `block: { number: ${block} }`;
            }
            const query = graphql_request_1.gql `
      {
        pair(
          id: "${pair}"
          ${blockNumber}
        ) {
          token0 {
            symbol
          }
          token1 {
            symbol
          }
          reserveUSD
          volumeUSD
        }
      }
    `;
            graphql_request_1.request(endpoint, query)
                .then((data) => {
                const json = JSON.parse(JSON.stringify(data));
                resolve(json);
            })
                .catch((error) => {
                reject(error);
            });
        });
    }
    async getTopLiquidPairs() {
        return new Promise((resolve, reject) => {
            const query = graphql_request_1.gql `
      {
        pairs(
          first: 200
          orderBy: reserveUSD
          orderDirection: desc
        ) {
          id
        }
      }
    `;
            graphql_request_1.request(UNISWAP_ENDPOINT, query)
                .then((data) => {
                const json = JSON.parse(JSON.stringify(data));
                resolve(json);
            })
                .catch((error) => {
                reject(error);
            });
        });
    }
    async getEthTransactionInfo(time) {
        return new Promise((resolve, reject) => {
            const query = graphql_request_1.gql `
      {
        blocks(first: 1, orderBy: timestamp, orderDirection: asc, where: {timestamp_gt: "${time}"}) {
            number
        }
      }
    `;
            graphql_request_1.request(ETH_ENDPOINT, query).then((data) => {
                const json = JSON.parse(JSON.stringify(data));
                this._logger?.debug(JSON.stringify(data));
                resolve(json);
            }).catch((error) => {
                reject(error);
            });
        });
    }
    getAnnualInterest(liquidity, volume) {
        const ratio = volume / liquidity;
        const day = ratio * 0.003;
        const month = ((1 + day) ** 30 - 1) * 100;
        const year = ((1 + day) ** 365 - 1) * 100;
        return year;
    }
    async getAprWeek(pairId, newest) {
        return new Promise(async (resolve, reject) => {
            try {
                const weekData = await history_controller_1.getPairWeekData(DEFI_NAME, pairId);
                if (weekData.length < 2) {
                    reject(-1);
                    return;
                }
                let totalVolume = weekData.reduce((acc, val) => {
                    return acc + val.volumeUSD;
                }, 0);
                totalVolume += newest.volumeUSD;
                const volumeAverage = totalVolume / (weekData.length + 1);
                resolve(this.getAnnualInterest(weekData[0].reserveUSD, volumeAverage));
            }
            catch (err) {
                reject(-1);
            }
        });
    }
}
exports.UniswapSyncher = UniswapSyncher;
