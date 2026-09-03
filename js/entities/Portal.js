/*
 * Portal - der Uebergang in ein anderes Level.
 *
 * Bewusst ohne Physik-Koerper: die Beruehrung wird in GameScene.update per
 * Rechteck geprueft, genau wie beim Schwert. Das ist berechenbarer als ein
 * Overlap-Callback und hat keine Ueberraschungen mit der Argumentreihenfolge.
 *
 * Das Ziel steht in der Level-Definition (levels.js):
 *   { floor, x, to, toFloor, toX }
 */
class Portal {

  static createAnims(scene) {
    if (scene.anims.exists('portal_spin')) return;
    scene.anims.create({
      key: 'portal_spin',
      frames: scene.anims.generateFrameNumbers('portal', { frames: [0, 1, 2, 1] }),
      frameRate: 8, repeat: -1
    });
  }

  constructor(scene, def) {
    this.scene = scene;
    this.def = def;

    const foot = floorTop(def.floor);
    this.y = foot - 7;                 // Sprite ist 14 hoch, steht auf dem Boden
    this.x = def.x;

    // Schein hinter dem Portal, damit es auch aus der Ferne auffaellt
    this.halo = scene.add.ellipse(this.x, this.y, 26, 30, 0x8b4cff, 0.22).setDepth(1);
    scene.tweens.add({
      targets: this.halo, scaleX: 1.25, scaleY: 1.15, alpha: 0.1,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut'
    });

    this.sprite = scene.add.sprite(this.x, this.y, 'portal', 0).setDepth(2);
    this.sprite.play('portal_spin');
  }

  /** Trefferzone fuer die Beruehrungspruefung. */
  rect() {
    return new Phaser.Geom.Rectangle(this.x - 7, this.y - 7, 14, 14);
  }
}
