/*
 * Bildmotive fuer die Graphic-Novel-Panels.
 *
 * Jedes Motiv liefert ein Array von EBENEN (Phaser-Containern), die die
 * Cutscene nacheinander einblendet - Hintergrund zuerst, Vordergrund zuletzt.
 * Genau das macht den Comic-Effekt: das Bild baut sich vor den Augen auf,
 * statt fertig dazustehen.
 *
 * Alles ist prozedural gezeichnet, damit keine Bilddateien noetig sind. Ein
 * Motiv laesst sich spaeter durch ein echtes PNG ersetzen, ohne dass die
 * Cutscene-Logik sich aendert - sie kennt nur "Ebenen".
 *
 * Ein neues Motiv: hier eine Funktion ergaenzen und in story.js unter `art`
 * referenzieren.
 */
const PanelArt = {

  /** Verlauf als Grundflaeche - Basis fast aller Motive. */
  _verlauf(scene, x, y, w, h, oben, unten) {
    const g = scene.add.graphics();
    for (let i = 0; i < h; i++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(oben),
        Phaser.Display.Color.ValueToColor(unten), h, i
      );
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(x, y + i, w, 1);
    }
    return g;
  },

  /* --------------------------------------------- Der Aufzug im 3. Stock */
  elevator(scene, x, y, w, h) {
    const cx = x + w / 2;
    const boden = y + h - 22;

    // Ebene 1: Flurwand mit Paneelfugen
    const wand = scene.add.graphics();
    wand.fillStyle(0x332d63, 1).fillRect(x, y, w, h);
    wand.fillStyle(0x3b3573, 1).fillRect(x, y, w, 14);          // Deckenband
    wand.lineStyle(1, 0x241f4a, 1);
    for (let px = x + 20; px < x + w; px += 34) {
      wand.lineBetween(px, y + 14, px, boden);                   // Fugen
    }
    wand.fillStyle(0x171331, 1).fillRect(x, boden, w, h - (boden - y));
    wand.lineStyle(1, 0x554d94, 1).lineBetween(x, boden, x + w, boden);
    const hintergrund = scene.add.container(0, 0, [wand]);

    // Ebene 2: Deckenleuchten mit Lichtkegeln auf den Boden
    const decke = scene.add.container(0, 0);
    for (const lx of [x + 46, cx, x + w - 46]) {
      decke.add(scene.add.rectangle(lx, y + 8, 22, 4, 0xfff2c4, 0.9));
      decke.add(scene.add.ellipse(lx, y + 26, 46, 26, 0xffe9a8, 0.09));
      decke.add(scene.add.ellipse(lx, boden + 4, 40, 8, 0xffe9a8, 0.12));
    }

    // Ebene 3: die offene Aufzugtuer - dahinter nichts
    const tuer = scene.add.graphics();
    tuer.fillStyle(0x8d86cf, 1).fillRect(cx - 46, y + 20, 92, boden - y - 20);
    tuer.fillStyle(0x000000, 1).fillRect(cx - 38, y + 26, 76, boden - y - 26);
    tuer.fillStyle(0xb8b2e8, 1).fillRect(cx - 46, y + 16, 92, 5);   // Sturz
    tuer.fillStyle(0x6f66b8, 1);
    tuer.fillRect(cx - 46, y + 20, 8, boden - y - 20);              // Zargen
    tuer.fillRect(cx + 38, y + 20, 8, boden - y - 20);
    // Etagenanzeige ueber der Tuer
    tuer.fillStyle(0x1a1533, 1).fillRect(cx - 12, y + 4, 24, 10);
    tuer.fillStyle(0xff5c3a, 1).fillRect(cx - 3, y + 7, 6, 4);
    const tuerL = scene.add.container(0, 0, [tuer]);

    // Ebene 4: Schein aus der Tiefe und der Held davor
    const vorn = scene.add.container(0, 0, [
      scene.add.rectangle(cx, boden - 26, 4, 52, 0x9d84ff, 0.22),
      scene.add.ellipse(cx, boden, 54, 12, 0x7a5cff, 0.4),
      // Silhouette, angeschnitten am rechten Rand - typischer Comic-Anschnitt
      scene.add.rectangle(x + w - 54, boden - 15, 14, 30, 0x07050f, 1),
      scene.add.ellipse(x + w - 54, boden - 36, 15, 15, 0x07050f, 1),
      scene.add.rectangle(x + w - 40, boden - 20, 12, 4, 0x07050f, 1)
    ]);

    return [hintergrund, decke, tuerL, vorn];
  },

  /* ------------------------------------------------ Das Portal von nahem */
  portal(scene, x, y, w, h) {
    const cx = x + w / 2, cy = y + h / 2;

    const hintergrund = scene.add.container(0, 0, [
      this._verlauf(scene, x, y, w, h, 0x33174f, 0x0d0722)
    ]);

    // Ringe nach aussen
    const ringe = scene.add.container(0, 0);
    for (let i = 4; i >= 1; i--) {
      ringe.add(scene.add.ellipse(cx, cy, 34 * i, 30 * i, 0x6a2ec9, 0.1 + i * 0.02));
    }

    const kern = scene.add.container(0, 0, [
      scene.add.ellipse(cx, cy, 54, 62, 0xa96bff, 0.9),
      scene.add.ellipse(cx, cy, 34, 40, 0xe4ccff, 0.95),
      scene.add.ellipse(cx, cy, 16, 20, 0xffffff, 1)
    ]);

    // Silhouette des Helden davor, klein - Groessenverhaeltnis erzaehlt mit
    const held = scene.add.container(0, 0, [
      scene.add.rectangle(cx - 62, y + h - 26, 10, 26, 0x05040a, 1),
      scene.add.ellipse(cx - 62, y + h - 42, 12, 12, 0x05040a, 1)
    ]);

    return [hintergrund, ringe, kern, held];
  },

  /* ------------------------------------------------- Serverschraenke */
  servers(scene, x, y, w, h) {
    const hintergrund = scene.add.container(0, 0, [
      this._verlauf(scene, x, y, w, h, 0x0b463c, 0x03191a)
    ]);

    // Schrankreihen, hinten kleiner - billige, aber wirksame Tiefe
    const hinten = scene.add.graphics();
    for (let i = 0; i < 7; i++) {
      hinten.fillStyle(0x125349, 1).fillRect(x + 14 + i * 44, y + 30, 30, h - 60);
    }
    const reiheHinten = scene.add.container(0, 0, [hinten]);

    const vorn = scene.add.graphics();
    for (let i = 0; i < 4; i++) {
      const bx = x + 8 + i * 82;
      vorn.fillStyle(0x1b6f60, 1).fillRect(bx, y + 16, 56, h - 30);
      vorn.lineStyle(1, 0x2fd8b0, 0.7).strokeRect(bx, y + 16, 56, h - 30);
    }
    const reiheVorn = scene.add.container(0, 0, [vorn]);

    // Statuslampen
    const lampen = scene.add.container(0, 0);
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 6; j++) {
        const an = Phaser.Math.Between(0, 2) > 0;
        lampen.add(scene.add.rectangle(
          x + 16 + i * 82 + (j % 2) * 34, y + 26 + Math.floor(j / 2) * 22,
          3, 3, an ? 0x5affd0 : 0x14453c, 1
        ));
      }
    }

    return [hintergrund, reiheHinten, reiheVorn, lampen];
  },

  /* ------------------------------- Zwei Wege - Bild zur Entscheidung */
  crossroads(scene, x, y, w, h) {
    const cx = x + w / 2;

    const hintergrund = scene.add.container(0, 0, [
      this._verlauf(scene, x, y, w, h, 0x24244f, 0x0b0b1e)
    ]);

    const boden = scene.add.graphics();
    boden.fillStyle(0x15152f, 1).fillRect(x, y + h - 20, w, 20);
    boden.lineStyle(1, 0x2a2a55, 1).lineBetween(x, y + h - 20, x + w, y + h - 20);
    const bodenL = scene.add.container(0, 0, [boden]);

    // Links: breites, beleuchtetes Tor. Rechts: enger, dunkler Schacht.
    const wege = scene.add.graphics();
    wege.fillStyle(0x453d80, 1).fillRect(x + 26, y + 24, 90, h - 44);
    wege.fillStyle(0xa88b3f, 0.6).fillRect(x + 38, y + 34, 66, h - 60);
    wege.fillStyle(0x1d1a3d, 1).fillRect(x + w - 96, y + 30, 54, h - 50);
    wege.fillStyle(0x000000, 1).fillRect(x + w - 86, y + 40, 34, h - 66);
    const wegeL = scene.add.container(0, 0, [wege]);

    const held = scene.add.container(0, 0, [
      scene.add.rectangle(cx, y + h - 32, 10, 24, 0x05040a, 1),
      scene.add.ellipse(cx, y + h - 47, 12, 12, 0x05040a, 1)
    ]);

    return [hintergrund, bodenL, wegeL, held];
  },

  /* --------------------------------------- Rueckweg: Treppe nach oben */
  ascent(scene, x, y, w, h) {
    const hintergrund = scene.add.container(0, 0, [
      this._verlauf(scene, x, y, w, h, 0x0d463d, 0x031513)
    ]);

    const stufen = scene.add.graphics();
    for (let i = 0; i < 7; i++) {
      stufen.fillStyle(0x246e60, 1);
      stufen.fillRect(x + 20 + i * 30, y + h - 24 - i * 16, 46, 8);
    }
    const stufenL = scene.add.container(0, 0, [stufen]);

    const licht = scene.add.container(0, 0, [
      scene.add.ellipse(x + w - 40, y + 22, 70, 44, 0xffe9a8, 0.2),
      scene.add.ellipse(x + w - 40, y + 22, 36, 24, 0xfff6d6, 0.32)
    ]);

    const held = scene.add.container(0, 0, [
      scene.add.rectangle(x + 44, y + h - 42, 10, 24, 0x03100e, 1),
      scene.add.ellipse(x + 44, y + h - 57, 12, 12, 0x03100e, 1)
    ]);

    return [hintergrund, stufenL, licht, held];
  }
};
