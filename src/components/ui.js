import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useId,
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
import Svg, { Defs, LinearGradient, Stop, Rect } from "react-native-svg";
import Icon from "./Icon";
import { textOf, speechChunks } from "../speechText";

const ReadingContext = createContext(null);
const readingSessions = new Set();
export async function stopReading() {
  for (const cancel of readingSessions) cancel();
  await Speech.stop();
}
function useReadableText(text) {
  const register = useContext(ReadingContext);
  const key = useRef({});
  useEffect(() => {
    register?.(key.current, text);
  }, [register, text]);
  useEffect(() => () => register?.(key.current, null), [register]);
}

export function ReadAloud({ getText, readingKey }) {
  const [reading, setReading] = useState(false),
    [error, setError] = useState("");
  const generation = useRef(0);
  useEffect(() => {
    const cancel = () => {
      ++generation.current;
      setReading(false);
    };
    readingSessions.add(cancel);
    return () => readingSessions.delete(cancel);
  }, []);
  useEffect(
    () => () => {
      ++generation.current;
      Speech.stop().catch(() => {});
    },
    [],
  );
  useEffect(() => {
    ++generation.current;
    setReading(false);
    stopReading().catch(() => {});
  }, [readingKey]);
  async function stop() {
    ++generation.current;
    setReading(false);
    try {
      await stopReading();
    } catch {
      setError("Não foi possível parar a voz neste aparelho.");
    }
  }
  async function read() {
    const stopping = stopReading();
    const current = ++generation.current;
    setError("");
    setReading(true);
    const fail = () => {
      if (current === generation.current) {
        setReading(false);
        setError(
          "A leitura de voz não está disponível. Confira o volume e a voz em português nos ajustes do aparelho.",
        );
      }
    };
    try {
      await stopping;
      if (current !== generation.current) return;
      const chunks = speechChunks(getText());
      const next = (index) => {
        if (current !== generation.current) return;
        if (index >= chunks.length) {
          setReading(false);
          return;
        }
        try {
          Speech.speak(chunks[index], {
            language: "pt-BR",
            rate: 0.85,
            onDone: () => next(index + 1),
            onError: fail,
            onStopped: () => {
              if (current === generation.current) setReading(false);
            },
          });
        } catch {
          fail();
        }
      };
      next(0);
    } catch {
      fail();
    }
  }
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <View style={{ flexGrow: 1, flexBasis: 170 }}>
          <Button icon="speaker" contrast onPress={read}>
            Ler em voz alta
          </Button>
        </View>
        <View style={{ flexGrow: 1, flexBasis: 130 }}>
          <Button icon="stop" contrast onPress={stop}>
            Parar leitura
          </Button>
        </View>
      </View>
      {!!reading && (
        <Txt accessibilityLiveRegion="polite" style={{ fontSize: 16 }}>
          Leitura em andamento.
        </Txt>
      )}
      {!!error && <Txt accessibilityRole="alert">{error}</Txt>}
    </View>
  );
}

export function palette(role = "paciente", light = false) {
  if (role === "administrador")
    return light
      ? {
          background: "#efefef",
          surface: "#ffffff",
          text: "#2b3153",
          muted: "#505870",
          border: "#86939b",
          primary: "#2b3153",
          onPrimary: "#ffffff",
          soft: "#d3d8de",
          input: "#ffffff",
        }
      : {
          background: "#101722",
          surface: "#1b2435",
          text: "#f4f6fc",
          muted: "#e3ebf7",
          border: "#a4b5cd",
          primary: "#f4f0ff",
          onPrimary: "#101722",
          soft: "#2a3850",
          input: "#243149",
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
          background: "#f4f8f7",
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
        surface: "#1b2632",
        text: "#ffffff",
        muted: "#e4eef6",
        border: "#a0b4c5",
        primary: "#f4f0ff",
        onPrimary: "#090909",
        soft: "#1d3442",
        input: "#273645",
      }
    : {
        background: "#09070f",
        surface: "#211c2b",
        text: "#ffffff",
        muted: "#e8e3f0",
        border: "#b0a4bf",
        primary: "#faf7ff",
        onPrimary: "#17121f",
        soft: "#3a2f4a",
        input: "#30293d",
      };
}
export const ThemeContext = createContext({
  large: false,
  light: false,
  ...palette(),
});
export function Txt({ children, title, style, ...props }) {
  useReadableText(textOf(children));
  const t = useContext(ThemeContext);
  const custom = { ...(StyleSheet.flatten(style) || {}) },
    scale = t.large ? 1.25 : 1;
  const size = Math.max(18, custom.fontSize || (title ? 26 : 20));
  if (
    ["#30223f", "#3d3447", "#544a60", "#5c348d", "#452069"].includes(
      custom.color,
    )
  )
    custom.color = t.text;
  return (
    <Text
      accessibilityRole={title ? "header" : undefined}
      allowFontScaling
      {...props}
      style={[
        { color: t.text, fontWeight: title ? "700" : "400" },
        custom,
        {
          fontSize: size * scale,
          lineHeight: Math.max(custom.lineHeight || 0, size * 1.5) * scale,
          flexShrink: 1,
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
  icon,
  contrast,
  accessibilityLabel,
}) {
  const t = useContext(ThemeContext);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      disabled={disabled}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: contrast
            ? t.text
            : danger
              ? "#a02132"
              : secondary
                ? selected
                  ? t.soft
                  : t.surface
                : t.primary,
          borderColor: focused
            ? secondary
              ? t.primary
              : contrast
                ? t.background
                : t.onPrimary
            : selected
              ? t.primary
              : contrast
                ? t.text
                : secondary
                  ? t.muted
                  : t.primary,
          opacity: disabled ? 0.5 : pressed ? 0.75 : 1,
          borderWidth: focused || selected ? 3 : 1,
        },
      ]}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        {!!icon && (
          <Icon
            name={icon}
            color={
              contrast
                ? t.background
                : secondary && !danger
                  ? t.primary
                  : danger
                    ? "#fff"
                    : t.onPrimary
            }
            size={t.large ? 28 : 24}
          />
        )}
        <Txt
          style={{
            color: contrast
              ? t.background
              : secondary && !danger
                ? t.text
                : danger
                  ? "#fff"
                  : t.onPrimary,
            fontWeight: "700",
            textAlign: "center",
          }}
        >
          {children}
        </Txt>
        {!!selected && (
          <View
            accessible={false}
            aria-hidden={true}
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: t.light ? "#dcfce7" : "#163b28",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              name="check"
              size={20}
              color={t.light ? "#166534" : "#86efac"}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChangeText,
  onFocus,
  onBlur,
  ...props
}) {
  useReadableText(!props.secureTextEntry && value ? `${label}: ${value}` : "");
  const t = useContext(ThemeContext),
    [show, setShow] = useState(false),
    [focused, setFocused] = useState(false);
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
          allowFontScaling
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          placeholderTextColor={t.muted}
          style={[
            styles.input,
            {
              fontSize: t.large ? 25 : 20,
              borderColor: focused ? t.primary : t.muted,
              borderWidth: 2,
              lineHeight: t.large ? 38 : 30,
              backgroundColor: t.input,
              color: t.text,
            },
          ]}
          {...props}
        />
      )}
      {mode && !native && (
        <Txt style={{ color: t.muted, fontSize: 16 }}>
          {mode === "date"
            ? "Digite ano, mês e dia. Exemplo: 2026-12-09."
            : "Use horas e minutos. Exemplo: 09:30."}
        </Txt>
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
export function Card({ children, style, ...props }) {
  const t = useContext(ThemeContext);
  return (
    <View
      {...props}
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: t.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Page({ title, children, readingKey = title, ...props }) {
  const t = useContext(ThemeContext);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const gradientId = `background-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const readable = useRef(new Map());
  const register = useCallback((key, text) => {
    if (text === null) readable.current.delete(key);
    else readable.current.set(key, text);
  }, []);
  return (
    <SafeAreaView
      edges={["left", "right"]}
      style={{ flex: 1, backgroundColor: t.background }}
    >
      <View
        pointerEvents="none"
        accessible={false}
        aria-hidden={true}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          accessible={false}
        >
          <Defs>
            <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={t.background} />
              <Stop
                offset="65%"
                stopColor={t.light ? t.soft : "#39264e"}
                stopOpacity={t.light ? 0.12 : 0}
              />
              <Stop offset="100%" stopColor={t.background} />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" fill={`url(#${gradientId})`} />
        </Svg>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.page}
        {...props}
      >
        <ReadAloud
          readingKey={readingKey}
          getText={() =>
            [
              preferencesOpen
                ? `Acessibilidade. Ler em voz alta lê o conteúdo desta tela. Parar leitura interrompe a voz. Texto maior: ${t.large ? "ativado" : "desativado"}. Tema atual: ${t.light ? "claro" : "escuro"}. Você pode escolher Modo claro ou Modo escuro. As preferências ficam salvas neste aparelho.`
                : "Use Acessibilidade para aumentar o texto ou mudar o tema.",
              ...readable.current.values(),
            ]
              .filter(Boolean)
              .join(". ")
          }
        />
        <Button
          icon="accessibility"
          secondary
          selected={preferencesOpen}
          onPress={() => setPreferencesOpen(!preferencesOpen)}
        >
          {preferencesOpen ? "Fechar acessibilidade" : "Acessibilidade"}
        </Button>
        {preferencesOpen && <PageAccessibility />}
        <ReadingContext.Provider value={register}>
          {title && (
            <Txt title accessibilityRole="header">
              {title}
            </Txt>
          )}
          {children}
        </ReadingContext.Provider>
      </ScrollView>
    </SafeAreaView>
  );
}
function PageAccessibility() {
  const theme = useContext(ThemeContext);
  const action = useAction();
  return (
    <Card>
      <Txt title>Ajustes de acessibilidade</Txt>
      <Txt>
        Estas opções valem para todo o aplicativo e ficam salvas neste aparelho.
      </Txt>
      <Button
        icon="text"
        secondary
        selected={theme.large}
        disabled={action.busy}
        onPress={() => action.run(() => theme.setTextSize?.(!theme.large))}
      >
        Texto maior
      </Button>
      <Button
        icon="sun"
        secondary
        selected={theme.light}
        disabled={action.busy}
        onPress={() => action.run(() => theme.setAppearance?.(true))}
      >
        Modo claro
      </Button>
      <Button
        icon="moon"
        secondary
        selected={!theme.light}
        disabled={action.busy}
        onPress={() => action.run(() => theme.setAppearance?.(false))}
      >
        Modo escuro
      </Button>
      {action.feedback}
    </Card>
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
          {!!pending && (
            <ReadAloud
              readingKey={pending}
              getText={() =>
                `${pending.title || "Confirmar exclusão?"}. ${pending.message || ""}. Escolha Voltar ou Confirmar.`
              }
            />
          )}
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
  style,
}) {
  const [values, setValues] = useState(initial);
  return (
    <Card style={style}>
      {fields.map((f) => (
        <React.Fragment key={f.name}>
          {!!f.section && (
            <Txt title style={{ fontSize: 22, marginTop: 8 }}>
              {f.section}
            </Txt>
          )}
          {f.options ? (
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
          )}
        </React.Fragment>
      ))}
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
    gap: 24,
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d9cce9",
    padding: 20,
    gap: 12,
  },
  button: {
    minHeight: 56,
    minWidth: 56,
    padding: 14,
    borderRadius: 28,
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
