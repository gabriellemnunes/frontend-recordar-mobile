function medicationPlan(medications, now = Date.now()) {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(now));
  const plan = [];
  for (const m of medications) {
    const limit = m.tomadas_por_dia || 1;
    const interval = m.intervalo_minimo_minutos || 0;
    const [h, min] = String(m.horario_remedio).split(":").map(Number);
    if (
      !Number.isInteger(h) ||
      h < 0 ||
      h > 23 ||
      !Number.isInteger(min) ||
      min < 0 ||
      min > 59
    )
      continue;
    for (let d = 0; d < 7; d++) {
      const day = new Date(Date.parse(today + "T12:00:00Z") + d * 86400000)
        .toISOString()
        .slice(0, 10);
      if (
        (m.data_inicio && day < m.data_inicio) ||
        (m.data_fim && day > m.data_fim)
      )
        continue;
      let remaining =
        day === today
          ? Math.max(0, limit - (m.tomadas_hoje ?? (m.tomado_hoje ? limit : 0)))
          : limit;
      const count =
        day === today ? (m.tomadas_hoje ?? (m.tomado_hoje ? limit : 0)) : 0;
      for (let i = count; i < limit && remaining > 0; i++) {
        const minute = h * 60 + min + i * interval;
        if (minute >= 1440) break;
        const nominal = Date.parse(day + "T00:00:00-03:00") + minute * 60000;
        const earliest =
          day === today && m.proximo_registro_em
            ? Date.parse(m.proximo_registro_em) + (i - count) * interval * 60000
            : 0;
        const date = Math.max(nominal, earliest);
        if (
          date <= now ||
          date >= Date.parse(day + "T00:00:00-03:00") + 86400000
        )
          continue;
        plan.push({
          id: `recordar-med-${m.id}-${day}-${i}`,
          date: new Date(date),
          title: "Lembrete de medicamento",
          body: "Confira o medicamento e a quantidade prescritos no Recordar.",
        });
        remaining--;
      }
    }
  }
  return plan;
}
module.exports = { medicationPlan };
