import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, AppState, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { createApi, availablePath } from './src/api';
import { clearReminders, requestReminders, syncReminders } from './src/reminders';

const URL = process.env.EXPO_PUBLIC_API_URL;
const dateBR = date => date?.split('-').reverse().join('/');
function Button({ children, onPress, disabled, secondary }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
    style={[s.button, secondary && s.secondary, disabled && { opacity: .5 }]}><Text style={[s.buttonText, secondary && s.secondaryText]}>{children}</Text></Pressable>;
}
function Field({ label, ...props }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} placeholderTextColor="#68616f" style={s.input} {...props} /></View>;
}
function Card({ c, children }) {
  return <View style={s.card}><Text style={s.subtitle}>{c.nome_medico}</Text><Text style={s.text}>{c.nome_especialidade}</Text>
    <Text style={s.text}>{c.nome_clinica}</Text><Text style={s.text}>{c.endereco_clinica}</Text>
    <Text style={s.slot}>{dateBR(c.data_consulta)} às {c.horario_consulta}</Text>{children}</View>;
}
export default function App() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState(''); const [senha, setSenha] = useState('');
  const [page, setPage] = useState('agenda'); const [busy, setBusy] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const [appointments, setAppointments] = useState([]); const [slots, setSlots] = useState([]);
  const [triages, setTriages] = useState([]); const [triage, setTriage] = useState(null);
  const [selected, setSelected] = useState(null); const [changing, setChanging] = useState(null);
  const [reason, setReason] = useState(''); const [date, setDate] = useState('');
  const [clinic, setClinic] = useState(''); const [doctor, setDoctor] = useState('');
  const [enabled, setEnabled] = useState(false); const lock = useRef(false); const searchRevision = useRef(0);
  const logout = useCallback(async () => {
    await clearReminders().catch(() => {});
    await SecureStore.deleteItemAsync('recordar_session');
    setSession(null); setAppointments([]); setSlots([]); setTriages([]); setTriage(null); setSelected(null); setChanging(null); setSenha(''); setEnabled(false); setPage('agenda');
  }, []);
  const api = useCallback((path, options) => createApi(URL, session?.token, logout)(path, options), [session?.token, logout]);
  async function run(action) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(e.message); } finally { lock.current = false; setBusy(false); }
  }
  useEffect(() => { (async () => {
    try {
      const raw = await SecureStore.getItemAsync('recordar_session');
      if (raw) setSession(JSON.parse(raw));
    } catch { setError('Não foi possível restaurar a sessão. Entre novamente.'); }
    setReady(true);
  })(); }, []);
  async function refresh(remindersEnabled = enabled) {
    const list = await api('/consultas'); setAppointments(list);
    if (remindersEnabled) await syncReminders(list).catch(() => setNotice('Consultas atualizadas. Não foi possível atualizar os lembretes neste aparelho.'));
    return list;
  }
  useEffect(() => {
    if (!session) return;
    run(async () => {
      const pref = await SecureStore.getItemAsync(`recordar_reminders_${session.user.id}`);
      setEnabled(pref === 'sim'); await refresh(pref === 'sim');
    });
    const listener = AppState.addEventListener('change', state => { if (state === 'active') run(() => refresh()); });
    return () => listener.remove();
  }, [session, enabled]);
  async function search(t = triage, current = changing, searchDate = date) {
    const revision = ++searchRevision.current;
    const list = await api(availablePath({ triageId: t?._id, doctorId: current?.id_medico, date: searchDate }));
    if (revision === searchRevision.current) { setSlots(list); setClinic(''); setDoctor(''); }
  }
  async function openBooking() {
    setChanging(null); setTriage(null); setSelected(null); setDate(''); setSlots([]); setClinic(''); setDoctor('');
    const list = await api('/pre-triagens'); setTriages(list); setPage('triagem');
  }
  async function confirmBooking() {
    const c = selected;
    let saved;
    try {
      saved = changing ? await api(`/consultas/${changing.id}/trocar`, { method: 'PUT', body: { id_nova: c.id } })
        : await api(`/consultas/${c.id}/agendar`, { method: 'PUT', body: { id_pre_triagem: triage?._id, queixa_principal: reason } });
    } catch (e) {
      if (e.status === 409) { setSelected(null); setPage('horarios'); await search(); }
      throw e;
    }
    setPage('agenda'); setSelected(null); setChanging(null);
    setNotice(`Consulta confirmada para ${dateBR(saved.data_consulta)} às ${saved.horario_consulta}.`);
    const updated = [...appointments.filter(item => item.id !== changing?.id && item.id !== saved.id), saved];
    setAppointments(updated);
    if (enabled) await syncReminders(updated).catch(() => setNotice('Consulta confirmada. Não foi possível atualizar os lembretes neste aparelho.'));
    try { await refresh(); } catch { setNotice('Consulta confirmada. Atualize a agenda quando a conexão voltar.'); }
  }
  const visible = slots.filter(c => (!clinic || c.id_clinica === clinic) && (!doctor || c.id_medico === doctor) && c.id !== changing?.id);
  const clinics = [...new Map(slots.map(c => [c.id_clinica, c.nome_clinica])).entries()];
  const doctors = [...new Map(slots.filter(c => !clinic || c.id_clinica === clinic).map(c => [c.id_medico, c.nome_medico])).entries()];
  return <SafeAreaProvider><SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
    <Text style={s.brand}>recordar</Text><Text style={s.tagline}>Saúde na palma da mão</Text>
    {!ready ? <ActivityIndicator accessibilityLabel="Carregando sessão" /> : !session ? <>
      <Text style={s.title}>Entre para cuidar da sua agenda</Text>
      <Field label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label="Senha" value={senha} onChangeText={setSenha} secureTextEntry autoComplete="current-password" />
      <Button disabled={busy} onPress={() => run(async () => {
        const result = await api('/auth/login', { method: 'POST', body: { email, senha, tipo: 'paciente' } });
        const current = { token: result.token, user: { id: result.user.id, tipo: result.user.tipo } };
        await SecureStore.setItemAsync('recordar_session', JSON.stringify(current)); setSenha(''); setSession(current);
      })}>Entrar</Button><Text style={s.text}>Use sua conta de paciente do Recordar na API configurada.</Text>
    </> : <>
      <View style={s.nav}><Button secondary disabled={busy} onPress={() => { setPage('agenda'); setSelected(null); setChanging(null); }}>Minha agenda</Button>
        <Button secondary disabled={busy} onPress={() => run(logout)}>Sair</Button></View>
      {page === 'agenda' && <>
        <Text style={s.title}>Suas consultas</Text><Button disabled={busy} onPress={() => run(openBooking)}>Agendar consulta</Button>
        <Button secondary disabled={busy} onPress={() => run(() => refresh())}>Atualizar agenda</Button>
        <Button secondary disabled={busy} onPress={() => run(async () => {
          if (enabled) { await clearReminders(); await SecureStore.setItemAsync(`recordar_reminders_${session.user.id}`, 'nao'); setEnabled(false); }
          else {
            if (!await requestReminders()) throw new Error('Permita notificações nos ajustes do aparelho para receber lembretes.');
            await SecureStore.setItemAsync(`recordar_reminders_${session.user.id}`, 'sim'); setEnabled(true); await refresh(true);
          }
        })}>{enabled ? 'Desativar lembretes' : 'Ativar lembretes'}</Button>
        <Text style={s.small}>Lembretes neste aparelho: 24 horas e 1 hora antes, quando houver tempo. Horários de Brasília.</Text>
        {!appointments.length && <Text style={s.text}>Você ainda não tem consultas agendadas.</Text>}
        {appointments.map(c => <Card key={c.id} c={c}>
          {c.id_pre_triagem && <Text style={s.small}>Pré-triagem vinculada à consulta</Text>}
          <Button secondary disabled={busy} onPress={() => run(async () => { setChanging(c); setTriage(null); setDate(''); await search(null, c, ''); setPage('horarios'); })}>Trocar horário</Button>
          <Button secondary disabled={busy} onPress={() => Alert.alert('Cancelar consulta?', 'O horário será liberado. As prescrições existentes serão preservadas.', [
            { text: 'Manter consulta', style: 'cancel' }, { text: 'Cancelar consulta', style: 'destructive', onPress: () => run(async () => {
              await api(`/consultas/${c.id}/cancelar`, { method: 'PUT' });
              const updated = appointments.filter(item => item.id !== c.id);
              setAppointments(updated);
              if (enabled) await syncReminders(updated).catch(() => setNotice('Consulta cancelada. Verifique os lembretes nas configurações do aparelho.'));
              try { await refresh(); setNotice('Consulta cancelada.'); } catch { setNotice('Consulta cancelada. Atualize a agenda para sincronizar os lembretes.'); }
            }) }
          ])}>Cancelar consulta</Button>
        </Card>)}
      </>}
      {page === 'triagem' && <><Text style={s.title}>Como deseja agendar?</Text><Text style={s.text}>Escolha uma pré-triagem concluída para encontrar as especialidades recomendadas.</Text>
        <Text style={s.small}>A IA não substitui a avaliação médica.</Text>
        {!triages.length && <Text style={s.text}>Nenhuma pré-triagem concluída. Você pode agendar diretamente.</Text>}
        {triages.map(t => <View key={t._id} style={s.card}><Text style={s.subtitle}>Pré-triagem de {dateBR(t.createdAt.slice(0, 10))}</Text>
          <Text style={s.text}>{t.resumo}</Text><Text style={s.text}>{t.especialidades.map(e => e.nome_especialidade).join(', ')}</Text>
          {t.urgencia ? <Text accessibilityRole="alert" style={s.error}>Siga as orientações de urgência apresentadas pela pré-triagem. O agendamento comum não está disponível para este resultado.</Text>
            : <Button disabled={busy} onPress={() => run(async () => { setTriage(t); setReason(t.resumo); await search(t, null); setPage('horarios'); })}>Usar recomendação</Button>}
        </View>)}
        <Button secondary disabled={busy} onPress={() => run(async () => { setTriage(null); setReason(''); await search(null, null); setPage('horarios'); })}>Agendar diretamente</Button>
      </>}
      {page === 'horarios' && <><Text style={s.title}>{changing ? 'Escolha o novo horário' : 'Encontre sua consulta'}</Text>
        <Text style={s.text}>{changing ? `Horários do mesmo profissional: ${changing.nome_medico}` : triage ? 'Profissionais das especialidades recomendadas pela pré-triagem.' : 'Todos os horários disponíveis.'}</Text>
        <Field label="Data (AAAA-MM-DD, opcional)" value={date} onChangeText={setDate} placeholder="2026-12-09" />
        <Button secondary disabled={busy} onPress={() => run(() => search())}>Buscar horários</Button>
        <Text style={s.label}>Clínica</Text><Button secondary disabled={busy} onPress={() => { setClinic(''); setDoctor(''); }}>Todas as clínicas {clinic === '' ? '✓' : ''}</Button>
        {clinics.map(([id, name]) => <Button secondary key={id} disabled={busy} onPress={() => { setClinic(id); setDoctor(''); }}>{name} {clinic === id ? '✓' : ''}</Button>)}
        {!changing && <><Text style={s.label}>Profissional</Text><Button secondary disabled={busy} onPress={() => setDoctor('')}>Todos os profissionais {doctor === '' ? '✓' : ''}</Button>
          {doctors.map(([id, name]) => <Button secondary key={id} disabled={busy} onPress={() => setDoctor(id)}>{name} {doctor === id ? '✓' : ''}</Button>)}</>}
        {!visible.length && <Text style={s.text}>Nenhum horário disponível para estes filtros. Tente outra data ou clínica.</Text>}
        {visible.map(c => <Card key={c.id} c={c}><Button disabled={busy} onPress={() => { setSelected(c); setPage('confirmar'); }}>Escolher horário</Button></Card>)}
      </>}
      {page === 'confirmar' && selected && <><Text style={s.title}>Confira sua consulta</Text><Card c={selected} />
        {!changing && <Field label="Motivo da consulta" multiline value={reason} onChangeText={setReason} />}
        {(triage || changing?.id_pre_triagem) && <Text style={s.text}>A pré-triagem será vinculada a esta consulta.</Text>}
        <Button disabled={busy || (!changing && !reason.trim())} onPress={() => run(confirmBooking)}>{changing ? 'Confirmar novo horário' : 'Confirmar agendamento'}</Button>
        <Button secondary disabled={busy} onPress={() => { setSelected(null); setPage('horarios'); }}>Voltar aos horários</Button>
      </>}
    </>}
    {busy && <ActivityIndicator color="#6941a5" accessibilityLabel="Aguarde" />}
    {!!error && <Text accessibilityRole="alert" style={s.error}>{error}</Text>}
    {!!notice && <Text accessibilityLiveRegion="polite" style={s.success}>{notice}</Text>}
  </ScrollView></SafeAreaView></SafeAreaProvider>;
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f6f3fa' }, content: { padding: 22, paddingBottom: 48, gap: 12, width: '100%', maxWidth: 680, alignSelf: 'center' },
  brand: { fontSize: 36, fontWeight: '800', color: '#5c348d' }, tagline: { fontSize: 16, color: '#544a60', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#30223f', marginVertical: 12 }, subtitle: { fontSize: 22, fontWeight: '700', color: '#30223f' },
  text: { fontSize: 18, lineHeight: 27, color: '#3d3447' }, small: { fontSize: 16, lineHeight: 24, color: '#544a60' },
  card: { padding: 20, gap: 10, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: '#d9cce9' },
  slot: { fontSize: 22, fontWeight: '700', color: '#5c348d' }, field: { gap: 8 }, label: { fontSize: 18, fontWeight: '600', color: '#30223f' },
  input: { minHeight: 56, padding: 14, borderWidth: 1, borderColor: '#8e7a9e', borderRadius: 12, backgroundColor: '#fff', fontSize: 18, color: '#30223f' },
  button: { minHeight: 56, justifyContent: 'center', padding: 16, borderRadius: 12, backgroundColor: '#623592' },
  buttonText: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' }, secondary: { backgroundColor: '#eee6f6', borderWidth: 1, borderColor: '#aa8cbe' }, secondaryText: { color: '#452069' },
  nav: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, error: { fontSize: 18, lineHeight: 27, color: '#9e1831', padding: 12, backgroundColor: '#ffecef', borderRadius: 12 },
  success: { fontSize: 18, lineHeight: 27, color: '#215d3b', padding: 12, backgroundColor: '#e4f3e9', borderRadius: 12 }
});
