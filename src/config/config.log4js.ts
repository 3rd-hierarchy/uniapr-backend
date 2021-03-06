export const log4jsConfig = {
  appenders: {
    console: {
      type: "console"
    }
  },

  categories: {
    default: {
      appenders: ["console"],
      level: "debug"
    },
    web: {
      appenders: ["console"],
      level: "info"
    }
  }
}