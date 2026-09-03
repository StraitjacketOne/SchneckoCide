/* Zentrale Tuning-Werte. Balancing passiert hier, nicht im Code verstreut. */
const CFG = {
  // Interne Pixelauflösung. Wird per ZOOM hochskaliert -> echter 16-Bit-Look.
  W: 320,
  H: 264,
  ZOOM: 3,

  GRAVITY: 520,

  // Etagen: Oberkante des Bodens, Index 0 = Etage 1 (unten).
  // Hier haengt das gesamte Layout dran - Leitern, Gegner-Spawns, Hintergrund
  // und Etagenanzeige leiten sich daraus ab. Eine Etage tiefer/hoeher legen
  // heisst: hier eine Zahl aendern, sonst nichts.
  FLOOR_TOPS: [256, 222, 188, 154, 120, 86],
  FLOOR_H: 8,          // Dicke der Bodenplatte
  FLOOR_GAP: 34,       // Abstand zwischen zwei Etagen (nur informativ)

  // Umriss des Gebaeudes. Links und rechts bleibt Nachthimmel stehen, damit
  // man sieht, dass da ein Haus steht und nicht nur Etagen schweben.
  BUILDING: {
    LEFT: 6,           // linke Aussenkante
    RIGHT: 314,        // rechte Aussenkante
    WALL: 5,           // Dicke der Aussenmauer (Spielflaeche liegt dazwischen)
    ROOF_Y: 58,        // Oberkante des Dachs (muss ueber dem Boss liegen)
    FACE_TOP: 0x1f1b40, // Fassade oben
    FACE_BOT: 0x131029, // Fassade unten
    EDGE: 0x6a5fa8,     // Kantenlicht an den Aussenkanten
    WALL_COL: 0x1d1938, // Aussenmauer
    WIN_DARK: 0x2a2652, // dunkles Fenster
    WIN_LIT: 0x60502a   // erleuchtetes Fenster
  },

  // Die Leuchtreklame auf dem Dach. TEXT aendern reicht - Breite, Rahmen und
  // Halterung richten sich automatisch danach.
  SIGN: {
    TEXT: 'KINDE$WOOLWORTH INC.',
    Y: 38,               // Hoehe der Schrift
    SIZE: 10,
    COLOR: '#ffd9f2',    // heller Kern der Neonroehre
    GLOW: '#ff2f9e',     // farbiger Schimmer drumherum
    FLICKER_CHAR: 5      // dieses Zeichen ist defekt und zuckt eigenstaendig
  },

  PLAYER: {
    W: 12, H: 18,
    SPEED: 78,
    JUMP: 195,
    CLIMB_SPEED: 52,
    HP: 6,
    INVULN_MS: 900,      // Unverwundbarkeit nach Treffer
    KNOCKBACK: 90,

    SWORD_CD: 320,       // ms zwischen zwei Hieben
    SWORD_ACTIVE: 110,   // ms, in denen die Hitbox trifft
    SWORD_REACH: 14,
    SWORD_TALL: 14,
    SWORD_DMG: 3,

    SHOT_CD: 260,
    SHOT_SPEED: 180,
    SHOT_DMG: 1
  },

  BULLET: { W: 4, H: 3, LIFE_MS: 1400 },

  // Leitern: verbinden Etage `from` (0-basiert) mit der Etage darueber.
  // Abwechselnd links/rechts = Donkey-Kong-Zickzack, letzte mittig zum Boss.
  LADDERS: [
    { x: 276, from: 0 },
    { x: 44,  from: 1 },
    { x: 276, from: 2 },
    { x: 44,  from: 3 },
    { x: 160, from: 4 }
  ],
  LADDER_W: 12,

  COLORS: {
    SKY_TOP: 0x06050e,   // Nachthimmel oben
    SKY_BOT: 0x191033,   // Nachthimmel unten
    HUD: '#8ce8d0'
  }
};

/** Linke Innenkante des Gebaeudes - hier faengt die Spielflaeche an. */
function innerLeft() { return CFG.BUILDING.LEFT + CFG.BUILDING.WALL; }

/** Rechte Innenkante des Gebaeudes. */
function innerRight() { return CFG.BUILDING.RIGHT - CFG.BUILDING.WALL; }

/**
 * Horizontale Mitte des GEBAEUDES - Bezugspunkt fuer alles Zentrierte.
 * Bewusst nicht CFG.W/2: verschiebt man das Haus im Bild (LEFT/RIGHT), soll
 * die Leuchtreklame mitwandern statt auf der Bildmitte kleben zu bleiben.
 */
function centerX() { return (CFG.BUILDING.LEFT + CFG.BUILDING.RIGHT) / 2; }

/** Y-Koordinate, auf der eine Figur auf Etage `i` mit den Fuessen steht. */
function floorTop(i) { return CFG.FLOOR_TOPS[i]; }

/** Etagen-Index (0..5) fuer eine gegebene Fuss-Y-Position. */
function floorIndexOf(footY) {
  let best = 0, bestD = Infinity;
  for (let i = 0; i < CFG.FLOOR_TOPS.length; i++) {
    const d = Math.abs(CFG.FLOOR_TOPS[i] - footY);
    if (d < bestD) { bestD = d; best = i; }
  }
  return best;
}

/* -------------------------------------------------------- Level-Umschaltung */

/*
 * Die Standardwerte werden EINMAL kopiert, bevor ein Level sie ueberschreibt.
 * Ohne diese Kopie wuerden sich die Themes beim Hin- und Herwechseln
 * uebereinanderschichten und das Hochhaus haette irgendwann Serverkeller-Farben.
 */
const CFG_DEFAULTS = JSON.parse(JSON.stringify({
  COLORS: CFG.COLORS,
  BUILDING: CFG.BUILDING,
  SIGN: CFG.SIGN,
  FLOOR_TOPS: CFG.FLOOR_TOPS,
  LADDERS: CFG.LADDERS
}));

/**
 * Uebernimmt Etagenraster, Leitern und Optik eines Levels in CFG.
 * Alles, was das Level nicht angibt, faellt auf den Standardwert zurueck.
 * Muss vor dem Aufbau der Szene laufen - danach lesen alle Zeichenroutinen
 * einfach wie gewohnt aus CFG.
 */
function applyLevel(level) {
  CFG.FLOOR_TOPS = level.floors  || CFG_DEFAULTS.FLOOR_TOPS.slice();
  CFG.LADDERS    = level.ladders || CFG_DEFAULTS.LADDERS.slice();

  const t = level.theme || {};
  CFG.COLORS   = Object.assign({}, CFG_DEFAULTS.COLORS,   t.COLORS   || {});
  CFG.BUILDING = Object.assign({}, CFG_DEFAULTS.BUILDING, t.BUILDING || {});
  CFG.SIGN     = Object.assign({}, CFG_DEFAULTS.SIGN,     t.SIGN     || {});
}
