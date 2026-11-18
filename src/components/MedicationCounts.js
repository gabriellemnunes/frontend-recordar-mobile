import React from "react";
import { View } from "react-native";
import { Txt } from "./ui";

export default function MedicationCounts({ medication: m }) {
  if (!m.tomadas_por_dia) return null;
  const mistakes = m.marcacoes_por_engano_hoje || 0;
  return (
    <View style={{ gap: 4 }}>
      <Txt>
        {m.tomadas_hoje || 0} de {m.tomadas_por_dia} tomadas hoje
      </Txt>
      {mistakes > 0 && (
        <Txt>
          {mistakes}{" "}
          {mistakes === 1 ? "marcação por engano" : "marcações por engano"} de{" "}
          {m.tomadas_por_dia} tomadas previstas
        </Txt>
      )}
    </View>
  );
}
