import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { C, SHADOW, R } from '../theme';
import { getStats, checkHealth } from '../services/api';

const W = Dimensions.get('window').width;

export default function HomeScreen({ navigation }) {
  const [stats, setStats] = useState({ totalProductos: 0, totalListas: 0 });
  const [online, setOnline] = useState(false);

  useEffect(() => {
    load();
    const u = navigation.addListener('focus', load);
    return u;
  }, []);

  async function load() {
    try { await checkHealth(); setOnline(true); const d = await getStats(); if (d.ok) setStats(d); }
    catch (e) { setOnline(false); }
  }

  return (
    <View style={s.container}>
      {/* HEADER OSCURO */}
      <View style={s.header}>
        <View style={s.headerBg}>
          <View style={[s.orb, { top: -40, right: -30, width: 140, height: 140, backgroundColor: 'rgba(232,121,29,0.12)' }]} />
          <View style={[s.orb, { bottom: -50, left: -20, width: 120, height: 120, backgroundColor: 'rgba(107,122,47,0.15)' }]} />
          <View style={[s.orb, { top: 30, left: W * 0.4, width: 50, height: 50, backgroundColor: 'rgba(255,255,255,0.04)' }]} />
        </View>
        <View style={s.headerRow}>
          <Image source={require('../../assets/logo.jpg')} style={s.logo} />
          <View style={{ flex: 1 }}>
            <Text style={s.brand}>Mundo Sin Gluten</Text>
            <Text style={s.brandSub}>Sistema inteligente de precios con IA</Text>
          </View>
          <View style={[s.badge, online ? s.badgeOn : s.badgeOff]}>
            <View style={[s.dot, { backgroundColor: online ? C.success : C.red }]} />
          </View>
        </View>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollInner} showsVerticalScrollIndicator={false}>
        {/* STATS */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: C.orangePale }]}>
            <Feather name="package" size={20} color={C.orange} />
            <Text style={[s.statNum, { color: C.orange }]}>{stats.totalProductos}</Text>
            <Text style={s.statLabel}>Productos</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.greenPale }]}>
            <Feather name="file-text" size={20} color={C.green} />
            <Text style={[s.statNum, { color: C.green }]}>{stats.totalListas}</Text>
            <Text style={s.statLabel}>Listas</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.bg }]}>
            <Feather name="cpu" size={20} color={C.textMuted} />
            <Text style={[s.statNum, { color: C.text, fontSize: 14 }]}>Gemini</Text>
            <Text style={s.statLabel}>IA activa</Text>
          </View>
        </View>

        {/* BOTÓN PRINCIPAL */}
        <TouchableOpacity style={s.mainBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Scan')}>
          <View style={s.mainBtnIcon}>
            <Feather name="camera" size={28} color={C.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.mainBtnTitle}>Escanear producto</Text>
            <Text style={s.mainBtnDesc}>Sacá foto y la IA extrae precios</Text>
          </View>
          <Feather name="arrow-right" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* ACCIONES SECUNDARIAS */}
        <Text style={s.section}>ACCIONES</Text>
        <View style={s.grid}>
          {[
            { icon: 'edit-3', label: 'Carga manual', color: C.green, screen: 'Manual' },
            { icon: 'file-text', label: 'Cargar CSV', color: C.orange, screen: 'CSV' },
            { icon: 'sliders', label: 'Configuración', color: C.textSec, screen: 'Config' },
            { icon: 'clock', label: 'Historial', color: C.greenLight, screen: 'History' },
          ].map((item, i) => (
            <TouchableOpacity key={i} style={s.actionCard} activeOpacity={0.7}
              onPress={() => navigation.navigate(item.screen)}>
              <View style={[s.actionIcon, { backgroundColor: item.color + '10' }]}>
                <Feather name={item.icon} size={22} color={item.color} />
              </View>
              <Text style={s.actionLabel}>{item.label}</Text>
              <Feather name="chevron-right" size={16} color={C.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* PRÓXIMAMENTE */}
        <Text style={s.section}>PRÓXIMAMENTE</Text>
        <View style={s.futureRow}>
          {['Stock', 'Pistola', 'Ventas', 'Recetas'].map((t, i) => (
            <View key={i} style={s.futureChip}>
              <Text style={s.futureText}>{['🏷️','📡','🛒','🧮'][i]} {t}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { backgroundColor: C.headerDark, paddingTop: 56, paddingBottom: 28, paddingHorizontal: 22, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  headerBg: { ...StyleSheet.absoluteFillObject },
  orb: { position: 'absolute', borderRadius: 999 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, zIndex: 1 },
  logo: { width: 50, height: 50, borderRadius: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)' },
  brand: { fontSize: 20, fontWeight: '800', color: C.white, letterSpacing: -0.3 },
  brandSub: { fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: '500', marginTop: 2 },
  badge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  badgeOn: { backgroundColor: 'rgba(67,160,71,0.2)' },
  badgeOff: { backgroundColor: 'rgba(229,57,53,0.2)' },
  dot: { width: 9, height: 9, borderRadius: 5 },

  scroll: { flex: 1 },
  scrollInner: { padding: 20 },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: -16, marginBottom: 22 },
  statCard: { flex: 1, borderRadius: 20, padding: 16, alignItems: 'center', ...SHADOW.soft },
  statNum: { fontSize: 24, fontWeight: '800', marginTop: 6 },
  statLabel: { fontSize: 10, fontWeight: '600', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },

  mainBtn: { backgroundColor: C.orange, borderRadius: 24, padding: 22, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 28, ...SHADOW.orange },
  mainBtnIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  mainBtnTitle: { fontSize: 18, fontWeight: '800', color: C.white },
  mainBtnDesc: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 3 },

  section: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1.2, marginBottom: 14 },

  grid: { gap: 10, marginBottom: 28 },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: C.card, borderRadius: 20, padding: 18, ...SHADOW.soft },
  actionIcon: { width: 46, height: 46, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: C.text },

  futureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  futureChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 30, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, opacity: 0.5 },
  futureText: { fontSize: 12, fontWeight: '600', color: C.textMuted },
});
