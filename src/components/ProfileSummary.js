import React, { useContext } from "react";
import { Image, View } from "react-native";
import { Button, Card, ThemeContext, Txt, dateBR, nameOf } from "./ui";
import Icon from "./Icon";

export default function ProfileSummary({ user, busy, onPhoto, onRemovePhoto }) {
  const t = useContext(ThemeContext);
  return (
    <Card style={{ borderWidth: 0, gap: 20 }}>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 18,
        }}
      >
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 44,
            backgroundColor: t.soft,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {user.foto_perfil ? (
            <Image
              accessible={false}
              source={{ uri: user.foto_perfil }}
              style={{ width: 88, height: 88 }}
            />
          ) : (
            <Icon
              name={user.tipo === "paciente" ? "elder" : "user"}
              size={44}
              color={t.primary}
            />
          )}
        </View>
        <View style={{ flexGrow: 1, flexBasis: 170, gap: 4 }}>
          <Txt style={{ fontSize: 24, fontWeight: "700" }}>{nameOf(user)}</Txt>
          <Txt style={{ color: t.muted }}>
            {user.tipo === "medico"
              ? "Médico"
              : user.tipo === "administrador"
                ? "Administrador"
                : "Paciente"}
          </Txt>
          {!!user.demonstracao && (
            <Txt style={{ color: t.muted, fontSize: 16 }}>
              Perfil fictício de demonstração
            </Txt>
          )}
        </View>
      </View>
      {user.tipo === "paciente" && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {[
            [
              "Idade",
              Number.isInteger(user.idade) && user.idade >= 0
                ? `${user.idade} anos`
                : "Não informada",
            ],
            [
              "Nascimento",
              user.data_nascimento
                ? dateBR(user.data_nascimento)
                : "Não informado",
            ],
          ].map(([label, value]) => (
            <View
              key={label}
              style={{
                flexGrow: 1,
                flexBasis: 130,
                backgroundColor: t.soft,
                borderRadius: 12,
                padding: 14,
                gap: 4,
              }}
            >
              <Txt style={{ color: t.muted, fontSize: 16 }}>{label}</Txt>
              <Txt style={{ fontWeight: "700" }}>{value}</Txt>
            </View>
          ))}
        </View>
      )}
      <Button icon="camera" secondary disabled={busy} onPress={onPhoto}>
        {user.foto_perfil ? "Alterar foto" : "Adicionar foto"}
      </Button>
      {!!user.foto_perfil && (
        <Button secondary disabled={busy} onPress={onRemovePhoto}>
          Remover foto
        </Button>
      )}
    </Card>
  );
}
