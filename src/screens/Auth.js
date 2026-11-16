import { Image } from "react-native";
import React, { useState } from "react";
import { Button, Card, Form, Page, Txt, useAction } from "../components/ui";
export default function Auth({ api, onLogin, onRoleChange, accessibility }) {
  const [page, setPage] = useState("login"),
    [tipo, setTipo] = useState("paciente");
  const a = useAction();
  const credentials = [
    { name: "email", label: "E-mail" },
    { name: "senha", label: "Senha", secret: true },
  ];
  const fields =
    page === "login"
      ? credentials
      : page === "cadastro"
        ? [
            { name: "nome_paciente", label: "Nome completo" },
            {
              name: "data_nascimento",
              label: "Data de nascimento (AAAA-MM-DD)",
            },
            { name: "telefone", label: "Telefone" },
            ...credentials,
            { name: "confirmar_senha", label: "Confirmar senha", secret: true },
          ]
        : [
            { name: "email", label: "E-mail" },
            tipo === "medico"
              ? { name: "crm", label: "CRM" }
              : {
                  name: "data_nascimento",
                  label: "Data de nascimento (AAAA-MM-DD)",
                },
            { name: "nova_senha", label: "Nova senha", secret: true },
            {
              name: "confirmar_senha",
              label: "Confirmar nova senha",
              secret: true,
            },
          ];
  async function submit(v) {
    await a.run(async () => {
      if (!v.email?.trim() || !(v.senha || v.nova_senha))
        throw new Error("Preencha o e-mail e a senha.");
      if (page !== "login" && (v.senha || v.nova_senha) !== v.confirmar_senha)
        throw new Error("As senhas não são iguais.");
      if (page === "login")
        await onLogin(
          await api("/auth/login", {
            method: "POST",
            body: { ...v, email: v.email.trim(), tipo },
          }),
        );
      else {
        await api(
          page === "cadastro" ? "/auth/register" : "/auth/recuperar-senha",
          {
            method: "POST",
            body: { ...v, tipo: page === "cadastro" ? "paciente" : tipo },
          },
        );
        setPage("login");
        a.setNotice(
          page === "cadastro"
            ? "Conta criada. Entre com seu e-mail e senha."
            : "Senha alterada. Entre com a nova senha.",
        );
      }
    });
  }
  return (
    <Page title="Recordar">
      <Image
        accessible={false}
        source={require("../../assets/logo.png")}
        style={{ width: 84, height: 84, alignSelf: "center" }}
      />
      <Txt>Saúde na palma da mão</Txt>
      <Txt title>
        {page === "login"
          ? "Entrar"
          : page === "cadastro"
            ? "Criar conta"
            : "Recuperar senha"}
      </Txt>
      {page === "login" && (
        <Card>
          <Txt>Acesso de {tipo === "medico" ? "médico" : tipo}</Txt>
          {["paciente", "medico", "administrador"].map((t) => (
            <Button
              secondary
              key={t}
              selected={tipo === t}
              onPress={() =>
                (() => {
                  setTipo(t);
                  onRoleChange?.(t);
                })()
              }
            >
              Entrar como {t === "medico" ? "médico" : t}
            </Button>
          ))}
        </Card>
      )}
      <Form
        key={`${page}-${tipo}`}
        fields={fields}
        onSave={submit}
        busy={a.busy}
        saveLabel={
          page === "login"
            ? "Entrar"
            : page === "cadastro"
              ? "Criar conta"
              : "Salvar senha"
        }
      />
      {a.feedback}
      {page === "login" ? (
        <>
          {tipo !== "administrador" && (
            <Button secondary onPress={() => setPage("recuperar")}>
              Esqueci minha senha
            </Button>
          )}
          {tipo === "paciente" && (
            <Button secondary onPress={() => setPage("cadastro")}>
              Criar conta
            </Button>
          )}
          {accessibility}
        </>
      ) : (
        <Button secondary onPress={() => setPage("login")}>
          Voltar ao login
        </Button>
      )}
    </Page>
  );
}
