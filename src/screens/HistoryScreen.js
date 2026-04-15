import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C, R } from '../theme';

export default function HistoryScreen({ navigation }) {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}><Feather name="arrow-left" size={20} color={C.green} /></TouchableOpacity>
        <Text style={s.title}>Historial</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.empty}>
        <View style={s.iconWrap}><Feather name="clock" size={40} color={C.textMuted} /></View>
        <Text style={s.emptyTitle}>Sin historial aún</Text>
        <Text style={s.emptySub}>Las listas que proceses se van a guardar acá</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 56, paddingBottom: 16, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.greenGhost, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: C.text },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  iconWrap: { width: 80, height: 80, borderRadius: R, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: C.textSec },
  emptySub: { fontSize: 13, color: C.textMuted, marginTop: 6, textAlign: 'center' },
});
