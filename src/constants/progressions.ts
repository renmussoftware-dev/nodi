export interface Progression {
  name: string;
  numerals: string[];       // e.g. ['I', 'IV', 'V', 'I']
  degrees: number[];        // semitone offsets from root: 0,5,7,0
  chordTypes: string[];     // keys into CHORDS: 'Major','Minor', etc
  genre: string;
  description: string;
}

export const PROGRESSIONS: Progression[] = [
  // ── Pop / Rock ──────────────────────────────────────────
  {
    name: 'I – V – vi – IV',
    numerals: ['I', 'V', 'vi', 'IV'],
    degrees: [0, 7, 9, 5],
    chordTypes: ['Major', 'Major', 'Minor', 'Major'],
    genre: 'Pop',
    description: 'The "4-chord song". Used in hundreds of pop hits.',
  },
  {
    name: 'I – IV – V',
    numerals: ['I', 'IV', 'V'],
    degrees: [0, 5, 7],
    chordTypes: ['Major', 'Major', 'Major'],
    genre: 'Rock',
    description: 'The backbone of rock and blues. Simple and powerful.',
  },
  {
    name: 'I – IV – vi – V',
    numerals: ['I', 'IV', 'vi', 'V'],
    degrees: [0, 5, 9, 7],
    chordTypes: ['Major', 'Major', 'Minor', 'Major'],
    genre: 'Pop',
    description: 'Bright and uplifting. Common in pop anthems.',
  },
  {
    name: 'vi – IV – I – V',
    numerals: ['vi', 'IV', 'I', 'V'],
    degrees: [9, 5, 0, 7],
    chordTypes: ['Minor', 'Major', 'Major', 'Major'],
    genre: 'Pop',
    description: 'Same chords as I–V–vi–IV, starting on minor. Melancholic.',
  },
  {
    name: 'I – vi – IV – V',
    numerals: ['I', 'vi', 'IV', 'V'],
    degrees: [0, 9, 5, 7],
    chordTypes: ['Major', 'Minor', 'Major', 'Major'],
    genre: 'Pop',
    description: 'The "50s progression". Doo-wop and classic pop.',
  },
  {
    name: 'I – iii – IV – V',
    numerals: ['I', 'iii', 'IV', 'V'],
    degrees: [0, 4, 5, 7],
    chordTypes: ['Major', 'Minor', 'Major', 'Major'],
    genre: 'Pop',
    description: 'Smooth descending feel. Used in many ballads.',
  },
  // ── Blues ────────────────────────────────────────────────
  {
    name: '12-Bar Blues',
    numerals: ['I', 'I', 'I', 'I', 'IV', 'IV', 'I', 'I', 'V', 'IV', 'I', 'V'],
    degrees: [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7],
    chordTypes: ['Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7'],
    genre: 'Blues',
    description: 'The foundation of blues. 12 bars, all dominant 7ths.',
  },
  {
    name: '8-Bar Blues',
    numerals: ['I', 'V', 'IV', 'IV', 'I', 'V', 'I', 'V'],
    degrees: [0, 7, 5, 5, 0, 7, 0, 7],
    chordTypes: ['Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7', 'Dominant 7'],
    genre: 'Blues',
    description: 'Shorter blues form. More movement, less repetition.',
  },
  {
    name: 'Minor Blues',
    numerals: ['i', 'i', 'i', 'i', 'iv', 'iv', 'i', 'i', 'V', 'iv', 'i', 'V'],
    degrees: [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7],
    chordTypes: ['Minor 7', 'Minor 7', 'Minor 7', 'Minor 7', 'Minor 7', 'Minor 7', 'Minor 7', 'Minor 7', 'Dominant 7', 'Minor 7', 'Minor 7', 'Dominant 7'],
    genre: 'Blues',
    description: 'Darker, moodier blues. Common in minor keys.',
  },
  // ── Jazz ─────────────────────────────────────────────────
  {
    name: 'ii – V – I',
    numerals: ['ii', 'V', 'I'],
    degrees: [2, 7, 0],
    chordTypes: ['Minor 7', 'Dominant 7', 'Major 7'],
    genre: 'Jazz',
    description: 'The most important jazz progression. Foundation of bebop.',
  },
  {
    name: 'ii – V – I – VI',
    numerals: ['ii', 'V', 'I', 'VI'],
    degrees: [2, 7, 0, 9],
    chordTypes: ['Minor 7', 'Dominant 7', 'Major 7', 'Dominant 7'],
    genre: 'Jazz',
    description: 'ii–V–I with a turnaround. Cycles back to the top.',
  },
  {
    name: 'I – VI – ii – V',
    numerals: ['I', 'VI', 'ii', 'V'],
    degrees: [0, 9, 2, 7],
    chordTypes: ['Major 7', 'Dominant 7', 'Minor 7', 'Dominant 7'],
    genre: 'Jazz',
    description: 'Jazz turnaround. Smooth chord movement.',
  },
  {
    name: 'I – IV – iii – VI',
    numerals: ['I', 'IV', 'iii', 'VI'],
    degrees: [0, 5, 4, 9],
    chordTypes: ['Major 7', 'Major 7', 'Minor 7', 'Dominant 7'],
    genre: 'Jazz',
    description: 'Chromatic descending bass motion. Lush jazz sound.',
  },
  // ── Minor / Dark ─────────────────────────────────────────
  {
    name: 'i – VII – VI – VII',
    numerals: ['i', 'VII', 'VI', 'VII'],
    degrees: [0, 10, 8, 10],
    chordTypes: ['Minor', 'Major', 'Major', 'Major'],
    genre: 'Rock',
    description: 'Natural minor descending. Dark and dramatic.',
  },
  {
    name: 'i – iv – VII – III',
    numerals: ['i', 'iv', 'VII', 'III'],
    degrees: [0, 5, 10, 3],
    chordTypes: ['Minor', 'Minor', 'Major', 'Major'],
    genre: 'Rock',
    description: 'Minor key rock progression. Anthemic and driving.',
  },
  {
    name: 'i – VI – III – VII',
    numerals: ['i', 'VI', 'III', 'VII'],
    degrees: [0, 8, 3, 10],
    chordTypes: ['Minor', 'Major', 'Major', 'Major'],
    genre: 'Pop',
    description: 'Minor pop/rock staple. Used in many modern songs.',
  },
  {
    name: 'i – v – VI – VII',
    numerals: ['i', 'v', 'VI', 'VII'],
    degrees: [0, 7, 8, 10],
    chordTypes: ['Minor', 'Minor', 'Major', 'Major'],
    genre: 'Rock',
    description: 'All-minor feel with lift. Metal and hard rock.',
  },
  // ── Folk / Country ───────────────────────────────────────
  {
    name: 'I – IV – I – V',
    numerals: ['I', 'IV', 'I', 'V'],
    degrees: [0, 5, 0, 7],
    chordTypes: ['Major', 'Major', 'Major', 'Major'],
    genre: 'Country',
    description: 'Classic country/folk. Simple, singable, timeless.',
  },
  {
    name: 'I – II – IV – I',
    numerals: ['I', 'II', 'IV', 'I'],
    degrees: [0, 2, 5, 0],
    chordTypes: ['Major', 'Major', 'Major', 'Major'],
    genre: 'Folk',
    description: 'Non-diatonic II chord gives an open, folk feel.',
  },
  // ── R&B / Soul ───────────────────────────────────────────
  {
    name: 'I – iii – vi – ii',
    numerals: ['I', 'iii', 'vi', 'ii'],
    degrees: [0, 4, 9, 2],
    chordTypes: ['Major 7', 'Minor 7', 'Minor 7', 'Minor 7'],
    genre: 'R&B',
    description: 'All-minor feel in a major key. Smooth R&B.',
  },
  {
    name: 'ii – I – ii – V',
    numerals: ['ii', 'I', 'ii', 'V'],
    degrees: [2, 0, 2, 7],
    chordTypes: ['Minor 7', 'Major 7', 'Minor 7', 'Dominant 9'],
    genre: 'R&B',
    description: 'Neo-soul groove progression. Floating, lush.',
  },
];

export const GENRES = ['All', 'Pop', 'Rock', 'Blues', 'Jazz', 'Country', 'Folk', 'R&B'];
