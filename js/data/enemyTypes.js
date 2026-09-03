/*
 * Die 10 Gegnertypen - rein datengetrieben.
 *
 * Einen elften Gegner hinzuzufuegen heisst: hier einen Eintrag ergaenzen und ihn
 * in level.js platzieren. Sprite und Verhalten entstehen automatisch.
 *
 * shape     Grundform + Groesse des Sprites: humanoid | flyer | turret | boss
 * behavior  Bewegungslogik in Enemy.js: patrol | hopper | charger | shooter |
 *           turret | flyer | climber | boss
 * main/dark/eye  Palette - macht die Typen auf einen Blick unterscheidbar
 * touchDmg  Schaden bei Beruehrung
 */
const ENEMY_TYPES = {

  grunt: {
    name: 'Wachmann', shape: 'humanoid', behavior: 'patrol',
    main: 0x8fc24a, dark: 0x54782f, eye: 0xffe36e,
    hp: 2, speed: 26, touchDmg: 1, score: 100
  },

  runner: {
    name: 'Laeufer', shape: 'humanoid', behavior: 'patrol',
    main: 0xf0873a, dark: 0xa8521f, eye: 0xfff0a0,
    hp: 1, speed: 68, touchDmg: 1, score: 150
  },

  hopper: {
    name: 'Springer', shape: 'humanoid', behavior: 'hopper',
    main: 0x3fd4b2, dark: 0x22867a, eye: 0xd8ffef,
    hp: 2, speed: 34, touchDmg: 1, score: 175,
    hopEvery: 1100, hopPower: 170
  },

  charger: {
    name: 'Stuermer', shape: 'humanoid', behavior: 'charger',
    main: 0xe04a5c, dark: 0x8f2434, eye: 0xffd0d0,
    hp: 3, speed: 30, touchDmg: 2, score: 250,
    chargeSpeed: 120, sightRange: 130
  },

  tank: {
    name: 'Panzer', shape: 'humanoid', behavior: 'patrol',
    main: 0x8a94a8, dark: 0x4d5666, eye: 0xff6b4a,
    hp: 8, speed: 14, touchDmg: 2, score: 400
  },

  shooter: {
    name: 'Schuetze', shape: 'humanoid', behavior: 'shooter',
    main: 0xab7ee0, dark: 0x6a459a, eye: 0xffe36e,
    hp: 2, speed: 22, touchDmg: 1, score: 300,
    shootCd: 1600, shotSpeed: 105, shotDmg: 1, sightRange: 200
  },

  climber: {
    name: 'Kletterer', shape: 'humanoid', behavior: 'climber',
    main: 0xefc63a, dark: 0xa2831a, eye: 0x2b1d00,
    hp: 2, speed: 40, touchDmg: 1, score: 350,
    climbSpeed: 46
  },

  flyer: {
    name: 'Drohne', shape: 'flyer', behavior: 'flyer',
    main: 0x5fc4ff, dark: 0x2f7ba8, eye: 0xff4a4a, wing: 0xbfe4f7,
    hp: 1, speed: 52, touchDmg: 1, score: 200,
    hoverHeight: 18, waveAmp: 7, waveSpeed: 0.004
  },

  turret: {
    name: 'Geschuetz', shape: 'turret', behavior: 'turret',
    main: 0xb8c2d0, dark: 0x5a6373, eye: 0xff3b30,
    hp: 3, speed: 0, touchDmg: 1, score: 250,
    shootCd: 1300, shotSpeed: 120, shotDmg: 1
  },

  boss: {
    name: 'Der Direktor', shape: 'boss', behavior: 'boss',
    main: 0xb05fd6, dark: 0x753a91, eye: 0xff3b30,
    hp: 24, speed: 34, touchDmg: 2, score: 2000,
    chargeSpeed: 105, shootCd: 1500, shotSpeed: 115, shotDmg: 1,
    volley: 3, volleyGap: 160
  }
};
