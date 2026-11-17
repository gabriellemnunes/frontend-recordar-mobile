import React, { useContext } from "react";
import { View } from "react-native";
import { Button, ThemeContext, Txt, useAction } from "./ui";

export default function ThemePicker({ prefs, onChange }) {
  const theme = useContext(ThemeContext);
  const action = useAction();
  const light = prefs?.light ?? theme.light;
  const change = (value) =>
    action.run(() =>
      onChange
        ? onChange({ ...prefs, light: value })
        : theme.setAppearance?.(value),
    );
  return (
    <View style={{ gap: 10 }}>
      <Txt style={{ fontWeight: "700" }}>Aparência</Txt>
      <Txt style={{ color: theme.muted, fontSize: 16 }}>
        Escolha como prefere ver o Recordar.
      </Txt>
      {!onChange && (
        <>
          <Button
            icon="text"
            secondary
            selected={theme.large}
            disabled={action.busy}
            onPress={() => action.run(() => theme.setTextSize?.(!theme.large))}
          >
            Texto maior
          </Button>
          <Txt style={{ color: theme.muted, fontSize: 16 }}>
            A aparência e o tamanho do texto ficam salvos neste aparelho.
          </Txt>
        </>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <View style={{ flexGrow: 1, flexBasis: 140 }}>
          <Button
            icon="sun"
            secondary
            selected={light}
            disabled={action.busy}
            onPress={() => change(true)}
          >
            Modo claro
          </Button>
        </View>
        <View style={{ flexGrow: 1, flexBasis: 140 }}>
          <Button
            icon="moon"
            secondary
            selected={!light}
            disabled={action.busy}
            onPress={() => change(false)}
          >
            Modo escuro
          </Button>
        </View>
      </View>
      {action.feedback}
    </View>
  );
}
