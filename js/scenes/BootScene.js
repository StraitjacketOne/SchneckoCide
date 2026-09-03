/*
 * Erzeugt alle Texturen und startet den Titelbildschirm.
 *
 * Wenn du spaeter echte PNG-Sprites verwendest, kommen die load-Aufrufe hier
 * hinein und der Aufruf von buildAllTextures() faellt weg.
 */
class BootScene extends Phaser.Scene {

  constructor() { super('boot'); }

  preload() {
    buildAllTextures(this);
  }

  create() {
    this.scene.start('title');
  }
}
