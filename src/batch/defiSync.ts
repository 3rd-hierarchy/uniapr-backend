import { request, gql } from 'graphql-request'
import { Worker } from 'worker_threads'
import { Logger } from '../utils/logger'
import * as path from 'path'
import { Mutex } from 'async-mutex'
import { append, getPairWeekData } from '../controllers/history.controller'
import { HistorySchemaDefine, IHistory } from '../commons/history.types'
import * as mongoose from 'mongoose'
import { config } from '../config/config'
import * as cron from 'node-cron'

const UNISWAP_NAME = "UniswapV2"
const UNISWAP_ENDPOINT = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2"

const SUSHISWAP_NAME = "Sushiswap"
const SUSHISWAP_ENDPOINT = "https://api.thegraph.com/subgraphs/name/sushiswap/exchange"

const ETH_ENDPOINT = "https://api.thegraph.com/subgraphs/name/blocklytics/ethereum-blocks"

interface IAllPairs {
  pairs: { id: string }[],
}

interface IEthBlockInfo {
  blocks: {
    number: string,
  }[]
}

interface IPairInfo {
  pair: {
    reserveUSD: string,
    token0: ITokenInfo,
    token1: ITokenInfo,
    volumeUSD: string
  }
}

interface ITokenInfo {
  symbol: string
}

export class defiSyncher {
  private static _self: defiSyncher
  private _mutex = new Mutex()
  private _logger = Logger.instance.logger

  get mutex() {
    return this._mutex
  }

  static get instance() {
    if (!this._self) {
      this._self = new defiSyncher()
    }
    return this._self
  }

  static schedule() {
    if (!this._self) {
      this._self = new defiSyncher()
    }

    // test
    // new Worker(path.join(__dirname, 'worker.js'), { execArgv: [] })
    if (process.env.NODE_ENV == "production") {
      cron.schedule('0 0 1 * * *', () => {
        defiSyncher.process()
      })
    } else if (process.env.NODE_ENV == "development") {
      defiSyncher.process()
    }
  }

  static async process() {
    if (!this._self) {
      this._self = new defiSyncher()
    }

    mongoose.connect(config['mongoUri'], {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true
    }).catch((err) => {
      Logger.instance.logger?.error('Mongo db connection faild. (%s)', err)
    })

    // const release = await this._self._mutex.acquire()
    try {
      await this._self.processInternal(UNISWAP_NAME, UNISWAP_ENDPOINT)
      await this._self.processInternal(SUSHISWAP_NAME, SUSHISWAP_ENDPOINT)
    } finally {
      // release()
    }
  }

  private constructor() {
    
  }

  private async processInternal(name: string, endpoint: string) {
    this._logger?.trace("[IN]defiSyncher#processInternal " + name)

    const time = new Date().getTime();
    const currentTime = Math.floor(time / 1000);
    const oneDayAgoTime = currentTime - 24 * 60 * 60;

    let ethBlockInfo: IEthBlockInfo
    try {
      ethBlockInfo = await this.getEthTransactionInfo(oneDayAgoTime)
    } catch (err) {
      this._logger?.error("Faild get eth blog info. err = " + err)
      return
    }

    let pairs: IAllPairs
    try {
      pairs = await this.getTopLiquidPairs(endpoint)
    } catch (err) {
      this._logger?.error("Faild get pairs info. err = " + err)
      return
    }

    await Promise.all(pairs.pairs.map(async (value: { id: string }) => {
      let pairData: IPairInfo[]
      try {
        pairData = await Promise.all([
          this.getPairData(value.id, endpoint, ethBlockInfo.blocks[0].number),
          this.getPairData(value.id, endpoint)
        ])
      } catch (err) {
        this._logger?.error("Faild get pair. err = " + err)
        return
      }

      if (pairData.length < 2) {
        this._logger?.error("Invalid pair length")
        return
      }

      if (!pairData[0].pair) {
        return
      }

      const volumeUSD = parseFloat(pairData[1].pair.volumeUSD)
      if (volumeUSD <= 0) {
        return
      }

      const baseVolume = parseFloat(pairData[0].pair.volumeUSD);
      const currentVolume = parseFloat(pairData[1].pair.volumeUSD);
      const volume = currentVolume - baseVolume;
      const reservedUSD = parseFloat(pairData[1].pair.reserveUSD);

      var appendData = {
        [HistorySchemaDefine.DEFI_NAME]: name,
        [HistorySchemaDefine.RESERVED_USD]: Math.floor(parseFloat(pairData[1].pair.reserveUSD)),
        [HistorySchemaDefine.VOLUME_USD]: Math.floor(volume),
        [HistorySchemaDefine.PAIR_ID]: value.id,
        [HistorySchemaDefine.PAIR_NAME]: pairData[0].pair.token0.symbol + "-" + pairData[0].pair.token1.symbol,
        [HistorySchemaDefine.APR]: Number((this.getAnnualInterest(reservedUSD, volume)).toFixed(2)),
        [HistorySchemaDefine.APR_WEEK]: -1
      }

      var aprWeak = -1
      try {
        aprWeak = await this.getAprWeek(value.id, appendData, name)
      } catch (err) {

      }
      appendData.aprWeek = Number(aprWeak.toFixed(2))

      append(appendData)

      return new Promise((resolve) => {
        resolve(null)
      })
    }))

    this._logger?.trace("[out]defiSyncher#processInternal " + name)
  }

  private async getPairData(pair: string, endpoint: string, block : string|undefined = undefined): Promise<IPairInfo>{
    return new Promise((resolve, reject) => {
      var blockNumber = ""
      if (block) {
        blockNumber = `block: { number: ${block} }`
      }

      const query = gql`
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

      request(endpoint, query)
        .then((data) => {
          const json = JSON.parse(JSON.stringify(data));
          resolve(json);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  private async getTopLiquidPairs(endpoint: string): Promise<IAllPairs> {
    return new Promise((resolve, reject) => {
      const query = gql`
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

      request(endpoint, query)
        .then((data) => {
          const json = JSON.parse(JSON.stringify(data));
          resolve(json);
        })
        .catch((error) => {
          reject(error);
        });
    })
  }


  private async getEthTransactionInfo(time: number): Promise<IEthBlockInfo> {
    return new Promise((resolve, reject) => {
      const query = gql`
      {
        blocks(first: 1, orderBy: timestamp, orderDirection: asc, where: {timestamp_gt: "${time}"}) {
            number
        }
      }
    `
      request(ETH_ENDPOINT, query).then((data) => {
        const json = JSON.parse(JSON.stringify(data))
        this._logger?.debug(JSON.stringify(data));
        resolve(json);
      }).catch((error) => {
        reject(error);
      })
    });
  }

  private getAnnualInterest(liquidity: number, volume: number) {
    const ratio = volume / liquidity
    const day = ratio * 0.003;
    const month = ((1 + day) ** 30 - 1) * 100;
    const year = ((1 + day) ** 365 - 1) * 100

    return year
  }

  private async getAprWeek(pairId: string, newest: IHistory, name: string): Promise<number> {
    return new Promise(async (resolve, reject) => {
      try {
        const weekData = await getPairWeekData(name, pairId)

        if (weekData.length < 2) {
          reject(-1)
          return
        }

        let totalVolume = weekData.reduce((acc, val): number => {
          return acc + val.volumeUSD
        }, 0)
        totalVolume += newest.volumeUSD

        const volumeAverage = totalVolume / (weekData.length + 1)

        resolve(this.getAnnualInterest(weekData[0].reserveUSD, volumeAverage))
      } catch (err) {
        reject(-1)
      }
    })
  }
}