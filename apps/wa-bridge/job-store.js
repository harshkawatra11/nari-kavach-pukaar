function createJobStore({ idField = "alertId" } = {}) {
  const jobs = new Map();
  function create(input) {
    const id = input[idField];
    const existing = jobs.get(id);
    if (existing) return { job: existing, created: false };
    const job = { ...input, stage: "queued", foregroundRestored: false, createdAt: Date.now(), updatedAt: Date.now() };
    jobs.set(id, job);
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
