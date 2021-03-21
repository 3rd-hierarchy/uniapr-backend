"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defiSyncher = void 0;
const graphql_request_1 = require("graphql-request");
const logger_1 = require("../utils/logger");
const async_mutex_1 = require("async-mutex");
const history_controller_1 = require("../controllers/history.controller");
const history_types_1 = require("../commons/history.types");
const mongoose = require("mongoose");
const config_1 = require("../config/config");
const cron = require("node-cron");
const UNISWAP_NAME = "UniswapV2";
const UNISWAP_ENDPOINT = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";
const SUSHISWAP_NAME = "Sushiswap";
const SUSHISWAP_ENDPOINT = "https://api.thegraph.com/subgraphs/name/sushiswap/exchange";
const ETH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks";
class defiSyncher {
    constructor() {
        this._mutex = new async_mutex_1.Mutex();
        this._logger = logger_1.Logger.instance.logger;
    }
    get mutex() {
        return this._mutex;
    }
    static get instance() {
        if (!this._self) {
            this._self = new defiSyncher();
        }
        return this._self;
    }
    static schedule() {
        if (!this._self) {
            this._self = new defiSyncher();
        }
        // test
        // new Worker(path.join(__dirname, 'worker.js'), { execArgv: [] })
        if (process.env.NODE_ENV == "production") {
            cron.schedule('0 0 1 * * *', () => {
                defiSyncher.process();
                logger_1.Logger.instance.logger?.trace('production mode sceduled');
            });
        }
        else if (process.env.SYNC == "force") {
            defiSyncher.process();
            logger_1.Logger.instance.logger?.trace('processed force sync');
        }
    }
    static async process() {
        if (!this._self) {
            this._self = new defiSyncher();
        }
        mongoose.connect(config_1.config['mongoUri'], {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true
        }).catch((err) => {
            logger_1.Logger.instance.logger?.error('Mongo db connection faild. (%s)', err);
        });
        // const release = await this._self._mutex.acquire()
        try {
            await this._self.processInternal(UNISWAP_NAME, UNISWAP_ENDPOINT);
            await this._self.processInternal(SUSHISWAP_NAME, SUSHISWAP_ENDPOINT);
        }
        finally {
            // release()
        }
    }
    async processInternal(name, endpoint) {
        this._logger?.trace("[IN]defiSyncher#processInternal " + name);
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
            pairs = await this.getTopLiquidPairs(endpoint);
        }
        catch (err) {
            this._logger?.error("Faild get pairs info. err = " + err);
            return;
        }
        await Promise.all(pairs.pairs.map(async (value) => {
            let pairData;
            try {
                pairData = await Promise.all([
                    this.getPairData(value.id, endpoint, ethBlockInfo.blocks[0].number),
                    this.getPairData(value.id, endpoint)
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
            if (!pairData[0].pair) {
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
                [history_types_1.HistorySchemaDefine.DEFI_NAME]: name,
                [history_types_1.HistorySchemaDefine.RESERVED_USD]: Math.floor(parseFloat(pairData[1].pair.reserveUSD)),
                [history_types_1.HistorySchemaDefine.VOLUME_USD]: Math.floor(volume),
                [history_types_1.HistorySchemaDefine.PAIR_ID]: value.id,
                [history_types_1.HistorySchemaDefine.PAIR_NAME]: pairData[0].pair.token0.symbol + "-" + pairData[0].pair.token1.symbol,
                [history_types_1.HistorySchemaDefine.APR]: Number((this.getAnnualInterest(reservedUSD, volume)).toFixed(2)),
                [history_types_1.HistorySchemaDefine.APR_WEEK]: -1
            };
            var aprWeak = -1;
            try {
                aprWeak = await this.getAprWeek(value.id, appendData, name);
            }
            catch (err) {
            }
            appendData.aprWeek = Number(aprWeak.toFixed(2));
            history_controller_1.append(appendData);
            return new Promise((resolve) => {
                resolve(null);
            });
        }));
        this._logger?.trace("[out]defiSyncher#processInternal " + name);
    }
    async getPairData(pair, endpoint, block = undefined) {
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
    async getTopLiquidPairs(endpoint) {
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
    async getAprWeek(pairId, newest, name) {
        return new Promise(async (resolve, reject) => {
            try {
                const weekData = await history_controller_1.getPairWeekData(name, pairId);
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
exports.defiSyncher = defiSyncher;
