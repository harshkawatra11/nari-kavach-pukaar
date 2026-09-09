const TERMINAL = new Set(["submitted", "failed", "unknown"]);

function createDispatchWorker({ wa, captureForegroundTarget, restoreForegroundTarget, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) }) {
  async function run(job, update) {
    let clipboard = null;
    let returnTarget = null;
    let entered = false;
    const results = [];
    try {
      update({ stage: "preparing" });
      returnTarget = await captureForegroundTarget().catch(() => null);
      clipboard = await wa.getClipboard();
      if (!(await wa.isRunning())) throw new Error("WhatsApp Desktop is not running");
      await wa.focus();
      update({ stage: "submitting" });
      for (const contact of job.contacts) {
        entered = false;
        try {
          await wa.resetToCleanState();
          await wa.openChatByNumber(String(contact.phone));
          await wa.pasteIntoComposer(job.message);
          const verification = await wa.verifyComposer(job.message);
          if (!verification.ok) {
            await wa.clearComposer();
            throw new Error(`composer verification failed (${verification.score.toFixed(3)})`);
          }
          await wa.pressEnterToSend();
          entered = true;
          results.push({ ...contact, submitted: true });
        } catch (error) {
          results.push({ ...contact, submitted: false, uncertain: entered, error: String(error?.message || error) });
        }
      }
      await sleep(job.returnDelayMs);
      const foregroundRestored = await restoreForegroundTarget(returnTarget).catch(() => false);
      const uncertain = results.some((result) => result.uncertain);
      const successful = results.every((result) => result.submitted);
      update({ stage: uncertain ? "unknown" : successful ? "submitted" : "failed", contacts: results, foregroundRestored });
    } catch (error) {
      update({ stage: entered ? "unknown" : "failed", error: String(error?.message || error), contacts: results });
    } finally {
      if (clipboard !== null) await wa.setClipboard(clipboard).catch(() => undefined);
    }
  }
  return { run, isTerminal: (stage) => TERMINAL.has(stage) };
}

module.exports = { createDispatchWorker };
