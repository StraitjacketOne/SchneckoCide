/*
 * Level-Definition: wer steht wo.
 *
 * floor  0..5  (0 = Erdgeschoss unten, 5 = sechste Etage / Boss)
 * x      Startposition in Pixeln (Weltbreite 320)
 * from/to  optionale Patrouillengrenzen; ohne Angabe patrouilliert der Gegner
 *          zwischen den Wandbegrenzungen der Etage.
 *
 * Hier wird der Schwierigkeitsgrad gebaut: unten wenig und langsam,
 * oben dicht und aggressiv.
 */
const LEVEL = {
  playerStart: { floor: 0, x: 28 },

  enemies: [
    // Etage 1 - Einstieg, ruhig
    { type: 'grunt',   floor: 0, x: 150, from: 100, to: 240 },
    { type: 'grunt',   floor: 0, x: 230, from: 180, to: 300 },

    // Etage 2 - Tempo kommt rein
    { type: 'runner',  floor: 1, x: 120, from: 30,  to: 250 },
    { type: 'hopper',  floor: 1, x: 210, from: 150, to: 290 },

    // Etage 3 - erster Fernkampf
    { type: 'shooter', floor: 2, x: 90,  from: 60,  to: 160 },
    { type: 'grunt',   floor: 2, x: 200, from: 170, to: 290 },
    { type: 'flyer',   floor: 2, x: 250, from: 120, to: 300 },

    // Etage 4 - Druck von vorn und aus der Ecke
    { type: 'charger', floor: 3, x: 180, from: 60,  to: 290 },
    { type: 'turret',  floor: 3, x: 96 },
    { type: 'runner',  floor: 3, x: 250, from: 200, to: 300 },

    // Etage 5 - der harte Riegel vor dem Boss
    { type: 'tank',    floor: 4, x: 120, from: 70,  to: 240 },
    { type: 'climber', floor: 4, x: 220, from: 30,  to: 300 },
    { type: 'flyer',   floor: 4, x: 260, from: 100, to: 300 },
    { type: 'turret',  floor: 4, x: 288 },

    // Etage 6 - Ziel
    { type: 'boss',    floor: 5, x: 230, from: 40,  to: 290 }
  ]
};
