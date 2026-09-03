/*
 * Projektil fuer Spieler und Gegner.
 *
 * Wird ueber einen Pool wiederverwendet (group.get()), damit bei laengeren
 * Feuergefechten keine Objekte am laufenden Band erzeugt und verworfen werden.
 */
class Bullet extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y) {
    super(scene, x, y, 'shot_player', 0);
    this.fromPlayer = true;
    this.dmg = 1;
    this.dieAt = 0;
  }

  fire(x, y, vx, vy, fromPlayer, dmg) {
    this.fromPlayer = fromPlayer;
    this.dmg = dmg;

    this.setTexture(fromPlayer ? 'shot_player' : 'shot_enemy');
    this.enableBody(true, x, y, true, true);
    this.body.setAllowGravity(false);
    this.body.setSize(4, 3);
    this.setVelocity(vx, vy);
    this.setFlipX(vx < 0);
    this.setDepth(6);

    this.dieAt = this.scene.time.now + CFG.BULLET.LIFE_MS;
  }

  update() {
    if (!this.active) return;
    if (this.scene.time.now > this.dieAt ||
        this.x < -8 || this.x > CFG.W + 8 || this.y < -8 || this.y > CFG.H + 8) {
      this.kill();
    }
  }

  kill() {
    if (!this.active) return;
    this.setVelocity(0, 0);
    this.disableBody(true, true);
  }
}
