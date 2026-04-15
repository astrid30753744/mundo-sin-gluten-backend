import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, TextInput, Alert, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C, SHADOW, R } from '../theme';

const fmt = n => '$' + Math.round(n).toLocaleString('es-AR');

export default function ResultsScreen({ navigation, route }) {
  const { productos: init, cantidad, metodo } = route.params;
  const [prods, setProds] = useState(init.map((p, i) => ({ ...p, _id: i, on: true })));

  const toggle = id => setProds(ps => ps.map(p => p._id === id ? { ...p, on: !p.on } : p));
  const remove = id => setProds(ps => ps.filter(p => p._id !== id));
  const updPrice = (id, v) => setProds(ps => ps.map(p => p._id === id ? { ...p, precio_lista: parseFloat(v) || 0 } : p));

  const activos = prods.filter(p => p.on && p.precio_lista > 0);
  const total = activos.reduce((s, p) => s + p.precio_publico, 0);

  function exportWA() {
    let msg = '🌿 *Mundo Sin Gluten - Precios*\n━━━━━━━━━━━━━━━━━━━\n\n';
    activos.forEach((p, i) => { msg += `*${i + 1}. ${p.nombre}*\n   Lista: ${fmt(p.precio_lista)} → *Público: ${fmt(p.precio_publico)}*\n\n`; });
    msg += `━━━━━━━━━━━━━━━━━━━\n💰 *TOTAL: ${fmt(total)}*\n✅ ${activos.length} productos`;
    Linking.openURL('whatsapp://send?text=' + encodeURIComponent(msg));
  }

  function confirm() {
    if (!activos.length) { Alert.alert('', 'No hay productos'); return; }
    Alert.alert('✅ Confirmado', `${activos.length} producto(s) procesado(s).\nTotal: ${fmt(total)}\n\n⚠️ Recordá: precios nunca bajan.`,
      [{ text: 'OK', onPress: () => navigation.navigate('Home') }]);
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={C.green} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Resultado</Text>
          <Text style={s.sub}>{activos.length} de {prods.length} · vía {metodo}</Text>
        </View>
      </View>

      {/* TOTAL CARD */}
      <View style={s.totalCard}>
        <Text style={s.totalLabel}>TOTAL GENERAL</Text>
        <Text style={s.totalValue}>{fmt(total)}</Text>
        <Text style={s.totalCount}>{activos.length} productos</Text>
      </View>

      <FlatList
        data={prods}
        keyExtractor={item => String(item._id)}
        contentContainerStyle={s.list}
        renderItem={({ item }) => (
          <View style={[s.card, !item.on && { opacity: 0.25 }]}>
            <TouchableOpacity style={[s.check, item.on && s.checkOn]} onPress={() => toggle(item._id)}>
              {item.on && <Feather name="check" size={14} color={C.white} />}
            </TouchableOpacity>
            <View style={s.info}>
              <Text style={s.name} numberOfLines={2}>{item.nombre}</Text>
              <View style={s.priceRow}>
                <Text style={s.pLabel}>$</Text>
                <TextInput style={s.pInput} keyboardType="numeric" value={String(item.precio_lista || '')} onChangeText={v => updPrice(item._id, v)} selectTextOnFocus />
                <View style={s.pubWrap}>
                  <Text style={s.pubPrice}>{fmt(item.precio_publico)}</Text>
                  {item.margen > 0 && <Text style={s.margin}>+{item.margen}%</Text>}
                </View>
              </View>
            </View>
            <TouchableOpacity style={s.rmBtn} onPress={() => remove(item._id)}>
              <Feather name="x" size={14} color={C.red} />
            </TouchableOpacity>
          </View>
        )}
      />

      <View style={s.noteBar}>
        <Feather name="alert-triangle" size={14} color={C.orange} />
        <Text style={s.noteText}>Si un producto ya existe y bajó, se mantiene el precio anterior</Text>
      </View>

      <View style={s.bottomBar}>
        <TouchableOpacity style={s.waBtn} onPress={exportWA} activeOpacity={0.8}>
          <Feather name="share" size={18} color={C.green} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.confirmBtn, !activos.length && { opacity: 0.4 }]}
          onPress={confirm} disabled={!activos.length} activeOpacity={0.8}>
          <Feather name="check-circle" size={20} color={C.white} />
          <Text style={s.confirmText}>Confirmar ({activos.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 56, paddingBottom: 14, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.greenGhost, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  sub: { fontSize: 12, color: C.textMuted, marginTop: 1 },

  totalCard: { margin: 18, backgroundColor: C.headerDark, borderRadius: R, padding: 24, alignItems: 'center', ...SHADOW.medium },
  totalLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5 },
  totalValue: { fontSize: 36, fontWeight: '800', color: C.orangeLight, marginTop: 4 },
  totalCount: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  list: { paddingHorizontal: 18, paddingBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 20, padding: 16, marginBottom: 10, ...SHADOW.soft },
  check: { width: 26, height: 26, borderRadius: 8, borderWidth: 2, borderColor: C.textMuted, justifyContent: 'center', alignItems: 'center' },
  checkOn: { backgroundColor: C.green, borderColor: C.green },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pLabel: { fontSize: 13, color: C.textMuted },
  pInput: { width: 80, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.cardWarm, fontSize: 14, fontWeight: '600', color: C.text, textAlign: 'right' },
  pubWrap: { flex: 1, alignItems: 'flex-end' },
  pubPrice: { fontSize: 18, fontWeight: '800', color: C.orange },
  margin: { fontSize: 10, fontWeight: '600', color: C.green },
  rmBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: C.redPale, justifyContent: 'center', alignItems: 'center' },

  noteBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 8 },
  noteText: { fontSize: 11, color: C.orange, flex: 1 },

  bottomBar: { flexDirection: 'row', gap: 12, padding: 18, backgroundColor: C.card, borderTopWidth: 1, borderTopColor: C.border },
  waBtn: { width: 56, height: 56, borderRadius: 18, backgroundColor: C.greenPale, justifyContent: 'center', alignItems: 'center' },
  confirmBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18, backgroundColor: C.green, ...SHADOW.green },
  confirmText: { fontSize: 16, fontWeight: '700', color: C.white },
});
