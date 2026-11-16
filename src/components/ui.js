import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Speech from "expo-speech";
import { SafeAreaView } from "react-native-safe-area-context";

export function palette(role = "paciente", light = false) {
  if (role === "administrador")
    return {
      background: "#efefef",
      surface: "#ffffff",
      text: "#2b3153",
      muted: "#505870",
      border: "#86939b",
      primary: "#2b3153",
      onPrimary: "#ffffff",
      soft: "#d3d8de",
      input: "#ffffff",
    };
  if (light)
    return role === "medico"
      ? {
          background: "#f1f7fb",
          surface: "#ffffff",
          text: "#0e2230",
          muted: "#385467",
          border: "#b9d9ea",
          primary: "#215a7a",
          onPrimary: "#ffffff",
          soft: "#e0eff8",
          input: "#ffffff",
        }
      : {
          background: "#f5f3fc",
          surface: "#ffffff",
          text: "#1c1730",
          muted: "#4b4466",
          border: "#cbc3ef",
          primary: "#4f3fb8",
          onPrimary: "#ffffff",
          soft: "#ebe7fb",
          input: "#ffffff",
        };
  return role === "medico"
    ? {
        background: "#090909",
        surface: "#131c22",
        text: "#ffffff",
        muted: "#d3e9f5",
        border: "#3f6f8a",
        primary: "#7bc3e9",
        onPrimary: "#090909",
        soft: "#1d3442",
        input: "#1b2a34",
      }
    : {
        background: "#050505",
        surface: "#191724",
        text: "#ffffff",
        muted: "#dcd7fa",
        border: "#5a5296",
        primary: "#a89bf2",
        onPrimary: "#050505",
        soft: "#322e52",
        input: "#2a2740",
      };
}
export const ThemeContext = createContext({
  large: false,
  light: false,
  ...palette(),
});
export function Txt({ children, title, style, ...props }) {
  const t = useContext(ThemeContext);
  const custom = { ...(StyleSheet.flatten(style) || {}) },
    scale = t.large ? 1.25 : 1;
  if (
    ["#30223f", "#3d3447", "#544a60", "#5c348d", "#452069"].includes(
      custom.color,
    )
  )
    custom.color = t.text;
  return (
    <Text
      {...props}
      style={[
        { color: t.text, fontWeight: title ? "700" : "400" },
        custom,
        {
          fontSize: (custom.fontSize || (title ? 26 : 18)) * scale,
          lineHeight: (custom.lineHeight || (title ? 34 : 27)) * scale,
        },
      ]}
    >
      {children}
    </Text>
  );
}
export function Button({
  children,
  onPress,
  disabled,
  secondary,
  danger,
  selected,
  accessibilityLabel,
}) {
  const t = useContext(ThemeContext);
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: danger ? "#a02132" : secondary ? t.soft : t.primary,
          borderColor: t.border,
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
          borderWidth: selected ? 3 : 1,
        },
      ]}
    >
      <Txt
        style={{
          color: secondary && !danger ? t.text : danger ? "#fff" : t.onPrimary,
          fontWeight: "700",
          textAlign: "center",
        }}
      >
        {children}
        {selected ? " ✓" : ""}
      </Txt>
    </Pressable>
  );
}
export function Field({ label, value, onChangeText, ...props }) {
  const t = useContext(ThemeContext),
    [show, setShow] = useState(false);
  const mode = label.includes("AAAA-MM-DD")
    ? "date"
    : label.includes("HH:MM")
      ? "time"
      : null;
  const native = mode && Platform.OS !== "web";
  let date =
    mode === "date" && /^\d{4}-\d{2}-\d{2}$/.test(value || "")
      ? new Date(`${value}T12:00:00`)
      : new Date();
  if (mode === "time" && /^\d{2}:\d{2}$/.test(value || "")) {
    const [h, m] = value.split(":").map(Number);
    date.setHours(h, m, 0, 0);
  }
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <View style={{ gap: 6 }}>
      <Txt style={{ fontWeight: "600" }}>{label}</Txt>
      {native ? (
        <Button
          secondary
          accessibilityLabel={`${label}: ${value || "selecionar"}`}
          onPress={() => setShow(true)}
        >
          {value
            ? mode === "date"
              ? dateBR(value)
              : value
            : mode === "date"
              ? "Selecionar data"
              : "Selecionar horário"}
        </Button>
      ) : (
        <TextInput
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={t.muted}
          style={[
            styles.input,
            {
              fontSize: t.large ? 25 : 20,
              borderColor: t.border,
              backgroundColor: t.input,
              color: t.text,
            },
          ]}
          {...props}
        />
      )}
      {native && show && (
        <>
          <DateTimePicker
            value={isNaN(date) ? new Date() : date}
            mode={mode}
            is24Hour
            onChange={(event, selected) => {
              if (Platform.OS === "android") setShow(false);
              if (selected && event.type !== "dismissed")
                onChangeText(
                  mode === "date"
                    ? `${selected.getFullYear()}-${pad(selected.getMonth() + 1)}-${pad(selected.getDate())}`
                    : `${pad(selected.getHours())}:${pad(selected.getMinutes())}`,
                );
            }}
          />
          {Platform.OS === "ios" && (
            <Button
              secondary
              onPress={() => {
                if (!value)
                  onChangeText(
                    mode === "date"
                      ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
                      : `${pad(date.getHours())}:${pad(date.getMinutes())}`,
                  );
                setShow(false);
              }}
            >
              Concluir escolha
            </Button>
          )}
        </>
      )}
      {native && label.includes("opcional") && !!value && (
        <Button secondary onPress={() => onChangeText("")}>
          Limpar data
        </Button>
      )}
    </View>
  );
}
export function Card({ children }) {
  const t = useContext(ThemeContext);
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: t.border },
      ]}
    >
      {children}
    </View>
  );
}
export function Page({ title, children, ...props }) {
  const t = useContext(ThemeContext);
  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={{ flex: 1, backgroundColor: t.background }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
        {...props}
      >
        {title && (
          <Txt title accessibilityRole="header">
            {title}
          </Txt>
        )}
        {children}
        {!!title && title !== "Recordar" && (
          <Button
            secondary
            onPress={() => {
              Speech.stop();
              Speech.speak(
                `${title}. Use os botões com seus nomes para escolher uma ação. Preencha os campos identificados para cadastrar ou editar. Para retornar, use o botão Voltar.`,
                { language: "pt-BR", rate: 0.85 },
              );
            }}
          >
            Ouvir instruções
          </Button>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const lock = useRef(false);
  async function run(action) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      return await action();
    } catch (e) {
      setError(e.message || "Não foi possível concluir.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return {
    busy,
    run,
    setNotice,
    feedback: (
      <>
        {busy && <ActivityIndicator accessibilityLabel="Aguarde" />}
        {!!error && (
          <Txt
            accessibilityRole="alert"
            style={{
              color: "#a02132",
              backgroundColor: "#ffecef",
              padding: 12,
              borderRadius: 10,
            }}
          >
            {error}
          </Txt>
        )}
        {!!notice && (
          <Txt
            accessibilityLiveRegion="polite"
            style={{
              color: "#215d3b",
              backgroundColor: "#e4f3e9",
              padding: 12,
              borderRadius: 10,
            }}
          >
            {notice}
          </Txt>
        )}
      </>
    ),
  };
}
export function Confirm({ pending, close, busy, onConfirm }) {
  const t = useContext(ThemeContext);
  return (
    <Modal
      visible={!!pending}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.overlay}>
        <View
          accessibilityViewIsModal
          style={[
            styles.card,
            { backgroundColor: t.surface, borderColor: t.border },
          ]}
        >
          <Txt title>{pending?.title || "Confirmar exclusão?"}</Txt>
          <Txt>{pending?.message}</Txt>
          <Button secondary disabled={busy} onPress={close}>
            Voltar
          </Button>
          <Button danger disabled={busy} onPress={onConfirm}>
            Confirmar
          </Button>
        </View>
      </View>
    </Modal>
  );
}
export function Choice({ label, options, value, onChange, multiple }) {
  return (
    <Card>
      <Txt>{label}</Txt>
      {options.length === 0 && <Txt>Nenhuma opção cadastrada.</Txt>}
      {options.map((o) => (
        <Button
          secondary
          key={o.id}
          selected={multiple ? value?.includes(o.id) : value === o.id}
          onPress={() =>
            onChange(
              multiple
                ? value?.includes(o.id)
                  ? value.filter((id) => id !== o.id)
                  : [...(value || []), o.id]
                : o.id,
            )
          }
        >
          {o.label}
        </Button>
      ))}
    </Card>
  );
}
export function Form({
  fields,
  initial = {},
  onSave,
  saveLabel = "Salvar",
  busy,
}) {
  const [values, setValues] = useState(initial);
  return (
    <Card>
      {fields.map((f) =>
        f.options ? (
          <Choice
            key={f.name}
            label={f.label}
            options={f.options}
            multiple={f.multiple}
            value={values[f.name]}
            onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
          />
        ) : (
          <Field
            key={f.name}
            label={f.label}
            value={String(values[f.name] ?? "")}
            onChangeText={(v) => setValues((s) => ({ ...s, [f.name]: v }))}
            secureTextEntry={f.secret}
            multiline={f.multiline}
            autoCapitalize={f.name === "email" ? "none" : "sentences"}
            keyboardType={f.name === "email" ? "email-address" : "default"}
            placeholder={f.placeholder}
          />
        ),
      )}
      <Button disabled={busy} onPress={() => onSave(values)}>
        {saveLabel}
      </Button>
    </Card>
  );
}
export const dateBR = (d) => d?.split("-").reverse().join("/") || "—";
export const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(
    new Date(),
  );
export const nameOf = (u) =>
  u?.nome_paciente || u?.nome_medico || u?.nome_administrador || "Recordar";
const styles = StyleSheet.create({
  page: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d9cce9",
    padding: 20,
    gap: 12,
  },
  button: {
    minHeight: 56,
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
  },
  input: {
    minHeight: 56,
    fontSize: 20,
    color: "#30223f",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#796886",
    padding: 14,
    borderRadius: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: "#0009",
    justifyContent: "center",
    padding: 24,
  },
});

export function useOnFocus(navigation, refresh) {
  useEffect(
    () => navigation?.addListener?.("focus", refresh),
    [navigation, refresh],
  );
}
