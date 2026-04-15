import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C, SHADOW, R } from '../theme';
import { procesarManual } from '../services/api';

export default function ManualScreen({ navigation }) {
  const [rows, setRows] = useState([{ n: '', p: '' }, { n: '', p: '' }, { n: '', p: '' }]);

  const upd = (i, f, v) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [f]: v } : r));
  const add = () => setRows(rs => [...rs, { n: '', p: '' }]);

  async function send() {
    const valid = rows.filter(r => r.n && r.p);
    if (!valid.length) { Alert.alert('', 'Completá al menos un producto'); return; }
    try {
      const res = await procesarManual(valid.map(r => ({ nombre: r.n, precio: parseFloat(r.p) })));
      if (!res.ok) { Alert.alert('Error', res.error); return; }
      navigation.navigate('Results', { productos: res.productos, cantidad: res.cantidad, metodo: 'Manual' });
    } catch (e) { Alert.alert('Error', e.message); }
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Feather name="arrow-left" size={20} color={C.green} /></TouchableOpacity>
        <Text style={s.title}>Carga manual</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {rows.map((r, i) => (
          <View key={i} style={s.row}>
            <TextInput style={s.nameIn} placeholder="Nombre del producto" placeholderTextColor={C.textMuted} value={r.n} onChangeText={v => upd(i, 'n', v)} />
            <TextInput style={s.priceIn} placeholder="Precio" placeholderTextColor={C.textMuted} keyboardType="numeric" value={r.p} onChangeText={v => upd(i, 'p', v)} />
          </View>
        ))}
        <TouchableOpacity style={s.addBtn} onPress={add}><Feather name="plus" size={18} color={C.orange} /><Text style={s.addText}>Agregar producto</Text></TouchableOpacity>
        <TouchableOpacity style={s.sendBtn} onPress={send} activeOpacity={0.8}><Feather name="zap" size={20} color={C.white} /><Text style={s.sendText}>Calcular precios</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 56, paddingBottom: 16, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.greenGhost, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  scroll: { padding: 20 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  nameIn: { flex: 2, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: C.text },
  priceIn: { flex: 1, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, paddingHorizontal: 16, paddingVertical: 14, fontSize: 14, color: C.green, fontWeight: '600', textAlign: 'right' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginBottom: 20 },
  addText: { fontSize: 14, fontWeight: '600', color: C.orange },
  sendBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.green, paddingVertical: 18, borderRadius: 18, ...SHADOW.green },
  sendText: { fontSize: 16, fontWeight: '700', color: C.white },
});
