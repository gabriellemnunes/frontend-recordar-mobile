require("./render-setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { create, act } = require("react-test-renderer");
const { patientOverview, nextDays } = require("../src/patientOverview");
const { Button, ThemeContext, palette } = require("../src/components/ui");
const PatientHome = require("../src/screens/PatientHome").default;
const ThemePicker = require("../src/components/ThemePicker").default;
const BookingProgress = require("../src/components/BookingProgress").default;

test("resumo usa agenda real, ordena próximas consultas e preserva datas de Brasília", () => {
  const now = Date.parse("2026-11-18T01:30:00Z"); // Ainda dia 17 em Brasília.
  const result = patientOverview(
    [
      {
        id: "b",
        status: "agendada",
        data_consulta: "2026-11-19",
        horario_consulta: "09:00",
      },
      {
        id: "a",
        status: "agendada",
        data_consulta: "2026-11-18",
        horario_consulta: "09:00",
      },
      {
        id: "old",
        status: "agendada",
        data_consulta: "2020-01-01",
        horario_consulta: "09:00",
      },
      {
        id: "done",
        status: "realizada",
        data_consulta: "2099-01-01",
        horario_consulta: "09:00",
      },
    ],
    [
      {
        id: "1",
        horario_remedio: "10:00",
        data_inicio: "2026-11-17",
        data_fim: "2026-11-17",
        tomado_hoje: true,
      },
      {
        id: "2",
        horario_remedio: "08:00",
        data_inicio: "2026-11-01",
        data_fim: "2026-11-30",
      },
      { id: "3", horario_remedio: "08:00", data_inicio: "2026-11-18" },
    ],
    now,
  );
  assert.equal(result.day, "2026-11-17");
  assert.equal(result.next.id, "a");
  assert.deepEqual(
    result.medications.map((m) => m.id),
    ["2", "1"],
  );
  assert.equal(result.remaining, 1);
  assert.deepEqual(nextDays(new Date("2026-12-31T15:00:00Z")).slice(0, 2), [
    "2026-12-31",
    "2027-01-01",
  ]);
});

test("início mostra consulta e medicamentos da API e conserva rotas existentes", async () => {
  let root;
  const routes = [];
  const appointment = {
    id: "c1",
    status: "agendada",
    nome_medico: "Ana",
    nome_clinica: "Clínica de teste",
    data_consulta: "2099-12-09",
    horario_consulta: "09:00",
  };
  await act(async () => {
    root = create(
      React.createElement(PatientHome, {
        api: async (path) =>
          path === "/consultas"
            ? [appointment]
            : [
                {
                  id: "m1",
                  nome_remedio: "Prescrição de teste",
                  horario_remedio: "08:00",
                  quantidade_remedio: "1 comprimido",
                },
              ],
        user: { nome_paciente: "Maria Silva", anamnese_preenchida: true },
        navigation: { navigate: (r) => routes.push(r) },
      }),
    );
  });
  const text = JSON.stringify(root.toJSON());
  assert.match(text, /Maria/);
  assert.match(text, /Ana/);
  assert.match(text, /Prescrição de teste/);
  const button = root.root
    .findAllByType(Button)
    .find((b) => b.props.children === "Marcar consulta");
  await act(async () => button.props.onPress());
  assert.deepEqual(routes, ["Agendamento"]);
  await act(async () => root.unmount());
});

test("início informa erro de conexão e permite tentar novamente sem inventar consultas", async () => {
  let root,
    fail = true;
  await act(async () => {
    root = create(
      React.createElement(PatientHome, {
        api: async () => {
          if (fail) throw Error("Sem conexão");
          return [];
        },
        user: { nome_paciente: "Maria" },
        navigation: {},
      }),
    );
  });
  assert.match(JSON.stringify(root.toJSON()), /Não foi possível atualizar/);
  fail = false;
  await act(async () =>
    root.root
      .findAllByType(Button)
      .find((b) => b.props.children === "Tentar novamente")
      .props.onPress(),
  );
  assert.match(JSON.stringify(root.toJSON()), /Nenhuma consulta futura/);
  await act(async () => root.unmount());
});

test("aparência oferece opções explícitas e preserva a preferência de texto maior", async () => {
  let root;
  const changes = [];
  await act(async () => {
    root = create(
      React.createElement(ThemePicker, {
        prefs: { light: false, large: true },
        onChange: async (value) => changes.push(value),
      }),
    );
  });
  const buttons = root.root.findAllByType(Button);
  assert.equal(
    buttons.find((b) => b.props.children === "Modo escuro").props.selected,
    true,
  );
  await act(async () =>
    buttons.find((b) => b.props.children === "Modo claro").props.onPress(),
  );
  await act(async () =>
    buttons.find((b) => b.props.children === "Modo escuro").props.onPress(),
  );
  assert.deepEqual(changes, [
    { light: true, large: true },
    { light: false, large: true },
  ]);
  await act(async () => root.unmount());
});

test("cores do texto e dos botões mantêm contraste nos dois modos e três perfis", () => {
  const luminance = (hex) => {
    const values = hex
      .replace("#", "")
      .match(/../g)
      .map((v) => parseInt(v, 16) / 255)
      .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
  };
  for (const role of ["paciente", "medico", "administrador"])
    for (const light of [true, false]) {
      const theme = palette(role, light);
      for (const [fg, bg] of [
        [theme.text, theme.surface],
        [theme.muted, theme.background],
        [theme.onPrimary, theme.primary],
        [theme.text, theme.input],
        [theme.muted, theme.input],
        [theme.text, theme.soft],
      ]) {
        const l1 = luminance(fg),
          l2 = luminance(bg);
        assert.ok(
          (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) >= 4.5,
          `${role}: ${fg}/${bg}`,
        );
      }
      if (!light) {
        for (const background of [theme.surface, theme.input]) {
          const a = luminance(theme.border),
            b = luminance(background);
          assert.ok(
            (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 3,
            `${role}: borda pouco visível`,
          );
        }
      }
    }
});

test("progresso informa etapa de confirmação sem alterar a operação de reagendamento", async () => {
  let root;
  await act(async () => {
    root = create(
      React.createElement(
        ThemeContext.Provider,
        { value: { ...palette(), light: false } },
        React.createElement(BookingProgress, {
          page: "confirmar",
          changing: true,
        }),
      ),
    );
  });
  assert.match(JSON.stringify(root.toJSON()), /Etapa 2 de 2: Confirmar/);
  await act(async () => root.unmount());
});

test("texto ampliado mantém espaçamento e foco visível nos campos", async () => {
  const { Field, Txt } = require("../src/components/ui");
  let root;
  await act(async () => {
    root = create(
      React.createElement(
        ThemeContext.Provider,
        { value: { ...palette("paciente", true), large: true } },
        React.createElement(
          React.Fragment,
          null,
          React.createElement(
            Txt,
            { style: { fontSize: 14, lineHeight: 18 } },
            "Texto de apoio",
          ),
          React.createElement(Field, {
            label: "E-mail",
            value: "",
            onChangeText() {},
          }),
        ),
      ),
    );
  });
  const text = root.root
    .findAllByType("Text")
    .find((t) => t.props.children === "Texto de apoio");
  const style = Object.assign({}, ...text.props.style);
  assert.equal(style.fontSize, 22.5);
  assert.ok(style.lineHeight >= style.fontSize * 1.5);
  assert.equal(text.props.allowFontScaling, true);
  let field = root.root.findByType("TextInput");
  await act(async () => field.props.onFocus({}));
  field = root.root.findByType("TextInput");
  assert.equal(
    Object.assign({}, ...field.props.style).borderColor,
    palette("paciente", true).primary,
  );
  await act(async () => root.unmount());
});

test("perfil permite mudar tamanho do texto sem alterar aparência", async () => {
  let root;
  const changes = [];
  await act(async () => {
    root = create(
      React.createElement(
        ThemeContext.Provider,
        {
          value: {
            ...palette(),
            light: false,
            large: false,
            setTextSize: async (v) => changes.push(v),
          },
        },
        React.createElement(ThemePicker),
      ),
    );
  });
  await act(async () =>
    root.root
      .findAllByType(Button)
      .find((b) => b.props.children === "Texto maior")
      .props.onPress(),
  );
  assert.deepEqual(changes, [true]);
  await act(async () => root.unmount());
});
