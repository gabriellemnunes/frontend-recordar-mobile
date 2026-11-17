import React, { useContext } from "react";
import { View } from "react-native";
import { ThemeContext, Txt } from "./ui";
import Icon from "./Icon";

export default function SectionHeading({ icon, children }) {
  const theme = useContext(ThemeContext);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <Icon name={icon} color={theme.primary} size={28} />
      <Txt title style={{ flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}
