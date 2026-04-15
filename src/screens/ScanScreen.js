import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { C, SHADOW, R } from '../theme';
import { procesarImagen } from '../services/api';

export default function ScanScreen({ navigation }) {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadMsg, setLoadMsg] = useState('');

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permiso', 'Necesitamos acceso a la cámara'); return; }
    const r = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 });
    if (!r.canceled && r.assets[0]) setImage(r.assets[0]);
  }

  async function pickGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permiso', 'Necesitamos acceso a tus fotos'); return; }
    const r = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8 });
    if (!r.canceled && r.assets[0]) setImage(r.assets[0]);
  }

  async function analyze() {
    if (!image?.base64) { Alert.alert('', 'Primero sacá o elegí una foto'); return; }
    setLoading(true);
    const msgs = ['Analizando producto...', 'Detectando ingredientes...', 'Leyendo precios...', 'Calculando precios...'];
    let i = 0; setLoadMsg(msgs[0]);
    const iv = setInterval(() => { i = Math.min(i + 1, msgs.length - 1); setLoadMsg(msgs[i]); }, 2800);

    try {
      const mime = image.mimeType || image.type || 'image/jpeg';
      const b64 = `data:${mime};base64,${image.base64}`;
      const res = await procesarImagen(b64, mime);
      clearInterval(iv); setLoading(false);

      if (!res.ok) { Alert.alert('Error', res.error || 'No se pudo procesar'); return; }
      if (res.cantidad === 0) { Alert.alert('Sin resultados', 'No se detectaron productos.'); return; }
      navigation.navigate('Results', { productos: res.productos, cantidad: res.cantidad, metodo: res.metodo });
    } catch (e) {
      clearInterval(iv); setLoading(false);
      Alert.alert('Error', (e.response?.data?.error || e.message) + '\n\nVerificá tu conexión.');
    }
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Feather name="arrow-left" size={20} color={C.green} />
        </TouchableOpacity>
        <Text style={s.title}>Escanear producto</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.body}>
        {image ? (
          <View style={s.previewCard}>
            <Image source={{ uri: image.uri }} style={s.preview} resizeMode="contain" />
            <TouchableOpacity style={s.clearBtn} onPress={() => setImage(null)}>
              <Feather name="x" size={16} color={C.white} />
              <Text style={s.clearText}>Cambiar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.scanZone} activeOpacity={0.85} onPress={takePhoto}>
            <View style={s.scanCornerTL} /><View style={s.scanCornerTR} />
            <View style={s.scanCornerBL} /><View style={s.scanCornerBR} />
            <View style={s.scanCenter}>
              <View style={s.scanIconWrap}>
                <Feather name="camera" size={36} color={C.orange} />
              </View>
              <Text style={s.scanTitle}>Tocá para escanear</Text>
              <Text style={s.scanSub}>Apuntá a la lista de precios</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Botones */}
        <View style={s.btns}>
          {!image ? (
            <>
              <TouchableOpacity style={s.btnOrange} activeOpacity={0.8} onPress={takePhoto}>
                <Feather name="camera" size={20} color={C.white} />
                <Text style={s.btnOrangeText}>Sacar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnOutline} activeOpacity={0.8} onPress={pickGallery}>
                <Feather name="image" size={20} color={C.green} />
                <Text style={s.btnOutlineText}>Galería</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={s.btnOrange} activeOpacity={0.8} onPress={analyze} disabled={loading}>
              <Feather name="zap" size={20} color={C.white} />
              <Text style={s.btnOrangeText}>{loading ? 'Procesando...' : 'Analizar con IA'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading overlay */}
      {loading && (
        <View style={s.overlay}>
          <View style={s.overlayCard}>
            <ActivityIndicator size="large" color={C.orange} />
            <Text style={s.overlayMsg}>{loadMsg}</Text>
            <Text style={s.overlaySub}>No cierres la app</Text>
            <View style={s.overlayBar}>
              <View style={s.overlayBarFill} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const corner = { position: 'absolute', width: 28, height: 28, borderColor: C.orange };
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 56, paddingBottom: 16, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: C.greenGhost, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 17, fontWeight: '700', color: C.text },

  body: { flex: 1, padding: 20, justifyContent: 'space-between' },

  previewCard: { flex: 1, borderRadius: R, overflow: 'hidden', backgroundColor: C.card, marginBottom: 18, ...SHADOW.soft },
  preview: { flex: 1 },
  clearBtn: { position: 'absolute', top: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  clearText: { color: C.white, fontSize: 13, fontWeight: '600' },

  scanZone: { flex: 1, borderRadius: R, backgroundColor: C.card, marginBottom: 18, justifyContent: 'center', alignItems: 'center', ...SHADOW.soft, position: 'relative' },
  scanCornerTL: { ...corner, top: 16, left: 16, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
  scanCornerTR: { ...corner, top: 16, right: 16, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
  scanCornerBL: { ...corner, bottom: 16, left: 16, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
  scanCornerBR: { ...corner, bottom: 16, right: 16, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
  scanCenter: { alignItems: 'center' },
  scanIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: C.orangeGhost, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  scanTitle: { fontSize: 18, fontWeight: '700', color: C.text },
  scanSub: { fontSize: 13, color: C.textMuted, marginTop: 4 },

  btns: { flexDirection: 'row', gap: 12 },
  btnOrange: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18, backgroundColor: C.orange, ...SHADOW.orange },
  btnOrangeText: { fontSize: 16, fontWeight: '700', color: C.white },
  btnOutline: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 18, borderRadius: 18, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.green },
  btnOutlineText: { fontSize: 16, fontWeight: '700', color: C.green },

  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(245,246,250,0.95)', justifyContent: 'center', alignItems: 'center', zIndex: 99 },
  overlayCard: { backgroundColor: C.card, borderRadius: 28, padding: 40, alignItems: 'center', ...SHADOW.medium, minWidth: 280 },
  overlayMsg: { marginTop: 22, fontSize: 17, fontWeight: '700', color: C.orange, textAlign: 'center' },
  overlaySub: { marginTop: 6, fontSize: 12, color: C.textMuted },
  overlayBar: { width: 180, height: 4, borderRadius: 2, backgroundColor: C.border, marginTop: 20, overflow: 'hidden' },
  overlayBarFill: { width: '60%', height: '100%', backgroundColor: C.orange, borderRadius: 2 },
});
