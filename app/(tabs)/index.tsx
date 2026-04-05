import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, Image, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { Language, t } from '../../constants/i18n';
import { PERFUMES, ScentVector } from '../../data/perfumes';
import { calculateSimilarity, fetchAnalysisFromClaude } from '../../utils/analysis';

function getRecommendations(v: ScentVector) {
  return [...PERFUMES]
    .map(p => ({ ...p, score: calculateSimilarity(v, p.vector) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function getLayeringPair(recs: any[]): { base: any, top: any } | null {
  const base = recs.find(p => p.layerRole === 'base' || p.layerRole === 'both');
  const top = recs.find(p => (p.layerRole === 'top' || p.layerRole === 'both') && p.id !== base?.id);
  if (base && top) return { base, top };
  return null;
}

const API_KEY = '';

export default function MemoryScreen() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>('ko');
  const [memory, setMemory] = useState('');
  const [loading, setLoading] = useState(false);
  const [skinLoading, setSkinLoading] = useState(false);
  const [combineLoading, setCombineLoading] = useState(false);
  const [vector, setVector] = useState<ScentVector | null>(null);
  const [skinVector, setSkinVector] = useState<ScentVector | null>(null);
  const [combinedVector, setCombinedVector] = useState<ScentVector | null>(null);
  const [skinImage, setSkinImage] = useState<string | null>(null);
  const [recs, setRecs] = useState<any[]>([]);
  const [story, setStory] = useState('');
  const [mode, setMode] = useState<'memory' | 'skin' | 'combined'>('memory');

  const isArabic = lang === 'ar';

  async function generateStory(v: ScentVector) {
    const langInstruction = lang === 'ko' ? '한국어' : lang === 'ar' ? 'العربية' : 'English';
    const prompt = `향조 벡터: floral ${v.floral}, woody ${v.woody}, musky ${v.musky}, fresh ${v.fresh}, oud ${v.oud}
이 데이터를 기반으로 L'Oréal Luxe 브랜드에 어울리는 시적이고 감성적인 향 스토리를 3문장으로 ${langInstruction}로 작성해줘.`;
    try {
      const res = await fetchAnalysisFromClaude(API_KEY, prompt);
      setStory(res.content[0].text.trim());
    } catch {}
  }

  async function analyzeMemory() {
    if (!memory.trim()) return;
    setLoading(true);
    try {
      const prompt = `아래 추억을 분석해서 향조 벡터를 JSON으로만 반환해. 다른 말 하지 마.
텍스트: "${memory}"
형식: {"floral":0.0,"woody":0.0,"musky":0.0,"fresh":0.0,"oud":0.0} 값은 0.0~1.0.`;
      const res = await fetchAnalysisFromClaude(API_KEY, prompt);
      const v: ScentVector = JSON.parse(res.content[0].text.trim());
      setVector(v);
      const r = getRecommendations(v);
      setRecs(r);
      await generateStory(v);
    } catch (e: any) { alert(t(lang, 'errorAnalysis') + e.message); }
    setLoading(false);
  }

  async function takeSkinPhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { alert(t(lang, 'errorCamera')); return; }
    const result = await ImagePicker.launchCameraAsync({
      base64: true, quality: 0.3, allowsEditing: true, aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0].base64) return;
    setSkinLoading(true);
    setSkinImage(result.assets[0].uri);
    try {
      const prompt = `이 피부 사진을 보고 향조 벡터를 JSON으로만 반환해. 다른 말 하지 마.
따뜻한/어두운 피부=woody,oud 높게. 밝은/분홍 피부=floral,fresh 높게. 붉은 피부=musky 높게.
형식: {"floral":0.0,"woody":0.0,"musky":0.0,"fresh":0.0,"oud":0.0} 값은 0.0~1.0.`;
      const res = await fetchAnalysisFromClaude(API_KEY, prompt, result.assets[0].base64);
      const v: ScentVector = JSON.parse(res.content[0].text.trim());
      setSkinVector(v);
      const r = getRecommendations(v);
      setRecs(r);
      await generateStory(v);
    } catch (e: any) { alert(t(lang, 'errorSkin') + e.message); }
    setSkinLoading(false);
  }

  async function runCombined() {
    if (!vector || !skinVector) return;
    setCombineLoading(true);
    try {
      const v: ScentVector = {
        floral: vector.floral * 0.6 + skinVector.floral * 0.4,
        woody: vector.woody * 0.6 + skinVector.woody * 0.4,
        musky: vector.musky * 0.6 + skinVector.musky * 0.4,
        fresh: vector.fresh * 0.6 + skinVector.fresh * 0.4,
        oud: vector.oud * 0.6 + skinVector.oud * 0.4,
      };
      setCombinedVector(v);
      const r = getRecommendations(v);
      setRecs(r);
      await generateStory(v);
    } catch (e: any) { alert(e.message); }
    setCombineLoading(false);
  }

  const activeVector = mode === 'memory' ? vector : mode === 'skin' ? skinVector : combinedVector;
  const layeringPair = recs.length > 0 ? getLayeringPair(recs) : null;

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 60 }}>

      {/* 언어 선택 */}
      <View style={[s.langRow, isArabic && { flexDirection: 'row-reverse' }]}>
        {(['ko', 'en', 'ar'] as Language[]).map(l => (
          <TouchableOpacity key={l} style={[s.langBtn, lang === l && s.langBtnActive]} onPress={() => setLang(l)}>
            <Text style={[s.langTxt, lang === l && s.langTxtActive]}>
              {l === 'ko' ? '한국어' : l === 'en' ? 'English' : 'العربية'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 헤더 */}
      <Text style={s.title}>{t(lang, 'appName')}</Text>
      <Text style={[s.subtitle, isArabic && { textAlign: 'right' }]}>{t(lang, 'appSub')}</Text>

      {/* 모드 탭 */}
      <View style={[s.modeRow, isArabic && { flexDirection: 'row-reverse' }]}>
        {(['memory', 'skin', 'combined'] as const).map(m => (
          <TouchableOpacity key={m} style={[s.modeBtn, mode === m && s.modeBtnActive]} onPress={() => setMode(m)}>
            <Text style={[s.modeTxt, mode === m && s.modeTxtActive]}>
              {m === 'memory' ? t(lang, 'tabMemory') : m === 'skin' ? t(lang, 'tabSkin') : t(lang, 'tabSignature')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 추억 모드 */}
      {mode === 'memory' && (
        <View style={s.section}>
          <Text style={[s.label, isArabic && s.rtl]}>{t(lang, 'memoryLabel')}</Text>
          <TextInput style={[s.input, isArabic && s.rtl]}
            placeholder={t(lang, 'memoryPlaceholder')}
            placeholderTextColor="#666"
            value={memory} onChangeText={setMemory} multiline
            textAlign={isArabic ? 'right' : 'left'}
          />
          <TouchableOpacity style={s.button} onPress={analyzeMemory}>
            {loading ? <ActivityIndicator color="#000" /> : <Text style={s.buttonText}>{t(lang, 'analyzeBtn')}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* 피부 모드 */}
      {mode === 'skin' && (
        <View style={[s.section, { alignItems: 'center' }]}>
          <Text style={[s.label, isArabic && s.rtl]}>{t(lang, 'skinLabel')}</Text>
          {skinImage
            ? <Image source={{ uri: skinImage }} style={s.previewImage} />
            : <View style={s.cameraPlaceholder}><Text style={{ color: '#D4AF37', fontSize: 32 }}>✧</Text></View>
          }
          <TouchableOpacity style={s.button} onPress={takeSkinPhoto}>
            {skinLoading ? <ActivityIndicator color="#000" />
              : <Text style={s.buttonText}>{skinImage ? t(lang, 'reskinBtn') : t(lang, 'skinBtn')}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* 시그니처 모드 */}
      {mode === 'combined' && (
        <View style={[s.section, { alignItems: 'center' }]}>
          <Text style={[s.label, isArabic && s.rtl, { textAlign: 'center' }]}>{t(lang, 'sigLabel')}</Text>
          <TouchableOpacity
            style={[s.button, (!vector || !skinVector) && s.buttonDisabled]}
            onPress={runCombined}
            disabled={!vector || !skinVector}>
            {combineLoading ? <ActivityIndicator color="#000" />
              : <Text style={s.buttonText}>{t(lang, 'sigBtn')}</Text>}
          </TouchableOpacity>
        </View>
      )}

      {/* 향 프로필 */}
      {activeVector && (
        <View style={s.card}>
          <Text style={s.cardTitle}>{t(lang, 'scentProfile')}</Text>
          {Object.entries(activeVector).map(([key, val]) => (
            <View key={key} style={s.barRow}>
              <Text style={s.barLabel}>{key.toUpperCase()}</Text>
              <View style={s.barBg}>
                <View style={[s.barFill, { width: `${(val as number) * 100}%` }]} />
              </View>
              <Text style={s.barVal}>{Math.round((val as number) * 100)}%</Text>
            </View>
          ))}
        </View>
      )}

      {/* 추천 향수 */}
      {recs.length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>{t(lang, 'curatedFor')}</Text>
          {recs.map((p, i) => (
            <TouchableOpacity key={p.id} style={s.recRow}
              onPress={() => router.push({ pathname: '/perfume', params: { id: p.id } })}>
              <View style={s.recRank}><Text style={s.recRankText}>{i + 1}</Text></View>
              <View style={s.recInfo}>
                <Text style={s.recBrand}>{p.brand}</Text>
                <Text style={s.recName} numberOfLines={1}>{p.name}</Text>
                <Text style={s.recDesc}>{p.desc}</Text>
              </View>
              <Text style={s.recScore}>{Math.round(p.score * 100)}%</Text>
            </TouchableOpacity>
          ))}

          {/* 스토리 */}
          {story ? (
            <View style={s.storyContainer}>
              <Text style={[s.storyText, isArabic && s.rtl]}>{story}</Text>
            </View>
          ) : null}
        </View>
      )}

      {/* 레이어링 가이드 */}
      {layeringPair && (
        <View style={s.card}>
          <Text style={s.cardTitle}>{t(lang, 'layeringGuide')}</Text>
          <Text style={[s.layeringDesc, isArabic && s.rtl]}>{t(lang, 'layeringDesc')}</Text>
          <View style={s.layeringRow}>
            <View style={s.layeringItem}>
              <Text style={s.layeringRole}>{t(lang, 'base')}</Text>
              <Text style={s.layeringBrand}>{layeringPair.base.brand}</Text>
              <Text style={s.layeringName}>{layeringPair.base.name}</Text>
              <Text style={s.layeringTip}>{layeringPair.base.layerTip}</Text>
            </View>
            <View style={s.layeringArrow}>
              <Text style={{ color: '#D4AF37', fontSize: 20 }}>+</Text>
            </View>
            <View style={s.layeringItem}>
              <Text style={s.layeringRole}>{t(lang, 'top')}</Text>
              <Text style={s.layeringBrand}>{layeringPair.top.brand}</Text>
              <Text style={s.layeringName}>{layeringPair.top.name}</Text>
              <Text style={s.layeringTip}>{layeringPair.top.layerTip}</Text>
            </View>
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', padding: 24 },
  langRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 56, marginBottom: 8 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#333' },
  langBtnActive: { borderColor: '#D4AF37' },
  langTxt: { color: '#666', fontSize: 11 },
  langTxtActive: { color: '#D4AF37' },
  title: { fontSize: 34, fontWeight: '300', color: '#fff', textAlign: 'center', letterSpacing: 10, marginBottom: 4 },
  subtitle: { fontSize: 11, color: '#D4AF37', textAlign: 'center', letterSpacing: 4, marginBottom: 32, fontWeight: '600' },
  modeRow: { flexDirection: 'row', backgroundColor: '#111', borderRadius: 8, padding: 4, marginBottom: 32 },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: 6, alignItems: 'center' },
  modeBtnActive: { backgroundColor: '#222' },
  modeTxt: { color: '#666', fontSize: 13 },
  modeTxtActive: { color: '#D4AF37', fontWeight: '600' },
  section: { marginBottom: 20 },
  label: { fontSize: 15, color: '#E0E0E0', marginBottom: 16 },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
  input: { backgroundColor: '#111', color: '#fff', borderRadius: 8, padding: 16, minHeight: 120, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  button: { backgroundColor: '#D4AF37', borderRadius: 4, padding: 16, alignItems: 'center', marginBottom: 24, width: '100%' },
  buttonDisabled: { backgroundColor: '#333' },
  buttonText: { color: '#000', fontSize: 14, fontWeight: '600' },
  cameraPlaceholder: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#111', borderWidth: 1, borderColor: '#333', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  previewImage: { width: 160, height: 160, borderRadius: 80, marginBottom: 24, borderWidth: 1, borderColor: '#D4AF37' },
  card: { backgroundColor: '#111', borderRadius: 8, padding: 24, marginBottom: 24 },
  cardTitle: { fontSize: 13, color: '#D4AF37', fontWeight: '600', marginBottom: 20, letterSpacing: 3, textAlign: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  barLabel: { color: '#888', fontSize: 11, width: 60 },
  barBg: { flex: 1, backgroundColor: '#222', height: 4, marginHorizontal: 12 },
  barFill: { backgroundColor: '#D4AF37', height: 4 },
  barVal: { color: '#E0E0E0', fontSize: 11, width: 36, textAlign: 'right' },
  recRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  recRank: { width: 24, marginRight: 16, alignItems: 'center' },
  recRankText: { color: '#D4AF37', fontSize: 14, fontWeight: '600' },
  recInfo: { flex: 1 },
  recBrand: { color: '#888', fontSize: 10, letterSpacing: 2 },
  recName: { color: '#fff', fontSize: 14, marginVertical: 2 },
  recDesc: { color: '#666', fontSize: 12 },
  recScore: { color: '#D4AF37', fontSize: 14 },
  storyContainer: { marginTop: 20, padding: 16, backgroundColor: '#0a0a0a', borderLeftWidth: 2, borderLeftColor: '#D4AF37' },
  storyText: { color: '#A0A0A0', fontSize: 13, fontStyle: 'italic', lineHeight: 22 },
  layeringDesc: { color: '#888', fontSize: 12, textAlign: 'center', marginBottom: 20 },
  layeringRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  layeringItem: { flex: 1, backgroundColor: '#0a0a0a', borderRadius: 8, padding: 12 },
  layeringArrow: { alignItems: 'center', justifyContent: 'center', paddingTop: 24 },
  layeringRole: { color: '#D4AF37', fontSize: 10, letterSpacing: 2, marginBottom: 6 },
  layeringBrand: { color: '#666', fontSize: 9, letterSpacing: 1, marginBottom: 4 },
  layeringName: { color: '#fff', fontSize: 12, fontWeight: '500', marginBottom: 8 },
  layeringTip: { color: '#666', fontSize: 10, lineHeight: 14 },
});