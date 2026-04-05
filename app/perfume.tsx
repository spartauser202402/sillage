import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { isInCollection, removeFromCollection, saveToCollection } from '../constants/collection';
import { PERFUMES } from '../data/perfumes';

export default function PerfumeDetail() {
  const { id, score } = useLocalSearchParams<{ id: string; score: string }>();
  const router = useRouter();
  const perfume = PERFUMES.find(p => p.id === id);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (perfume) {
      isInCollection(perfume.id).then(setSaved);
    }
  }, [perfume]);

  if (!perfume) return (
    <View style={s.container}>
      <Text style={s.errorText}>향수를 찾을 수 없어요</Text>
    </View>
  );

  async function toggleSave() {
    if (saved) {
      await removeFromCollection(perfume!.id);
      setSaved(false);
    } else {
      await saveToCollection(perfume!);
      setSaved(true);
    }
    console.log('저장 상태:', !saved);
  }

  return (
    <ScrollView style={s.container}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Text style={s.backText}>← 돌아가기</Text>
      </TouchableOpacity>

      <View style={s.header}>
        <Text style={s.brand}>{perfume.brand}</Text>
        <Text style={s.name}>{perfume.name}</Text>
        <Text style={s.desc}>{perfume.desc}</Text>
      </View>
      {/* 매칭 점수 */}
      {score && (
        <View style={s.scoreCard}>
          <Text style={s.scoreLabel}>나와의 향 궁합</Text>
          <Text style={s.scoreValue}>{score}%</Text>
        </View>
      )}

      {/* 저장 버튼 */}
      <TouchableOpacity style={[s.saveBtn, saved && s.saveBtnActive]} onPress={toggleSave}>
        <Text style={[s.saveTxt, saved && s.saveTxtActive]}>
          {saved ? '✦ 컬렉션에 저장됨' : '✧ 컬렉션에 저장하기'}
        </Text>
      </TouchableOpacity>

      {/* 향조 프로필 */}
      <View style={s.card}>
        <Text style={s.cardTitle}>향조 프로필</Text>
        {Object.entries(perfume.vector).map(([key, val]) => (
          <View key={key} style={s.barRow}>
            <Text style={s.barLabel}>{key}</Text>
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${val * 100}%` }]} />
            </View>
            <Text style={s.barVal}>{Math.round(val * 100)}%</Text>
          </View>
        ))}
      </View>

      {/* 레이어 역할 */}
      <View style={s.card}>
        <Text style={s.cardTitle}>레이어링 포지션</Text>
        <View style={s.roleRow}>
          <View style={[s.roleBadge, perfume.layerRole !== 'top' && s.roleBadgeActive]}>
            <Text style={[s.roleText, perfume.layerRole !== 'top' && s.roleTextActive]}>BASE</Text>
          </View>
          <View style={[s.roleBadge, perfume.layerRole !== 'base' && s.roleBadgeActive]}>
            <Text style={[s.roleText, perfume.layerRole !== 'base' && s.roleTextActive]}>TOP</Text>
          </View>
        </View>
        <Text style={s.layerTip}>{perfume.layerTip}</Text>
      </View>

      {/* 주요 노트 */}
      <View style={s.card}>
        <Text style={s.cardTitle}>주요 노트</Text>
        <View style={s.notesRow}>
          {perfume.notes.split(' · ').map(note => (
            <View key={note} style={s.noteTag}>
              <Text style={s.noteText}>{note}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 이런 날 뿌려요 */}
      <View style={[s.card, { marginBottom: 60 }]}>
        <Text style={s.cardTitle}>이런 날 뿌려요</Text>
        <Text style={s.whenText}>{perfume.whenToWear}</Text>
      </View>
    </ScrollView>
  );
}

const GOLD = '#D4AF37';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24 },
  errorText: { color: '#fff', textAlign: 'center', marginTop: 100 },
  backBtn: { marginTop: 60, marginBottom: 20 },
  backText: { color: GOLD, fontSize: 14 },
  header: { alignItems: 'center', marginBottom: 24 },
  brand: { fontSize: 11, color: GOLD, letterSpacing: 4, marginBottom: 8 },
  name: { fontSize: 28, fontWeight: '300', color: '#fff', letterSpacing: 4, textAlign: 'center', marginBottom: 8 },
  desc: { fontSize: 13, color: '#888', textAlign: 'center' },
  saveBtn: { borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 14, alignItems: 'center', marginBottom: 24 },
  saveBtnActive: { borderColor: GOLD, backgroundColor: '#1a1500' },
  saveTxt: { color: '#666', fontSize: 13, letterSpacing: 1 },
  saveTxtActive: { color: GOLD, fontWeight: '600' },
  card: { backgroundColor: '#111', borderRadius: 8, padding: 20, marginBottom: 16 },
  cardTitle: { fontSize: 11, color: GOLD, letterSpacing: 3, marginBottom: 16, textAlign: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel: { color: '#aaa', fontSize: 11, width: 50 },
  barBg: { flex: 1, backgroundColor: '#222', borderRadius: 4, height: 4, marginHorizontal: 8 },
  barFill: { backgroundColor: GOLD, borderRadius: 4, height: 4 },
  barVal: { color: '#aaa', fontSize: 11, width: 32, textAlign: 'right' },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  roleBadge: { flex: 1, borderWidth: 1, borderColor: '#333', borderRadius: 4, padding: 10, alignItems: 'center' },
  roleBadgeActive: { borderColor: GOLD, backgroundColor: '#1a1500' },
  roleText: { color: '#444', fontSize: 11, letterSpacing: 2 },
  roleTextActive: { color: GOLD, fontWeight: '600' },
  layerTip: { color: '#666', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  notesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noteTag: { borderWidth: 1, borderColor: '#333', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  noteText: { color: GOLD, fontSize: 12 },
  whenText: { color: '#ccc', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  scoreCard: { backgroundColor: '#111', borderRadius: 8, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1500' },
  scoreLabel: { fontSize: 11, color: '#888', letterSpacing: 2, marginBottom: 8 },
  scoreValue: { fontSize: 48, fontWeight: '200', color: GOLD },
});