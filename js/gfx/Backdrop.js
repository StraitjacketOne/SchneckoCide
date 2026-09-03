/*
 * Die Kulisse: Nachthimmel, Gebaeude, Fassade.
 *
 * Bewusst ausgelagert, weil Spiel UND Titelbildschirm dasselbe Haus zeigen.
 * Alle Masse kommen aus CFG.BUILDING - wer das Layout aendert, aendert es an
 * einer Stelle und beide Bildschirme ziehen mit.
 *
 * Reihenfolge beim Aufbau:
 *   sky -> building -> (Etagenboeden) -> facade
 * Die Fassade kommt zuletzt, weil sie die Bodenkacheln an den Aussenkanten
 * abdeckt.
 */
const Backdrop = {

  /** Nachthimmel mit Sternen - alles ausserhalb des Gebaeudes. */
  sky(scene) {
    const g = scene.add.graphics().setDepth(-12);
    for (let y = 0; y < CFG.H; y++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(CFG.COLORS.SKY_TOP),
        Phaser.Display.Color.ValueToColor(CFG.COLORS.SKY_BOT),
        CFG.H, y
      );
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, y, CFG.W, 1);
    }

    const s = scene.add.graphics().setDepth(-11).fillStyle(0xbfc6e8, 0.6);
    for (let i = 0; i < 40; i++) {
      s.fillRect(Phaser.Math.Between(0, CFG.W), Phaser.Math.Between(0, CFG.BUILDING.ROOF_Y - 8), 1, 1);
    }
  },

  /** Fassade und Fenster - der Baukoerper hinter den Etagen. */
  building(scene) {
    const B = CFG.BUILDING;
    const g = scene.add.graphics().setDepth(-10);

    // Fassade mit vertikalem Verlauf: oben heller, unten dunkler
    for (let y = B.ROOF_Y; y < CFG.H; y++) {
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(B.FACE_TOP),
        Phaser.Display.Color.ValueToColor(B.FACE_BOT),
        CFG.H - B.ROOF_Y, y - B.ROOF_Y
      );
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(B.LEFT, y, B.RIGHT - B.LEFT, 1);
    }

    // Fenster reihenweise pro Etage, ein Teil davon beleuchtet
    const w = scene.add.graphics().setDepth(-9);
    CFG.FLOOR_TOPS.forEach(top => {
      for (let x = innerLeft() + 6; x < innerRight() - 12; x += 26) {
        const lit = Phaser.Math.Between(0, 4) === 0;
        w.fillStyle(lit ? B.WIN_LIT : B.WIN_DARK, lit ? 0.45 : 0.55);
        w.fillRect(x, top - 24, 10, 13);
      }
    });
  },

  /**
   * Aussenmauern, Kantenlicht und Dach. Muss ZULETZT gezeichnet werden und
   * liegt ueber den Etagenboeden, damit die Boeden sauber an der Mauer enden.
   */
  facade(scene) {
    const B = CFG.BUILDING;
    const g = scene.add.graphics().setDepth(3);

    // Himmel links und rechts wieder freilegen - die Bodenkacheln ragen darueber
    g.fillStyle(CFG.COLORS.SKY_BOT, 1);
    g.fillRect(0, 0, B.LEFT, CFG.H);
    g.fillRect(B.RIGHT, 0, CFG.W - B.RIGHT, CFG.H);

    // Aussenmauern
    g.fillStyle(B.WALL_COL, 1);
    g.fillRect(B.LEFT, B.ROOF_Y, B.WALL, CFG.H - B.ROOF_Y);
    g.fillRect(B.RIGHT - B.WALL, B.ROOF_Y, B.WALL, CFG.H - B.ROOF_Y);

    // Kantenlicht: macht den Umriss gegen den Nachthimmel sichtbar
    g.fillStyle(B.EDGE, 1);
    g.fillRect(B.LEFT, B.ROOF_Y, 1, CFG.H - B.ROOF_Y);
    g.fillRect(B.RIGHT - 1, B.ROOF_Y, 1, CFG.H - B.ROOF_Y);

    // Dachgesims, ragt beidseitig etwas ueber die Mauer hinaus
    g.fillStyle(B.WALL_COL, 1);
    g.fillRect(B.LEFT - 3, B.ROOF_Y - 4, (B.RIGHT - B.LEFT) + 6, 4);
    g.fillStyle(B.EDGE, 1);
    g.fillRect(B.LEFT - 3, B.ROOF_Y - 5, (B.RIGHT - B.LEFT) + 6, 1);
  },

  /** Etagenboeden nur als Deko (ohne Physik) - fuer den Titelbildschirm. */
  floorsDecor(scene) {
    CFG.FLOOR_TOPS.forEach(top => {
      for (let x = CFG.BUILDING.LEFT; x < CFG.BUILDING.RIGHT; x += 16) {
        scene.add.image(x + 8, top + 4, 'tile');
      }
    });
  }
};
