import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { Audio } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';
import { COLORS, RADIUS, SPACE } from '../constants/theme';

interface TimeSig { name: string; beats: number; }

const TIME_SIGS: TimeSig[] = [
  { name: '2/4', beats: 2 },
  { name: '3/4', beats: 3 },
  { name: '4/4', beats: 4 },
  { name: '5/4', beats: 5 },
  { name: '6/8', beats: 6 },
  { name: '7/8', beats: 7 },
];

const ACCENT_VOLUME = 1.0;
const OFFBEAT_VOLUME = 0.55;
const CLICK_SAMPLE = require('../../assets/audio/WoodBlHi ExtraPerc V1.wav');

const BPM_MIN = 40;
const BPM_MAX = 240;
const TAP_WINDOW_MS = 2500;  // taps older than this expire

export default function Metronome() {
  const accentSoundRef = useRef<Sound | null>(null);
  const offbeatSoundRef = useRef<Sound | null>(null);

  // Load two Sound instances of the wood-block sample at different volumes —
  // pre-loading avoids per-tick volume change latency.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
      });
      const [{ sound: accent }, { sound: offbeat }] = await Promise.all([
        Audio.Sound.createAsync(CLICK_SAMPLE, { shouldPlay: false, volume: ACCENT_VOLUME }),
        Audio.Sound.createAsync(CLICK_SAMPLE, { shouldPlay: false, volume: OFFBEAT_VOLUME }),
      ]);
      if (cancelled) {
        accent.unloadAsync();
        offbeat.unloadAsync();
        return;
      }
      accentSoundRef.current = accent;
      offbeatSoundRef.current = offbeat;
    }
    load();
    return () => {
      cancelled = true;
      accentSoundRef.current?.unloadAsync();
      offbeatSoundRef.current?.unloadAsync();
      accentSoundRef.current = null;
      offbeatSoundRef.current = null;
    };
  }, []);

  function playClick(accent: boolean) {
    const sound = accent ? accentSoundRef.current : offbeatSoundRef.current;
    if (!sound) return;
    // replayAsync is a single native call that restarts the sample from the
    // beginning even if it's still ringing out — much more reliable at high
    // BPMs than setPositionAsync(0) + playAsync().
    sound.replayAsync().catch(() => {});
  }

  const [bpm, setBpm] = useState(100);
  const [sigIdx, setSigIdx] = useState(2); // default 4/4
  const [running, setRunning] = useState(false);
  const [beatIdx, setBeatIdx] = useState(0);

  const sig = TIME_SIGS[sigIdx];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTickRef = useRef<number>(0);
  const beatRef = useRef(0);
  const tapTimesRef = useRef<number[]>([]);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Self-correcting tick scheduler: targets absolute tick times to avoid drift
  useEffect(() => {
    if (!running) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      return;
    }

    beatRef.current = 0;
    setBeatIdx(0);
    nextTickRef.current = Date.now();

    function tick() {
      const beat = beatRef.current;
      const isAccent = beat === 0;
      playClick(isAccent);
      setBeatIdx(beat);

      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
      ]).start();

      beatRef.current = (beat + 1) % sig.beats;
      const interval = 60_000 / bpm;
      nextTickRef.current += interval;
      const delay = Math.max(0, nextTickRef.current - Date.now());
      timerRef.current = setTimeout(tick, delay);
    }
    // First tick immediately
    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [running, bpm, sig.beats, pulseAnim]);

  function bumpBpm(delta: number) {
    setBpm(b => Math.max(BPM_MIN, Math.min(BPM_MAX, b + delta)));
  }

  function tapTempo() {
    const now = Date.now();
    const taps = tapTimesRef.current.filter(t => now - t < TAP_WINDOW_MS);
    taps.push(now);
    tapTimesRef.current = taps;
    if (taps.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
      const avg = intervals.reduce((s, v) => s + v, 0) / intervals.length;
      const tappedBpm = Math.round(60_000 / avg);
      setBpm(Math.max(BPM_MIN, Math.min(BPM_MAX, tappedBpm)));
    }
  }

  return (
    <View style={styles.wrap}>
      {/* BPM display */}
      <View style={styles.bpmCard}>
        <Animated.View style={[
          styles.pulseRing,
          {
            opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] }),
            transform: [{
              scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.15] }),
            }],
          },
        ]} />
        <Text style={styles.bpmValue}>{bpm}</Text>
        <Text style={styles.bpmLabel}>BPM</Text>
      </View>

      {/* BPM controls */}
      <View style={styles.bpmRow}>
        <TouchableOpacity onPress={() => bumpBpm(-5)} activeOpacity={0.7} style={styles.bpmStep}>
          <Text style={styles.bpmStepTxt}>−5</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => bumpBpm(-1)} activeOpacity={0.7} style={styles.bpmStep}>
          <Text style={styles.bpmStepTxt}>−1</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={tapTempo} activeOpacity={0.7} style={styles.tapBtn}>
          <Text style={styles.tapTxt}>TAP</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => bumpBpm(1)} activeOpacity={0.7} style={styles.bpmStep}>
          <Text style={styles.bpmStepTxt}>+1</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => bumpBpm(5)} activeOpacity={0.7} style={styles.bpmStep}>
          <Text style={styles.bpmStepTxt}>+5</Text>
        </TouchableOpacity>
      </View>

      {/* Time signature */}
      <Text style={styles.secLabel}>TIME SIGNATURE</Text>
      <View style={styles.sigRow}>
        {TIME_SIGS.map((s, i) => (
          <TouchableOpacity
            key={s.name}
            onPress={() => setSigIdx(i)}
            activeOpacity={0.7}
            style={[styles.sigPill, i === sigIdx && styles.sigPillActive]}
          >
            <Text style={[styles.sigText, i === sigIdx && styles.sigTextActive]}>{s.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Beat dots */}
      <Text style={styles.secLabel}>BEAT</Text>
      <View style={styles.beatRow}>
        {Array.from({ length: sig.beats }, (_, i) => {
          const isCurrent = running && i === beatIdx;
          const isAccent = i === 0;
          return (
            <View
              key={i}
              style={[
                styles.beatDot,
                isAccent && styles.beatDotAccent,
                isCurrent && (isAccent ? styles.beatDotAccentLit : styles.beatDotLit),
              ]}
            />
          );
        })}
      </View>

      {/* Start / stop */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setRunning(v => !v)}
        style={[styles.mainBtn, running && styles.mainBtnStop]}
      >
        <Text style={[styles.mainBtnText, running && styles.mainBtnTextStop]}>
          {running ? '■ Stop' : '▶ Start'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md, alignItems: 'center' },

  bpmCard: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACE.lg, position: 'relative',
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 100, borderWidth: 4, borderColor: COLORS.accent,
  },
  bpmValue: { fontSize: 64, fontWeight: '700', color: COLORS.text, lineHeight: 70 },
  bpmLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted, letterSpacing: 1.5, marginTop: -4 },

  bpmRow: {
    flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: SPACE.lg,
  },
  bpmStep: {
    width: 44, height: 36, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  bpmStepTxt: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  tapBtn: {
    width: 56, height: 36, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.accent, backgroundColor: COLORS.accentLight,
    alignItems: 'center', justifyContent: 'center',
  },
  tapTxt: { fontSize: 12, fontWeight: '700', color: COLORS.accent, letterSpacing: 1 },

  secLabel: {
    fontSize: 9, fontWeight: '700', color: COLORS.textFaint, letterSpacing: 0.8,
    marginTop: SPACE.sm, marginBottom: SPACE.sm,
  },

  sigRow: {
    flexDirection: 'row', gap: 6, justifyContent: 'center', flexWrap: 'wrap',
    marginBottom: SPACE.sm,
  },
  sigPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.full,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  sigPillActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  sigText: { fontSize: 13, fontWeight: '600', color: COLORS.textMuted },
  sigTextActive: { color: '#fff' },

  beatRow: {
    flexDirection: 'row', gap: 10, justifyContent: 'center',
    marginBottom: SPACE.lg,
  },
  beatDot: {
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: COLORS.surfaceHigh,
    borderWidth: 1, borderColor: COLORS.border,
  },
  beatDotAccent: { borderColor: COLORS.textMuted },
  beatDotLit: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  beatDotAccentLit: { backgroundColor: '#E8D44D', borderColor: '#C4A800' },

  mainBtn: {
    paddingHorizontal: 36, paddingVertical: 12,
    borderRadius: RADIUS.full, backgroundColor: COLORS.accent,
    alignSelf: 'stretch', alignItems: 'center',
  },
  mainBtnStop: { backgroundColor: '#E24B4A' },
  mainBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  mainBtnTextStop: { color: '#fff' },
});
