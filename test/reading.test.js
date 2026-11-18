const runtime = require("./render-setup.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const { create, act } = require("react-test-renderer");
const {
  Page,
  Txt,
  Field,
  Button,
  stopReading,
} = require("../src/components/ui");
const { speechChunks } = require("../src/speechText");
const ProfileSummary = require("../src/components/ProfileSummary").default;
async function press(root, label) {
  if (
    label === "Ler em voz alta" &&
    !root.root.findAllByType(Button).some((b) => b.props.children === label)
  )
    await press(root, "Acessibilidade");
  await act(async () =>
    root.root
      .findAllByType(Button)
      .find((b) => b.props.children === label)
      .props.onPress(),
  );
}
test("leitura inclui conteúdo atualizado, rótulos e exclui senhas", async () => {
  let root;
  const screen = (value) =>
    React.createElement(
      Page,
      null,
      React.createElement(Txt, null, value),
      React.createElement(Field, {
        label: "Nome",
        value: "Maria",
        onChangeText() {},
      }),
      React.createElement(Field, {
        label: "Senha",
        value: "segredo-123",
        secureTextEntry: true,
        onChangeText() {},
      }),
    );
  runtime.speech.length = 0;
  await act(async () => {
    root = create(screen("Consulta às 09:00"));
  });
  await press(root, "Ler em voz alta");
  assert.match(runtime.speech.at(-1).text, /Consulta às 09:00/);
  assert.match(runtime.speech.at(-1).text, /Maria/);
  assert.doesNotMatch(runtime.speech.at(-1).text, /segredo-123/);
  await act(async () => root.update(screen("Consulta às 10:00")));
  await press(root, "Ler em voz alta");
  assert.match(runtime.speech.at(-1).text, /10:00/);
  assert.doesNotMatch(runtime.speech.at(-1).text, /09:00/);
  await act(async () => root.unmount());
});
test("parar e trocar de tela cancelam a sequência de leitura longa", async () => {
  let root;
  runtime.speech.length = 0;
  await act(async () => {
    root = create(
      React.createElement(
        Page,
        null,
        React.createElement(Txt, null, "Palavra ".repeat(700)),
      ),
    );
  });
  await press(root, "Ler em voz alta");
  const first = runtime.speech.at(-1);
  assert.ok(first.text.length <= 1200);
  await act(async () => first.options.onDone());
  assert.equal(runtime.speech.length, 2);
  const last = runtime.speech.at(-1);
  await press(root, "Parar leitura");
  await act(async () => last.options.onDone());
  assert.equal(runtime.speech.length, 2);
  await press(root, "Ler em voz alta");
  const before = runtime.speech.length;
  const pending = runtime.speech.at(-1);
  await act(async () => stopReading());
  await act(async () => pending.options.onDone());
  assert.equal(runtime.speech.length, before);
  await act(async () => root.unmount());
});
test("falha de voz mostra orientação e não trava a tela", async () => {
  let root;
  await act(async () => {
    root = create(React.createElement(Page, { title: "Perfil" }));
  });
  await press(root, "Ler em voz alta");
  await act(async () => runtime.speech.at(-1).options.onError());
  assert.match(JSON.stringify(root.toJSON()), /Confira o volume/);
  await act(async () => root.unmount());
});
test("texto muito longo é dividido sem ultrapassar limite da voz", () => {
  const chunks = speechChunks("x".repeat(3500));
  assert.ok(chunks.every((c) => c.length <= 1200));
  assert.equal(chunks.join("").length, 3500);
});
test("perfil mostra nome completo, idade e nascimento sem inventar dados", async () => {
  let root;
  await act(async () => {
    root = create(
      React.createElement(ProfileSummary, {
        user: {
          nome_paciente: "Maria Silva Santos",
          tipo: "paciente",
          idade: 73,
          data_nascimento: "1953-03-10",
        },
      }),
    );
  });
  const text = JSON.stringify(root.toJSON());
  assert.match(text, /Maria Silva Santos/);
  assert.match(text, /73 anos/);
  assert.match(text, /10\/03\/1953/);
  await act(async () => root.unmount());
});

test("todas as páginas oferecem ajustes de acessibilidade sem mudar de tela", async () => {
  const { ThemeContext, palette } = require("../src/components/ui");
  let root;
  const changes = [];
  await act(async () => {
    root = create(
      React.createElement(
        ThemeContext.Provider,
        {
          value: {
            ...palette(),
            large: false,
            light: false,
            setTextSize: async (v) => changes.push(["texto", v]),
            setAppearance: async (v) => changes.push(["tema", v]),
          },
        },
        React.createElement(Page, { title: "Página de teste" }),
      ),
    );
  });
  await press(root, "Acessibilidade");
  await press(root, "Ler em voz alta");
  assert.match(runtime.speech.at(-1).text, /Texto maior: desativado/);
  assert.match(runtime.speech.at(-1).text, /Tema atual: escuro/);
  assert.match(runtime.speech.at(-1).text, /Modo claro ou Modo escuro/);
  await press(root, "Parar leitura");
  await press(root, "Texto maior");
  await press(root, "Modo claro");
  assert.deepEqual(changes, [
    ["texto", true],
    ["tema", true],
  ]);
  await press(root, "Fechar acessibilidade");
  assert.doesNotMatch(
    JSON.stringify(root.toJSON()),
    /Ajustes de acessibilidade/,
  );
  await act(async () => root.unmount());
});

test("saudação usa o nome completo registrado e acompanha alteração do perfil", async () => {
  const Home = require("../src/screens/PatientHome").default;
  const api = async () => [];
  let root;
  const element = (name) =>
    React.createElement(Home, {
      api,
      user: { nome_paciente: name },
      navigation: {},
    });
  await act(async () => {
    root = create(element("Maria Helena Santos"));
  });
  assert.match(JSON.stringify(root.toJSON()), /Maria Helena Santos/);
  await act(async () => root.update(element("Maria Helena Almeida")));
  assert.match(JSON.stringify(root.toJSON()), /Maria Helena Almeida/);
  assert.doesNotMatch(JSON.stringify(root.toJSON()), /Maria Helena Santos/);
  await act(async () => root.unmount());
});
