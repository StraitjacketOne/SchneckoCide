/*
 * Prozedurale 16-Bit-Sprites.
 *
 * Jeder Sprite ist eine "Pixel-Map": ein Array von Strings, ein Zeichen = ein Pixel,
 * '.' = transparent. Die Palette ordnet Zeichen -> Farbe zu.
 * Vorteil: keine externen Bilddateien noetig (laeuft per Doppelklick), und die
 * Sprites sind im Editor direkt lesbar und aenderbar.
 *
 * Spaeter durch echte PNGs ersetzen: in BootScene.preload ein
 * this.load.spritesheet('hero', ...) mit demselben Key laden - der restliche
 * Code bleibt unveraendert.
 */

/** Baut aus mehreren Pixel-Maps ein Spritesheet mit nummerierten Frames (0..n-1). */
function buildSheet(scene, key, w, h, palette, frames) {
  const g = scene.make.graphics({ x: 0, y: 0, add: false });

  frames.forEach((rows, fi) => {
    if (rows.length !== h) {
      console.warn('[gfx] ' + key + ' Frame ' + fi + ': ' + rows.length + ' Zeilen statt ' + h);
    }
    rows.forEach((row, y) => {
      if (row.length !== w) {
        console.warn('[gfx] ' + key + ' Frame ' + fi + ' Zeile ' + y + ': ' + row.length + ' Zeichen statt ' + w);
      }
      for (let x = 0; x < row.length; x++) {
        const col = palette[row[x]];
        if (col === undefined) continue;      // '.' und Unbekanntes = transparent
        g.fillStyle(col, 1);
        g.fillRect(fi * w + x, y, 1, 1);
      }
    });
  });

  g.generateTexture(key, w * frames.length, h);
  g.destroy();

  const tex = scene.textures.get(key);
  for (let i = 0; i < frames.length; i++) tex.add(i, 0, i * w, 0, w, h);
}

/* ------------------------------------------------------------------ Held */

const HERO_PAL = {
  o: 0x14121f, h: 0x7fb2e5, H: 0x2f5f9e, s: 0xf0c090, e: 0x14121f,
  b: 0x3f7fc4, B: 0x27538a, l: 0x9a6b32, m: 0xd8dde8, g: 0x5a6272
};

const HERO_HEAD = [
  '....oooo....',
  '...ohhhho...',
  '..ohhhhhhho.',
  '..oHssssHo..',
  '..osesseso..',
  '...osssso...'
];
const HERO_TORSO = [
  '.ommmmmmmmo.',
  '.omBbbbbBmo.',
  '.omBbbbbBmo.',
  '..oBbbbbBo..',
  '..ollllllo..',
  '..oBbbbbBo..',
  '..oBbbbbBo..'
];

const HERO_FRAMES = [
  // 0 idle
  HERO_HEAD.concat(HERO_TORSO, [
    '..ogg..ggo..', '..ogg..ggo..', '..ogg..ggo..', '.oggo..oggo.', '.oooo..oooo.']),
  // 1 run A
  HERO_HEAD.concat(HERO_TORSO, [
    '..oggggggo..', '.oggo..oggo.', '.ogo....ogo.', 'oggo....oggo', 'oooo....oooo']),
  // 2 run B
  HERO_HEAD.concat(HERO_TORSO, [
    '..oggggggo..', '..oggggggo..', '..ogg.ggo...', '..ooo.ooo...', '............']),
  // 3 jump
  HERO_HEAD.concat(HERO_TORSO, [
    '..oggggggo..', '.oggo..oggo.', '.ooo....ooo.', '............', '............']),
  // 4 slash (Arm vor; die Klinge ist ein eigenes Sprite)
  HERO_HEAD.concat([
    '.ommmmmmmmo.', '.oBbbbbbmmmo', '.oBbbbbbBmo.', '..oBbbbbBo..',
    '..ollllllo..', '..oBbbbbBo..', '..oBbbbbBo..',
    '..oggggggo..', '.oggo..oggo.', '.ogo....ogo.', '.ooo....ooo.', '............']),
  // 5 climb A (Rueckenansicht)
  ['....oooo....', '...ohhhho...', '..ohhhhhhho.', '..ohhhhhho..',
   '..oHHHHHHo..', '...oHHHHo...',
   '.ommmmmmmmo.', 'omoBbbbbBomo', 'omoBbbbbBomo', '..oBbbbbBo..',
   '..ollllllo..', '..oBbbbbBo..', '..oBbbbbBo..',
   '..oggggggo..', '..ogg..ggo..', '.oggo..oggo.', '.ooo....ooo.', '............'],
  // 6 climb B
  ['....oooo....', '...ohhhho...', '..ohhhhhhho.', '..ohhhhhho..',
   '..oHHHHHHo..', '...oHHHHo...',
   '.ommmmmmmmo.', 'omoBbbbbBomo', 'omoBbbbbBomo', '..oBbbbbBo..',
   '..ollllllo..', '..oBbbbbBo..', '..oBbbbbBo..',
   '..oggggggo..', '.oggo..oggo.', '..ogg..ggo..', '..ooo..ooo..', '............']
];

/* ---------------------------------------------------------------- Gegner */

/*
 * Grundform "Humanoid" 12x16 - die Palette macht den Typ unterscheidbar.
 * Wichtig fuer die Erkennbarkeit: schmaler Kopf, deutlicher Hals, abgesetzte
 * Schultern und Arme, die vom Rumpf durch eine Outline getrennt sind. Ohne
 * diese Trennung verschmilzt die Figur bei 16 Pixeln Hoehe zu einem Klumpen.
 */
const HUMANOID_TOP = [
  '...oooooo...',   // Kopf
  '..oaaaaaao..',
  '..oaeaaeao..',   // Augen
  '..oaaaaaao..',
  '..oaAAAAao..',   // Kinnpartie
  '...oaaaao...',   // Hals
  '.oooaaaaooo.',   // Schultern
  'oAaoaaaaoaAo',   // Arme aussen, Rumpf innen
  'oAaoaaaaoaAo',
  '.oAoaaaaoAo.',
  '..ooaaaaoo..',
  '...oAAAAo...'    // Guertel
];
const HUMANOID_FRAMES = [
  // Beine nebeneinander
  HUMANOID_TOP.concat(['...oao.oao..', '...oao.oao..', '..oaAo.oaAo.', '..oooo.oooo.']),
  // Beine im Schritt
  HUMANOID_TOP.concat(['..oaao.oao..', '.oaao...oao.', 'oaAo....oaAo', 'oooo....oooo'])
];

/* Flieger 14x10 */
const FLYER_FRAMES = [
  ['..oo......oo..',
   '.owwo.oo.owwo.',
   '.owwwoaaowwwo.',
   '..oowoaaowoo..',
   '....oaaaaao...',
   '...oaeaaeao...',
   '...oaaaaaao...',
   '...oAAAAAAo...',
   '....oAAAAo....',
   '.....oooo.....'],
  ['..............',
   '....oo..oo....',
   '...owwoaaowwo.',
   '..oowwoaaowwoo',
   '....oaaaaao...',
   '...oaeaaeao...',
   '...oaaaaaao...',
   '...oAAAAAAo...',
   '....oAAAAo....',
   '.....oooo.....']
];

/* Geschuetzturm 14x12 */
const TURRET_FRAMES = [
  ['....oooooo....',
   '...oaaaaaao...',
   '..oaaeaaeaao..',
   '..oaaaaaaaao..',
   'oooaaaaaaaaooo',
   'ommmaaaaaammmo',
   'ooooAAAAAAoooo',
   '..oAAAAAAAAo..',
   '..oAAAAAAAAo..',
   '.oAAAAAAAAAAo.',
   '.oAAAAAAAAAAo.',
   '.oooooooooooo.'],
  ['....oooooo....',
   '...oaaaaaao...',
   '..oaaeaaeaao..',
   '..oaaaaaaaao..',
   'oooaaaaaaaaooo',
   '.ommaaaaaammo.',
   'ooooAAAAAAoooo',
   '..oAAAAAAAAo..',
   '..oAAAAAAAAo..',
   '.oAAAAAAAAAAo.',
   '.oAAAAAAAAAAo.',
   '.oooooooooooo.']
];

/* Boss 20x24 */
const BOSS_TOP = [
  '...oo..........oo...',
  '..ohho........ohho..',
  '..ohhoo.oooo.oohho..',
  '...ohhooaaaaoohho...',
  '....ooaaaaaaaaoo....',
  '....oaaaaaaaaaao....',
  '....oaeeaaaaeeao....',
  '....oaaaaaaaaaao....',
  '....ooaaaaaaaaoo....',
  '.....oAAAAAAAAo.....',
  '..oooooaaaaaaooooo..',
  '.ommmoaaaaaaaaommmo.',
  '.ommmoaaaaaaaaommmo.',
  '.ommmoaAAAAAAaommmo.',
  '..ooo.oaaaaaao.ooo..',
  '......oaaaaaao......',
  '......oAAAAAAo......',
  '......oaaaaaao......',
  '.....oAAAAAAAAo.....'
];
const BOSS_FRAMES = [
  BOSS_TOP.concat([
   '.....oAAo..oAAo.....',
   '.....oAAo..oAAo.....',
   '.....oAAo..oAAo.....',
   '....oAAAo..oAAAo....',
   '....ooooo..ooooo....']),
  BOSS_TOP.concat([
   '....oAAAo..oAAAo....',
   '....oAAo....oAAo....',
   '...oAAo......oAAo...',
   '...oAAAo....oAAAo...',
   '...ooooo....ooooo...'])
];

/* ------------------------------------------------- Umgebung und Sonstiges */

const TILE_PAL = { M: 0x9aa4b2, m: 0x6f7889, d: 0x4a5261, D: 0x333a47, k: 0x1e222c };
const TILE_FRAMES = [[
  'MMMMMMMMMMMMMMMM',
  'mmmmmmmmmmmmmmmm',
  'dddDdddddddDdddd',
  'ddDDddddddDDdddd',
  'DDDDDDDDDDDDDDDD',
  'ddddDdddddddDddd',
  'dddDDdddddddDDdd',
  'kkkkkkkkkkkkkkkk'
]];

const LADDER_PAL = { o: 0x3a2510, L: 0xb5751f, l: 0xe0a040 };
const LADDER_FRAMES = [[
  '.oo......oo.',
  '.oL......Lo.',
  '.oLLLLLLLLo.',
  '.oLllllllLo.',
  '.oLo....oLo.',
  '.oLo....oLo.',
  '.oLo....oLo.',
  '.oLo....oLo.'
]];

const BLADE_PAL = { o: 0x9aa4b8, m: 0xeef2fb, L: 0x9a6b32, l: 0xc9903f };
const BLADE_FRAMES = [[
  '................',
  '..............oo',
  '............oomm',
  '.........ooommm.',
  '......ooommmmoo.',
  '...ooommmmmoo...',
  '.Loommmmmoo.....',
  '.Lloommmoo......',
  '..oooommoo......',
  '.....oooo.......',
  '................',
  '................'
]];


/* Portal 16x26 - drei Frames, damit der Wirbel laeuft */
const PORTAL_PAL = { o: 0x1b0a2e, r: 0x6a2ec9, m: 0xa96bff, h: 0xe4ccff, w: 0xffffff };
const PORTAL_FRAMES = [
  ['....oooooo....',
   '..oorrrrrroo..',
   '.orrmmmmmmrro.',
   'orrmmhhhhmmrro',
   'orrmhhwwhhmrro',
   'orrmhwwwwhmrro',
   'orrmhwwwwhmrro',
   'orrmhhwwhhmrro',
   'orrmmhhhhmmrro',
   'orrrmmmmmmrrro',
   'orrrrmmmmrrrro',
   '.orrrrmmrrrro.',
   '..oorrrrrroo..',
   '....oooooo....'],
  ['....oooooo....',
   '..oorrrrrroo..',
   '.orrmmmmmmrro.',
   'orrmmmhhmmmrro',
   'orrmhhwwhhmrro',
   'orrhwwwwwwhrro',
   'orrhwwwwwwhrro',
   'orrmhhwwhhmrro',
   'orrmmmhhmmmrro',
   'orrrmmmmmmrrro',
   'orrrrmmmmrrrro',
   '.orrrrmmrrrro.',
   '..oorrrrrroo..',
   '....oooooo....'],
  ['....oooooo....',
   '..oorrrrrroo..',
   '.orrmmmmmmrro.',
   'orrmhhhhhhmrro',
   'orrhhwwwwhhrro',
   'orrhwwwwwwhrro',
   'orrhwwwwwwhrro',
   'orrhhwwwwhhrro',
   'orrmhhhhhhmrro',
   'orrrmmmmmmrrro',
   'orrrrmmmmrrrro',
   '.orrrrmmrrrro.',
   '..oorrrrrroo..',
   '....oooooo....']
];

/** Erzeugt alle Texturen. Wird einmal in BootScene.preload aufgerufen. */
function buildAllTextures(scene) {
  buildSheet(scene, 'hero', 12, 18, HERO_PAL, HERO_FRAMES);
  buildSheet(scene, 'tile', 16, 8, TILE_PAL, TILE_FRAMES);
  buildSheet(scene, 'ladder', 12, 8, LADDER_PAL, LADDER_FRAMES);
  buildSheet(scene, 'portal', 14, 14, PORTAL_PAL, PORTAL_FRAMES);

  // Zweites Bodenset fuer den Serverkeller - gleiche Form, kuehle Palette.
  buildSheet(scene, 'tile_cyber', 16, 8,
    { M: 0x3f9c86, m: 0x24705f, d: 0x14453c, D: 0x0d2f2a, k: 0x061a17 },
    TILE_FRAMES);
  buildSheet(scene, 'blade', 16, 12, BLADE_PAL, BLADE_FRAMES);

  // Lebensanzeige: Frame 0 = voll, Frame 1 = leer
  buildSheet(scene, 'heart', 7, 6, { o: 0x6a1220, r: 0xe23b4a, d: 0x3a2028 }, [
    ['.oo.oo.', 'orrorro', 'orrrrro', '.rrrrr.', '..rrr..', '...r...'],
    ['.oo.oo.', 'oddoddo', 'odddddo', '.ddddd.', '..ddd..', '...d...']
  ]);

  buildSheet(scene, 'shot_player', 4, 3, { y: 0xfff09a, o: 0xe08a20 },
    [['.yyo', 'yyyo', '.yyo']]);
  buildSheet(scene, 'shot_enemy', 4, 3, { y: 0xff9a7a, o: 0xc0392b },
    [['.yyo', 'yyyo', '.yyo']]);

  // Ein Spritesheet pro Gegnertyp - gleiche Form, eigene Palette.
  for (const id in ENEMY_TYPES) {
    const t = ENEMY_TYPES[id];
    const pal = { o: 0x120f18, e: t.eye, a: t.main, A: t.dark, w: t.wing || t.main };
    if (t.shape === 'flyer') {
      buildSheet(scene, 'e_' + id, 14, 10, pal, FLYER_FRAMES);
    } else if (t.shape === 'turret') {
      pal.m = 0xb9c0cc;
      buildSheet(scene, 'e_' + id, 14, 12, pal, TURRET_FRAMES);
    } else if (t.shape === 'boss') {
      pal.m = 0xb9c0cc; pal.h = 0xe8d8b0;
      buildSheet(scene, 'e_' + id, 20, 24, pal, BOSS_FRAMES);
    } else {
      buildSheet(scene, 'e_' + id, 12, 16, pal, HUMANOID_FRAMES);
    }
  }
}
