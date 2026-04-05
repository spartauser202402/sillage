import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getCollection, removeFromCollection } from '../../constants/collection';
import { Perfume } from '../../data/perfumes';

export default function CollectionScreen() {
  const [collection, setCollection] = useState<Perfume[]>([]);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      getCollection().then(setCollection);
    }, [])
  );

  async function handleRemove(id: string) {
    await removeFromCollection(id);
    setCollection(prev => prev.filter(p => p.id !== id));
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <Text style={s.title}>My Collection</Text>
      <Text style={s.subtitle}>나만의 향수 컬렉션</Text>

      {collection.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>✧</Text>
          <Text style={s.emptyText}>저장된 향수가 없어요</Text>
          <Text style={s.emptyDesc}>향수 상세 페이지에서 저장해보세요</Text>
        </View>
      ) : (
        <View>
          <Text style={s.count}>{collection.length}개의 향수</Text>
          {collection.map(p => (
            <TouchableOpacity
              key={p.id}
              style={s.card}
              onPress={() => router.push({ pathname: '/perfume', params: { id: p.id } })}>
              <View style={s.cardTop}>
                <View style={s.cardLeft}>
                  <Text style={s.brand}>{p.brand}</Text>
                  <Text style={s.name}>{p.name}</Text>
                  <Text style={s.desc}>{p.desc}</Text>
                </View>
                <TouchableOpacity style={s.removeBtn} onPress={() => handleRemove(p.id)}>
                  <Text style={s.removeTxt}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={s.noteRow}>
                {p.notes.split(' · ').slice(0, 3).map(note => (
                  <View key={note} style={s.noteTag}>
                    <Text style={s.noteTxt}>{note}</Text>
                  </View>
                ))}
              </View>

              <View style={s.vectorRow}>
                {Object.entries(p.vector).map(([key, val]) => (
                  <View key={key} style={s.vecItem}>
                    <View style={s.vecBg}>
                      <View style={[s.vecFill, { height: `${val * 100}%` }]} />
                    </View>
                    <Text style={s.vecLabel}>{key.slice(0, 3)}</Text>
                  </View>
                ))}
              </View>

              <View style={s.roleBadge}>
                <Text style={s.roleText}>
                  {p.layerRole === 'base' ? 'BASE' : p.layerRole === 'top' ? 'TOP' : 'BASE · TOP'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const GOLD = '#D4AF37';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', padding: 24 },
  title: { fontSize: 32, fontWeight: '300', color: '#fff', textAlign: 'center', marginTop: 60, letterSpacing: 8, fontFamily: 'Georgia' },
  subtitle: { fontSize: 11, color: GOLD, textAlign: 'center', letterSpacing: 4, marginBottom: 32 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 40, color: GOLD, marginBottom: 16 },
  emptyText: { fontSize: 16, color: '#fff', marginBottom: 8 },
  emptyDesc: { fontSize: 12, color: '#666' },
  count: { fontSize: 11, color: '#666', letterSpacing: 2, marginBottom: 16 },
  card: { backgroundColor: '#111', borderRadius: 8, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#222' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  cardLeft: { flex: 1 },
  brand: { fontSize: 10, color: GOLD, letterSpacing: 2, marginBottom: 4 },
  name: { fontSize: 18, color: '#fff', fontWeight: '300', marginBottom: 4 },
  desc: { fontSize: 11, color: '#666' },
  removeBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  removeTxt: { color: '#666', fontSize: 11 },
  noteRow: { flexDirection: 'row', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  noteTag: { borderWidth: 1, borderColor: '#333', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  noteTxt: { color: GOLD, fontSize: 10 },
  vectorRow: { flexDirection: 'row', gap: 8, marginBottom: 12, alignItems: 'flex-end', height: 40 },
  vecItem: { flex: 1, alignItems: 'center' },
  vecBg: { width: '100%', height: 30, backgroundColor: '#222', borderRadius: 2, justifyContent: 'flex-end' },
  vecFill: { backgroundColor: GOLD, borderRadius: 2, width: '100%' },
  vecLabel: { color: '#555', fontSize: 8, marginTop: 3 },
  roleBadge: { alignSelf: 'flex-start', borderWidth: 1, borderColor: GOLD, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4 },
  roleText: { color: GOLD, fontSize: 9, letterSpacing: 2 },
});
