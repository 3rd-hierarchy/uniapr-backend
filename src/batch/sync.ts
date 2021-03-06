import { request, gql } from 'graphql-request'
import { Logger } from '../utils/logger'

const UNISWAP_ENDPOINT = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2"
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
    volumeUSD: string
  }[]
}

interface ITokenInfo {
  symbol: string
}

export class UniswapSyncher {
  private static _self: UniswapSyncher

  static schedule() {
    if (!this._self) {
      this._self = new UniswapSyncher()
    }

    // test
    this._self.onFired()
  }

  private constructor() {
    
  }

  private async onFired() {
    const time = new Date().getTime();
    const currentTime = Math.floor(time / 1000);
    const oneDayAgoTime = currentTime - 24 * 60 * 60;

    const logger = Logger.instance.logger

    let ethBlockInfo: IEthBlockInfo
    try {
      ethBlockInfo = await this.getEthTransactionInfo(oneDayAgoTime)
    } catch (err) {
      logger?.error("Faild get eth blog info. err = " + err)
      return
    }

    let pairs: IAllPairs
    try {
      pairs = await this.getTopLiquidPairs()
    } catch (err) {
      logger?.error("Faild get pairs info. err = " + err)
      return
    }

    pairs.pairs.map(async (value: { id: string }) => {
      let pairData: IPairInfo[] | void
      try {
        pairData = await Promise.all([
          this.getPairData(value.id, ethBlockInfo.blocks[0].number),
          this.getPairData(value.id)
        ])
      } catch (err) {
        logger?.error("Faild get pair. err = " + err)
      }

      logger?.debug(pairData)
    })
  }

  private async getPairData(pair: string, block : string|undefined = undefined): Promise<IPairInfo>{
    const endpoint = "https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v2";

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
          console.log(JSON.stringify(data));
          resolve(json);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  private async getTopLiquidPairs(): Promise<IAllPairs> {
    return new Promise((resolve, reject) => {
      const query = gql`
      {
        pairs(
          first: 110
          orderBy: reserveUSD
          orderDirection: desc
        ) {
          id
        }
      }
    `;

      request(UNISWAP_ENDPOINT, query)
        .then((data) => {
          const json = JSON.parse(JSON.stringify(data));
          console.log(JSON.stringify(data));
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
        console.log(JSON.stringify(data));
        resolve(json);
      }).catch((error) => {
        reject(error);
      })
    });
  }
}