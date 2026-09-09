if (process.platform !== "win32") {
  const fail = async () => { throw new Error(`Telegram Desktop automation is unsupported on ${process.platform}`); };
  module.exports = { isRunning: async () => false, focus: fail, openSavedMessages: fail, verifySavedMessages: fail, openLocationPicker: fail, waitForHumanSubmission: fail, copyLatestLocationLink: fail, resetToCleanState: fail, getClipboard: fail, setClipboard: fail };
} else {
  module.exports = require("./desktop.win.js");
}
