require("./render-setup.cjs");
const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  React = require("react"),
  { create, act } = require("react-test-renderer");
const Auth = require("../src/screens/Auth").default;
const { Consultations, AdminResource } = require("../src/screens/Areas");
const { Medications } = require("../src/screens/Care");
const Chat = require("../src/screens/Chat").default;
const { Form, Button } = require("../src/components/ui");
let root;
async function mount(component) {
  await act(async () => {
    root = create(component);
  });
  return root;
}
async function click(label) {
  const item = root.root
    .findAllByType(Button)
    .find((x) => [x.props.children].flat().join("") === label);
  assert.ok(item, `Botão ausente: ${label}`);
  await act(async () => {
    await item.props.onPress();
  });
}
async function save(values) {
  await act(async () => {
    await root.root.findByType(Form).props.onSave(values);
  });
}
async function close() {
  await act(async () => root.unmount());
}

test("login dos três perfis envia tipo correto e abre sessão", async () => {
  for (const tipo of ["paciente", "medico", "administrador"]) {
    let sent, session;
    await mount(
      React.createElement(Auth, {
        api: async (p, o) => {
          sent = { p, ...o };
          return { token: "token", user: { tipo } };
        },
        onLogin: async (s) => {
          session = s;
        },
      }),
    );
    if (tipo !== "paciente")
      await click(`Entrar como ${tipo === "medico" ? "médico" : tipo}`);
    await save({ email: " teste@exemplo.com ", senha: "123456" });
    assert.equal(sent.p, "/auth/login");
    assert.equal(sent.body.tipo, tipo);
    assert.equal(sent.body.email, "teste@exemplo.com");
    assert.equal(session.token, "token");
    await close();
  }
});
test("cadastro recusa confirmação divergente e usa rota de paciente", async () => {
  const calls = [];
  await mount(
    React.createElement(Auth, {
      api: async (p, o) => {
        calls.push({ p, ...o });
      },
      onLogin: () => {},
    }),
  );
  await click("Criar conta");
  await save({ email: "a@b.com", senha: "123456", confirmar_senha: "outro" });
  assert.equal(calls.length, 0);
  await save({
    email: "a@b.com",
    senha: "123456",
    confirmar_senha: "123456",
    nome_paciente: "Maria",
    data_nascimento: "1950-01-01",
  });
  assert.equal(calls[0].p, "/auth/register");
  assert.equal(calls[0].body.tipo, "paciente");
  await close();
});
test("recuperação envia nova senha e prova do cadastro", async () => {
  let sent;
  await mount(
    React.createElement(Auth, {
      api: async (p, o) => {
        sent = { p, ...o };
      },
      onLogin: () => {},
    }),
  );
  await click("Esqueci minha senha");
  await save({
    email: "a@b.com",
    data_nascimento: "1950-01-01",
    nova_senha: "abcdef",
    confirmar_senha: "abcdef",
  });
  assert.equal(sent.p, "/auth/recuperar-senha");
  assert.equal(sent.body.data_nascimento, "1950-01-01");
  await close();
});
test("admin só exclui consulta após confirmação e recarrega lista", async () => {
  const calls = [];
  let exists = true;
  const api = async (p, o = {}) => {
    calls.push([p, o.method || "GET"]);
    if (o.method === "DELETE") {
      exists = false;
      return {};
    }
    return exists
      ? [
          {
            id: "c1",
            status: "agendada",
            nome_medico: "Dra. Ana",
            data_consulta: "2099-01-01",
            horario_consulta: "10:00",
          },
        ]
      : [];
  };
  await mount(
    React.createElement(Consultations, {
      api,
      user: { tipo: "administrador" },
      navigation: {},
    }),
  );
  await click("Excluir consulta");
  assert.equal(calls.filter((c) => c[1] === "DELETE").length, 0);
  await click("Confirmar");
  assert.deepEqual(
    calls.find((c) => c[1] === "DELETE"),
    ["/consultas/c1", "DELETE"],
  );
  assert.equal(
    root.root
      .findAllByType(Button)
      .some((b) => b.props.children === "Excluir consulta"),
    false,
  );
  await close();
});
test("erro de exclusão conserva consulta e permite nova tentativa", async () => {
  const api = async (p, o = {}) => {
    if (o.method === "DELETE") throw new Error("Sem conexão");
    return [{ id: "c1", data_consulta: "2099-01-01" }];
  };
  await mount(
    React.createElement(Consultations, {
      api,
      user: { tipo: "administrador" },
      navigation: {},
    }),
  );
  await click("Excluir consulta");
  await click("Confirmar");
  assert.ok(
    root.root
      .findAllByType(Button)
      .some((b) => b.props.children === "Excluir consulta"),
  );
  assert.match(JSON.stringify(root.toJSON()), /Sem conexão/);
  await close();
});
test("paciente registra e desfaz tomada no contrato da API", async () => {
  const calls = [];
  let taken = false;
  const api = async (p, o = {}) => {
    calls.push({ p, ...o });
    if (o.method === "PUT") {
      taken = o.body.tomado;
      return {};
    }
    return [
      {
        id: "r1",
        nome_remedio: "Exemplo",
        data_inicio: "2020-01-01",
        data_fim: "2099-01-01",
        tomado_hoje: taken,
      },
    ];
  };
  await mount(
    React.createElement(Medications, { api, user: { tipo: "paciente" } }),
  );
  await click("Marcar como tomado hoje");
  assert.equal(calls.find((c) => c.method === "PUT").body.tomado, true);
  await click("Desmarcar tomada de hoje");
  assert.equal(calls.filter((c) => c.method === "PUT")[1].body.tomado, false);
  await close();
});
test("chat sem serviço configurado bloqueia envio e oferece agendamento", async () => {
  delete process.env.EXPO_PUBLIC_CHAT_PATH;
  const routes = [];
  await mount(
    React.createElement(Chat, {
      api: () => {
        throw Error("Não deve chamar API");
      },
      navigation: { navigate: (r) => routes.push(r) },
    }),
  );
  const send = root.root
    .findAllByType(Button)
    .find((b) => b.props.children === "Enviar mensagem");
  assert.equal(send.props.disabled, true);
  await click("Abrir agendamento");
  assert.deepEqual(routes, ["Agendamento"]);
  await close();
});

const Booking = require("../src/screens/Booking").default;
const { Profile, CreateConsultation } = require("../src/screens/Care");
const Accessibility = require("../src/components/Accessibility").default;
const { Field } = require("../src/components/ui");
const session = { token: "teste", user: { id: "p1", tipo: "paciente" } };
async function fill(label, value) {
  const field = root.root
    .findAllByType(Field)
    .find((f) => f.props.label === label);
  assert.ok(field, `Campo ausente: ${label}`);
  await act(async () => field.props.onChangeText(value));
}
test("agendamento direto confirma motivo e sintomas e volta à agenda", async () => {
  let saved = null;
  const calls = [];
  const slot = {
    id: "c1",
    id_medico: "m1",
    id_clinica: "cl1",
    nome_medico: "Ana",
    data_consulta: "2099-12-09",
    horario_consulta: "09:00",
  };
  const api = async (p, o = {}) => {
    calls.push({ p, ...o });
    if (p === "/pre-triagens") return [];
    if (p.startsWith("/consultas/disponiveis")) return [slot];
    if (o.method === "PUT") {
      saved = { ...slot, status: "agendada" };
      return saved;
    }
    return saved ? [saved] : [];
  };
  await mount(React.createElement(Booking, { api, session }));
  await click("Agendar consulta");
  await click("Agendar diretamente");
  await click("Escolher horário");
  await fill("Motivo da consulta", "Dor fictícia");
  await fill("Sintomas", "Sintoma fictício");
  await click("Confirmar agendamento");
  const request = calls.find((c) => c.p === "/consultas/c1/agendar");
  assert.equal(request.body.queixa_principal, "Dor fictícia");
  assert.equal(request.body.sintomas, "Sintoma fictício");
  assert.match(JSON.stringify(root.toJSON()), /Consulta confirmada/);
  await close();
});
test("horário disputado mostra erro e atualiza horários em vez de confirmar", async () => {
  const slot = {
    id: "c1",
    id_medico: "m1",
    id_clinica: "cl1",
    nome_medico: "Ana",
    data_consulta: "2099-12-09",
    horario_consulta: "09:00",
  };
  const api = async (p, o = {}) => {
    if (p === "/pre-triagens") return [];
    if (p.startsWith("/consultas/disponiveis")) return [slot];
    if (o.method === "PUT")
      throw Object.assign(new Error("Horário indisponível"), { status: 409 });
    return [];
  };
  await mount(React.createElement(Booking, { api, session }));
  await click("Agendar consulta");
  await click("Agendar diretamente");
  await click("Escolher horário");
  await fill("Motivo da consulta", "Teste");
  await click("Confirmar agendamento");
  assert.match(JSON.stringify(root.toJSON()), /Horário indisponível/);
  assert.ok(
    root.root
      .findAllByType(Button)
      .some((b) => b.props.children === "Escolher horário"),
  );
  await close();
});
test("pré-triagem urgente não oferece uso da recomendação", async () => {
  const api = async (p) =>
    p === "/pre-triagens"
      ? [
          {
            _id: "t1",
            createdAt: "2026-11-16",
            especialidades: [],
            resumo: "Resultado fictício",
            urgencia: true,
          },
        ]
      : [];
  await mount(React.createElement(Booking, { api, session }));
  await click("Agendar consulta");
  assert.equal(
    root.root
      .findAllByType(Button)
      .some((b) => b.props.children === "Usar recomendação"),
    false,
  );
  assert.match(JSON.stringify(root.toJSON()), /urgência/);
  await close();
});
test("perfil não inclui opções de acessibilidade e salva dados na API", async () => {
  let saved;
  const user = { id: "p1", tipo: "paciente", nome_paciente: "Maria" };
  await mount(
    React.createElement(Profile, {
      api: async (p, o = {}) => {
        if (o.method === "PUT") saved = o.body;
        return user;
      },
      user,
      updateUser: async () => {},
      logout: async () => {},
    }),
  );
  assert.equal(
    root.root
      .findAllByType(Button)
      .some((b) => ["Modo claro", "Texto maior"].includes(b.props.children)),
    false,
  );
  await save({ nome_paciente: "Maria atualizada" });
  assert.equal(saved.nome_paciente, "Maria atualizada");
  await close();
});
test("acessibilidade oferece as mesmas preferências do PWA antes do login", async () => {
  const changes = [];
  await mount(
    React.createElement(Accessibility, {
      prefs: { large: false, light: false },
      onChange: async (p) => changes.push(p),
    }),
  );
  await click("Texto maior");
  await click("Modo claro");
  assert.equal(changes[0].large, true);
  assert.equal(changes[1].light, true);
  await close();
});
test("criação de consultas transforma horários do formulário em lista", async () => {
  let saved;
  const api = async (p, o = {}) => {
    if (o.method === "POST") {
      saved = o.body;
      return { message: "2 horários criados" };
    }
    return { clinicas: [{ id: "cl1", nome_clinica: "Teste" }] };
  };
  await mount(
    React.createElement(CreateConsultation, {
      api,
      user: { tipo: "medico" },
      navigation: {},
    }),
  );
  await save({
    id_clinica: "cl1",
    data_consulta: "2099-01-01",
    horarios: "09:00, 10:00",
  });
  assert.deepEqual(saved.horarios, ["09:00", "10:00"]);
  await close();
});
test("admin cadastra clínica usando a mesma interface de edição", async () => {
  const calls = [];
  await mount(
    React.createElement(AdminResource, {
      resource: "Clínicas",
      api: async (p, o = {}) => {
        calls.push({ p, ...o });
        return [];
      },
      user: { id: "a1" },
    }),
  );
  await click("Cadastrar clínica");
  const forms = root.root.findAllByType(Form);
  await act(async () => {
    await forms[1].props.onSave({ nome_clinica: "Teste" });
  });
  assert.equal(calls.find((c) => c.method === "POST").p, "/clinicas");
  assert.equal(
    calls.find((c) => c.method === "POST").body.nome_clinica,
    "Teste",
  );
  await close();
});
