import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import {
  Page,
  Card as Surface,
  Button,
  Field,
  Txt,
  useOnFocus,
  Confirm,
  ThemeContext,
} from "../components/ui";
import AppointmentCard from "../components/AppointmentCard";
import BrandLogo from "../components/BrandLogo";
import BookingProgress from "../components/BookingProgress";
import { nextDays } from "../patientOverview";
import { storage } from "../storage";
import { availablePath } from "../api";
import {
  clearReminders,
  reminderVersion,
  requestReminders,
  syncReminders,
} from "../reminders";

const dateBR = (date) => date?.split("-").reverse().join("/");
function Card({ c, children }) {
  return (
    <AppointmentCard appointment={c} available={c.status === "disponivel"}>
      {children}
    </AppointmentCard>
  );
}
const triageId = (item) => item?.id || item?._id;
export default function Booking({ session, api, navigation, route }) {
  const theme = useContext(ThemeContext);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [page, setPage] = useState("agenda");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [slots, setSlots] = useState([]);
  const [triages, setTriages] = useState([]);
  const [triage, setTriage] = useState(null);
  const [selected, setSelected] = useState(null);
  const [changing, setChanging] = useState(null);
  const [symptoms, setSymptoms] = useState("");
  const [onset, setOnset] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [clinic, setClinic] = useState("");
  const [doctor, setDoctor] = useState("");
  const [enabled, setEnabled] = useState(false);
  const lock = useRef(false);
  const searchRevision = useRef(0);
  const active = useRef(true);
  const handledTriageRoute = useRef(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function run(action) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function refresh(remindersEnabled = enabled) {
    const revision = reminderVersion();
    const list = await api("/consultas");
    if (!active.current) return list;
    setAppointments(list);
    if (remindersEnabled)
      await syncReminders(list, revision).catch(() =>
        setNotice(
          "Consultas atualizadas. Não foi possível atualizar os lembretes neste aparelho.",
        ),
      );
    return list;
  }
  useEffect(() => {
    if (!session) return;
    run(async () => {
      const pref = await storage.get(`recordar_reminders_${session.user.id}`);
      setEnabled(pref === "sim");
      await refresh(pref === "sim");
    });
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") run(() => refresh());
    });
    return () => listener.remove();
  }, [session?.user?.id, enabled]);
  useOnFocus(navigation, () => run(() => refresh()));
  useEffect(() => {
    const id = route?.params?.id_pre_triagem;
    if (!id) {
      handledTriageRoute.current = null;
      return;
    }
    if (lock.current || handledTriageRoute.current === id) return;
    handledTriageRoute.current = id;
    run(async () => {
      // O resultado do chatbot só fornece o ID. A API confirma dono, conclusão
      // e especialidades; o aplicativo nunca fabrica uma recomendação.
      const result = await api(`/pre-triagens/${encodeURIComponent(id)}`);
      if (result.concluida !== true)
        throw new Error("Esta pré-triagem ainda não foi concluída.");
      setChanging(null);
      setSelected(null);
      setTriage(null);
      setSlots([]);
      setDate("");
      setSpecialty("");
      setName("");
      setTriages([result]);
      setPage("triagem");
    });
    navigation?.setParams?.({ id_pre_triagem: undefined });
  }, [route?.params?.id_pre_triagem, busy]);
  useEffect(() => {
    if (page === "agenda") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      setPage(page === "confirmar" ? "horarios" : "agenda");
      return true;
    });
    return () => sub.remove();
  }, [page]);
  async function search(t = triage, current = changing, searchDate = date) {
    const revision = ++searchRevision.current;
    const list = await api(
      availablePath({
        triageId: triageId(t),
        appointmentId: current?.id,
        doctorId: current?.id_medico,
        date: searchDate,
      }),
    );
    if (revision === searchRevision.current) {
      setSlots(list);
      setClinic("");
      setDoctor("");
    }
  }
  async function openBooking() {
    setChanging(null);
    setTriage(null);
    setSelected(null);
    setDate("");
    setSlots([]);
    setClinic("");
    setDoctor("");
    setSpecialty("");
    setName("");
    setSymptoms("");
    setOnset("");
    const list = await api("/pre-triagens");
    setTriages(list);
    setPage("triagem");
  }
  async function confirmBooking() {
    const c = selected;
    let saved;
    try {
      saved = changing
        ? await api(`/consultas/${changing.id}/trocar`, {
            method: "PUT",
            body: { id_nova: c.id },
          })
        : await api(`/consultas/${c.id}/agendar`, {
            method: "PUT",
            body: {
              id_pre_triagem: triageId(triage),
              queixa_principal: reason,
              sintomas: symptoms,
              inicio_sintomas: onset,
            },
          });
    } catch (e) {
      if (e.status === 409) {
        setSelected(null);
        setPage("horarios");
        await search().catch(() => setSlots([]));
      } else if (e.status === 404 && changing) {
        setChanging(null);
        setSelected(null);
        setPage("agenda");
        await refresh().catch(() => {});
      }
      throw e;
    }
    if (!active.current) return;
    setPage("agenda");
    setSelected(null);
    setChanging(null);
    setNotice(
      `Consulta confirmada para ${dateBR(saved.data_consulta)} às ${saved.horario_consulta}.`,
    );
    const updated = [
      ...appointments.filter(
        (item) => item.id !== changing?.id && item.id !== saved.id,
      ),
      saved,
    ];
    setAppointments(updated);
    if (enabled)
      await syncReminders(updated).catch(() =>
        setNotice(
          "Consulta confirmada. Não foi possível atualizar os lembretes neste aparelho.",
        ),
      );
    try {
      await refresh();
    } catch {
      setNotice(
        "Consulta confirmada. Atualize a agenda quando a conexão voltar.",
      );
    }
  }
  const visible = slots.filter(
    (c) =>
      (!clinic || c.id_clinica === clinic) &&
      (!doctor || c.id_medico === doctor) &&
      c.id !== changing?.id &&
      (!specialty || c.nome_especialidade === specialty) &&
      (!name || c.nome_medico?.toLowerCase().includes(name.toLowerCase())),
  );
  const clinics = [
    ...new Map(slots.map((c) => [c.id_clinica, c.nome_clinica])).entries(),
  ];
  const doctors = [
    ...new Map(
      slots
        .filter((c) => !clinic || c.id_clinica === clinic)
        .map((c) => [c.id_medico, c.nome_medico]),
    ).entries(),
  ];
  return (
    <>
      <Page readingKey={page}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <BrandLogo />
          <View style={{ flex: 1, gap: 4 }}>
            <Txt
              style={{ fontSize: 26, fontWeight: "800", color: theme.primary }}
            >
              recordar
            </Txt>
            <Txt style={{ fontSize: 16, color: theme.muted }}>
              Saúde na palma da mão
            </Txt>
          </View>
        </View>
        {page !== "agenda" && (
          <BookingProgress page={page} changing={!!changing} />
        )}
        {
          <>
            {page !== "agenda" && (
              <Button
                secondary
                disabled={busy}
                onPress={() => {
                  setPage("agenda");
                  setSelected(null);
                  setChanging(null);
                }}
              >
                Voltar à minha agenda
              </Button>
            )}
            {page === "agenda" && (
              <>
                <Txt style={s.title}>Sua agenda</Txt>
                <Txt style={{ color: theme.muted }}>
                  Consultas, horários e lembretes em um só lugar.
                </Txt>
                <Button disabled={busy} onPress={() => run(openBooking)}>
                  Agendar consulta
                </Button>
                <View
                  style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}
                >
                  <View style={{ flexGrow: 1, flexBasis: 200 }}>
                    <Button
                      secondary
                      disabled={busy}
                      onPress={() => run(() => refresh())}
                    >
                      Atualizar agenda
                    </Button>
                  </View>
                  <View style={{ flexGrow: 1, flexBasis: 200 }}>
                    <Button
                      secondary
                      disabled={busy}
                      onPress={() =>
                        run(async () => {
                          if (enabled) {
                            await storage.set(
                              `recordar_reminders_${session.user.id}`,
                              "nao",
                            );
                            await clearReminders();
                            setEnabled(false);
                          } else {
                            if (Platform.OS === "web")
                              throw new Error(
                                "Os lembretes estão disponíveis no aplicativo do celular.",
                              );
                            if (!(await requestReminders()))
                              throw new Error(
                                "Permita notificações nos ajustes do aparelho para receber lembretes.",
                              );
                            await storage.set(
                              `recordar_reminders_${session.user.id}`,
                              "sim",
                            );
                            setEnabled(true);
                            await refresh(true);
                          }
                        })
                      }
                    >
                      {enabled ? "Desativar lembretes" : "Ativar lembretes"}
                    </Button>
                  </View>
                </View>
                <Txt style={s.small}>
                  Lembretes neste aparelho: 24 horas e 1 hora antes, quando
                  houver tempo. Horários de Brasília.
                </Txt>
                {!appointments.length && (
                  <Surface>
                    <Txt title>Sua próxima consulta começa aqui</Txt>
                    <Txt style={s.text}>
                      Você ainda não tem consultas agendadas.
                    </Txt>
                    <Txt style={{ color: theme.muted }}>
                      Escolha “Agendar consulta” para encontrar um profissional
                      e um horário.
                    </Txt>
                  </Surface>
                )}
                {appointments.map((c) => (
                  <Card key={c.id} c={c}>
                    {c.id_pre_triagem && (
                      <Txt style={s.small}>
                        Pré-triagem vinculada à consulta
                      </Txt>
                    )}
                    <Button
                      secondary
                      disabled={busy}
                      onPress={() =>
                        run(async () => {
                          setChanging(c);
                          setTriage(null);
                          setSpecialty("");
                          setName("");
                          setClinic("");
                          setDoctor("");
                          setDate("");
                          await search(null, c, "");
                          setPage("horarios");
                        })
                      }
                    >
                      Trocar horário
                    </Button>
                    <Button
                      secondary
                      disabled={busy}
                      onPress={() => setPending(c)}
                    >
                      Cancelar consulta
                    </Button>
                  </Card>
                ))}
              </>
            )}
            {page === "triagem" && (
              <>
                <Txt style={s.title}>Como deseja agendar?</Txt>
                <Txt style={s.text}>
                  Use uma conversa sobre seus sintomas (pré-triagem) para ver
                  especialidades recomendadas. Se preferir, agende diretamente.
                </Txt>
                <Txt style={s.small}>
                  A IA não substitui a avaliação médica.
                </Txt>
                {!triages.length && (
                  <Txt style={s.text}>
                    Nenhuma pré-triagem concluída. Você pode agendar
                    diretamente.
                  </Txt>
                )}
                {triages.map((t) => (
                  <Surface key={triageId(t)}>
                    <Txt style={s.subtitle}>
                      Pré-triagem de {dateBR(t.createdAt.slice(0, 10))}
                    </Txt>
                    <Txt style={s.text}>{t.resumo}</Txt>
                    {!!t.duracao && <Txt>Duração informada: {t.duracao}</Txt>}
                    {t.intensidade != null && (
                      <Txt>Intensidade informada: {t.intensidade}/10</Txt>
                    )}
                    {(t.alertas || []).map((alerta, index) => (
                      <Txt key={index} accessibilityRole="alert">
                        {alerta}
                      </Txt>
                    ))}
                    <Txt style={s.text}>
                      {t.especialidades
                        .map((e) => e.nome_especialidade)
                        .join(", ")}
                    </Txt>
                    {t.urgencia ? (
                      <Txt accessibilityRole="alert" style={s.error}>
                        Siga as orientações de urgência apresentadas pela
                        pré-triagem. O agendamento comum não está disponível
                        para este resultado.
                      </Txt>
                    ) : (
                      <Button
                        disabled={busy || t.concluida === false || !triageId(t)}
                        onPress={() =>
                          run(async () => {
                            setTriage(t);
                            setReason(t.resumo);
                            setSymptoms((t.sintomas || []).join(", "));
                            setOnset("");
                            await search(t, null);
                            setPage("horarios");
                          })
                        }
                      >
                        Usar recomendação
                      </Button>
                    )}
                  </Surface>
                ))}
                <Button
                  secondary
                  disabled={busy}
                  onPress={() =>
                    run(async () => {
                      setTriage(null);
                      setReason("");
                      await search(null, null);
                      setPage("horarios");
                    })
                  }
                >
                  Agendar diretamente
                </Button>
              </>
            )}
            {page === "horarios" && (
              <>
                <Txt style={s.title}>
                  {changing
                    ? "Escolha o novo horário"
                    : "Encontre sua consulta"}
                </Txt>
                <Txt style={s.text}>
                  {changing
                    ? `Horários do mesmo profissional: ${changing.nome_medico}`
                    : triage
                      ? "Profissionais das especialidades recomendadas pela pré-triagem."
                      : "Todos os horários disponíveis."}
                </Txt>
                <Txt style={{ fontWeight: "700" }}>Escolha uma data</Txt>
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: 10,
                    paddingVertical: 4,
                  }}
                >
                  {nextDays().map((day) => (
                    <View
                      key={day}
                      style={{
                        minWidth: 105,
                        flexGrow: 1,
                        flexBasis: theme.large ? 140 : 105,
                      }}
                    >
                      <Button
                        secondary
                        selected={date === day}
                        disabled={busy}
                        accessibilityLabel={`Buscar horários em ${dateBR(day)}`}
                        onPress={() =>
                          run(() => {
                            setDate(day);
                            return search(triage, changing, day);
                          })
                        }
                      >
                        {dateBR(day).slice(0, 5)}
                      </Button>
                    </View>
                  ))}
                </View>
                <Field
                  label="Data (AAAA-MM-DD, opcional)"
                  value={date}
                  onChangeText={setDate}
                  placeholder="2026-12-09"
                />
                <Button
                  secondary
                  disabled={busy}
                  onPress={() => run(() => search())}
                >
                  Buscar horários
                </Button>
                {!!date && (
                  <Button
                    secondary
                    disabled={busy}
                    onPress={() =>
                      run(() => {
                        setDate("");
                        return search(triage, changing, "");
                      })
                    }
                  >
                    Ver todas as datas
                  </Button>
                )}
                <Surface>
                  <Button
                    secondary
                    selected={filtersOpen}
                    onPress={() => setFiltersOpen(!filtersOpen)}
                  >
                    {filtersOpen
                      ? "Fechar filtros"
                      : "Filtrar por profissional ou clínica"}
                  </Button>
                  {filtersOpen && (
                    <View style={{ gap: 12 }}>
                      <Field
                        label="Nome do profissional"
                        value={name}
                        onChangeText={setName}
                      />
                      <Txt style={s.label}>Especialidade</Txt>
                      <Button
                        secondary
                        selected={specialty === ""}
                        onPress={() => setSpecialty("")}
                      >
                        Todas as especialidades
                      </Button>
                      {[
                        ...new Set(
                          slots
                            .map((c) => c.nome_especialidade)
                            .filter(Boolean),
                        ),
                      ].map((e) => (
                        <Button
                          secondary
                          key={e}
                          selected={specialty === e}
                          onPress={() => setSpecialty(e)}
                        >
                          {e}
                        </Button>
                      ))}
                      <Txt style={s.label}>Clínica</Txt>
                      <Button
                        secondary
                        disabled={busy}
                        selected={clinic === ""}
                        onPress={() => {
                          setClinic("");
                          setDoctor("");
                        }}
                      >
                        Todas as clínicas
                      </Button>
                      {clinics.map(([id, name]) => (
                        <Button
                          secondary
                          key={id}
                          disabled={busy}
                          selected={clinic === id}
                          onPress={() => {
                            setClinic(id);
                            setDoctor("");
                          }}
                        >
                          {name}
                        </Button>
                      ))}
                      {!changing && (
                        <>
                          <Txt style={s.label}>Profissional</Txt>
                          <Button
                            secondary
                            disabled={busy}
                            selected={doctor === ""}
                            onPress={() => setDoctor("")}
                          >
                            Todos os profissionais
                          </Button>
                          {doctors.map(([id, name]) => (
                            <Button
                              secondary
                              key={id}
                              disabled={busy}
                              selected={doctor === id}
                              onPress={() => setDoctor(id)}
                            >
                              {name}
                            </Button>
                          ))}
                        </>
                      )}
                    </View>
                  )}
                </Surface>
                <Txt
                  style={{ color: theme.muted, fontSize: 16 }}
                  accessibilityLiveRegion="polite"
                >
                  {visible.length}{" "}
                  {visible.length === 1
                    ? "horário encontrado"
                    : "horários encontrados"}
                </Txt>
                {!visible.length && (
                  <Txt style={s.text}>
                    Nenhum horário disponível para estes filtros. Tente outra
                    data ou clínica.
                  </Txt>
                )}
                {visible.map((c) => (
                  <Card key={c.id} c={c}>
                    <Button
                      disabled={busy}
                      onPress={() => {
                        setSelected(c);
                        setPage("confirmar");
                      }}
                    >
                      Escolher horário
                    </Button>
                  </Card>
                ))}
              </>
            )}
            {page === "confirmar" && selected && (
              <>
                <Txt style={s.title}>Confira sua consulta</Txt>
                <Card c={selected} />
                {!changing && (
                  <>
                    <Field
                      label="Motivo da consulta"
                      multiline
                      value={reason}
                      onChangeText={setReason}
                    />
                    <Field
                      label="Sintomas"
                      multiline
                      value={symptoms}
                      onChangeText={setSymptoms}
                    />
                    <Field
                      label="Início dos sintomas (AAAA-MM-DD, opcional)"
                      value={onset}
                      onChangeText={setOnset}
                    />
                  </>
                )}
                {(triage || changing?.id_pre_triagem) && (
                  <Txt style={s.text}>
                    A pré-triagem será vinculada a esta consulta.
                  </Txt>
                )}
                <Button
                  disabled={busy || (!changing && !reason.trim())}
                  onPress={() => run(confirmBooking)}
                >
                  {changing
                    ? "Confirmar novo horário"
                    : "Confirmar agendamento"}
                </Button>
                <Button
                  secondary
                  disabled={busy}
                  onPress={() => {
                    setSelected(null);
                    setPage("horarios");
                  }}
                >
                  Voltar aos horários
                </Button>
              </>
            )}
          </>
        }
        {busy && (
          <ActivityIndicator color="#6941a5" accessibilityLabel="Aguarde" />
        )}
        {!!error && (
          <Txt accessibilityRole="alert" style={s.error}>
            {error}
          </Txt>
        )}
        {!!notice && (
          <Txt accessibilityLiveRegion="polite" style={s.success}>
            {notice}
          </Txt>
        )}
      </Page>
      <Confirm
        pending={
          pending && {
            title: "Cancelar consulta?",
            message:
              "O horário será liberado. As prescrições serão preservadas pela API de agendamento.",
          }
        }
        close={() => setPending(null)}
        busy={busy}
        onConfirm={() =>
          run(async () => {
            const cancelled = pending;
            try {
              await api(`/consultas/${cancelled.id}/cancelar`, {
                method: "PUT",
              });
            } catch (e) {
              if (e.status === 404 || e.status === 409) {
                setPending(null);
                await refresh().catch(() => {});
              }
              throw e;
            }
            if (!active.current) return;
            setPending(null);
            const updated = appointments.filter(
              (item) => item.id !== cancelled.id,
            );
            setAppointments(updated);
            setNotice("Consulta cancelada.");
            if (enabled)
              await syncReminders(updated).catch(() =>
                setNotice(
                  "Consulta cancelada. Não foi possível atualizar os lembretes neste aparelho.",
                ),
              );
            await refresh().catch(() =>
              setNotice(
                "Consulta cancelada. Atualize a agenda quando a conexão voltar.",
              ),
            );
          })
        }
      />
    </>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f6f3fa" },
  content: {
    padding: 22,
    paddingBottom: 48,
    gap: 12,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  brand: { fontSize: 36, fontWeight: "800", color: "#5c348d" },
  tagline: { fontSize: 16, color: "#544a60", marginBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#30223f",
    marginVertical: 12,
  },
  subtitle: { fontSize: 22, fontWeight: "700", color: "#30223f" },
  text: { fontSize: 18, lineHeight: 27, color: "#3d3447" },
  small: { fontSize: 16, lineHeight: 24, color: "#544a60" },
  card: {
    padding: 20,
    gap: 10,
    borderRadius: 18,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d9cce9",
  },
  slot: { fontSize: 22, fontWeight: "700", color: "#5c348d" },
  field: { gap: 8 },
  label: { fontSize: 18, fontWeight: "600", color: "#30223f" },
  input: {
    minHeight: 56,
    padding: 14,
    borderWidth: 1,
    borderColor: "#8e7a9e",
    borderRadius: 12,
    backgroundColor: "#fff",
    fontSize: 18,
    color: "#30223f",
  },
  button: {
    minHeight: 56,
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#623592",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  secondary: {
    backgroundColor: "#eee6f6",
    borderWidth: 1,
    borderColor: "#aa8cbe",
  },
  secondaryText: { color: "#452069" },
  nav: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  error: {
    fontSize: 18,
    lineHeight: 27,
    color: "#9e1831",
    padding: 12,
    backgroundColor: "#ffecef",
    borderRadius: 12,
  },
  success: {
    fontSize: 18,
    lineHeight: 27,
    color: "#215d3b",
    padding: 12,
    backgroundColor: "#e4f3e9",
    borderRadius: 12,
  },
});
