import React, { useContext } from "react";
import { View } from "react-native";
import { ThemeContext, Txt } from "./ui";

export default function MedicationTakenBadge() {
  const theme = useContext(ThemeContext);
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: theme.light ? "#e1f1eb" : "#193c35",
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginTop: 6,
      }}
    >
      <Txt
        style={{
          color: theme.light ? "#17634f" : "#a6ead1",
          fontWeight: "700",
          fontSize: 18,
        }}
      >
        Remédio tomado hoje
      </Txt>
    </View>
  );
}
