import React, { useEffect, useState } from "react";
import PatientHome from "./PatientHome";
import {
  Button,
  Card,
  Confirm,
  Form,
  Page,
  Txt,
  dateBR,
  nameOf,
  useOnFocus,
  useAction,
} from "../components/ui";

export function Home({ user, navigation, api }) {
  if (user.tipo === "paciente")
    return <PatientHome user={user} navigation={navigation} api={api} />;
  const links =
    user.tipo === "paciente"
      ? [
          ["Agenda do dia", "Dia"],
          ["Marcar consulta", "Agendamento"],
          ["Próximas consultas", "Agendamento"],
          ["Remédios", "Remédios"],
          ["Conversar com o assistente", "Chatbot"],
          ["Histórico de consultas", "Histórico"],
          ["Meu perfil", "Perfil"],
        ]
      : user.tipo === "medico"
        ? [
            ["Criar consulta", "Criar consulta"],
            ["Minhas consultas", "Consultas"],
            ["Meus pacientes", "Pacientes"],
            ["Histórico de consultas", "Histórico"],
            ["Meu perfil", "Perfil"],
          ]
        : [
            ["Usuários", "Usuários"],
            ["Clínicas", "Clínicas"],
            ["Especialidades", "Especialidades"],
            ["Consultas do sistema", "Consultas"],
            ["Histórico de consultas", "Histórico"],
          ];
  return (
    <Page title={`Olá, ${nameOf(user)}`}>
      <Txt>Saúde na palma da mão</Txt>
      {user.tipo === "paciente" && !user.anamnese_preenchida && (
        <Card>
          <Txt>
            Antes de agendar, preencha suas informações de saúde no perfil.
          </Txt>
          <Button onPress={() => navigation.navigate("Perfil")}>
            Preencher informações de saúde
          </Button>
        </Card>
      )}
      {links.map(([label, route]) => (
        <Button
          key={label}
          secondary
          onPress={() => navigation.navigate(route)}
        >
          {label}
        </Button>
      ))}
    </Page>
  );
}

export function AdminResource({ resource, api, user, navigation }) {
  const a = useAction();
  const [list, setList] = useState([]),
    [query, setQuery] = useState(""),
    [type, setType] = useState("paciente"),
    [edit, setEdit] = useState(null),
    [pending, setPending] = useState(null),
    [refs, setRefs] = useState({ clinicas: [], especialidades: [] });
  const path = {
    Usuários: "/users",
    Clínicas: "/clinicas",
    Especialidades: "/especialidades",
  }[resource];
  async function load() {
    const data = await api(
      path + (resource === "Usuários" ? `?tipo=${type}` : ""),
    );
    setList(data);
  }
  useEffect(() => {
    a.run(async () => {
      await load();
      if (resource === "Usuários") {
        const [clinicas, especialidades] = await Promise.all([
          api("/clinicas"),
          api("/especialidades"),
        ]);
        setRefs({ clinicas, especialidades });
      }
    });
  }, [resource, type]);
  useOnFocus(navigation, () => a.run(load));
  const base =
    resource === "Clínicas"
      ? [
          { name: "nome_clinica", label: "Nome da clínica" },
          { name: "endereco_clinica", label: "Endereço" },
          { name: "telefone_clinica", label: "Telefone" },
        ]
      : resource === "Especialidades"
        ? [{ name: "nome_especialidade", label: "Nome da especialidade" }]
        : [
            {
              name:
                type === "medico"
                  ? "nome_medico"
                  : type === "paciente"
                    ? "nome_paciente"
                    : "nome_administrador",
              label: "Nome completo",
            },
            { name: "telefone", label: "Telefone" },
            { name: "email", label: "E-mail" },
            ...(type === "paciente"
              ? [{ name: "data_nascimento", label: "Nascimento (AAAA-MM-DD)" }]
              : type === "medico"
                ? [
                    { name: "crm", label: "CRM" },
                    {
                      name: "id_especialidade",
                      label: "Especialidade",
                      options: refs.especialidades.map((e) => ({
                        id: e.id,
                        label: e.nome_especialidade,
                      })),
                    },
                    {
                      name: "clinicas",
                      label: "Clínicas onde atende",
                      multiple: true,
                      options: refs.clinicas.map((c) => ({
                        id: c.id,
                        label: c.nome_clinica,
                      })),
                    },
                  ]
                : []),
          ];
  const fields =
    resource === "Usuários" && !edit?.id
      ? [
          ...base,
          { name: "senha", label: "Senha", secret: true },
          { name: "confirmar_senha", label: "Confirmar senha", secret: true },
        ]
      : base;
  async function save(v) {
    await a.run(async () => {
      if (v.senha && v.senha !== v.confirmar_senha)
        throw new Error("As senhas não são iguais.");
      await api(path + (edit?.id ? `/${edit.id}` : ""), {
        method: edit?.id ? "PUT" : "POST",
        body: { ...v, ...(resource === "Usuários" ? { tipo: type } : {}) },
      });
      setEdit(null);
      await load();
      a.setNotice("Cadastro salvo.");
    });
  }
  return (
    <Page title={resource}>
      {resource === "Usuários" &&
        ["paciente", "medico", "administrador"].map((t) => (
          <Button
            key={t}
            secondary
            selected={type === t}
            onPress={() => {
              setType(t);
              setEdit(null);
            }}
          >
            {t}
          </Button>
        ))}
      <Form
        key={`${resource}-${type}-search`}
        fields={[{ name: "busca", label: "Pesquisar por nome" }]}
        initial={{ busca: query }}
        onSave={(v) => setQuery(v.busca || "")}
        saveLabel="Pesquisar"
      />
      {!edit && (resource !== "Usuários" || type !== "paciente") && (
        <Button onPress={() => setEdit({})}>
          Cadastrar{" "}
          {resource === "Usuários"
            ? type
            : resource === "Clínicas"
              ? "clínica"
              : "especialidade"}
        </Button>
      )}
      {edit && (
        <>
          <Form
            key={`${resource}-${type}-${edit.id || "new"}`}
            fields={fields}
            initial={{
              ...edit,
              clinicas:
                edit.clinicas?.map((c) => (typeof c === "string" ? c : c.id)) ||
                [],
            }}
            onSave={save}
            busy={a.busy}
          />
          <Button secondary onPress={() => setEdit(null)}>
            Cancelar edição
          </Button>
        </>
      )}
      {a.feedback}
      {list
        .filter((x) =>
          JSON.stringify(x).toLowerCase().includes(query.toLowerCase()),
        )
        .map((x) => (
          <Card key={x.id}>
            <Txt title>
              {x.nome_clinica || x.nome_especialidade || nameOf(x)}
            </Txt>
            {[
              x.email,
              x.telefone,
              x.crm,
              x.endereco_clinica,
              x.telefone_clinica,
              x.nome_especialidade,
            ]
              .filter(Boolean)
              .map((v, i) => (
                <Txt key={i}>{v}</Txt>
              ))}
            {!(resource === "Usuários" && x.tipo === "administrador") && (
              <Button secondary disabled={a.busy} onPress={() => setEdit(x)}>
                Editar
              </Button>
            )}
            {x.id !== user.id && (
              <Button danger disabled={a.busy} onPress={() => setPending(x)}>
                Excluir
              </Button>
            )}
          </Card>
        ))}
      {!list.length && <Txt>Nenhum cadastro encontrado.</Txt>}
      <Confirm
        pending={
          pending && {
            message:
              resource === "Usuários"
                ? `Excluir ${nameOf(pending)}? Consultas e remédios vinculados serão afetados conforme o tipo de conta.`
                : "Excluir este cadastro? Registros vinculados podem impedir a exclusão.",
          }
        }
        close={() => setPending(null)}
        busy={a.busy}
        onConfirm={() =>
          a.run(async () => {
            await api(`${path}/${pending.id}`, { method: "DELETE" });
            setPending(null);
            await load();
            a.setNotice("Cadastro excluído.");
          })
        }
      />
    </Page>
  );
}

export function Consultations({ api, user, navigation, history = false }) {
  const a = useAction(),
    [list, setList] = useState([]),
    [pending, setPending] = useState(null),
    [filter, setFilter] = useState("todas");
  async function load() {
    setList(await api(history ? "/consultas/historico" : "/consultas"));
  }
  useEffect(() => {
    a.run(load);
  }, [history]);
  useOnFocus(navigation, () => a.run(load));
  return (
    <Page title={history ? "Histórico de consultas" : "Consultas"}>
      <Button secondary disabled={a.busy} onPress={() => a.run(load)}>
        Atualizar
      </Button>
      {!history && user.tipo === "medico" && (
        <>
          <Button onPress={() => navigation.navigate("Criar consulta")}>
            Criar consulta
          </Button>
          {["todas", "agendada", "disponivel"].map((f) => (
            <Button
              key={f}
              secondary
              selected={filter === f}
              onPress={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </>
      )}
      {a.feedback}
      {!list.length && <Txt>Nenhuma consulta encontrada.</Txt>}
      {list
        .filter((c) => filter === "todas" || c.status === filter)
        .map((c) => (
          <Card key={c.id}>
            <Txt title>
              {dateBR(c.data_consulta)} às {c.horario_consulta}
            </Txt>
            <Txt>
              {c.nome_medico} · {c.nome_especialidade}
            </Txt>
            <Txt>
              {c.nome_clinica} · {c.endereco_clinica}
            </Txt>
            <Txt>
              {c.nome_paciente || "Sem paciente"} · {c.status}
            </Txt>
            {c.aviso_troca && user.tipo === "medico" && (
              <>
                <Txt>
                  Paciente trocou o horário de{" "}
                  {dateBR(c.aviso_troca.data_anterior)} às{" "}
                  {c.aviso_troca.horario_anterior}.
                </Txt>
                <Button
                  secondary
                  onPress={() =>
                    a.run(async () => {
                      await api(`/consultas/${c.id}/aviso-visto`, {
                        method: "PUT",
                      });
                      await load();
                    })
                  }
                >
                  Marcar aviso como visto
                </Button>
              </>
            )}
            {user.tipo === "medico" && c.id_paciente && (
              <Button
                secondary
                onPress={() => navigation.navigate("Atendimento", { id: c.id })}
              >
                Ver atendimento e remédios
              </Button>
            )}
            {user.tipo === "medico" && c.status === "agendada" && (
              <Button onPress={() => setPending({ c, action: "realizada" })}>
                Marcar como realizada
              </Button>
            )}
            {user.tipo !== "paciente" && (
              <Button
                danger
                disabled={a.busy}
                onPress={() => setPending({ c, action: "delete" })}
              >
                Excluir consulta
              </Button>
            )}
          </Card>
        ))}
      <Confirm
        pending={
          pending && {
            title:
              pending.action === "delete"
                ? "Excluir consulta?"
                : "Concluir atendimento?",
            message:
              pending.action === "delete"
                ? "A consulta e os remédios receitados nela serão apagados. Esta ação é definitiva."
                : "A consulta será mantida no histórico, com as prescrições.",
          }
        }
        busy={a.busy}
        close={() => setPending(null)}
        onConfirm={() =>
          a.run(async () => {
            await api(
              `/consultas/${pending.c.id}${pending.action === "delete" ? "" : "/realizada"}`,
              { method: pending.action === "delete" ? "DELETE" : "PUT" },
            );
            setPending(null);
            await load();
            a.setNotice("Consulta atualizada.");
          })
        }
      />
    </Page>
  );
}
