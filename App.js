import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ActivityIndicator, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createApi } from "./src/api";
import { storage } from "./src/storage";
import { clearReminders } from "./src/reminders";
import {
  ThemeContext,
  palette,
  Button,
  Card,
  Page,
  Txt,
} from "./src/components/ui";
import Accessibility from "./src/components/Accessibility";
import SessionReminders from "./src/components/SessionReminders";
import Auth from "./src/screens/Auth";
import Booking from "./src/screens/Booking";
import Chat from "./src/screens/Chat";
import { Home, AdminResource, Consultations } from "./src/screens/Areas";
import {
  Profile,
  Medications,
  CreateConsultation,
  Patients,
  Attendance,
} from "./src/screens/Care";
const Stack = createNativeStackNavigator(),
  Tabs = createBottomTabNavigator(),
  Services = createContext(null);
function Screen({ kind, ...props }) {
  const x = useContext(Services);
  const shared = { ...x, ...props, user: x.session.user };
  if (kind === "home") return <Home {...shared} />;
  if (kind === "booking") return <Booking {...shared} />;
  if (kind === "profile") return <Profile {...shared} />;
  if (kind === "meds")
    return <Medications {...shared} {...props.route.params} />;
  if (kind === "day") return <Medications {...shared} daily />;
  if (kind === "patients") return <Patients {...shared} />;
  if (kind === "create") return <CreateConsultation {...shared} />;
  if (kind === "attendance") return <Attendance {...shared} />;
  if (kind === "chat") return <Chat {...shared} />;
  if (kind === "history") return <Consultations {...shared} history />;
  if (kind === "consultations") return <Consultations {...shared} />;
  return <AdminResource {...shared} resource={kind} />;
}
const HomeScreen = (p) => <Screen {...p} kind="home" />;
const ProfileScreen = (p) => <Screen {...p} kind="profile" />;
const BookingScreen = (p) => <Screen {...p} kind="booking" />;
const MedsScreen = (p) => <Screen {...p} kind="meds" />;
const ConsultationsScreen = (p) => <Screen {...p} kind="consultations" />;
const PatientsScreen = (p) => <Screen {...p} kind="patients" />;
const UsersScreen = (p) => <Screen {...p} kind="Usuários" />;
function MainTabs() {
  const { session } = useContext(Services);
  const role = session.user.tipo;
  const theme = useContext(ThemeContext);
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarStyle: {
          minHeight: 72,
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        tabBarLabelStyle: { fontSize: 15 },
        tabBarIcon: () => null,
      }}
    >
      <Tabs.Screen name="Início" component={HomeScreen} />
      {role === "paciente" ? (
        <>
          <Tabs.Screen name="Agendamento" component={BookingScreen} />
          <Tabs.Screen name="Remédios" component={MedsScreen} />
        </>
      ) : role === "medico" ? (
        <>
          <Tabs.Screen name="Consultas" component={ConsultationsScreen} />
          <Tabs.Screen name="Pacientes" component={PatientsScreen} />
        </>
      ) : (
        <>
          <Tabs.Screen name="Consultas" component={ConsultationsScreen} />
          <Tabs.Screen name="Usuários" component={UsersScreen} />
        </>
      )}
      <Tabs.Screen name="Perfil" component={ProfileScreen} />
    </Tabs.Navigator>
  );
}
export default function App() {
  const [session, setSession] = useState(null),
    [ready, setReady] = useState(false),
    [prefs, setPrefs] = useState({ large: false, light: false }),
    [accessRole, setAccessRole] = useState("paciente"),
    [startupError, setStartupError] = useState("");
  const logout = useCallback(async () => {
    await clearReminders().catch(() => {});
    await storage.remove("recordar_session");
    setSession(null);
  }, []);
  const api = useMemo(
    () => createApi(process.env.EXPO_PUBLIC_API_URL, session?.token, logout),
    [session?.token, logout],
  );
  useEffect(() => {
    (async () => {
      try {
        const [raw, preferences] = await Promise.all([
          storage.get("recordar_session"),
          storage.get("recordar_accessibility"),
        ]);
        if (preferences) setPrefs(JSON.parse(preferences));
        if (raw) {
          const previous = JSON.parse(raw);
          const user = await createApi(
            process.env.EXPO_PUBLIC_API_URL,
            previous.token,
          )("/users/me");
          setSession({ ...previous, user });
        }
      } catch {
        setStartupError(
          "Não foi possível restaurar a sessão. Entre novamente.",
        );
        await storage.remove("recordar_session").catch(() => {});
      } finally {
        setReady(true);
      }
    })();
  }, []);
  const login = async (result) => {
    const next = { token: result.token, user: result.user };
    await storage.set(
      "recordar_session",
      JSON.stringify({
        token: next.token,
        user: { id: next.user.id, tipo: next.user.tipo },
      }),
    );
    setSession(next);
    setStartupError("");
  };
  const updateUser = async (user) => {
    const next = { ...session, user };
    await storage.set(
      "recordar_session",
      JSON.stringify({
        token: next.token,
        user: { id: next.user.id, tipo: next.user.tipo },
      }),
    );
    setSession(next);
  };
  const theme = {
    ...prefs,
    ...palette(session?.user.tipo || accessRole, prefs.light),
  };
  return (
    <SafeAreaProvider>
      <ThemeContext.Provider value={theme}>
        <StatusBar
          barStyle={
            prefs.light ||
            session?.user.tipo === "administrador" ||
            accessRole === "administrador"
              ? "dark-content"
              : "light-content"
          }
          backgroundColor={theme.background}
        />
        {!ready ? (
          <Page>
            <ActivityIndicator accessibilityLabel="Carregando sessão" />
          </Page>
        ) : !session ? (
          <>
            <Auth
              api={api}
              onLogin={login}
              onRoleChange={setAccessRole}
              accessibility={
                <Accessibility
                  prefs={prefs}
                  onChange={async (next) => {
                    await storage.set(
                      "recordar_accessibility",
                      JSON.stringify(next),
                    );
                    setPrefs(next);
                  }}
                />
              }
            />
            {!!startupError && (
              <Txt accessibilityRole="alert">{startupError}</Txt>
            )}
          </>
        ) : (
          <Services.Provider value={{ session, api, logout, updateUser }}>
            <SessionReminders session={session} api={api} />
            <NavigationContainer
              theme={{
                ...DefaultTheme,
                colors: {
                  ...DefaultTheme.colors,
                  primary: theme.primary,
                  background: theme.background,
                  card: theme.surface,
                  text: theme.text,
                  border: theme.border,
                },
              }}
            >
              <Stack.Navigator
                screenOptions={{
                  headerTintColor: theme.primary,
                  headerBackTitle: "Voltar",
                }}
              >
                <Stack.Screen name="Recordar" component={MainTabs} />
                {[
                  ["Dia", "day"],
                  ["Criar consulta", "create"],
                  ["Atendimento", "attendance"],
                  ["Prescrições", "meds"],
                  ["Histórico", "history"],
                  ["Chatbot", "chat"],
                  ["Clínicas", "Clínicas"],
                  ["Especialidades", "Especialidades"],
                ]
                  .filter(([n]) =>
                    session.user.tipo === "administrador"
                      ? ["Histórico", "Clínicas", "Especialidades"].includes(n)
                      : session.user.tipo === "paciente"
                        ? ["Dia", "Histórico", "Chatbot"].includes(n)
                        : [
                            "Criar consulta",
                            "Atendimento",
                            "Prescrições",
                            "Histórico",
                          ].includes(n),
                  )
                  .map(([name, kind]) => (
                    <Stack.Screen key={name} name={name}>
                      {(p) => <Screen {...p} kind={kind} />}
                    </Stack.Screen>
                  ))}
              </Stack.Navigator>
            </NavigationContainer>
          </Services.Provider>
        )}
      </ThemeContext.Provider>
    </SafeAreaProvider>
  );
}
