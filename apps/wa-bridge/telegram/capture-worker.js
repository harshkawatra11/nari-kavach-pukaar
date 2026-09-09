const { parseMapsLink } = require("./maps-link.js");

function createTelegramCaptureWorker({ telegram, captureForegroundTarget, restoreForegroundTarget }) {
  async function run(job, update) {
    let clipboard = null;
    let returnTarget = null;
    let outcome = null;
    try {
      update({ stage: "opening_telegram" });
      returnTarget = await captureForegroundTarget().catch(() => null);
      clipboard = await telegram.getClipboard();
      if (!(await telegram.isRunning())) throw Object.assign(new Error("Telegram Desktop is not running"), { code: "telegram_not_running" });
      await telegram.focus();
      update({ stage: "opening_saved_messages" });
      await telegram.openSavedMessages();
      if (!(await telegram.verifySavedMessages())) throw Object.assign(new Error("Saved Messages could not be verified"), { code: "saved_messages_not_verified" });
      update({ stage: "opening_picker" });
      await telegram.openLocationPicker();
      update({ stage: "awaiting_confirmation" });
      await telegram.waitForHumanSubmission(job.confirmationTimeoutMs);
      update({ stage: "copying_link" });
      const copied = await telegram.copyLatestLocationLink();
      const parsed = parseMapsLink(copied);
      if (!parsed) {
        outcome = { stage: "unparsed", errorCode: "maps_link_invalid", error: "Telegram did not provide a valid Google Maps coordinate link" };
      } else {
        outcome = {
          stage: "captured",
          mapsUrl: parsed.canonicalUrl,
          point: { lat: parsed.lat, lng: parsed.lng, accuracyM: null, at: Date.now(), source: "telegram-desktop" },
        };
      }
    } catch (error) {
      const errorCode = error?.code || "telegram_capture_failed";
      outcome = { stage: errorCode === "confirmation_timeout" ? "cancelled" : "failed", errorCode, error: String(error?.message || error) };
    } finally {
      await telegram.resetToCleanState().catch(() => undefined);
      if (clipboard !== null) await telegram.setClipboard(clipboard).catch(() => undefined);
      const foregroundRestored = await restoreForegroundTarget(returnTarget).catch(() => false);
      update({ ...outcome, foregroundRestored });
    }
  }
  return { run };
}

module.exports = { createTelegramCaptureWorker };
