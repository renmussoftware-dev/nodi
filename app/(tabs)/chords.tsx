import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Animated, Pressable, useWindowDimensions, PanResponder,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ChordBox from '../../src/components/ChordBox';
import { COLORS, SPACE, RADIUS } from '../../src/constants/theme';
import { NOTES, NOTE_DISPLAY, CHORDS } from '../../src/constants/music';
import { useStore } from '../../src/store/useStore';
import { useAudioEngine } from '../../src/hooks/useAudioEngine';
import { useProGate } from '../../src/hooks/useProGate';
import { ProBanner } from '../../src/components/ProLock';
import { isChordFree } from '../../src/constants/subscription';
import { getChordVoicings } from '../../src/utils/theory';
import StandardTuningNotice from '../../src/components/StandardTuningNotice';
import { getResolutions } from '../../src/constants/resolutions';
import HeartButton from '../../src/components/HeartButton';
import SavedSheet from '../../src/components/SavedSheet';

const CATEGORIES = ['All', 'Triads', 'Seventh', 'Extended', 'Sus'];
const CAT_MAP: Record<string, string> = {
  'Triads': 'triad', 'Seventh': 'seventh', 'Extended': 'extended', 'Sus': 'sus',
};
const DRAWER_W = 220;

export default function ChordsScreen() {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const isTablet = screenW >= 768;
  const { root, setRoot } = useStore();
  const pendingNav = useStore(s => s.pendingNav);
  const setPendingNav = useStore(s => s.setPendingNav);
  const addRecent = useStore(s => s.addRecent);
  const { isPro, requirePro } = useProGate();
  const { playChord } = useAudioEngine();
  const [category, setCategory] = useState('All');
  const [selectedChord, setSelectedChord] = useState('Major');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  // Apply pending navigation from the Saved sheet
  useEffect(() => {
    if (pendingNav?.kind === 'chord') {
      setSelectedChord(pendingNav.chordKey);
      setPendingNav(null);
    }
  }, [pendingNav, setPendingNav]);
  const drawerAnim = useRef(new Animated.Value(0)).current;
  const scrimAnim = useRef(new Animated.Value(0)).current;

  // Draggable toggle pill
  const pillOffset = useRef(new Animated.Value(0)).current;
  const pillBase   = useRef(0);
  const dragStartY = useRef(0);
  const didDrag    = useRef(false);
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gs) => {
      dragStartY.current = gs.y0;
      didDrag.current = false;
      pillOffset.setOffset(pillBase.current);
      pillOffset.setValue(0);
    },
    onPanResponderMove: (_, gs) => {
      if (Math.abs(gs.dy) > 4) didDrag.current = true;
      pillOffset.setValue(gs.dy);
    },
    onPanResponderRelease: (_, gs) => {
      pillOffset.flattenOffset();
      const raw = pillBase.current + gs.dy;
      const clamped = Math.max(0, Math.min(screenH * 0.82, raw));
      pillBase.current = clamped;
      Animated.spring(pillOffset, { toValue: clamped, useNativeDriver: true, bounciness: 0, speed: 20 }).start();
      if (!didDrag.current) toggleDrawer();
    },
  })).current;

  function openDrawer() {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: 1, useNativeDriver: true, bounciness: 0, speed: 20 }),
      Animated.timing(scrimAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }

  function closeDrawer() {
    Animated.parallel([
      Animated.spring(drawerAnim, { toValue: 0, useNativeDriver: true, bounciness: 0, speed: 20 }),
      Animated.timing(scrimAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  }

  function toggleDrawer() { drawerOpen ? closeDrawer() : openDrawer(); }

  function changeCategory(cat: string) {
    const filtered = Object.entries(CHORDS).filter(([, ch]) =>
      cat === 'All' || ch.category === CAT_MAP[cat]
    );
    setCategory(cat);
    if (filtered.length > 0) setSelectedChord(filtered[0][0]);
    openDrawer();
  }

  function selectChord(key: string) {
    const apply = () => {
      setSelectedChord(key);
      addRecent({ kind: 'chord', root, chordKey: key });
      closeDrawer();
      const voicings = getChordVoicings(root, key);
      if (voicings.length > 0) playChord(voicings[0].frets);
    };
    if (!isChordFree(key)) { requirePro(apply); return; }
    apply();
  }

  function resolveTo(offset: number, targetType: string) {
    const newRoot = (root + offset + 12) % 12;
    const apply = () => {
      setRoot(newRoot);
      setSelectedChord(targetType);
      addRecent({ kind: 'chord', root: newRoot, chordKey: targetType });
      const voicings = getChordVoicings(newRoot, targetType);
      if (voicings.length > 0) playChord(voicings[0].frets);
    };
    if (!isChordFree(targetType)) { requirePro(apply); return; }
    apply();
  }

  const filteredChords = Object.entries(CHORDS).filter(([, ch]) =>
    category === 'All' || ch.category === CAT_MAP[category]
  );

  const drawerX = drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [-DRAWER_W, 0] });
  const toggleX = drawerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, DRAWER_W] });

  const chord = CHORDS[selectedChord];
  const resolutions = getResolutions(selectedChord);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Chord Library</Text>
          <TouchableOpacity onPress={() => setSavedOpen(true)} activeOpacity={0.7} style={styles.savedBtn}>
            <Text style={styles.savedBtnText}>♥ Saved</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.noteRow}>
          {NOTES.map((note, i) => (
            <TouchableOpacity key={note} onPress={() => {
                setRoot(i);
                addRecent({ kind: 'chord', root: i, chordKey: selectedChord });
                const voicings = getChordVoicings(i, selectedChord);
                if (voicings.length > 0) playChord(voicings[0].frets);
              }}
              style={[styles.notePill, root === i && styles.notePillActive]} activeOpacity={0.7}>
              <Text style={[styles.noteText, root === i && styles.noteTextActive]}>{NOTE_DISPLAY[note] || note}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
          {CATEGORIES.map(cat => (
            <TouchableOpacity key={cat} onPress={() => changeCategory(cat)}
              style={[styles.catPill, category === cat && styles.catPillActive]} activeOpacity={0.7}>
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main content */}
      <View style={styles.body}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.detailContent}
        >
          <StandardTuningNotice context="chord library" />
          {/* Chord name + description */}
          <View style={styles.titleHeart}>
            <Text style={[styles.diagramTitle, isTablet && styles.diagramTitleTablet]}>
              {NOTES[root]} {selectedChord}
            </Text>
            <HeartButton item={{ kind: 'chord', root, chordKey: selectedChord }} size="md" />
          </View>
          <Text style={[styles.diagramDesc, isTablet && styles.diagramDescTablet]}>
            {chord?.description}
          </Text>

          {/* Chord diagram — centered, large */}
          <View style={styles.boxWrap}>
            <ChordBox root={root} chordKey={selectedChord} />
          </View>

          {/* Interval pills — centered */}
          <View style={styles.intervalsWrap}>
            {chord?.intervalNames.map((name, i) => (
              <View key={i} style={[
                styles.intervalBadge,
                isTablet && styles.intervalBadgeTablet,
                i === 0 && styles.rootBadge,
              ]}>
                <Text style={[
                  styles.intervalText,
                  isTablet && styles.intervalTextTablet,
                  i === 0 && styles.rootText,
                ]}>{name}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.intervalLabel}>Interval structure</Text>

          {/* Resolution suggestions */}
          {resolutions.length > 0 && (
            <View style={styles.resWrap}>
              <Text style={styles.resHeader}>OFTEN RESOLVES TO</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.resScrollContent}
              >
                {resolutions.map((r, i) => {
                  const targetRoot = (root + r.degreeOffset + 12) % 12;
                  const locked = !isPro && !isChordFree(r.targetType);
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => resolveTo(r.degreeOffset, r.targetType)}
                      activeOpacity={0.7}
                      style={[styles.resCard, locked && { opacity: 0.55 }]}
                    >
                      <View style={styles.resCardTop}>
                        <Text style={styles.resCardArrow}>→</Text>
                        <Text style={styles.resCardName} numberOfLines={1}>
                          {NOTES[targetRoot]} {r.targetType}
                        </Text>
                        {locked && <Text style={styles.resCardLock}>🔒</Text>}
                      </View>
                      <View style={styles.resCardBadge}>
                        <Text style={styles.resCardBadgeText}>{r.intervalLabel}</Text>
                      </View>
                      <Text style={styles.resCardWhy}>{r.why}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Chord description card */}
          {chord && (
            <View style={styles.infoCard}>
              <Text style={styles.infoCardLabel}>ABOUT THIS CHORD</Text>
              <Text style={styles.infoCardText}>{chord.description}</Text>
              <View style={styles.infoCardIntervals}>
                {chord.intervalNames.map((name, i) => (
                  <View key={i} style={styles.infoInterval}>
                    <Text style={styles.infoIntervalName}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Scrim */}
        {drawerOpen && (
          <Animated.View style={[styles.scrim, { opacity: scrimAnim }]} pointerEvents="auto">
            <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
          </Animated.View>
        )}

        {/* Drawer */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: drawerX }] }]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {!isPro && <ProBanner />}
            {filteredChords.map(([key, ch]) => {
              const locked = !isPro && !isChordFree(key);
              return (
                <TouchableOpacity key={key} onPress={() => selectChord(key)}
                  style={[styles.chordItem, selectedChord === key && styles.chordItemActive, locked && { opacity: 0.5 }]}
                  activeOpacity={0.7}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.chordName, selectedChord === key && styles.chordNameActive]} numberOfLines={1}>
                      {NOTES[root]} {key}
                    </Text>
                    <Text style={styles.chordIntervals} numberOfLines={1}>{ch.intervalNames.join(' · ')}</Text>
                  </View>
                  {locked && <Text style={{ fontSize: 12, marginRight: 4 }}>🔒</Text>}
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>

        {/* Toggle pill — drag to reposition, tap to open */}
        <Animated.View
          style={[styles.toggleWrap, { transform: [{ translateX: toggleX }, { translateY: pillOffset }] }]}
          {...panResponder.panHandlers}
        >
          <View style={styles.togglePill}>
            <Text style={styles.toggleDots}>⋮</Text>
            <Text style={styles.toggleArrow}>{drawerOpen ? '‹' : '›'}</Text>
            <Text style={styles.toggleLabel}>LIST</Text>
          </View>
        </Animated.View>
      </View>

      <SavedSheet visible={savedOpen} onClose={() => setSavedOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: COLORS.bg },
  header:       { backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingTop: SPACE.md, paddingBottom: SPACE.md, gap: SPACE.sm },
  title:        { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  titleRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACE.lg },
  savedBtn:     {
                  marginLeft: 'auto',
                  paddingHorizontal: 10, paddingVertical: 5,
                  borderRadius: RADIUS.full,
                  borderWidth: 1, borderColor: COLORS.border,
                  backgroundColor: COLORS.bg,
                },
  savedBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },
  titleHeart:   {
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 10, marginBottom: 6,
                },
  noteRow:      { flexDirection: 'row', paddingHorizontal: SPACE.lg, gap: 6 },
  notePill:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  notePillActive: { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  noteText:     { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  noteTextActive: { color: '#5C4400' },
  catRow:       { flexDirection: 'row', paddingHorizontal: SPACE.lg, gap: 6 },
  catPill:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  catPillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  catText:      { fontSize: 12, fontWeight: '500', color: COLORS.textMuted },
  catTextActive: { color: '#fff' },

  body:              { flex: 1, overflow: 'hidden' },
  detailContent:     { alignItems: 'center', paddingTop: SPACE.xxl, paddingHorizontal: SPACE.xl },

  diagramTitle:      { fontSize: 32, fontWeight: '700', color: COLORS.text, marginBottom: 6, textAlign: 'center' },
  diagramTitleTablet:{ fontSize: 48 },
  diagramDesc:       { fontSize: 15, color: COLORS.textMuted, marginBottom: SPACE.xl, textAlign: 'center' },
  diagramDescTablet: { fontSize: 20 },

  boxWrap:      { alignItems: 'center', justifyContent: 'center', marginBottom: SPACE.xl },

  intervalsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 8 },
  intervalBadge:    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border },
  intervalBadgeTablet: { paddingHorizontal: 22, paddingVertical: 12 },
  rootBadge:        { backgroundColor: '#E8D44D', borderColor: '#C4A800' },
  intervalText:     { fontSize: 16, fontWeight: '700', color: COLORS.textMuted },
  intervalTextTablet: { fontSize: 22 },
  rootText:         { color: '#5C4400' },
  intervalLabel:    { fontSize: 12, color: COLORS.textFaint, letterSpacing: 0.5, marginBottom: SPACE.xl },

  resWrap:          { width: '100%', marginBottom: SPACE.md },
  resHeader:        { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, marginBottom: SPACE.sm },
  resScrollContent: { gap: 10, paddingRight: 8 },
  resCard:          {
                      width: 220,
                      padding: SPACE.md,
                      borderRadius: RADIUS.md,
                      borderWidth: 1, borderColor: COLORS.border,
                      backgroundColor: COLORS.surface,
                    },
  resCardTop:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  resCardArrow:     { fontSize: 16, color: COLORS.accent, fontWeight: '700', lineHeight: 18 },
  resCardName:      { fontSize: 15, fontWeight: '700', color: COLORS.text, flexShrink: 1 },
  resCardLock:      { fontSize: 11, marginLeft: 'auto' },
  resCardBadge:     {
                      alignSelf: 'flex-start',
                      paddingHorizontal: 8, paddingVertical: 3,
                      borderRadius: RADIUS.full,
                      backgroundColor: COLORS.surfaceHigh,
                      borderWidth: 1, borderColor: COLORS.border,
                      marginBottom: 8,
                    },
  resCardBadgeText: { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 0.5 },
  resCardWhy:       { fontSize: 11, color: COLORS.textMuted, lineHeight: 16 },

  infoCard:         { width: '100%', backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACE.lg, marginTop: SPACE.sm },
  infoCardLabel:    { fontSize: 10, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: SPACE.sm },
  infoCardText:     { fontSize: 15, color: COLORS.text, lineHeight: 22, marginBottom: SPACE.md },
  infoCardIntervals:{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoInterval:     { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  infoIntervalName: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted },

  scrim:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 10 },
  drawer:       { position: 'absolute', left: 0, top: 0, bottom: 0, width: DRAWER_W, backgroundColor: COLORS.surface, borderRightWidth: 1, borderRightColor: COLORS.border, zIndex: 20 },
  chordItem:    { paddingVertical: 12, paddingHorizontal: SPACE.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chordItemActive: { backgroundColor: COLORS.surfaceHigh },
  chordName:    { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  chordNameActive: { color: COLORS.accent },
  chordIntervals: { fontSize: 11, color: COLORS.textMuted },

  toggleWrap:    { position: 'absolute', left: 0, top: '35%', zIndex: 30 },
  togglePill:    { backgroundColor: COLORS.surfaceHigh, borderTopRightRadius: 20, borderBottomRightRadius: 20,
                   borderWidth: 1, borderLeftWidth: 0, borderColor: COLORS.borderLight,
                   paddingVertical: 14, paddingLeft: 6, paddingRight: 10, alignItems: 'center', gap: 4 },
  toggleDots:    { fontSize: 13, color: COLORS.textFaint, lineHeight: 14, letterSpacing: -2 },
  toggleArrow:   { fontSize: 16, color: COLORS.text, fontWeight: '600', lineHeight: 18 },
  toggleLabel:   { fontSize: 9, fontWeight: '700', color: COLORS.textMuted, letterSpacing: 1.2 },
});
