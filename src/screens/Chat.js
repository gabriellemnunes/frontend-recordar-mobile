import React, { useState } from "react";
import { Button, Card, Field, Page, Txt, useAction } from "../components/ui";

// Contract for the team's separate assistant service. No secret or AI-service
// credential belongs in a client app. The backend must save completed triages.
export default function Chat({ api, navigation }) {
  const a = useAction(),
    [text, setText] = useState(""),
    [messages, setMessages] = useState([]),
    [conversation, setConversation] = useState(null);
  const endpoint = process.env.EXPO_PUBLIC_CHAT_PATH;
  return (
    <Page title="Assistente Recordar">
      <Txt>
        Conte como você está se sentindo. O assistente não substitui uma
        avaliação médica.
      </Txt>
      {!endpoint && (
        <Card>
          <Txt>
            O serviço de conversa ainda não está disponível nesta API. Você pode
            agendar diretamente ou usar uma pré-triagem já concluída.
          </Txt>
          <Button onPress={() => navigation.navigate("Agendamento")}>
            Abrir agendamento
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
      />
      <Button
        disabled={a.busy || !text.trim() || !endpoint}
        onPress={() =>
          a.run(async () => {
            if (!endpoint?.startsWith("/") || endpoint.startsWith("//"))
              throw new Error(
                "O serviço de conversa está configurado incorretamente.",
              );
            const result = await api(endpoint, {
              method: "POST",
              body: { mensagem: text.trim(), id_conversa: conversation },
            });
            if (typeof result.resposta !== "string")
              throw new Error("O serviço retornou uma resposta incompatível.");
            setMessages((old) => [
              ...old,
              { role: "user", text: text.trim() },
              { role: "assistant", text: result.resposta },
            ]);
            setConversation(result.id_conversa || conversation);
            setText("");
          })
        }
      >
        Enviar mensagem
      </Button>
      {a.feedback}
      <Button
        secondary
        disabled={a.busy || !messages.length}
        onPress={() => {
          setMessages([]);
          setConversation(null);
        }}
      >
        Nova conversa
      </Button>
      <Button secondary onPress={() => navigation.navigate("Agendamento")}>
        Ver pré-triagens e agendar
      </Button>
    </Page>
  );
}
