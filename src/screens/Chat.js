import React, { useState } from "react";
import { Linking } from "react-native";
import { Button, Card, Field, Page, Txt, useAction } from "../components/ui";
import { openBooking } from "../bookingNavigation";

// O modelo roda no backend; nenhuma chave ou endereço da IA entra no APK.
export default function Chat({ api, navigation }) {
  const a = useAction(),
    [text, setText] = useState(""),
    [messages, setMessages] = useState([]),
    [conversation, setConversation] = useState(null),
    [completedTriage, setCompletedTriage] = useState(null),
    [urgent, setUrgent] = useState(false),
    [consent, setConsent] = useState(false);
  const endpoint = process.env.EXPO_PUBLIC_CHAT_PATH?.trim() || "/chat";
  return (
    <Page title="Assistente Recordar" automaticallyAdjustKeyboardInsets>
      <Txt>
        Conte como você está se sentindo. O assistente não substitui uma
        avaliação médica.
      </Txt>
      {!consent && (
        <Card>
          <Txt>
            O assistente usa suas mensagens para organizar uma pré-triagem e
            sugerir especialidades. O resultado fica salvo no seu perfil. Não
            informe senhas ou documentos.
          </Txt>
          <Button onPress={() => setConsent(true)}>Iniciar pré-triagem</Button>
        </Card>
      )}
      {urgent && (
        <Card>
          <Txt title accessibilityRole="alert">
            Procure atendimento de urgência
          </Txt>
          <Txt>Não espere pelo agendamento. No Brasil, ligue 192 (SAMU).</Txt>
          <Button onPress={() => a.run(() => Linking.openURL("tel:192"))}>
            Ligar para o SAMU 192
          </Button>
        </Card>
      )}
      {messages.map((m, i) => (
        <Card key={i}>
          <Txt style={{ fontWeight: "700" }}>
            {m.role === "user" ? "Você" : "Assistente"}
          </Txt>
          <Txt
            accessibilityLiveRegion={m.role === "assistant" ? "polite" : "none"}
          >
            {m.text}
          </Txt>
        </Card>
      ))}
      <Field
        label="Sua mensagem"
        value={text}
        onChangeText={setText}
        multiline
        numberOfLines={2}
        editable={!a.busy}
      />
      <Button
        disabled={a.busy || !text.trim() || !consent || !!completedTriage}
        onPress={() =>
          a.run(async () => {
            if (!endpoint?.startsWith("/") || endpoint.startsWith("//"))
              throw new Error(
                "O serviço de conversa está configurado incorretamente.",
              );
            const result = await api(endpoint, {
              method: "POST",
              body: {
                mensagem: text.trim(),
                id_conversa: conversation,
                consentimento_ia: consent,
              },
            });
            if (typeof result.resposta !== "string")
              throw new Error("O serviço retornou uma resposta incompatível.");
            setMessages((old) => [
              ...old,
              { role: "user", text: text.trim() },
              { role: "assistant", text: result.resposta },
            ]);
            setConversation(result.id_conversa || conversation);
            setUrgent(!!result.urgencia);
            if (typeof result.id_pre_triagem === "string")
              setCompletedTriage(result.id_pre_triagem);
            setText("");
          })
        }
      >
        Enviar mensagem
      </Button>
      {a.feedback}
      {a.busy && (
        <Txt accessibilityLiveRegion="polite">
          O assistente está organizando suas informações. Aguarde a resposta.
        </Txt>
      )}
      <Button
        secondary
        disabled={a.busy || !messages.length}
        onPress={() => {
          setMessages([]);
          setConversation(null);
          setCompletedTriage(null);
          setUrgent(false);
        }}
      >
        Nova conversa
      </Button>
      {!urgent && (
        <Button
          secondary
          onPress={() => openBooking(navigation, completedTriage)}
        >
          {completedTriage
            ? "Agendar com esta pré-triagem"
            : "Ver pré-triagens e agendar"}
        </Button>
      )}
    </Page>
  );
}
