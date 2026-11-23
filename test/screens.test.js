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
    if (tipo !== "paciente") {
      await click("Área de profissionais e administração");
      await click(`Entrar como ${tipo === "medico" ? "médico" : tipo}`);
    }
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
  await click("Marquei por engano");
  assert.equal(calls.filter((c) => c.method === "PUT").length, 1);
  await click("Confirmar");
  assert.equal(calls.filter((c) => c.method === "PUT")[1].body.tomado, false);
  await close();
});
test("agenda atualiza a data digitada e oculta prescrições fora do período", async () => {
  const paths = [];
  const api = async (path) => {
    paths.push(path);
    if (path === "/consultas") return [];
    return [{ id: "r1", nome_remedio: "Exemplo", data_inicio: "2026-11-23", data_fim: "2026-11-26" }];
  };
  await mount(React.createElement(Medications, { api, daily: true, user: { tipo: "paciente" } }));
  await fill("Dia (AAAA-MM-DD)", "2026-11-26");
  await click("Ver dia");
  assert.ok(paths.includes("/remedios?dia=2026-11-26"));
  assert.match(JSON.stringify(root.toJSON()), /Exemplo/);

  await fill("Dia (AAAA-MM-DD)", "2026-11-28");
  await click("Atualizar");
  assert.ok(paths.includes("/remedios?dia=2026-11-28"));
  assert.doesNotMatch(JSON.stringify(root.toJSON()), /Exemplo/);
  await close();
});
test("chat aguarda consentimento e oferece agendamento direto", async () => {
  delete process.env.EXPO_PUBLIC_CHAT_PATH;
  const routes = [];
  await mount(
    React.createElement(Chat, {
      api: () => {
        throw Error("Não deve chamar API");
      },
      navigation: { navigate: (...args) => routes.push(args) },
    }),
  );
  await fill("Sua mensagem", "Exemplo fictício");
  const send = root.root
    .findAllByType(Button)
    .find((b) => b.props.children === "Enviar mensagem");
  assert.equal(send.props.disabled, true);
  await click("Ver pré-triagens e agendar");
  assert.deepEqual(routes, [
    [
      "Recordar",
      { screen: "Agendamento", params: { id_pre_triagem: undefined } },
    ],
  ]);
  await close();
});

const Booking = require("../src/screens/Booking").default;
const { Profile, CreateConsultation } = require("../src/screens/Care");
const Accessibility = require("../src/components/Accessibility").default;
const { Field } = require("../src/components/ui");
const session = { token: "teste", user: { id: "p1", tipo: "paciente" } };
const runtime = require("./render-setup.cjs");
async function fill(label, value) {
  const field = root.root
    .findAllByType(Field)
    .find((f) => f.props.label === label);
  assert.ok(field, `Campo ausente: ${label}`);
  await act(async () => field.props.onChangeText(value));
}

test("recomendacao com id do backend filtra e vincula a consulta", async () => {
  const calls = [];
  const t = {
    id: "t1",
    createdAt: "2026-11-17",
    concluida: true,
    urgencia: false,
    resumo: "Resumo ficticio",
    sintomas: ["Sintoma ficticio"],
    duracao: "dois dias",
    intensidade: 3,
    especialidades: [{ id: "e1", nome_especialidade: "Clinica medica" }],
    alertas: ["Alerta do servico"],
  };
  const slot = {
    id: "c1",
    id_medico: "m1",
    id_clinica: "cl1",
    nome_medico: "Ana",
    data_consulta: "2099-12-09",
    horario_consulta: "09:00",
  };
  let saved;
  const api = async (p, o = {}) => {
    calls.push({ p, ...o });
    if (p === "/pre-triagens") return [t];
    if (p.startsWith("/consultas/disponiveis")) return [slot];
    if (o.method === "PUT") {
      saved = { ...slot, status: "agendada", id_pre_triagem: t.id };
      return saved;
    }
    return saved ? [saved] : [];
  };
  await mount(React.createElement(Booking, { api, session }));
  await click("Agendar consulta");
  await click("Usar recomendação");
  await click("Escolher horário");
  await click("Confirmar agendamento");
  assert.ok(
    calls.some((c) => c.p === "/consultas/disponiveis?id_pre_triagem=t1"),
  );
  const sent = calls.find((c) => c.p === "/consultas/c1/agendar");
  assert.equal(sent.body.id_pre_triagem, "t1");
  assert.equal(sent.body.sintomas, "Sintoma ficticio");
  await close();
});

test("id recebido do chatbot e carregado pela API depois da agenda inicial", async () => {
  const calls = [],
    params = [];
  await mount(
    React.createElement(Booking, {
      session,
      route: { params: { id_pre_triagem: "t1" } },
      navigation: { setParams: (p) => params.push(p) },
      api: async (p) => {
        calls.push(p);
        if (p === "/pre-triagens/t1")
          return {
            id: "t1",
            concluida: true,
            urgencia: false,
            resumo: "Resumo",
            createdAt: "2026-11-17",
            especialidades: [],
          };
        return [];
      },
    }),
  );
  assert.equal(calls.filter((p) => p === "/pre-triagens/t1").length, 1);
  assert.match(JSON.stringify(root.toJSON()), /Como deseja agendar/);
  assert.equal(params.length, 1);
  await close();
});

test("cancelamento confirmado atualiza agenda e lembretes mesmo sem conexao ao recarregar", async () => {
  runtime.storage.set("recordar_reminders_p1", "sim");
  runtime.notifications.clear();
  let cancelled = false;
  const slot = {
    id: "c1",
    nome_medico: "Ana",
    status: "agendada",
    data_consulta: "2099-12-09",
    horario_consulta: "09:00",
  };
  try {
    await mount(
      React.createElement(Booking, {
        session,
        api: async (p, o = {}) => {
          if (o.method === "PUT") {
            cancelled = true;
            return { message: "Cancelada" };
          }
          if (cancelled) throw Error("Sem conexao");
          return [slot];
        },
      }),
    );
    assert.equal(runtime.notifications.size, 2);
    await click("Cancelar consulta");
    await click("Confirmar");
    assert.match(JSON.stringify(root.toJSON()), /Consulta cancelada/);
    assert.equal(runtime.notifications.size, 0);
    assert.equal(
      root.root
        .findAllByType(Button)
        .some((b) => b.props.children === "Cancelar consulta"),
      false,
    );
    await close();
  } finally {
    runtime.storage.clear();
    runtime.notifications.clear();
  }
});

test("troca informa consulta atual e conserva pre-triagem no resultado", async () => {
  const calls = [];
  const old = {
    id: "c1",
    id_medico: "m1",
    nome_medico: "Ana",
    status: "agendada",
    id_pre_triagem: "t1",
    data_consulta: "2099-12-09",
    horario_consulta: "09:00",
  };
  const next = {
    ...old,
    id: "c2",
    horario_consulta: "10:00",
    status: "disponivel",
  };
  let current = old;
  await mount(
    React.createElement(Booking, {
      session,
      api: async (p, o = {}) => {
        calls.push({ p, ...o });
        if (p.startsWith("/consultas/disponiveis")) return [next];
        if (o.method === "PUT") {
          current = { ...next, status: "agendada" };
          return current;
        }
        return [current];
      },
    }),
  );
  await click("Trocar horário");
  await click("Escolher horário");
  await click("Confirmar novo horário");
  assert.ok(calls.some((c) => c.p.includes("id_consulta_atual=c1")));
  assert.equal(
    calls.find((c) => c.p === "/consultas/c1/trocar").body.id_nova,
    "c2",
  );
  assert.match(JSON.stringify(root.toJSON()), /Consulta confirmada/);
  await close();
});

test("chat concluido encaminha id persistido para a aba dentro da Stack", async () => {
  process.env.EXPO_PUBLIC_CHAT_PATH = "/chat";
  const routes = [];
  try {
    await mount(
      React.createElement(Chat, {
        api: async () => ({
          resposta: "Conversa concluida",
          id_conversa: "v1",
          id_pre_triagem: "t1",
        }),
        navigation: { navigate: (...args) => routes.push(args) },
      }),
    );
    await click("Iniciar pré-triagem");
    await fill("Sua mensagem", "Mensagem ficticia");
    await click("Enviar mensagem");
    await click("Agendar com esta pré-triagem");
    assert.deepEqual(routes, [
      ["Recordar", { screen: "Agendamento", params: { id_pre_triagem: "t1" } }],
    ]);
    await close();
  } finally {
    delete process.env.EXPO_PUBLIC_CHAT_PATH;
  }
});

test("chat urgente mostra contato de emergencia sem encaminhar agendamento", async () => {
  await mount(
    React.createElement(Chat, {
      api: async () => ({
        resposta: "Procure atendimento de urgência.",
        id_conversa: "c1",
        id_pre_triagem: "t1",
        urgencia: true,
      }),
      navigation: {
        navigate: () => {
          throw Error("Não deve agendar urgência");
        },
      },
    }),
  );
  await click("Iniciar pré-triagem");
  await fill("Sua mensagem", "Exemplo fictício de urgência");
  await click("Enviar mensagem");
  assert.match(JSON.stringify(root.toJSON()), /Ligar para o SAMU 192/);
  assert.equal(
    root.root
      .findAllByType(Button)
      .some((b) => b.props.children === "Agendar com esta pré-triagem"),
    false,
  );
  await close();
});

test("retorno ao aplicativo remove lembretes de consulta realizada sem abrir agendamento", async () => {
  const SessionReminders =
    require("../src/components/SessionReminders").default;
  runtime.storage.set("recordar_reminders_p1", "sim");
  runtime.notifications.clear();
  let list = [
    {
      id: "c1",
      status: "agendada",
      data_consulta: "2099-12-09",
      horario_consulta: "09:00",
    },
  ];
  try {
    await mount(
      React.createElement(SessionReminders, { session, api: async () => list }),
    );
    assert.equal(runtime.notifications.size, 2);
    list = [];
    await act(async () => {
      for (const listener of runtime.listeners) listener("active");
    });
    assert.equal(runtime.notifications.size, 0);
    await close();
  } finally {
    runtime.storage.clear();
    runtime.notifications.clear();
  }
});
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
test("perfil oferece aparência e continua salvando dados na API", async () => {
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
  await click("Acessibilidade");
  assert.equal(
    root.root
      .findAllByType(Button)
      .some((b) => b.props.children === "Modo escuro"),
    true,
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

test("acesso administrativo fica na área da equipe e volta ao tipo paciente ao fechar", async () => {
  const calls = [];
  await mount(
    React.createElement(Auth, {
      api: async (p, o) => {
        calls.push(o.body);
        return { token: "teste", user: { tipo: o.body.tipo } };
      },
      onLogin: async () => {},
    }),
  );
  assert.equal(
    root.root
      .findAllByType(Button)
      .some(
        (b) => b.props.children?.join?.("") === "Entrar como administrador",
      ),
    false,
  );
  await click("Área de profissionais e administração");
  await click("Entrar como administrador");
  assert.match(JSON.stringify(root.toJSON()), /Acesso restrito/);
  await click("Voltar ao acesso de paciente");
  await save({ email: "p@teste.com", senha: "123456" });
  assert.equal(calls[0].tipo, "paciente");
  await close();
});
