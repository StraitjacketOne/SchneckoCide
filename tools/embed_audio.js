/*
 * Bettet die Audiodateien aus assets/audio/ in eine JS-Datei ein.
 *
 *   node tools/embed_audio.js
 *
 * WARUM NICHT EINFACH NACHLADEN?
 * Weil das Spiel per Doppelklick auf index.html laufen soll. Bei einer
 * file://-Adresse blockiert der Browser das Nachladen von Dateien - eine
 * nachgeladene MP3 waere dann still, ohne erkennbaren Fehler. Als Data-URI
 * im Skript ist der Ton Teil der Seite und funktioniert ueberall.
 *
 * Kosten: Base64 macht die Daten rund ein Drittel groesser. Bei kurzen
 * Effekten ist das kein Thema. Fuer lange Musikstuecke waere ein echter
 * Ladevorgang (und damit ein Webserver) die bessere Wahl.
 *
 * Ablauf: MP3 nach assets/audio/ legen, dieses Skript laufen lassen, den
 * Namen in js/data/sounds.js eintragen.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const quelle = path.join(root, 'assets', 'audio');
const ziel = path.join(root, 'js', 'data', 'audioData.js');

const TYPEN = { '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4' };

if (!fs.existsSync(quelle)) {
  console.error('Ordner fehlt: assets/audio/');
  process.exit(1);
}

const dateien = fs.readdirSync(quelle).filter(f => TYPEN[path.extname(f).toLowerCase()]);
if (dateien.length === 0) {
  console.error('Keine Audiodateien in assets/audio/ gefunden.');
  process.exit(1);
}

let out = `/*
 * AUTOMATISCH ERZEUGT von tools/embed_audio.js - nicht von Hand aendern.
 * Quelle: assets/audio/    Neu erzeugen: node tools/embed_audio.js
 *
 * Die Toene stecken als Data-URI direkt hier drin, damit das Spiel auch per
 * Doppelklick auf index.html laeuft (siehe Kommentar im Erzeugerskript).
 */
const AUDIO_DATA = {
`;

let gesamt = 0;
dateien.forEach((f, i) => {
  const key = path.basename(f, path.extname(f));
  const typ = TYPEN[path.extname(f).toLowerCase()];
  const daten = fs.readFileSync(path.join(quelle, f));
  gesamt += daten.length;
  out += `  '${key}': '${'data:' + typ + ';base64,' + daten.toString('base64')}'`;
  out += (i < dateien.length - 1 ? ',\n' : '\n');
  console.log(`  ${f} -> '${key}'  (${(daten.length / 1024).toFixed(1)} KB)`);
});

out += '};\n';
fs.writeFileSync(ziel, out);

console.log(`\n${dateien.length} Datei(en), ${(gesamt / 1024).toFixed(1)} KB Rohdaten`);
console.log(`geschrieben: js/data/audioData.js (${(fs.statSync(ziel).size / 1024).toFixed(1)} KB)`);
