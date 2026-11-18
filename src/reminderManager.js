const { reminderPlan } = require("./reminderPlan");

// As operações são serializadas: uma sincronização antiga não pode recriar
// lembretes depois de uma atualização mais recente ou da saída da conta.
function createReminderManager(
  adapter,
  plan = reminderPlan,
  prefix = "recordar-",
  limit = 24,
) {
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
      if (
        item.identifier.startsWith(prefix) &&
        (prefix !== "recordar-" || !item.identifier.startsWith("recordar-med-"))
      )
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
        const items = plan(appointments)
          .sort((a, b) => a.date - b.date)
          .slice(0, limit);
        for (const item of items) {
          if (current !== revision) return false;
          await adapter.schedule(item);
        }
        return true;
      });
    },
  };
}
module.exports = { createReminderManager };
