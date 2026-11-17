import React, { useContext } from "react";
import { View } from "react-native";
import { ThemeContext, Txt } from "./ui";

export default function BookingProgress({ page, changing = false }) {
  const t = useContext(ThemeContext);
  const step = page === "triagem" ? 1 : page === "horarios" ? 2 : 3;
  const steps = changing
    ? ["Horário", "Confirmar"]
    : ["Especialidade", "Horário", "Confirmar"];
  const current = changing ? step - 1 : step;
  return (
    <View
      accessibilityLabel={`Etapa ${current} de ${steps.length}: ${steps[current - 1]}`}
      style={{ gap: 14, marginVertical: 8 }}
    >
      <Txt style={{ fontSize: 16, color: t.muted }}>
        {changing ? "Trocar horário" : "Novo agendamento"} · etapa {current} de{" "}
        {steps.length}
      </Txt>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {steps.map((label, index) => (
          <View key={label} style={{ flex: 1, gap: 8 }}>
            <View
              style={{
                height: 5,
                borderRadius: 5,
                backgroundColor: index < current ? t.primary : t.soft,
              }}
            />
            <Txt
              style={{
                fontSize: 14,
                fontWeight: index + 1 === current ? "700" : "400",
                color: index + 1 === current ? t.text : t.muted,
              }}
            >
              {label}
            </Txt>
          </View>
        ))}
      </View>
    </View>
  );
}
