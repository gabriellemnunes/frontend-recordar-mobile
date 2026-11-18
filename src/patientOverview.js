function dayISO(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(now);
}
function appointmentTime(item) {
  return new Date(
    `${item.data_consulta}T${item.horario_consulta}:00-03:00`,
  ).getTime();
}
function patientOverview(
  appointments = [],
  medications = [],
  now = Date.now(),
) {
  const day = dayISO(new Date(now));
  const upcoming = appointments
    .filter((c) => c.status === "agendada" && appointmentTime(c) >= now)
    .sort((a, b) => appointmentTime(a) - appointmentTime(b));
  const todayMedications = medications
    .filter(
      (m) =>
        (!m.data_inicio || m.data_inicio <= day) &&
        (!m.data_fim || m.data_fim >= day) &&
        m.situacao !== "encerrado",
    )
    .sort((a, b) =>
      String(a.horario_remedio).localeCompare(String(b.horario_remedio)),
    );
  return {
    day,
    upcoming,
    next: upcoming[0] || null,
    medications: todayMedications,
    remaining: todayMedications.reduce(
      (sum, m) =>
        sum +
        Math.max(
          0,
          (m.tomadas_por_dia || 1) -
            (m.tomadas_hoje ?? (m.tomado_hoje ? 1 : 0)),
        ),
      0,
    ),
  };
}
function nextDays(now = new Date()) {
  const day = dayISO(now);
  return Array.from({ length: 7 }, (_, i) =>
    new Date(Date.parse(day + "T12:00:00Z") + i * 86400000)
      .toISOString()
      .slice(0, 10),
  );
}
module.exports = { dayISO, appointmentTime, patientOverview, nextDays };
