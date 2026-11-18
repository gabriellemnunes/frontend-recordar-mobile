const { test } = require('node:test');
const assert = require('node:assert/strict');
const { medicationPlan } = require('../src/medicationPlan');
const base = {id:'m1',horario_remedio:'08:00',tomadas_por_dia:2,intervalo_minimo_minutos:720,data_inicio:'2026-11-18',data_fim:'2026-11-18'};
test('lembretes respeitam frequencia, limite, intervalo e tratamento',()=>{
 const now=Date.parse('2026-11-18T07:00:00-03:00');
 assert.equal(medicationPlan([base],now).length,2);
 assert.equal(medicationPlan([{...base,tomadas_hoje:2}],now).length,0);
 const result=medicationPlan([{...base,tomadas_hoje:1,proximo_registro_em:'2026-11-19T00:00:00Z'}],now);
 assert.equal(result.length,1);
 assert.equal(result[0].date.toISOString(),'2026-11-19T00:00:00.000Z');
 assert.doesNotMatch(result[0].body,/m1|comprimido/);
 assert.equal(medicationPlan([base],Date.parse('2026-11-19T12:00:00Z')).length,0);
});
