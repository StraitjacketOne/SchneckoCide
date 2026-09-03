/*
 * Der Protagonist.
 *
 * Kletter-Prinzip (Donkey Kong): Leitern sind KEINE Physik-Koerper, sondern
 * einfache Rechtecke. Waehrend des Kletterns wird die Kollision mit den
 * Etagenboeden abgeschaltet - dadurch klettert die Figur sauber durch den Boden
 * hindurch, ohne dass Luecken in die Etagen gebaut werden muessen. Das ist die
 * fehlerunanfaelligste Variante.
 */
class Player extends Phaser.Physics.Arcade.Sprite {

  static createAnims(scene) {
    const a = scene.anims;
    if (a.exists('hero_idle')) return;
    a.create({ key: 'hero_idle',  frames: [{ key: 'hero', frame: 0 }], frameRate: 1 });
    a.create({ key: 'hero_run',   frames: a.generateFrameNumbers('hero', { frames: [1, 2] }), frameRate: 9,  repeat: -1 });
    a.create({ key: 'hero_jump',  frames: [{ key: 'hero', frame: 3 }], frameRate: 1 });
    a.create({ key: 'hero_slash', frames: [{ key: 'hero', frame: 4 }], frameRate: 1 });
    a.create({ key: 'hero_climb', frames: a.generateFrameNumbers('hero', { frames: [5, 6] }), frameRate: 7, repeat: -1 });
  }

  constructor(scene, x, y) {
    super(scene, x, y, 'hero', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.body.setSize(8, 17).setOffset(2, 1);

    this.hp = CFG.PLAYER.HP;
    this.facing = 1;              // 1 = rechts, -1 = links

    this.climbing = false;
    this.ladder = null;

    this.swordUntil = 0;          // solange trifft die Klinge
    this.swordReady = 0;          // Cooldown
    this.shotReady = 0;
    this.invulnUntil = 0;
    this.lastGrounded = 0;        // fuer Coyote-Time

    this.alive = true;

    // Die Klinge ist ein eigenes Sprite - so kann sie weiter reichen als der Held breit ist.
    this.blade = scene.add.sprite(x, y, 'blade', 0).setVisible(false).setDepth(6);
  }

  /* ------------------------------------------------------------ Bewegung */

  update(time, keys) {
    if (!this.alive) return;

    const P = CFG.PLAYER;
    const left  = keys.left.isDown;
    const right = keys.right.isDown;
    const up    = keys.up.isDown;
    const down  = keys.down.isDown;

    if (left)  this.facing = -1;
    if (right) this.facing = 1;

    if (this.climbing) this.updateClimbing(up, down, keys);
    else               this.updateWalking(time, left, right, up, down, keys);

    // Angriffe gehen in beiden Zustaenden
    if (Phaser.Input.Keyboard.JustDown(keys.attack)) this.swing(time);
    if (keys.shoot.isDown) this.shoot(time);

    this.updateBlade(time);
    this.updateAnim(time);
  }

  updateWalking(time, left, right, up, down, keys) {
    const P = CFG.PLAYER;
    this.body.setAllowGravity(true);

    if (left)       this.setVelocityX(-P.SPEED);
    else if (right) this.setVelocityX(P.SPEED);
    else            this.setVelocityX(0);

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) this.lastGrounded = time;

    // Coyote-Time: kurz nach dem Verlassen der Kante zaehlt der Sprung noch.
    if (Phaser.Input.Keyboard.JustDown(keys.jump) && time - this.lastGrounded < 110) {
      this.setVelocityY(-P.JUMP);
      this.lastGrounded = 0;
    }

    // Leiter betreten
    if (up) {
      const l = this.scene.ladderAt(this.body);
      if (l && this.body.bottom > l.top + 6) this.enterLadder(l);
    } else if (down && onGround) {
      const l = this.scene.ladderBelow(this.body);
      if (l) this.enterLadder(l);
    }
  }

  updateClimbing(up, down, keys) {
    const P = CFG.PLAYER;
    this.body.setAllowGravity(false);
    this.setVelocityX(0);

    if (up)        this.setVelocityY(-P.CLIMB_SPEED);
    else if (down) this.setVelocityY(P.CLIMB_SPEED);
    else           this.setVelocityY(0);

    // Vom Leiter abspringen
    if (Phaser.Input.Keyboard.JustDown(keys.jump)) {
      this.leaveLadder();
      this.setVelocityY(-P.JUMP * 0.7);
      return;
    }

    const l = this.ladder;
    // Oben angekommen -> auf die Etage stellen
    if (this.body.bottom <= l.top + 1) {
      this.leaveLadder();
      this.snapFeetTo(l.top);
      this.setVelocityY(0);
    }
    // Unten angekommen -> Gravitation uebernimmt
    else if (this.body.bottom >= l.bottom - 1) {
      this.leaveLadder();
      this.snapFeetTo(l.bottom - 2);
    }
  }

  /** Setzt die Figur so, dass ihre Fuesse exakt auf y stehen. */
  snapFeetTo(y) {
    const feetOffset = this.body.offset.y + this.body.height - this.height / 2;
    this.setY(y - feetOffset);
    this.body.updateFromGameObject();
  }

  enterLadder(l) {
    this.climbing = true;
    this.ladder = l;
    this.setX(l.x);
    this.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.scene.setPlatformCollision(false);
  }

  leaveLadder() {
    this.climbing = false;
    this.ladder = null;
    this.body.setAllowGravity(true);
    this.scene.setPlatformCollision(true);
  }

  /* -------------------------------------------------------------- Kampf */

  swing(time) {
    if (time < this.swordReady) return;
    this.swordReady = time + CFG.PLAYER.SWORD_CD;
    this.swordUntil = time + CFG.PLAYER.SWORD_ACTIVE;
    this.scene.onSwordSwing();          // leert die "schon getroffen"-Liste
  }

  get swordActive() { return this.scene.time.now < this.swordUntil; }

  /** Trefferzone des Schwerts als Rechteck - wird von der Scene geprueft. */
  swordRect() {
    const P = CFG.PLAYER;
    const x = this.facing === 1 ? this.body.right : this.body.left - P.SWORD_REACH;
    return new Phaser.Geom.Rectangle(x, this.body.center.y - P.SWORD_TALL / 2, P.SWORD_REACH, P.SWORD_TALL);
  }

  updateBlade(time) {
    if (!this.swordActive) { this.blade.setVisible(false); return; }
    this.blade.setVisible(true);
    this.blade.setFlipX(this.facing === -1);
    this.blade.setPosition(this.x + this.facing * 10, this.y + 1);
  }

  shoot(time) {
    if (time < this.shotReady) return;
    this.shotReady = time + CFG.PLAYER.SHOT_CD;
    this.scene.spawnBullet(
      this.x + this.facing * 8, this.body.center.y - 2,
      this.facing * CFG.PLAYER.SHOT_SPEED, 0,
      true, CFG.PLAYER.SHOT_DMG
    );
  }

  /* ------------------------------------------------------------- Schaden */

  hurt(dmg, fromX) {
    const time = this.scene.time.now;
    if (!this.alive || time < this.invulnUntil) return false;

    this.hp -= dmg;
    this.invulnUntil = time + CFG.PLAYER.INVULN_MS;

    // Rueckstoss weg von der Schadensquelle
    const dir = (fromX !== undefined && fromX > this.x) ? -1 : 1;
    if (this.climbing) this.leaveLadder();
    this.setVelocity(dir * CFG.PLAYER.KNOCKBACK, -110);

    this.scene.cameras.main.shake(140, 0.006);
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => this.clearTint());

    // Blinken waehrend der Unverwundbarkeit
    this.scene.tweens.add({
      targets: this, alpha: 0.25, duration: 90,
      yoyo: true, repeat: Math.floor(CFG.PLAYER.INVULN_MS / 180),
      onComplete: () => this.setAlpha(1)
    });

    if (this.hp <= 0) this.die();
    return true;
  }

  die() {
    this.alive = false;
    this.hp = 0;
    this.blade.setVisible(false);
    this.setTint(0x884444);
    this.setVelocity(0, -140);
    this.body.setAllowGravity(true);
    this.scene.onPlayerDead();
  }

  /* ---------------------------------------------------------- Darstellung */

  updateAnim(time) {
    this.setFlipX(this.facing === -1);

    if (this.climbing) {
      if (this.body.velocity.y !== 0) this.play('hero_climb', true);
      else { this.stop(); this.setFrame(5); }
      return;
    }
    if (this.swordActive) { this.play('hero_slash', true); return; }

    const onGround = this.body.blocked.down || this.body.touching.down;
    if (!onGround)                    this.play('hero_jump', true);
    else if (this.body.velocity.x !== 0) this.play('hero_run', true);
    else                              this.play('hero_idle', true);
  }
}
