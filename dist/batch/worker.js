"use strict";
const path = require('path');
require("ts-node").register();
const { UniswapSyncher } = require(path.join(__dirname, "uniswapSync.ts"));
UniswapSyncher.process();
