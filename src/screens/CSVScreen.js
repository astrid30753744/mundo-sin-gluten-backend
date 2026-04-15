import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C, SHADOW, R } from '../theme';
import { procesarCSV } from '../services/api';

export default function CSVScreen({ navigation }) {
  const [txt, setTxt] = useState('');

  async function send() {
    if (!txt.trim()) { Alert.alert('', 'Pegá la lista primero'); return; }
    try {
      const res = await procesarCSV(txt);
      if (!res.ok) { Alert.alert('Error', res.error); return; }
      navigation.navigate('Results', { productos: res.productos, cantidad: res.cantidad, metodo: 'CSV' });
    } catch (e) { Alert.alert('Error', e.message); }
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Feather name="arrow-left" size={20} color={C.green} /></TouchableOpacity>
        <Text style={s.title}>Cargar CSV</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.body}>
        <Text style={s.hint}>Pegá la lista con formato: Nombre;Precio</Text>
        <TextInput style={s.textarea} multiline placeholder={'Harina sin TACC;2500\nFideos de arroz;1800\nGalletitas;950'} placeholderTextColor={C.textMuted} value={txt} onChangeText={setTxt} textAlignVertical="top" />
        <TouchableOpacity style={s.btn} onPress={send} activeOpacity={0.8}><Feather name="zap" size={20} color={C.white} /><Text style={s.btnText}>Procesar lista</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 56, paddingBottom: 16, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.greenGhost, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  body: { flex: 1, padding: 20 },
  hint: { fontSize: 13, color: C.textSec, marginBottom: 12 },
  textarea: { flex: 1, backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 18, fontSize: 14, color: C.text, fontFamily: 'monospace', marginBottom: 16, ...SHADOW.soft },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.orange, paddingVertical: 18, borderRadius: 18, ...SHADOW.orange },
  btnText: { fontSize: 16, fontWeight: '700', color: C.white },
});
