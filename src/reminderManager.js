const { reminderPlan } = require("./reminderPlan");

// As operações são serializadas: uma sincronização antiga não pode recriar
// lembretes depois de uma atualização mais recente ou da saída da conta.
function createReminderManager(adapter) {
  let queue = Promise.resolve();
  let revision = 0;
  const enqueue = (action) => {
    const next = queue.then(action);
    queue = next.catch(() => {});
    return next;
  };
  async function remove() {
    const pending = await adapter.pending();
    for (const item of pending) {
      if (item.identifier.startsWith("recordar-"))
        await adapter.cancel(item.identifier);
    }
  }
  return {
    version: () => revision,
    clear() {
      ++revision;
      return enqueue(remove);
    },
    sync(appointments, expectedRevision) {
      if (expectedRevision !== undefined && expectedRevision !== revision)
        return Promise.resolve(false);
      const current = ++revision;
      return enqueue(async () => {
        if (current !== revision) return false;
        await remove();
        if (!(await adapter.permitted()) || current !== revision) return false;
        const plan = reminderPlan(appointments)
          .sort((a, b) => a.date - b.date)
          .slice(0, 60);
        for (const item of plan) {
          if (current !== revision) return false;
          await adapter.schedule(item);
        }
        return true;
      });
    },
  };
}
module.exports = { createReminderManager };
