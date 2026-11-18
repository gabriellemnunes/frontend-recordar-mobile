import React, { useContext } from "react";
import { View } from "react-native";
import { ThemeContext, Txt } from "./ui";
import Icon from "./Icon";

export default function SectionHeading({ icon, children }) {
  const theme = useContext(ThemeContext);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View
        style={{
          backgroundColor: theme.light ? "#e1f1eb" : "#193c35",
          padding: 10,
          borderRadius: 14,
        }}
      >
        <Icon
          name={icon}
          color={theme.light ? "#17634f" : "#a6ead1"}
          size={26}
        />
      </View>
      <Txt title style={{ flex: 1 }}>
        {children}
      </Txt>
    </View>
  );
}
