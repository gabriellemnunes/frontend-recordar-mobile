import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import { storage } from "../storage";
import { clearReminders, reminderVersion, syncReminders } from "../reminders";

// A sincronização não depende de abrir a aba Agendamento. Assim, consultas
// realizadas ou alteradas pelo médico saem dos lembretes ao retornar ao app.
export default function SessionReminders({ session, api }) {
  useEffect(() => {
    if (session?.user.tipo !== "paciente" || Platform.OS === "web") return;
    let active = true;
    let loading = false;
    let repeat = false;
    async function refresh() {
      if (loading) {
        repeat = true;
        return;
      }
      loading = true;
      try {
        do {
          repeat = false;
          const preference = await storage.get(
            `recordar_reminders_${session.user.id}`,
          );
          if (!active) return;
          if (preference !== "sim") {
            await clearReminders();
            continue;
          }
          const revision = reminderVersion();
          const appointments = await api("/consultas");
          const enabled =
            (await storage.get(`recordar_reminders_${session.user.id}`)) ===
            "sim";
          if (active && enabled) {
            await syncReminders(appointments, revision);
          }
        } while (active && repeat);
      } catch {
        // Mantém os lembretes existentes sem conexão; tenta novamente no retorno.
      } finally {
        loading = false;
      }
    }
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      active = false;
      subscription.remove();
      clearReminders().catch(() => {});
    };
  }, [session?.user.id, session?.user.tipo, api]);
  return null;
}
