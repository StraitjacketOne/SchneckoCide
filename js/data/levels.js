/*
 * Die Level.
 *
 * Ein Level beschreibt eine komplette Welt: Etagenraster, Leitern, Optik,
 * Gegner, Startpunkt und Portale. Alles, was frueher fest in config.js stand,
 * kann hier pro Level ueberschrieben werden - fehlt ein Feld, gilt der
 * Standardwert aus CFG.
 *
 * Ein neues Level anlegen = einen Eintrag hier ergaenzen und ein Portal
 * dorthin zeigen lassen. Sonst nichts.
 *
 * FELDER
 *   id, name       Kennung und Anzeigename (wird beim Betreten eingeblendet)
 *   floors         Oberkanten der Etagenboeden, unten zuerst
 *   ladders        { x, from } - verbindet Etage `from` mit der darueber
 *   tileKey        Textur der Boeden ('tile' oder 'tile_cyber')
 *   theme          ueberschreibt CFG.COLORS / CFG.BUILDING / CFG.SIGN
 *   playerStart    { floor, x }
 *   enemies        wie gehabt
 *   portals        { floor, x, to, toFloor, toX } - `to` ist der Level-Index
 *   bossEndsGame   true = Boss besiegen gewinnt das Spiel
 */
const LEVELS = [

  /* ------------------------------------------------ 0: das Hochhaus */
  {
    id: 'tower',
    name: 'KINDE$WOOLWORTH INC.',

    floors: [256, 222, 188, 154, 120, 86],
    ladders: [
      { x: 276, from: 0 },
      { x: 44,  from: 1 },
      { x: 276, from: 2 },
      { x: 44,  from: 3 },
      { x: 160, from: 4 }
    ],
    tileKey: 'tile',
    theme: {},                       // nutzt die Standardwerte aus CFG

    playerStart: { floor: 0, x: 28 },
    bossEndsGame: true,

    // Der Lastenaufzug im dritten Stock - fuehrt in den Serverkeller.
    portals: [
      { floor: 2, x: 150, to: 1, toFloor: 0, toX: 40, story: 'enter_datacenter' }
    ],

    enemies: [
      { type: 'grunt',   floor: 0, x: 150, from: 100, to: 240 },
      { type: 'grunt',   floor: 0, x: 230, from: 180, to: 300 },

      { type: 'runner',  floor: 1, x: 120, from: 30,  to: 250 },
      { type: 'hopper',  floor: 1, x: 210, from: 150, to: 290 },

      { type: 'shooter', floor: 2, x: 90,  from: 60,  to: 130 },
      { type: 'grunt',   floor: 2, x: 210, from: 180, to: 290 },
      { type: 'flyer',   floor: 2, x: 250, from: 190, to: 300 },

      { type: 'charger', floor: 3, x: 180, from: 60,  to: 290 },
      { type: 'turret',  floor: 3, x: 96 },
      { type: 'runner',  floor: 3, x: 250, from: 200, to: 300 },

      { type: 'tank',    floor: 4, x: 120, from: 70,  to: 240 },
      { type: 'climber', floor: 4, x: 220, from: 30,  to: 300 },
      { type: 'flyer',   floor: 4, x: 260, from: 100, to: 300 },
      { type: 'turret',  floor: 4, x: 288 },

      { type: 'boss',    floor: 5, x: 230, from: 40,  to: 290 }
    ]
  },

  /* ------------------------------------- 1: der Serverkeller darunter */
  {
    id: 'datacenter',
    name: 'NODE 7 :: KERNEL',

    // Nur vier Ebenen, dafuer deutlich hoehere Raeume - fuehlt sich sofort
    // anders an als der enge Buerotturm.
    floors: [256, 208, 160, 112],
    ladders: [
      { x: 60,  from: 0 },
      { x: 260, from: 1 },
      { x: 60,  from: 2 }
    ],
    tileKey: 'tile_cyber',

    theme: {
      COLORS: { SKY_TOP: 0x01100d, SKY_BOT: 0x04231d },
      BUILDING: {
        ROOF_Y: 84,
        FACE_TOP: 0x0b3330, FACE_BOT: 0x05191a,
        EDGE: 0x2fd8b0, WALL_COL: 0x07231f,
        WIN_DARK: 0x0d3a36, WIN_LIT: 0x2f9f86
      },
      SIGN: {
        TEXT: 'NODE 7 :: KERNEL',
        COLOR: '#dcfff5', GLOW: '#00e6b0',
        FLICKER_CHAR: 8
      }
    },

    playerStart: { floor: 0, x: 40 },
    bossEndsGame: false,

    // Rueckweg ganz oben - man muss sich erst hochkaempfen.
    portals: [
      { floor: 3, x: 250, to: 0, toFloor: 2, toX: 176, story: 'leave_datacenter' }
    ],

    enemies: [
      { type: 'flyer',   floor: 0, x: 200, from: 80,  to: 300 },
      { type: 'runner',  floor: 0, x: 150, from: 90,  to: 290, skipIf: 'leise' },
      { type: 'grunt',   floor: 0, x: 240, from: 120, to: 300, onlyIf: 'laut' },

      { type: 'turret',  floor: 1, x: 140, skipIf: 'leise' },
      { type: 'hopper',  floor: 1, x: 220, from: 110, to: 300 },
      { type: 'flyer',   floor: 1, x: 100, from: 30,  to: 240 },

      { type: 'shooter', floor: 2, x: 200, from: 150, to: 290 },
      { type: 'climber', floor: 2, x: 120, from: 30,  to: 300 },

      { type: 'tank',    floor: 3, x: 140, from: 90,  to: 230 },
      { type: 'charger', floor: 3, x: 200, from: 100, to: 300 }
    ]
  }
];
