const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApi, availablePath } = require('../src/api');
const { reminderPlan } = require('../src/reminderPlan');
test('envia token e vínculo de pré-triagem sem alterar o contrato oficial', async () => {
  let sent;
  const api = createApi('http://localhost:3000/api/', 'token', undefined, async (url, options) => {
    sent = { url, options }; return { ok: true, status: 200, json: async () => ({ id: '1' }) };
  });
  await api('/consultas/1/agendar', { method: 'PUT', body: { id_pre_triagem: 'triagem' } });
  assert.equal(sent.options.headers.Authorization, 'Bearer token');
  assert.equal(sent.url, 'http://localhost:3000/api/consultas/1/agendar');
  assert.deepEqual(JSON.parse(sent.options.body), { id_pre_triagem: 'triagem' });
});
test('expiração de sessão aciona saída e mantém mensagem do servidor', async () => {
  let exited = false;
  const api = createApi('https://example.com/api', 'token', () => { exited = true; }, async () => ({ ok: false, status: 401, json: async () => ({ message: 'Sessão expirada' }) }));
  await assert.rejects(api('/consultas'), /Sessão expirada/); assert.equal(exited, true);
});
test('filtro recomendado inclui apenas parâmetros preenchidos', () => {
  assert.equal(availablePath({ triageId: 'abc', date: '2099-12-09' }), '/consultas/disponiveis?id_pre_triagem=abc&data=2099-12-09');
});
test('lembretes usam horário de Brasília e omitem sintomas e identificação médica', () => {
  const result = reminderPlan([{ id: '1', status: 'agendada', data_consulta: '2099-12-09', horario_consulta: '11:00' }], Date.parse('2099-12-01T00:00:00Z'));
  assert.equal(result.length, 2); assert.equal(result[0].date.toISOString(), '2099-12-08T14:00:00.000Z');
  assert.equal(result[1].date.toISOString(), '2099-12-09T13:00:00.000Z');
});
test('horários passados, cancelamentos e lembretes vencidos não são agendados', () => {
  const now = Date.parse('2099-12-09T13:30:00Z');
  assert.deepEqual(reminderPlan([{ id: '1', status: 'agendada', data_consulta: '2099-12-09', horario_consulta: '11:00' },
    { id: '2', status: 'disponivel', data_consulta: '2099-12-10', horario_consulta: '11:00' }], now), []);
});
