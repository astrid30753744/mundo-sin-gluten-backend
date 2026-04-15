import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C, SHADOW, R } from '../theme';
import { getConfig, saveConfig } from '../services/api';

const FIELDS = [
  { k: 'ganancia', l: 'Ganancia', ico: 'trending-up', d: 'Tu margen de ganancia' },
  { k: 'iva', l: 'IVA', ico: 'briefcase', d: 'Impuesto al Valor Agregado' },
  { k: 'flete', l: 'Flete', ico: 'truck', d: 'Costo de transporte' },
  { k: 'merma', l: 'Merma', ico: 'alert-circle', d: 'Roturas y vencimientos' },
  { k: 'iibb', l: 'IIBB', ico: 'file-text', d: 'Ingresos Brutos' },
  { k: 'otros', l: 'Otros costos', ico: 'box', d: 'Empaque, comisiones' },
];

const fmt = n => '$' + Math.round(n).toLocaleString('es-AR');

export default function ConfigScreen({ navigation }) {
  const [cfg, setCfg] = useState({ ganancia: 30, iva: 21, flete: 0, merma: 0, iibb: 0, otros: 0 });

  useEffect(() => { load(); }, []);
  async function load() { try { const d = await getConfig(); if (d.ok) setCfg(d.config); } catch (e) {} }
  const upd = (k, v) => setCfg(prev => ({ ...prev, [k]: v }));

  async function save() {
    try { const r = await saveConfig(cfg); if (r.ok) Alert.alert('✅', r.mensaje || 'Guardado'); }
    catch (e) { Alert.alert('Error', 'No se pudo guardar'); }
  }

  const mult = FIELDS.reduce((m, f) => m * (1 + (parseFloat(cfg[f.k]) || 0) / 100), 1);

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Feather name="arrow-left" size={20} color={C.green} /></TouchableOpacity>
        <Text style={s.title}>Configuración</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        {FIELDS.map(f => (
          <View key={f.k} style={s.fieldCard}>
            <View style={s.fieldIcon}><Feather name={f.ico} size={20} color={C.green} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.fieldLabel}>{f.l}</Text>
              <Text style={s.fieldDesc}>{f.d}</Text>
            </View>
            <View style={s.inputWrap}>
              <TextInput style={s.input} keyboardType="numeric" value={String(cfg[f.k] || '')} onChangeText={v => upd(f.k, v)} selectTextOnFocus />
              <Text style={s.pct}>%</Text>
            </View>
          </View>
        ))}

        <View style={s.multCard}>
          <Text style={s.multLabel}>MULTIPLICADOR TOTAL</Text>
          <Text style={s.multVal}>x{mult.toFixed(3)}</Text>
          <Text style={s.multEx}>$1.000 de lista → {fmt(1000 * mult)} al público</Text>
          <Text style={s.multNote}>⚠️ Los precios solo suben, nunca bajan</Text>
        </View>

        <TouchableOpacity style={s.saveBtn} onPress={save} activeOpacity={0.8}>
          <Feather name="save" size={20} color={C.white} />
          <Text style={s.saveText}>Guardar configuración</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
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
  fieldCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 20, padding: 18, marginBottom: 10, ...SHADOW.soft },
  fieldIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.greenGhost, justifyContent: 'center', alignItems: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: C.text },
  fieldDesc: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  input: { width: 60, paddingHorizontal: 8, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.cardWarm, fontSize: 18, fontWeight: '700', color: C.green, textAlign: 'right' },
  pct: { fontSize: 15, fontWeight: '700', color: C.textMuted },
  multCard: { backgroundColor: C.headerDark, borderRadius: R, padding: 24, marginVertical: 20, alignItems: 'center', ...SHADOW.medium },
  multLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5 },
  multVal: { fontSize: 36, fontWeight: '800', color: C.orangeLight, marginTop: 4 },
  multEx: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 },
  multNote: { fontSize: 11, color: C.orangeLight, marginTop: 10, fontStyle: 'italic' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: C.green, paddingVertical: 18, borderRadius: 18, ...SHADOW.green },
  saveText: { fontSize: 16, fontWeight: '700', color: C.white },
});
