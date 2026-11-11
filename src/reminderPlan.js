function reminderPlan(appointments, now = Date.now()) {
  return appointments.filter(c => c.status === 'agendada').flatMap(c => {
    const time = new Date(`${c.data_consulta}T${c.horario_consulta}:00-03:00`).getTime();
    if (!Number.isFinite(time)) return [];
    return [24, 1].filter(hours => time - hours * 3600000 > now).map(hours => ({
      id: `recordar-${c.id}-${hours}`, date: new Date(time - hours * 3600000),
      title: 'Lembrete do Recordar', body: `Você tem uma consulta ${hours === 24 ? 'amanhã' : 'em 1 hora'}. Abra o Recordar para ver os detalhes.`
    }));
  });
}
module.exports = { reminderPlan };
