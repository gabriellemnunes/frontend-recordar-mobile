// Executes the actual mobile HTTP client against an isolated copy of the API.
// No production URL or database is read or modified.
const path = require("node:path"),
  fs = require("node:fs"),
  os = require("node:os"),
  assert = require("node:assert/strict");
const backend = path.resolve(
  process.env.RECORDAR_BACKEND_DIR || "../backend-recordar-mobile",
);
const dependency = (name) =>
  require(require.resolve(name, { paths: [backend] }));
const mongoose = dependency("mongoose"),
  { MongoMemoryReplSet } = dependency("mongodb-memory-server"),
  bcrypt = dependency("bcryptjs");
const { createApi, availablePath } = require("../src/api");
const { reminderPlan } = require("../src/reminderPlan");
process.env.JWT_SECRET = require("node:crypto").randomBytes(32).toString("hex");
process.env.AI_SERVICE_TOKEN = require("node:crypto")
  .randomBytes(32)
  .toString("hex");
const app = require(path.join(backend, "src/server")),
  User = require(path.join(backend, "src/models/User"));
let repl,
  server,
  count = 0;
function check(ok, label) {
  assert.ok(ok, label);
  console.log("OK", ++count, label);
}
async function main() {
  const dbPath = fs.mkdtempSync(
    path.join(os.tmpdir(), "recordar-mobile-integration-"),
  );
  repl = await MongoMemoryReplSet.create({
    instanceOpts: [{ dbPath }],
    replSet: { count: 1 },
    binary: {
      version: "7.0.24",
      downloadDir: path.join(os.tmpdir(), "recordar-mongodb-binaries"),
    },
  });
  await mongoose.connect(repl.getUri());
  await User.init();
  await User.create({
    tipo: "administrador",
    nome_usuario: "Admin fictício",
    email: "admin@test.recordar",
    senha: await bcrypt.hash("Teste123!", 10),
  });
  server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}/api`,
    guest = createApi(base);
  const login = async (email, tipo) => {
    const result = await guest("/auth/login", {
      method: "POST",
      body: { email, senha: "Teste123!", tipo },
    });
    return { user: result.user, api: createApi(base, result.token) };
  };
  const admin = await login("admin@test.recordar", "administrador");
  check(admin.user.tipo === "administrador", "login administrador");
  const clinic = await admin.api("/clinicas", {
    method: "POST",
    body: {
      nome_clinica: "Clínica fictícia",
      endereco_clinica: "Endereço fictício",
    },
  });
  await admin.api(`/clinicas/${clinic.id}`, {
    method: "PUT",
    body: { nome_clinica: "Clínica de teste" },
  });
  check(
    (await guest("/clinicas")).some(
      (c) => c.nome_clinica === "Clínica de teste",
    ),
    "criação e edição de clínica",
  );
  const specialty = await admin.api("/especialidades", {
    method: "POST",
    body: { nome_especialidade: "Clínica médica" },
  });
  const doctor = await admin.api("/users", {
    method: "POST",
    body: {
      tipo: "medico",
      nome_medico: "Médico fictício",
      crm: "TESTE",
      id_especialidade: specialty.id,
      clinicas: [clinic.id],
      email: "medico@test.recordar",
      senha: "Teste123!",
      confirmar_senha: "Teste123!",
    },
  });
  check(doctor.clinicas[0].id === clinic.id, "cadastro de médico com vínculos");
  const registered = await guest("/auth/register", {
    method: "POST",
    body: {
      nome_paciente: "Paciente fictício",
      email: "paciente@test.recordar",
      senha: "Teste123!",
      confirmar_senha: "Teste123!",
      data_nascimento: "1950-01-01",
    },
  });
  check(registered.user.tipo === "paciente", "cadastro de paciente");
  const patient = await login("paciente@test.recordar", "paciente"),
    medic = await login("medico@test.recordar", "medico");
  const profile = await patient.api("/users/me", {
    method: "PUT",
    body: {
      condicoes_saude: "Informação fictícia",
      alergias: "Nenhuma",
      medicamentos_em_uso: "Nenhum",
    },
  });
  check(profile.anamnese_preenchida, "perfil e anamnese geral");
  const created = await medic.api("/consultas", {
    method: "POST",
    body: {
      id_clinica: clinic.id,
      data_consulta: "2099-12-09",
      horarios: ["09:00", "10:00", "11:00"],
    },
  });
  check(created.consultas.length === 3, "médico cria múltiplos horários");
  const triageResponse = await fetch(base + "/pre-triagens", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-ai-service-token": process.env.AI_SERVICE_TOKEN,
    },
    body: JSON.stringify({
      paciente: patient.user.id,
      especialidades: [specialty.id],
      resumo: "Resultado fictício",
      urgencia: false,
      concluida: true,
      sintomas: ["Sintoma fictício"],
      duracao: "dois dias",
      intensidade: 3,
    }),
  });
  assert.equal(triageResponse.status, 201);
  const triage = await triageResponse.json();
  check(
    !!triage.id && !triage._id,
    "contrato real da rota de pré-triagem usa id",
  );
  check(
    (await patient.api("/pre-triagens")).length === 1,
    "pré-triagem concluída disponível para paciente",
  );
  const slots = await patient.api(
    availablePath({ triageId: String(triage.id) }),
  );
  check(slots.length === 3, "busca por recomendação");
  let booked = await patient.api(`/consultas/${slots[0].id}/agendar`, {
    method: "PUT",
    body: {
      id_pre_triagem: triage.id,
      queixa_principal: "Queixa fictícia",
      sintomas: "Sintoma fictício",
    },
  });
  check(
    booked.status === "agendada" && booked.id_pre_triagem === triage.id,
    "agendamento com pré-triagem e anamnese",
  );
  const replacements = await patient.api(
    availablePath({ appointmentId: booked.id }),
  );
  check(
    replacements.length === 2,
    "busca de reagendamento permite horários no mesmo dia",
  );
  check(
    (await patient.api(availablePath())).length === 0,
    "busca comum oculta conflitos com consulta já marcada",
  );
  const medication = await medic.api("/remedios", {
    method: "POST",
    body: {
      id_consulta: booked.id,
      nome_remedio: "Remédio fictício",
      horario_remedio: "08:00",
      quantidade_remedio: "1 comprimido",
      data_inicio: "2020-01-01",
      data_fim: "2099-12-31",
    },
  });
  check(!!medication.id, "prescrição pelo médico");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
  check(
    (await patient.api("/remedios?dia=" + today)).length === 1,
    "agenda diária filtra remédios pelo dia",
  );
  check(
    (
      await patient.api(`/remedios/${medication.id}/tomar`, {
        method: "PUT",
        body: { tomado: true, dia: today },
      })
    ).tomado_hoje,
    "paciente marca tomada",
  );
  check(
    !(
      await patient.api(`/remedios/${medication.id}/tomar`, {
        method: "PUT",
        body: { tomado: false, dia: today },
      })
    ).tomado_hoje,
    "paciente desfaz tomada",
  );
  await medic.api(`/remedios/${medication.id}`, {
    method: "PUT",
    body: { quantidade_remedio: "2 comprimidos" },
  });
  check(
    (await patient.api("/remedios"))[0].quantidade_remedio === "2 comprimidos",
    "edição de prescrição",
  );
  booked = await patient.api(`/consultas/${booked.id}/trocar`, {
    method: "PUT",
    body: { id_nova: slots[1].id },
  });
  check(booked.id === slots[1].id && booked.aviso_troca, "troca de horário");
  check(
    (await medic.api("/consultas/meus-pacientes")).some(
      (p) => p.id_paciente === patient.user.id,
    ),
    "lista de pacientes do médico",
  );
  await medic.api(`/consultas/${booked.id}/aviso-visto`, { method: "PUT" });
  await medic.api(`/consultas/${booked.id}/realizada`, { method: "PUT" });
  check(
    reminderPlan(await patient.api("/consultas")).length === 0,
    "consulta realizada não gera lembretes na sincronização",
  );
  check(
    (await patient.api("/consultas/historico")).some((c) => c.id === booked.id),
    "consulta realizada no histórico",
  );
  await admin.api(`/consultas/${booked.id}`, { method: "DELETE" });
  check(
    (await patient.api("/consultas/historico")).length === 0 &&
      (await patient.api("/remedios")).length === 0,
    "administrador exclui consulta e prescrições vinculadas",
  );
  const direct = await patient.api(`/consultas/${slots[2].id}/agendar`, {
    method: "PUT",
    body: { queixa_principal: "Agendamento direto" },
  });
  await patient.api(`/consultas/${direct.id}/cancelar`, { method: "PUT" });
  check(
    (await patient.api("/consultas")).length === 0,
    "agendamento direto e cancelamento",
  );
  delete process.env.ALLOW_INSECURE_PASSWORD_RECOVERY;
  await assert.rejects(
    guest("/auth/recuperar-senha", {
      method: "POST",
      body: {
        tipo: "paciente",
        email: "paciente@test.recordar",
        data_nascimento: "1950-01-01",
        nova_senha: "Nova123!",
        confirmar_senha: "Nova123!",
      },
    }),
    (e) => e.status === 403,
  );
  check(
    !!(
      await guest("/auth/login", {
        method: "POST",
        body: {
          email: "paciente@test.recordar",
          senha: "Teste123!",
          tipo: "paciente",
        },
      })
    ).token,
    "recuperação legada bloqueada preserva senha e login existentes",
  );
  await assert.rejects(patient.api("/users"), (e) => e.status === 403);
  check(true, "permissões negam administração a paciente");
  console.log(`Integração concluída: ${count} verificações.`);
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (server) await new Promise((r) => server.close(r));
    await mongoose.disconnect();
    if (repl) await repl.stop();
  });
