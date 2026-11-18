import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import {
  clearMedicationReminders,
  syncMedicationReminders,
  medicationReminderVersion,
  requestMedicationReminders,
} from "../medicationReminders";
export default function MedicationReminders({ session, api }) {
  useEffect(() => {
    if (session?.user.tipo !== "paciente" || Platform.OS === "web") return;
    let active = true,
      loading = false;
    async function refresh() {
      if (loading) return;
      loading = true;
      try {
        const revision = medicationReminderVersion();
        const meds = await api("/remedios");
        if (active && (await requestMedicationReminders()))
          await syncMedicationReminders(meds, revision);
      } catch {
      } finally {
        loading = false;
      }
    }
    refresh();
    const listener = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    return () => {
      active = false;
      listener.remove();
      clearMedicationReminders().catch(() => {});
    };
  }, [session?.user.id, session?.user.tipo, api]);
  return null;
}
