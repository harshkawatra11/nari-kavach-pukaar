function createJobStore() {
  const jobs = new Map();
  function create(input) {
    const existing = jobs.get(input.alertId);
    if (existing) return { job: existing, created: false };
    const job = { ...input, stage: "queued", foregroundRestored: false, createdAt: Date.now(), updatedAt: Date.now() };
    jobs.set(input.alertId, job);
    return { job, created: true };
  }
  function get(id) { return jobs.get(id) || null; }
  function update(id, patch) {
    const current = jobs.get(id);
    if (!current) return null;
    const next = { ...current, ...patch, updatedAt: Date.now() };
    jobs.set(id, next);
    return next;
  }
  return { create, get, update };
}
module.exports = { createJobStore };
