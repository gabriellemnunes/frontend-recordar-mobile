import React from "react";

import { Button, Card, Txt, useAction } from "./ui";
import ThemePicker from "./ThemePicker";
export default function Accessibility({ prefs, onChange }) {
  const a = useAction();
  return (
    <Card>
      <Txt title>Acessibilidade</Txt>
      <Txt>
        Suas preferências valem para todas as telas e ficam salvas neste
        aparelho.
      </Txt>
      <Button
        icon="text"
        secondary
        selected={prefs.large}
        disabled={a.busy}
        onPress={() => a.run(() => onChange({ ...prefs, large: !prefs.large }))}
      >
        Texto maior
      </Button>
      <ThemePicker prefs={prefs} onChange={onChange} />
      {a.feedback}
    </Card>
  );
}
