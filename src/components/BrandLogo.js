import React, { useContext, useId } from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import { ThemeContext } from "./ui";
import source from "../../assets/recordar-logo-source";

export default function BrandLogo({ size = 56 }) {
  const theme = useContext(ThemeContext);
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const xml = source
    .replaceAll('id="bg"', `id="bg-${id}"`)
    .replaceAll("url(#bg)", `url(#bg-${id})`)
    .replaceAll('id="purple"', `id="purple-${id}"`)
    .replaceAll("url(#purple)", `url(#purple-${id})`);
  return (
    <View
      accessible={false}
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: size * 0.243,
        backgroundColor: "#F8F5FF",
        shadowColor: "#160c24",
        shadowOpacity: theme.light ? 0 : 0.22,
        shadowRadius: 9,
        shadowOffset: { width: 0, height: 4 },
        elevation: theme.light ? 0 : 3,
      }}
    >
      <SvgXml
        xml={xml}
        width={size}
        height={size}
        viewBox="90 90 844 844"
        accessible={false}
        aria-hidden={true}
        focusable={false}
      />
    </View>
  );
}
