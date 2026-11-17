import { View } from "react-native";
import BrandLogo from "../components/BrandLogo";
import React, { useContext, useState } from "react";
import {
  Button,
  Card,
  Form,
  Page,
  Txt,
  ThemeContext,
  useAction,
} from "../components/ui";
export default function Auth({ api, onLogin, onRoleChange }) {
  const inheritedTheme = useContext(ThemeContext);
  const theme = inheritedTheme.light
    ? {
        ...inheritedTheme,
        primary: "#624275",
        onPrimary: "#ffffff",
        soft: "#f0eaf3",
        border: "#c7b8cf",
      }
    : inheritedTheme;
  const [page, setPage] = useState("login"),
    [staffAccess, setStaffAccess] = useState(false),
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
    <ThemeContext.Provider value={theme}>
      <Page readingKey={`${page}-${tipo}`}>
        <View
          style={{
            alignItems: "center",
            backgroundColor: theme.primary,
            borderRadius: 24,
            paddingTop: 24,
            paddingHorizontal: 20,
            paddingBottom: 54,
            gap: 8,
          }}
        >
          <BrandLogo size={64} />
          <Txt
            title
            style={{
              color: theme.onPrimary,
              fontSize: 28,
              textAlign: "center",
            }}
          >
            Recordar
          </Txt>
          <Txt style={{ color: theme.onPrimary, textAlign: "center" }}>
            Saúde na palma da mão
          </Txt>
        </View>
        <View
          style={{
            backgroundColor: theme.surface,
            borderRadius: 24,
            padding: 20,
            marginTop: -48,
            gap: 20,
            shadowColor: theme.text,
            shadowOpacity: theme.light ? 0.045 : 0.12,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 1,
          }}
        >
          <Txt title>
            {page === "login"
              ? "Entrar"
              : page === "cadastro"
                ? "Criar conta"
                : "Recuperar senha"}
          </Txt>
          <Txt style={{ color: theme.muted }}>
            {page === "login"
              ? "Acesse suas consultas e seus medicamentos."
              : page === "cadastro"
                ? "Crie sua conta para organizar seus cuidados de saúde."
                : "Recupere o acesso à sua conta com segurança."}
          </Txt>
          {page === "login" && (
            <Card style={{ borderWidth: 0, padding: 0 }}>
              <Txt>Acesso de {tipo === "medico" ? "médico" : tipo}</Txt>
              {[
                "paciente",
                ...(staffAccess ? ["medico", "administrador"] : []),
              ].map((t) => (
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
              {tipo === "administrador" && (
                <Txt style={{ color: theme.muted }}>
                  Acesso restrito a administradores autorizados. Se você é
                  paciente, escolha “Entrar como paciente”.
                </Txt>
              )}
            </Card>
          )}
          <Form
            style={{ borderWidth: 0, padding: 0 }}
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
              <Button
                icon="lock"
                secondary
                onPress={() => {
                  if (staffAccess) {
                    setTipo("paciente");
                    onRoleChange?.("paciente");
                  }
                  setStaffAccess(!staffAccess);
                }}
              >
                {staffAccess
                  ? "Voltar ao acesso de paciente"
                  : "Área de profissionais e administração"}
              </Button>
            </>
          ) : (
            <Button secondary onPress={() => setPage("login")}>
              Voltar ao login
            </Button>
          )}
        </View>
      </Page>
    </ThemeContext.Provider>
  );
}
