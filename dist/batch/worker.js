"use strict";
const path = require('path');
require("ts-node").register();
const { defiSyncher } = require(path.join(__dirname, "defiSync.ts"));
defiSyncher.process();
