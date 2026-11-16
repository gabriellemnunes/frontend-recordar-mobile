import React, { useEffect, useState } from "react";
import {
  Button,
  Card,
  Choice,
  Confirm,
  Field,
  Form,
  Page,
  Txt,
  dateBR,
  today,
  useOnFocus,
  useAction,
} from "../components/ui";

export function Profile({ api, user, updateUser, logout }) {
  const a = useAction(),
    [loaded, setLoaded] = useState(null),
    [refs, setRefs] = useState({ clinicas: [], especialidades: [] }),
    [pending, setPending] = useState(null);
  useEffect(() => {
    a.run(async () => {
      setLoaded(await api("/users/me"));
      if (user.tipo === "medico") {
        const [clinicas, especialidades] = await Promise.all([
          api("/clinicas"),
          api("/especialidades"),
        ]);
        setRefs({ clinicas, especialidades });
      }
    });
  }, []);
  const fields = [
    { name: `nome_${user.tipo}`, label: "Nome completo" },
    { name: "email", label: "E-mail" },
    { name: "telefone", label: "Telefone" },
    ...(user.tipo === "paciente"
      ? [
          { name: "data_nascimento", label: "Nascimento (AAAA-MM-DD)" },
          {
            name: "condicoes_saude",
            label: "Condições de saúde",
            multiline: true,
          },
          { name: "alergias", label: "Alergias", multiline: true },
          {
            name: "medicamentos_em_uso",
            label: "Medicamentos em uso",
            multiline: true,
          },
        ]
      : user.tipo === "medico"
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
    { name: "senha", label: "Nova senha (opcional)", secret: true },
    { name: "confirmar_senha", label: "Confirmar nova senha", secret: true },
  ];
  return (
    <Page title="Meu perfil">
      {a.feedback}
      {loaded && (
        <Form
          key={loaded.id}
          fields={fields}
          initial={{
            ...loaded,
            clinicas: loaded.clinicas?.map((c) => c.id) || [],
          }}
          busy={a.busy}
          onSave={(v) =>
            a.run(async () => {
              if (v.senha && v.senha !== v.confirmar_senha)
                throw new Error("As senhas não são iguais.");
              const saved = await api("/users/me", { method: "PUT", body: v });
              await updateUser(saved);
              a.setNotice("Perfil atualizado.");
            })
          }
        />
      )}
      <Button secondary disabled={a.busy} onPress={() => a.run(logout)}>
        Sair da conta
      </Button>
      {user.tipo !== "administrador" && (
        <Button danger disabled={a.busy} onPress={() => setPending(true)}>
          Excluir minha conta
        </Button>
      )}
      <Confirm
        pending={
          pending && {
            title: "Excluir sua conta?",
            message:
              user.tipo === "paciente"
                ? "Seu cadastro, histórico, pré-triagens e remédios serão apagados. As consultas agendadas serão liberadas."
                : "Seu cadastro, consultas e prescrições serão apagados.",
          }
        }
        close={() => setPending(null)}
        busy={a.busy}
        onConfirm={() =>
          a.run(async () => {
            await api("/users/me", { method: "DELETE" });
            await logout();
          })
        }
      />
    </Page>
  );
}
const medFields = [
  { name: "nome_remedio", label: "Nome do remédio" },
  { name: "horario_remedio", label: "Horário (HH:MM)", placeholder: "08:00" },
  {
    name: "quantidade_remedio",
    label: "Quantidade",
    placeholder: "1 comprimido",
  },
  { name: "data_inicio", label: "Data inicial (AAAA-MM-DD)" },
  { name: "data_fim", label: "Data final (AAAA-MM-DD)" },
];
export function Medications({
  api,
  user,
  consultation,
  patient,
  daily = false,
  navigation,
}) {
  const a = useAction(),
    [list, setList] = useState([]),
    [edit, setEdit] = useState(null),
    [pending, setPending] = useState(null),
    [day, setDay] = useState(today()),
    [draftDay, setDraftDay] = useState(today()),
    [consultas, setConsultas] = useState([]);
  const query = consultation
    ? `?consulta=${consultation}`
    : patient
      ? `?paciente=${patient}`
      : daily
        ? `?dia=${encodeURIComponent(day)}`
        : "";
  async function load() {
    setList(await api("/remedios" + query));
    if (daily)
      setConsultas(
        (await api("/consultas")).filter((c) => c.data_consulta === day),
      );
  }
  useEffect(() => {
    a.run(load);
  }, [day, consultation, patient]);
  useOnFocus(navigation, () => a.run(load));
  return (
    <Page title={daily ? "Agenda do dia" : "Remédios"}>
      {daily && (
        <>
          <Field
            label="Dia (AAAA-MM-DD)"
            value={draftDay}
            onChangeText={setDraftDay}
          />
          <Button secondary disabled={a.busy} onPress={() => setDay(draftDay)}>
            Ver dia
          </Button>
          <Button
            secondary
            onPress={() => {
              setDay(today());
              setDraftDay(today());
            }}
          >
            Voltar para hoje
          </Button>
          {consultas.map((c) => (
            <Card key={c.id}>
              <Txt title>{c.horario_consulta} · Consulta</Txt>
              <Txt>
                {c.nome_medico} · {c.nome_clinica}
              </Txt>
            </Card>
          ))}
        </>
      )}
      <Button secondary disabled={a.busy} onPress={() => a.run(load)}>
        Atualizar
      </Button>
      {a.feedback}
      {user.tipo === "medico" && consultation && !edit && (
        <Button
          onPress={() => setEdit({ data_inicio: today(), data_fim: today() })}
        >
          Adicionar remédio
        </Button>
      )}
      {edit && (
        <>
          <Form
            key={edit.id || "new"}
            fields={medFields}
            initial={edit}
            busy={a.busy}
            onSave={(v) =>
              a.run(async () => {
                await api("/remedios" + (edit.id ? `/${edit.id}` : ""), {
                  method: edit.id ? "PUT" : "POST",
                  body: { ...v, id_consulta: consultation },
                });
                setEdit(null);
                await load();
                a.setNotice("Prescrição salva.");
              })
            }
          />
          <Button secondary onPress={() => setEdit(null)}>
            Cancelar edição
          </Button>
        </>
      )}
      {!list.length && <Txt>Nenhum remédio para exibir.</Txt>}
      {list.map((r) => (
        <Card key={r.id}>
          <Txt title>
            {r.horario_remedio} · {r.nome_remedio}
          </Txt>
          <Txt>{r.quantidade_remedio}</Txt>
          <Txt>
            De {dateBR(r.data_inicio)} até {dateBR(r.data_fim)}
          </Txt>
          <Txt>
            {r.nome_medico} ·{" "}
            {r.situacao === "encerrado"
              ? "Tratamento encerrado"
              : r.situacao === "futuro"
                ? "Tratamento ainda não iniciado"
                : "Em uso"}
          </Txt>
          {user.tipo === "paciente" &&
            (!daily || day === today()) &&
            r.data_inicio <= today() &&
            r.data_fim >= today() && (
              <Button
                secondary
                selected={r.tomado_hoje}
                disabled={a.busy}
                onPress={() =>
                  a.run(async () => {
                    await api(`/remedios/${r.id}/tomar`, {
                      method: "PUT",
                      body: { dia: today(), tomado: !r.tomado_hoje },
                    });
                    await load();
                  })
                }
              >
                {r.tomado_hoje
                  ? "Desmarcar tomada de hoje"
                  : "Marcar como tomado hoje"}
              </Button>
            )}
          {user.tipo === "medico" && (
            <>
              <Button secondary onPress={() => setEdit(r)}>
                Editar remédio
              </Button>
              <Button danger disabled={a.busy} onPress={() => setPending(r)}>
                Excluir remédio
              </Button>
            </>
          )}
        </Card>
      ))}
      <Confirm
        pending={
          pending && {
            title: "Excluir remédio?",
            message: "Esta prescrição será apagada da agenda do paciente.",
          }
        }
        close={() => setPending(null)}
        busy={a.busy}
        onConfirm={() =>
          a.run(async () => {
            await api(`/remedios/${pending.id}`, { method: "DELETE" });
            setPending(null);
            await load();
          })
        }
      />
    </Page>
  );
}
export function CreateConsultation({ api, user, navigation }) {
  const a = useAction(),
    [clinicas, setClinicas] = useState([]);
  useEffect(() => {
    a.run(async () => setClinicas((await api("/users/me")).clinicas || []));
  }, []);
  return (
    <Page title="Criar consulta">
      {!clinicas.length && (
        <>
          <Txt>Associe uma clínica no perfil antes de criar consultas.</Txt>
          <Button secondary onPress={() => navigation.navigate("Perfil")}>
            Abrir perfil
          </Button>
        </>
      )}
      {!!clinicas.length && (
        <Form
          fields={[
            {
              name: "id_clinica",
              label: "Clínica",
              options: clinicas.map((c) => ({
                id: c.id,
                label: c.nome_clinica,
              })),
            },
            { name: "data_consulta", label: "Dia (AAAA-MM-DD)" },
            {
              name: "horarios",
              label: "Horários separados por vírgula",
              placeholder: "09:00, 09:30, 10:00",
            },
          ]}
          onSave={(v) =>
            a.run(async () => {
              const result = await api("/consultas", {
                method: "POST",
                body: {
                  ...v,
                  horarios: (v.horarios || "")
                    .split(",")
                    .map((h) => h.trim())
                    .filter(Boolean),
                },
              });
              a.setNotice(
                result.message +
                  (result.horarios_repetidos?.length
                    ? ` Já existentes: ${result.horarios_repetidos.join(", ")}.`
                    : ""),
              );
            })
          }
          busy={a.busy}
          saveLabel="Criar horários"
        />
      )}
      {a.feedback}
    </Page>
  );
}
export function Patients({ api, navigation }) {
  const a = useAction(),
    [list, setList] = useState([]),
    [search, setSearch] = useState("");
  useEffect(() => {
    a.run(async () => setList(await api("/consultas/meus-pacientes")));
  }, []);
  return (
    <Page title="Meus pacientes">
      <Field
        label="Pesquisar por nome"
        value={search}
        onChangeText={setSearch}
      />
      {a.feedback}
      {list
        .filter((p) =>
          p.nome_paciente.toLowerCase().includes(search.toLowerCase()),
        )
        .map((p, i) => (
          <Card key={`${p.id_paciente}-${i}`}>
            <Txt title>{p.nome_paciente}</Txt>
            <Txt>
              {p.idade_paciente ?? "—"} anos · {p.remedios_ativos} remédios
              ativos
            </Txt>
            {p.id_consulta && (
              <Button
                onPress={() =>
                  navigation.navigate("Atendimento", { id: p.id_consulta })
                }
              >
                Ver atendimento
              </Button>
            )}
            <Button
              secondary
              onPress={() =>
                navigation.navigate("Prescrições", { patient: p.id_paciente })
              }
            >
              Ver remédios do paciente
            </Button>
          </Card>
        ))}
      {!list.length && <Txt>Nenhum paciente encontrado.</Txt>}
    </Page>
  );
}
export function Attendance({ api, user, route, navigation }) {
  const a = useAction(),
    [c, setC] = useState(null);
  useEffect(() => {
    a.run(async () => setC(await api(`/consultas/${route.params.id}`)));
  }, [route.params.id]);
  return (
    <Page title="Atendimento">
      {a.feedback}
      {c && (
        <>
          <Card>
            <Txt title>{c.nome_paciente}</Txt>
            <Txt>
              {dateBR(c.data_consulta)} às {c.horario_consulta}
            </Txt>
            {Object.entries({ ...c.anamnese_geral, ...c.anamnese }).map(
              ([k, v]) => (
                <Txt key={k}>
                  {
                    {
                      condicoes_saude: "Condições de saúde",
                      alergias: "Alergias",
                      medicamentos_em_uso: "Medicamentos em uso",
                      queixa_principal: "Queixa principal",
                      sintomas: "Sintomas",
                      inicio_sintomas: "Início dos sintomas",
                    }[k]
                  }
                  : {v || "Não informado"}
                </Txt>
              ),
            )}
          </Card>
          {c.id_pre_triagem && (
            <Txt>Pré-triagem vinculada: {c.id_pre_triagem}</Txt>
          )}
          <Button
            onPress={() =>
              navigation.navigate(
                "Prescrições",
                c.status === "agendada"
                  ? { consultation: c.id }
                  : { patient: c.id_paciente },
              )
            }
          >
            Abrir prescrições
          </Button>
        </>
      )}
    </Page>
  );
}
