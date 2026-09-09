function createSerialQueue() {
  let tail = Promise.resolve();
  function enqueue(task) {
    const result = tail.then(task);
    tail = result.catch(() => undefined);
    return result;
  }
  return { enqueue };
}

module.exports = { createSerialQueue };
