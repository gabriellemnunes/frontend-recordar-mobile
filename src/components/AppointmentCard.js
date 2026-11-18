import React, { useContext } from "react";
import { View } from "react-native";
import { Card, ThemeContext, Txt } from "./ui";

export default function AppointmentCard({
  appointment: c,
  children,
  available = false,
  compact = false,
}) {
  const t = useContext(ThemeContext);
  const [year, month, day] = (c.data_consulta || "").split("-");
  const months = [
    "JAN",
    "FEV",
    "MAR",
    "ABR",
    "MAI",
    "JUN",
    "JUL",
    "AGO",
    "SET",
    "OUT",
    "NOV",
    "DEZ",
  ];
  return (
    <Card
      style={{
        gap: 18,
        borderWidth: 0,
        borderLeftWidth: 4,
        borderLeftColor: t.primary,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        <View
          accessibilityLabel={`Data: ${day}/${month}/${year}`}
          style={{
            backgroundColor: t.soft,
            borderRadius: 16,
            padding: 14,
            minWidth: 78,
            alignItems: "center",
          }}
        >
          <Txt
            style={{
              fontSize: 30,
              lineHeight: 36,
              fontWeight: "800",
              color: t.primary,
            }}
          >
            {day}
          </Txt>
          <Txt style={{ fontSize: 14, fontWeight: "700", color: t.muted }}>
            {months[Number(month) - 1] || month}
          </Txt>
        </View>
        <View style={{ flexGrow: 1, flexBasis: 180, gap: 4 }}>
          <Txt style={{ fontSize: 16, fontWeight: "700", color: t.primary }}>
            {available
              ? "Horário disponível"
              : c.status === "realizada"
                ? "Consulta realizada"
                : "Consulta agendada"}
          </Txt>
          <Txt style={{ fontSize: 23, fontWeight: "700" }}>
            {(c.nome_medico || "Profissional").replace(
              /\s*\(demonstração\)/gi,
              "",
            )}
          </Txt>
          {!compact && !!c.nome_especialidade && (
            <Txt style={{ fontSize: 17, color: t.muted }}>
              {c.nome_especialidade}
            </Txt>
          )}
          <Txt style={{ fontSize: 21, fontWeight: "700" }}>
            {c.horario_consulta} · {day}/{month}/{year}
          </Txt>
        </View>
      </View>
      <View
        style={{
          borderTopWidth: 1,
          borderColor: t.border,
          paddingTop: 14,
          gap: 3,
        }}
      >
        <Txt style={{ fontSize: 18, fontWeight: "600" }}>
          {(c.nome_clinica || "Clínica").replace(
            /\s*[—–-]\s*demonstração/gi,
            "",
          )}
        </Txt>
        {!compact && !!c.endereco_clinica && (
          <Txt style={{ fontSize: 16, color: t.muted }}>
            {c.endereco_clinica}
          </Txt>
        )}
      </View>
      {children}
    </Card>
  );
}
