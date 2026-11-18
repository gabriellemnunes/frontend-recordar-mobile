import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { ActivityIndicator, View } from "react-native";
import BrandLogo from "../components/BrandLogo";
import SectionHeading from "../components/SectionHeading";
import {
  Button,
  Card,
  Page,
  ThemeContext,
  Txt,
  nameOf,
} from "../components/ui";
import AppointmentCard from "../components/AppointmentCard";
import MedicationTakenBadge from "../components/MedicationTakenBadge";
import MedicationCounts from "../components/MedicationCounts";
import { patientOverview } from "../patientOverview";

export default function PatientHome({ api, user, navigation }) {
  const t = useContext(ThemeContext);
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const revision = useRef(0);
  const load = useCallback(async () => {
    const current = ++revision.current;
    setLoading(true);
    setError("");
    try {
      const [appointments, medications] = await Promise.all([
        api("/consultas"),
        api("/remedios"),
      ]);
      if (current === revision.current)
        setData(patientOverview(appointments, medications));
    } catch {
      if (current === revision.current)
        setError("Não foi possível atualizar seu resumo. Tente novamente.");
    } finally {
      if (current === revision.current) setLoading(false);
    }
  }, [api]);
  useEffect(() => {
    load();
    return () => {
      ++revision.current;
    };
  }, [load]);
  useEffect(() => navigation?.addListener?.("focus", load), [navigation, load]);
  const go = (name) => navigation.navigate(name);
  return (
    <Page>
      <View style={{ flexDirection: "row", gap: 14, alignItems: "center" }}>
        <BrandLogo />
        <View style={{ flex: 1 }}>
          <Txt style={{ fontSize: 25, fontWeight: "800", color: t.primary }}>
            recordar
          </Txt>
          <Txt style={{ color: t.muted, fontSize: 15 }}>
            Saúde na palma da mão
          </Txt>
        </View>
      </View>
      <View style={{ gap: 6, marginTop: 12 }}>
        <Txt title accessibilityRole="header">
          Olá, {nameOf(user)}
        </Txt>
      </View>
      <View style={{ gap: 12 }}>
        <Button icon="calendar" onPress={() => go("Agendamento")}>
          Marcar consulta
        </Button>
        <Button icon="chat" secondary onPress={() => go("Chatbot")}>
          Conversar com o assistente
        </Button>
      </View>
      {loading && (
        <ActivityIndicator
          accessibilityLabel="Atualizando seu resumo"
          color={t.primary}
        />
      )}
      {!!error && (
        <Card>
          <Txt accessibilityRole="alert">{error}</Txt>
          <Button secondary onPress={load}>
            Tentar novamente
          </Button>
        </Card>
      )}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <View style={{ flexGrow: 1, flexBasis: 240 }}>
          <SectionHeading icon="stethoscope">Próxima consulta</SectionHeading>
        </View>
      </View>
      {data &&
        (data.next ? (
          <AppointmentCard appointment={data.next} compact>
            <Button secondary onPress={() => go("Agendamento")}>
              Ver minha agenda
            </Button>
          </AppointmentCard>
        ) : (
          <Card
            style={{
              borderWidth: 0,
              borderLeftWidth: 4,
              borderLeftColor: t.primary,
              gap: 6,
            }}
          >
            <Txt>Nenhuma consulta futura agendada.</Txt>
            <Txt style={{ color: t.muted, fontSize: 16 }}>
              Quando você marcar, os detalhes aparecem aqui.
            </Txt>
          </Card>
        ))}
      <SectionHeading icon="pill">Medicamentos de hoje</SectionHeading>
      {data && (
        <Card style={{ borderWidth: 0, gap: 18 }}>
          <Txt style={{ color: t.muted, fontWeight: "600" }}>
            {data.medications.length
              ? `${data.remaining} ${data.remaining === 1 ? "tomada pendente" : "tomadas pendentes"} hoje`
              : "Nenhum medicamento previsto para hoje"}
          </Txt>
          {data.medications.slice(0, 3).map((m) => (
            <View
              key={m.id}
              style={{
                flexDirection: "row",
                gap: 16,
                alignItems: "center",
                borderTopWidth: 1,
                borderColor: t.border,
                paddingTop: 12,
                flexWrap: "wrap",
              }}
            >
              <View
                style={{
                  backgroundColor: t.soft,
                  padding: 10,
                  borderRadius: 10,
                }}
              >
                <Txt
                  style={{ fontSize: 21, fontWeight: "700", color: t.primary }}
                >
                  {m.horario_remedio}
                </Txt>
              </View>
              <View style={{ flexGrow: 1, flexBasis: 160 }}>
                <Txt
                  style={{
                    fontWeight: "600",
                    textDecorationLine: m.tomado_hoje ? "line-through" : "none",
                  }}
                >
                  {m.nome_remedio}
                </Txt>
                {m.tomado_hoje ? (
                  <MedicationTakenBadge />
                ) : (
                  <Txt style={{ color: t.muted }}>Pendente</Txt>
                )}
                <MedicationCounts medication={m} />
              </View>
            </View>
          ))}
          <Button icon="calendar" secondary onPress={() => go("Dia")}>
            Abrir agenda do dia
          </Button>
        </Card>
      )}
      {!user.anamnese_preenchida && (
        <Card style={{ borderWidth: 0 }}>
          <SectionHeading icon="care">Suas informações de saúde</SectionHeading>
          <Txt style={{ color: t.muted }}>
            Mantenha seu perfil atualizado para ajudar no atendimento.
          </Txt>
          <Button secondary onPress={() => go("Perfil")}>
            Preencher informações de saúde
          </Button>
        </Card>
      )}
      <Txt title>Mais opções</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {[
          ["Remédios", "Remédios"],
          ["Histórico de consultas", "Histórico"],
          ["Meu perfil", "Perfil"],
        ].map(([label, route]) => (
          <View key={route} style={{ flexBasis: 220, flexGrow: 1 }}>
            <Button
              icon={
                { Remédios: "pill", Histórico: "history", Perfil: "user" }[
                  route
                ]
              }
              secondary
              onPress={() => go(route)}
            >
              {label}
            </Button>
          </View>
        ))}
      </View>
    </Page>
  );
}
