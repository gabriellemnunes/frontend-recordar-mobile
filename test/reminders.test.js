const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createReminderManager } = require("../src/reminderManager");
const appointment = {
  id: "c1",
  status: "agendada",
  data_consulta: "2099-12-09",
  horario_consulta: "11:00",
};
function setup() {
  const pending = new Map([["outra-funcionalidade", {}]]);
  const manager = createReminderManager({
    pending: async () =>
      [...pending.keys()].map((identifier) => ({ identifier })),
    cancel: async (id) => {
      pending.delete(id);
    },
    permitted: async () => true,
    schedule: async (item) => {
      pending.set(item.id, item);
    },
  });
  return { manager, pending };
}
test("consulta realizada remove lembretes sem afetar outras funcionalidades", async () => {
  const { manager, pending } = setup();
  await manager.sync([appointment]);
  assert.equal(pending.size, 3);
  await manager.sync([{ ...appointment, status: "realizada" }]);
  assert.deepEqual([...pending.keys()], ["outra-funcionalidade"]);
});
test("cancelamento posterior vence sincronizacao concorrente", async () => {
  const { manager, pending } = setup();
  await Promise.all([manager.sync([appointment]), manager.sync([])]);
  assert.deepEqual([...pending.keys()], ["outra-funcionalidade"]);
});
test("saida da conta vence sincronizacao ja iniciada", async () => {
  const { manager, pending } = setup();
  const sync = manager.sync([appointment]);
  await Promise.resolve();
  await Promise.all([sync, manager.clear()]);
  assert.deepEqual([...pending.keys()], ["outra-funcionalidade"]);
});
test("resposta antiga nao sobrescreve reagendamento confirmado", async () => {
  const { manager, pending } = setup();
  const oldRead = manager.version();
  await manager.sync([{ ...appointment, id: "c2", horario_consulta: "12:00" }]);
  assert.equal(await manager.sync([appointment], oldRead), false);
  assert.deepEqual(
    [...pending.keys()],
    ["outra-funcionalidade", "recordar-c2-24", "recordar-c2-1"],
  );
});
test("permissao negada remove lembretes antigos sem agendar novos", async () => {
  let scheduled = false,
    cancelled = false;
  const manager = createReminderManager({
    pending: async () => [{ identifier: "recordar-antigo" }],
    cancel: async () => {
      cancelled = true;
    },
    permitted: async () => false,
    schedule: async () => {
      scheduled = true;
    },
  });
  assert.equal(await manager.sync([appointment]), false);
  assert.equal(cancelled, true);
  assert.equal(scheduled, false);
});
test("falha nativa nao bloqueia limpeza seguinte", async () => {
  let fail = true;
  const manager = createReminderManager({
    pending: async () => {
      if (fail) throw Error("Falha nativa");
      return [];
    },
  });
  await assert.rejects(manager.clear(), /Falha nativa/);
  fail = false;
  await manager.clear();
});
