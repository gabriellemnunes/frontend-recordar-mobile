import React from "react";
import * as Speech from "expo-speech";
import { Button, Card, Txt, useAction } from "./ui";
export default function Accessibility({ prefs, onChange }) {
  const a = useAction();
  return (
    <Card>
      <Txt title>Acessibilidade</Txt>
      <Txt>
        Escolha suas preferências antes de entrar. Elas valem para todas as
        telas.
      </Txt>
      <Button
        secondary
        selected={prefs.large}
        disabled={a.busy}
        onPress={() => a.run(() => onChange({ ...prefs, large: !prefs.large }))}
      >
        Texto maior
      </Button>
      <Button
        secondary
        selected={prefs.light}
        disabled={a.busy}
        onPress={() => a.run(() => onChange({ ...prefs, light: !prefs.light }))}
      >
        Modo claro
      </Button>
      <Button
        secondary
        onPress={() =>
          a.run(async () => {
            await Speech.stop();
            Speech.speak(
              "Bem-vindo ao Recordar. Escolha seu tipo de acesso. Digite seu e-mail e sua senha e aperte Entrar. Se ainda não tem conta de paciente, aperte Criar conta. Para recuperar o acesso, aperte Esqueci minha senha.",
              {
                language: "pt-BR",
                rate: 0.85,
                onError: () =>
                  a.setNotice(
                    "A leitura de voz não está disponível neste aparelho.",
                  ),
              },
            );
          })
        }
      >
        Ouvir instruções
      </Button>
      <Button secondary onPress={() => Speech.stop()}>
        Parar leitura
      </Button>
      {a.feedback}
    </Card>
  );
}
