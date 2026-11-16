import React, { createContext, useContext, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ThemeContext = createContext({ large: false, contrast: false, color: '#623592' });
export function Txt({ children, title, style, ...props }) {
  const t = useContext(ThemeContext);
  return <Text {...props} style={[{ color: t.contrast ? '#000' : '#30223f', fontSize: (title ? 26 : 18) * (t.large ? 1.25 : 1), lineHeight: (title ? 34 : 27) * (t.large ? 1.25 : 1), fontWeight: title ? '700' : '400' }, style]}>{children}</Text>;
}
export function Button({ children, onPress, disabled, secondary, danger, selected }) {
  const t = useContext(ThemeContext);
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: !!disabled, selected: !!selected }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: danger ? '#a02132' : secondary ? (t.contrast ? '#fff' : '#eee6f6') : t.contrast ? '#000' : t.color, borderColor: t.contrast ? '#000' : t.color, opacity: disabled ? .5 : pressed ? .75 : 1, borderWidth: selected ? 3 : 1 }]}><Txt style={{ color: secondary && !danger ? '#30223f' : '#fff', fontWeight: '700', textAlign: 'center' }}>{children}{selected ? ' ✓' : ''}</Txt></Pressable>;
}
export function Field({ label, ...props }) { return <View style={{ gap: 6 }}><Txt style={{ fontWeight: '600' }}>{label}</Txt><TextInput accessibilityLabel={label} placeholderTextColor="#62586b" style={styles.input} {...props}/></View>; }
export function Card({ children }) { return <View style={styles.card}>{children}</View>; }
export function Page({ title, children, ...props }) { return <SafeAreaView edges={['left', 'right']} style={{ flex: 1, backgroundColor: '#f6f3fa' }}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.page} {...props}>{title && <Txt title accessibilityRole="header">{title}</Txt>}{children}</ScrollView></SafeAreaView>; }
export function useAction() {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''); const lock = useRef(false);
  async function run(action) { if (lock.current) return; lock.current = true; setBusy(true); setError(''); setNotice(''); try { return await action(); } catch(e) { setError(e.message || 'Não foi possível concluir.'); } finally { lock.current = false; setBusy(false); } }
  return { busy, run, setNotice, feedback: <>{busy && <ActivityIndicator accessibilityLabel="Aguarde"/>}{!!error && <Txt accessibilityRole="alert" style={{ color:'#a02132' }}>{error}</Txt>}{!!notice && <Txt accessibilityLiveRegion="polite" style={{ color:'#215d3b' }}>{notice}</Txt>}</> };
}
export function Confirm({ pending, close, busy, onConfirm }) {
  return <Modal visible={!!pending} transparent animationType="fade" onRequestClose={close}><View style={styles.overlay}><View accessibilityViewIsModal style={styles.card}><Txt title>{pending?.title || 'Confirmar exclusão?'}</Txt><Txt>{pending?.message}</Txt><Button secondary disabled={busy} onPress={close}>Voltar</Button><Button danger disabled={busy} onPress={onConfirm}>Confirmar</Button></View></View></Modal>;
}
export function Choice({ label, options, value, onChange, multiple }) { return <Card><Txt>{label}</Txt>{options.length === 0 && <Txt>Nenhuma opção cadastrada.</Txt>}{options.map(o => <Button secondary key={o.id} selected={multiple ? value?.includes(o.id) : value === o.id} onPress={() => onChange(multiple ? value?.includes(o.id) ? value.filter(id => id !== o.id) : [...(value || []), o.id] : o.id)}>{o.label}</Button>)}</Card>; }
export function Form({ fields, initial = {}, onSave, saveLabel = 'Salvar', busy }) {
  const [values, setValues] = useState(initial);
  return <Card>{fields.map(f => f.options ? <Choice key={f.name} label={f.label} options={f.options} multiple={f.multiple} value={values[f.name]} onChange={v => setValues(s => ({...s,[f.name]:v}))}/> : <Field key={f.name} label={f.label} value={String(values[f.name] ?? '')} onChangeText={v => setValues(s => ({...s,[f.name]:v}))} secureTextEntry={f.secret} multiline={f.multiline} autoCapitalize={f.name === 'email' ? 'none' : 'sentences'} keyboardType={f.name === 'email' ? 'email-address' : 'default'} placeholder={f.placeholder}/>)}<Button disabled={busy} onPress={() => onSave(values)}>{saveLabel}</Button></Card>;
}
export const dateBR = d => d?.split('-').reverse().join('/') || '—';
export const today = () => new Intl.DateTimeFormat('en-CA',{ timeZone:'America/Sao_Paulo' }).format(new Date());
export const nameOf = u => u?.nome_paciente || u?.nome_medico || u?.nome_administrador || 'Recordar';
const styles = StyleSheet.create({ page:{ padding:20, paddingBottom:40, gap:16, maxWidth:720, width:'100%', alignSelf:'center' }, card:{ backgroundColor:'#fff', borderRadius:18, borderWidth:1, borderColor:'#d9cce9', padding:20, gap:12 }, button:{ minHeight:56, padding:14, borderRadius:12, justifyContent:'center' }, input:{ minHeight:56, fontSize:20, color:'#30223f', backgroundColor:'#fff', borderWidth:1, borderColor:'#796886', padding:14, borderRadius:10 }, overlay:{ flex:1, backgroundColor:'#0009', justifyContent:'center', padding:24 } });
