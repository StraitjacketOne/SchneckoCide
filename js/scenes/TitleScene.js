/*
 * Titelbildschirm.
 *
 * Zeigt dieselbe Kulisse wie das Spiel (Backdrop) samt Leuchtreklame - der
 * Spieler sieht sofort, wo er gleich hineingeht. Alle Positionen leiten sich
 * aus CFG ab, damit der Titel bei Layout-Aenderungen nicht verrutscht.
 */
class TitleScene extends Phaser.Scene {

  constructor() { super('title'); }

  create() {
    Backdrop.sky(this);
    Backdrop.building(this);
    Backdrop.floorsDecor(this);
    Backdrop.facade(this);

    this.sign = new NeonSign(this, CFG.SIGN, CFG.BUILDING.ROOF_Y - 5);

    // Das Haus abdunkeln, damit die Schrift darauf lesbar bleibt.
    const top = CFG.BUILDING.ROOF_Y + 6;
    this.add.rectangle(CFG.W / 2, top + (CFG.H - top) / 2, CFG.W, CFG.H - top, 0x05040c, 0.78)
      .setDepth(10);

    /*
     * Positionierung relativ statt absolut:
     *   mid  = Mitte des Gebaeudes (nicht des Bildschirms)
     *   at() = Anteil der nutzbaren Hoehe zwischen Dach und Unterkante
     * Dadurch bleibt der Aufbau stimmig, wenn sich CFG.H oder die Dachhoehe
     * aendern. Nur der Zeilenabstand der Liste bleibt absolut - der haengt an
     * der Schriftgroesse, nicht an der Flaeche.
     */
    const mid = centerX();
    const usable = CFG.H - top;
    const at = f => Math.round(top + usable * f);

    this.add.text(mid, at(0.13), 'SCHNECKOCIDE', {
      fontFamily: 'monospace', fontSize: '20px', color: '#8ce8d0'
    }).setOrigin(0.5).setDepth(11);

    this.add.text(mid, at(0.25), 'Sechs Etagen. Ein Ausweg nach oben.', {
      fontFamily: 'monospace', fontSize: '8px', color: '#9aa4b2'
    }).setOrigin(0.5).setDepth(11);

    const lines = [
      'PFEILTASTEN / WASD   laufen',
      'HOCH / RUNTER        an der Leiter klettern',
      'LEERTASTE            springen',
      'J                    Schwert',
      'K                    schiessen',
      'R                    Neustart'
    ];
    // Die Zeilen stehen linksbuendig zueinander (sonst verrutschen die Spalten),
    // der Block als Ganzes wird aber exakt horizontal zentriert. Dafuer erst
    // erzeugen, dann die breiteste Zeile messen und alle darauf ausrichten -
    // ein geschaetzter Randwert waere bei jeder Textaenderung wieder schief.
    const items = lines.map((t, i) =>
      this.add.text(0, at(0.40) + i * 12, t, {
        fontFamily: 'monospace', fontSize: '8px', color: '#d8dde8'
      }).setOrigin(0, 0.5).setDepth(11)
    );
    const blockW = Math.max(...items.map(t => t.width));
    items.forEach(t => t.setX(Math.round(mid - blockW / 2)));

    const start = this.add.text(mid, at(0.90), 'LEERTASTE ZUM START', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffe36e'
    }).setOrigin(0.5).setDepth(11);

    this.tweens.add({ targets: start, alpha: 0.25, duration: 620, yoyo: true, repeat: -1 });

    this.input.keyboard.once('keydown-SPACE', () => this.scene.start('game'));
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('game'));
  }

  update(time) {
    this.sign.update(time);      // die Reklame flackert auch im Titel
  }
}
