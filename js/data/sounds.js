/*
 * Welcher Ton gehoert zu welchem Ereignis.
 *
 * `key` verweist auf einen Eintrag in AUDIO_DATA (erzeugt aus assets/audio/
 * per `node tools/embed_audio.js`). Ein neuer Ton:
 *   1. MP3 nach assets/audio/ legen
 *   2. node tools/embed_audio.js
 *   3. hier eintragen
 *   4. an der passenden Stelle Sfx.play('name') aufrufen
 *
 * volume  0..1
 * rate    Abspielgeschwindigkeit (1 = original). Auch ein Weg, aus einer
 *         Aufnahme mehrere Varianten zu machen.
 */
const SOUNDS = {
  portal: { key: 'portal', volume: 0.75, rate: 1 }
};

/*
 * Kleiner Abspieler ueber Phasers Sound-System.
 *
 * Browser lassen Ton erst zu, nachdem der Benutzer die Seite angefasst hat.
 * Phaser entsperrt den Audiokontext selbst bei der ersten Eingabe - weil das
 * Spiel ohnehin mit einem Tastendruck startet, faellt das nicht auf. Trotzdem
 * ist jeder Aufruf abgesichert: fehlt ein Ton oder ist Audio blockiert, laeuft
 * das Spiel stumm weiter statt abzustuerzen.
 */
const Sfx = {

  /** Laedt alle Toene. Wird einmal in BootScene.preload aufgerufen. */
  preload(scene) {
    if (typeof AUDIO_DATA === 'undefined') return;
    const geladen = {};
    for (const name in SOUNDS) {
      const def = SOUNDS[name];
      if (geladen[def.key]) continue;              // jeden Ton nur einmal laden
      const daten = AUDIO_DATA[def.key];
      if (!daten) {
        console.warn('[sfx] Kein Audio fuer "' + name + '" (Key: ' + def.key + ')');
        continue;
      }
      const url = this._blobURL(daten);
      if (url) { scene.load.audio(def.key, url); geladen[def.key] = true; }
    }
  },

  /*
   * Data-URI in eine Blob-Adresse umwandeln.
   *
   * Die Data-URI direkt an load.audio zu geben scheitert: Phaser erkennt sie,
   * schickt sie aber als Zeichenkette an decodeAudioData, das einen
   * ArrayBuffer erwartet ("parameter 1 is not of type 'ArrayBuffer'").
   * Ueber eine Blob-Adresse laeuft der normale Ladeweg - und der funktioniert
   * auch bei file://, weil Blobs zur eigenen Seite gehoeren.
   */
  _blobURL(dataURI) {
    try {
      const trenner = dataURI.indexOf(',');
      const kopf = dataURI.substring(0, trenner);
      const b64 = dataURI.substring(trenner + 1);
      const typ = (kopf.match(/data:([^;]+)/) || [])[1] || 'audio/mpeg';
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type: typ }));
    } catch (e) {
      console.warn('[sfx] Audiodaten nicht lesbar: ' + e.message);
      return null;
    }
  },

  play(scene, name) {
    const def = SOUNDS[name];
    if (!def) { console.warn('[sfx] Unbekannter Ton: ' + name); return null; }
    try {
      if (!scene.cache.audio.exists(def.key)) return null;

      // Lautstaerke und Tempo werden BEI DER ERZEUGUNG mitgegeben, nicht
      // nachtraeglich per setVolume gesetzt: solange der Browser den
      // Audiokontext noch nicht freigegeben hat (vor der ersten Eingabe des
      // Spielers), laeuft setVolume ins Leere. Als Erzeugungs-Konfiguration
      // wird der Wert beim spaeteren Start korrekt uebernommen.
      const s = scene.sound.add(def.key, {
        volume: def.volume !== undefined ? def.volume : 1,
        rate: def.rate || 1
      });
      s.once('complete', () => s.destroy());   // sonst sammeln sich Instanzen
      s.play();
      return s;
    } catch (e) {
      console.warn('[sfx] konnte "' + name + '" nicht abspielen: ' + e.message);
      return null;
    }
  }
};
