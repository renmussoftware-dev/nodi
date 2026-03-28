import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Rect, Text as SvgText, G } from 'react-native-svg';
import { COLORS, SPACE, RADIUS } from '../../src/constants/theme';
import { NOTES, NOTE_DISPLAY, CHORDS, OPEN_STRINGS, COLORS as MUSIC_C } from '../../src/constants/music';
import { PROGRESSIONS, GENRES, type Progression } from '../../src/constants/progressions';
import { useStore } from '../../src/store/useStore';

// ─── Mini chord box ────────────────────────────────────────────────────────────
const BOX_PAD_L = 20;
const BOX_PAD_T = 24;
const BOX_FRET_H = 20;
const BOX_STR_GAP = 16;
const BOX_DOT_R = 7;
const BOX_FRETS = 5;
const BOX_STRINGS = 6;

function buildVoicing(root: number, chordKey: string) {
  const ch = CHORDS[chordKey];
  if (!ch) return null;
  const chordNotes = ch.intervals.map(iv => (root + iv) % 12);
  const chordSet = new Set(chordNotes);
  for (let base = 0; base <= 9; base++) {
    const frets: (number | null)[] = [];
    let rootFound = false;
    const covered = new Set<number>();
    for (let s = 5; s >= 0; s--) {
      let best: number | null = null;
      const end = base === 0 ? 4 : base + 4;
      for (let f = base === 0 ? 0 : base; f <= end; f++) {
        const n = (OPEN_STRINGS[s] + f) % 12;
        if (chordSet.has(n)) {
          if (best === null) best = f;
          if (n === root && !rootFound) { best = f; rootFound = true; break; }
        }
      }
      frets.push(best);
      if (best !== null) covered.add((OPEN_STRINGS[s] + best) % 12);
    }
    const coveredAll = [...chordSet].every(n => covered.has(n));
    const used = frets.filter(f => f !== null).length;
    if (coveredAll && used >= Math.min(4, chordNotes.length) && rootFound) {
      const nonNull = frets.filter(f => f !== null && f > 0) as number[];
      const maxF = nonNull.length ? Math.max(...nonNull) : 0;
      const minF = nonNull.length ? Math.min(...nonNull) : 0;
      if (maxF - minF <= 4) return { frets, baseFret: base === 0 ? 1 : base };
    }
  }
  return null;
}

function MiniChordBox({ root, chordKey, label, active }: {
  root: number; chordKey: string; label: string; active: boolean;
}) {
  const voicing = buildVoicing(root, chordKey);
  const ch = CHORDS[chordKey];
  const svgW = BOX_PAD_L + (BOX_STRINGS - 1) * BOX_STR_GAP + 18;
  const svgH = BOX_PAD_T + BOX_FRETS * BOX_FRET_H + 16;

  function sx(s: number) { return BOX_PAD_L + s * BOX_STR_GAP; }
  function fy(f: number) { return BOX_PAD_T + f * BOX_FRET_H; }

  const accentColor = active ? '#E8D44D' : COLORS.accent;
  const borderColor = active ? '#E8D44D' : COLORS.border;

  return (
    <View style={[styles.miniBox, active && styles.miniBoxActive]}>
      <Text style={[styles.miniLabel, active && styles.miniLabelActive]} numberOfLines={1}>
        {label}
      </Text>
      {voicing ? (
        <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          {voicing.baseFret > 1 && (
            <SvgText x={BOX_PAD_L - 12} y={fy(1) + 3} fontSize={8} fill={COLORS.textMuted} textAnchor="middle">
              {voicing.baseFret}fr
            </SvgText>
          )}
          <Line x1={sx(0)} y1={fy(0)} x2={sx(BOX_STRINGS - 1)} y2={fy(0)}
            stroke={voicing.baseFret <= 1 ? '#888680' : '#2E2E38'} strokeWidth={voicing.baseFret <= 1 ? 4 : 1} />
          {Array.from({ length: BOX_FRETS }, (_, i) => (
            <Line key={i} x1={sx(0)} y1={fy(i + 1)} x2={sx(BOX_STRINGS - 1)} y2={fy(i + 1)}
              stroke="#2E2E38" strokeWidth={0.8} />
          ))}
          {Array.from({ length: BOX_STRINGS }, (_, s) => (
            <Line key={s} x1={sx(s)} y1={fy(0)} x2={sx(s)} y2={fy(BOX_FRETS)}
              stroke="#3A3A46" strokeWidth={0.8 + (5 - s) * 0.15} />
          ))}
          {voicing.frets.map((f, s) => {
            if (f === null) return (
              <SvgText key={s} x={sx(s)} y={fy(0) - 5} textAnchor="middle" fontSize={8} fill={COLORS.textMuted}>✕</SvgText>
            );
            if (f === 0) return (
              <Circle key={s} cx={sx(s)} cy={fy(0) - 6} r={4} fill="none" stroke={COLORS.textMuted} strokeWidth={1} />
            );
            const row = f - voicing.baseFret + 1;
            if (row < 1 || row > BOX_FRETS) return null;
            const cy = fy(row) - BOX_FRET_H / 2;
            const ni = (OPEN_STRINGS[s] + f) % 12;
            const isRoot = ni === root;
            const fill = isRoot ? '#E8D44D' : (active ? '#534AB7' : '#3A3A46');
            const stroke = isRoot ? '#C4A800' : (active ? '#3C3489' : '#52525F');
            const tc = isRoot ? '#5C4400' : '#fff';
            return (
              <G key={s}>
                <Circle cx={sx(s)} cy={cy} r={BOX_DOT_R} fill={fill} stroke={stroke} strokeWidth={1} />
                <SvgText x={sx(s)} y={cy + 3} textAnchor="middle" fontSize={6} fontWeight="600" fill={tc}>
                  {NOTES[ni]}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      ) : (
        <View style={{ width: svgW, height: svgH, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 10, color: COLORS.textFaint }}>—</Text>
        </View>
      )}
      <Text style={[styles.miniChordName, active && styles.miniChordNameActive]} numberOfLines={1}>
        {NOTES[root]} {chordKey}
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function ProgressionsScreen() {
  const { root, setRoot } = useStore();
  const [genre, setGenre] = useState('All');
  const [selected, setSelected] = useState<Progression>(PROGRESSIONS[0]);
  const [activeChordIdx, setActiveChordIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const filtered = PROGRESSIONS.filter(p => genre === 'All' || p.genre === genre);

  // Auto-advance when playing
  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setActiveChordIdx(i => (i + 1) % selected.degrees.length);
      }, 1200);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [playing, selected]);

  // Pulse animation on chord change
  useEffect(() => {
    pulseAnim.setValue(1.15);
    Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
  }, [activeChordIdx]);

  function selectProgression(p: Progression) {
    setSelected(p);
    setActiveChordIdx(0);
    setPlaying(false);
  }

  function togglePlay() {
    setPlaying(v => !v);
    if (!playing) setActiveChordIdx(0);
  }

  // Current chord info
  const currentDegree = selected.degrees[activeChordIdx];
  const currentChordRoot = (root + currentDegree) % 12;
  const currentChordType = selected.chordTypes[activeChordIdx];
  const currentNumeral = selected.numerals[activeChordIdx];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Progressions</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noteRow}>
          {NOTES.map((note, i) => (
            <TouchableOpacity key={note} onPress={() => setRoot(i)}
              style={[styles.notePill, root === i && styles.notePillActive]} activeOpacity={0.7}>
              <Text style={[styles.noteText, root === i && styles.noteTextActive]}>
                {NOTE_DISPLAY[note] || note}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.genreRow}>
          {GENRES.map(g => (
            <TouchableOpacity key={g} onPress={() => setGenre(g)}
              style={[styles.genrePill, genre === g && styles.genrePillActive]} activeOpacity={0.7}>
              <Text style={[styles.genreText, genre === g && styles.genreTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.body}>
        {/* Left: progression list */}
        <View style={styles.listWrap}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {filtered.map(p => (
              <TouchableOpacity key={p.name} onPress={() => selectProgression(p)}
                style={[styles.progItem, selected.name === p.name && styles.progItemActive]}
                activeOpacity={0.7}>
                <Text style={[styles.progName, selected.name === p.name && styles.progNameActive]} numberOfLines={1}>
                  {p.name}
                </Text>
                <View style={styles.progMeta}>
                  <View style={[styles.genreBadge]}>
                    <Text style={styles.genreBadgeText}>{p.genre}</Text>
                  </View>
                  <Text style={styles.progNumerals} numberOfLines={1}>
                    {p.numerals.join(' – ')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={{ height: SPACE.xxl }} />
          </ScrollView>
        </View>

        {/* Right: detail */}
        <View style={styles.detail}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Active chord display */}
            <Animated.View style={[styles.activeChordCard, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.activeNumeral}>{currentNumeral}</Text>
              <Text style={styles.activeChordName}>
                {NOTES[currentChordRoot]}{currentChordType === 'Major' ? '' : ` ${currentChordType}`}
              </Text>
              <Text style={styles.activeChordSub}>
                {CHORDS[currentChordType]?.intervalNames.join(' · ')}
              </Text>
            </Animated.View>

            {/* Play controls */}
            <View style={styles.playRow}>
              <TouchableOpacity onPress={togglePlay} style={[styles.playBtn, playing && styles.playBtnActive]} activeOpacity={0.7}>
                <Text style={[styles.playBtnText, playing && styles.playBtnTextActive]}>
                  {playing ? '⏸  Pause' : '▶  Play through'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Step dots */}
            <View style={styles.stepDots}>
              {selected.degrees.map((_, i) => (
                <TouchableOpacity key={i} onPress={() => { setActiveChordIdx(i); setPlaying(false); }} activeOpacity={0.7}>
                  <View style={[styles.stepDot, i === activeChordIdx && styles.stepDotActive]} />
                </TouchableOpacity>
              ))}
            </View>

            {/* Box diagrams row */}
            <Text style={styles.sectionLabel}>Chord shapes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.boxRow}>
              {selected.degrees.map((deg, i) => {
                const chordRoot = (root + deg) % 12;
                return (
                  <TouchableOpacity key={i} onPress={() => { setActiveChordIdx(i); setPlaying(false); }} activeOpacity={0.8}>
                    <MiniChordBox
                      root={chordRoot}
                      chordKey={selected.chordTypes[i]}
                      label={selected.numerals[i]}
                      active={i === activeChordIdx}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Description */}
            <View style={styles.descCard}>
              <Text style={styles.descTitle}>{selected.name}</Text>
              <Text style={styles.descText}>{selected.description}</Text>
            </View>

            {/* All chords in key */}
            <Text style={styles.sectionLabel}>All chords in key of {NOTES[root]}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keyChords}>
              {selected.degrees.map((deg, i) => {
                const cr = (root + deg) % 12;
                return (
                  <View key={i} style={styles.keyChordBadge}>
                    <Text style={styles.keyChordNumeral}>{selected.numerals[i]}</Text>
                    <Text style={styles.keyChordName}>
                      {NOTES[cr]}{selected.chordTypes[i] === 'Major' || selected.chordTypes[i] === 'Major 7' ? '' : selected.chordTypes[i] === 'Minor' || selected.chordTypes[i] === 'Minor 7' ? 'm' : ''}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>

            <View style={{ height: 80 }} />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingTop: SPACE.md,
    paddingBottom: SPACE.md,
    gap: SPACE.sm,
  },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text, paddingHorizontal: SPACE.lg, marginBottom: 2 },
  noteRow: { flexDirection: 'row', paddingHorizontal: SPACE.lg, gap: 6 },
  notePill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  notePillActive: { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  noteText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  noteTextActive: { color: '#5C4400' },
  genreRow: { flexDirection: 'row', paddingHorizontal: SPACE.lg, gap: 6 },
  genrePill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  genrePillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  genreText: { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  genreTextActive: { color: '#fff' },

  body: { flex: 1, flexDirection: 'row' },
  listWrap: { width: 170, borderRightWidth: 1, borderRightColor: COLORS.border },
  progItem: { paddingVertical: 10, paddingHorizontal: SPACE.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  progItemActive: { backgroundColor: COLORS.surfaceHigh },
  progName: { fontSize: 12, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  progNameActive: { color: COLORS.accent },
  progMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  genreBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 3, backgroundColor: COLORS.surfaceHigh, borderWidth: 0.5, borderColor: COLORS.border },
  genreBadgeText: { fontSize: 9, color: COLORS.textFaint, fontWeight: '500' },
  progNumerals: { fontSize: 10, color: COLORS.textFaint, flex: 1 },

  detail: { flex: 1 },

  activeChordCard: {
    margin: SPACE.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accent,
    padding: SPACE.lg,
    alignItems: 'center',
  },
  activeNumeral: { fontSize: 13, fontWeight: '600', color: COLORS.accent, marginBottom: 4, letterSpacing: 1 },
  activeChordName: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  activeChordSub: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 0.5 },

  playRow: { paddingHorizontal: SPACE.md, marginBottom: SPACE.md },
  playBtn: {
    paddingVertical: 9, borderRadius: RADIUS.md, borderWidth: 1,
    borderColor: COLORS.border, backgroundColor: COLORS.surface, alignItems: 'center',
  },
  playBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  playBtnText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  playBtnTextActive: { color: '#fff' },

  stepDots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: SPACE.lg },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border },
  stepDotActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },

  sectionLabel: { fontSize: 10, fontWeight: '500', color: COLORS.textMuted, letterSpacing: 0.7, textTransform: 'uppercase', paddingHorizontal: SPACE.md, marginBottom: SPACE.sm },
  boxRow: { paddingHorizontal: SPACE.md, gap: 8, paddingBottom: SPACE.md },

  miniBox: {
    alignItems: 'center', padding: 8, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
    minWidth: 80,
  },
  miniBoxActive: { borderColor: '#E8D44D', backgroundColor: COLORS.surfaceHigh },
  miniLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textMuted, marginBottom: 4 },
  miniLabelActive: { color: '#E8D44D' },
  miniChordName: { fontSize: 9, color: COLORS.textFaint, marginTop: 2 },
  miniChordNameActive: { color: COLORS.textMuted },

  descCard: {
    marginHorizontal: SPACE.md, marginBottom: SPACE.lg,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACE.md, borderWidth: 1, borderColor: COLORS.border,
  },
  descTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 4 },
  descText: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },

  keyChords: { paddingHorizontal: SPACE.md, gap: 8, paddingBottom: SPACE.md },
  keyChordBadge: { alignItems: 'center', backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.md, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.border },
  keyChordNumeral: { fontSize: 10, color: COLORS.textMuted, marginBottom: 2, fontWeight: '600' },
  keyChordName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
});
