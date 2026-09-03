/*
 * Ein Gegner fuer alle zehn Typen.
 *
 * Was der Gegner tut, steht in ENEMY_TYPES[...].behavior. Neue Verhaltensweisen
 * kommen als weiterer case in behave() dazu - die Klasse selbst muss nicht
 * umgebaut werden.
 */
class Enemy extends Phaser.Physics.Arcade.Sprite {

  static createAnims(scene) {
    for (const id in ENEMY_TYPES) {
      const key = 'e_' + id;
      if (scene.anims.exists(key + '_move')) continue;
      scene.anims.create({
        key: key + '_move',
        frames: scene.anims.generateFrameNumbers(key, { frames: [0, 1] }),
        frameRate: 6, repeat: -1
      });
    }
  }

  constructor(scene, spawn) {
    const t = ENEMY_TYPES[spawn.type];
    const foot = floorTop(spawn.floor);
    super(scene, spawn.x, foot - 20, 'e_' + spawn.type, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.typeId = spawn.type;
    this.def = t;
    this.hp = t.hp;
    this.maxHp = t.hp;
    this.floor = spawn.floor;
    this.dir = -1;
    this.alive = true;

    // Patrouillengrenzen (Default: gesamte Etagenbreite)
    this.minX = spawn.from !== undefined ? spawn.from : innerLeft() + 8;
    this.maxX = spawn.to   !== undefined ? spawn.to   : innerRight() - 8;

    // Trefferbox etwas kleiner als der Sprite - fuehlt sich fairer an.
    if (t.shape === 'flyer')       this.body.setSize(12, 8).setOffset(1, 1);
    else if (t.shape === 'turret') this.body.setSize(12, 11).setOffset(1, 1);
    else if (t.shape === 'boss')   this.body.setSize(16, 23).setOffset(2, 1);
    else                           this.body.setSize(10, 15).setOffset(1, 1);

    this.setCollideWorldBounds(true);

    if (t.behavior === 'flyer') {
      this.body.setAllowGravity(false);
      // Schwebehoehe: muss so tief liegen, dass ein stehender Schuss die Drohne
      // am unteren Wellenpunkt trifft - sonst fliegen alle Kugeln darunter durch.
      this.baseY = foot - (t.hoverHeight || 18);
      this.setY(this.baseY);
    } else if (t.behavior === 'turret') {
      // Der Turm steht fest. Ohne Gravitation braucht er die Bodenkollision
      // nicht - ein immovable Koerper wird von statischen Boeden naemlich
      // nicht getragen und faellt sonst durch die Etage.
      this.body.setAllowGravity(false);
      this.body.setImmovable(true);
      this.setVelocityX(0);
    }

    // Auf die Etage stellen
    if (t.behavior !== 'flyer') {
      const feetOffset = this.body.offset.y + this.body.height - this.height / 2;
      this.setY(foot - feetOffset);
    }

    this.nextShot = scene.time.now + Phaser.Math.Between(400, 1400);
    this.nextHop  = scene.time.now + Phaser.Math.Between(300, 1200);
    this.climbState = 'walk';
    this.climbLadder = null;

    this.play('e_' + spawn.type + '_move');
  }

  /* --------------------------------------------------------- Verhalten */

  update(time, delta, player, playerFloor) {
    if (!this.alive) return;
    this.behave(time, delta, player, playerFloor);
    this.setFlipX(this.dir === 1);
  }

  behave(time, delta, player, playerFloor) {
    const t = this.def;
    const sameFloor = playerFloor === this.floor;

    switch (t.behavior) {

      case 'patrol':
        this.patrol(t.speed);
        break;

      case 'hopper':
        this.patrol(t.speed);
        if (time > this.nextHop && this.onGround()) {
          this.setVelocityY(-t.hopPower);
          this.nextHop = time + t.hopEvery;
        }
        break;

      case 'charger': {
        const d = player.x - this.x;
        if (sameFloor && Math.abs(d) < t.sightRange) {
          this.dir = d > 0 ? 1 : -1;
          this.setVelocityX(this.dir * t.chargeSpeed);
          this.setTint(0xffbbbb);
        } else {
          this.clearTint();
          this.patrol(t.speed);
        }
        break;
      }

      case 'shooter': {
        const d = player.x - this.x;
        if (sameFloor && Math.abs(d) < t.sightRange) {
          this.setVelocityX(0);
          this.dir = d > 0 ? 1 : -1;
          if (time > this.nextShot) {
            this.fireAt(this.dir, t);
            this.nextShot = time + t.shootCd;
          }
        } else {
          this.patrol(t.speed);
        }
        break;
      }

      case 'turret':
        this.setVelocityX(0);
        if (sameFloor && time > this.nextShot) {
          this.dir = player.x > this.x ? 1 : -1;
          this.fireAt(this.dir, t);
          this.nextShot = time + t.shootCd;
        }
        break;

      case 'flyer': {
        this.patrol(t.speed);
        // Die Hoehe wird ueber die Geschwindigkeit geregelt, nicht per setY:
        // Arcade Physics schreibt die Position nach jedem Schritt aus dem
        // Koerper zurueck ins Sprite - ein direktes setY waere sofort wieder
        // ueberschrieben und die Drohne wuerde starr in der Luft stehen.
        const sollY = this.baseY + Math.sin(time * t.waveSpeed) * t.waveAmp;
        this.setVelocityY((sollY - this.y) * 6);
        break;
      }

      case 'climber':
        this.climberLogic(time, player, playerFloor);
        break;

      case 'boss':
        this.bossLogic(time, player, playerFloor);
        break;
    }
  }

  patrol(speed) {
    if (this.x <= this.minX) this.dir = 1;
    if (this.x >= this.maxX) this.dir = -1;
    if (this.body.blocked.left)  this.dir = 1;
    if (this.body.blocked.right) this.dir = -1;
    this.setVelocityX(this.dir * speed);
  }

  onGround() { return this.body.blocked.down || this.body.touching.down; }

  /** Verfolgt den Spieler ueber die Etagen hinweg per Leiter. */
  climberLogic(time, player, playerFloor) {
    const t = this.def;

    if (this.climbState === 'climb') {
      const l = this.climbLadder;
      const goingUp = this.climbDir < 0;
      this.setVelocityY(this.climbDir * t.climbSpeed);
      this.setX(l.x);

      if (goingUp && this.body.bottom <= l.top + 1) {
        this.endClimb(l.top, l.floorAbove);
      } else if (!goingUp && this.body.bottom >= l.bottom - 1) {
        this.endClimb(l.bottom - 2, l.floorBelow);
      }
      return;
    }

    // Auf der Spieler-Etage: normal patrouillieren
    if (playerFloor === this.floor) { this.patrol(t.speed); return; }

    // Sonst: die Leiter Richtung Spieler ansteuern
    const l = this.scene.ladderToward(this.floor, playerFloor);
    if (!l) { this.patrol(t.speed); return; }

    const d = l.x - this.x;
    if (Math.abs(d) < 2 && this.onGround()) {
      this.climbState = 'climb';
      this.climbLadder = l;
      this.climbDir = playerFloor > this.floor ? -1 : 1;   // -1 = hoch
      this.body.setAllowGravity(false);
      this.body.checkCollision.none = true;
      this.setVelocityX(0);
    } else {
      this.dir = d > 0 ? 1 : -1;
      this.setVelocityX(this.dir * t.speed);
    }
  }

  endClimb(footY, newFloor) {
    this.climbState = 'walk';
    this.climbLadder = null;
    this.body.setAllowGravity(true);
    this.body.checkCollision.none = false;
    this.setVelocityY(0);
    this.floor = newFloor;
    const feetOffset = this.body.offset.y + this.body.height - this.height / 2;
    this.setY(footY - feetOffset);
  }

  /** Boss: patrouilliert, feuert Salven, stuermt aus der Naehe. */
  bossLogic(time, player, playerFloor) {
    const t = this.def;
    const enraged = this.hp <= this.maxHp / 2;      // zweite Phase
    const d = player.x - this.x;

    if (playerFloor !== this.floor) { this.patrol(t.speed); return; }

    if (Math.abs(d) < 60) {
      this.dir = d > 0 ? 1 : -1;
      this.setVelocityX(this.dir * t.chargeSpeed * (enraged ? 1.3 : 1));
    } else {
      this.dir = d > 0 ? 1 : -1;
      this.setVelocityX(this.dir * t.speed);
    }

    if (time > this.nextShot) {
      const dir = this.dir;
      const shots = enraged ? t.volley + 1 : t.volley;
      for (let i = 0; i < shots; i++) {
        this.scene.time.delayedCall(i * t.volleyGap, () => {
          if (this.alive) this.fireAt(dir, t, (i - (shots - 1) / 2) * 22);
        });
      }
      this.nextShot = time + (enraged ? t.shootCd * 0.65 : t.shootCd);
    }
  }

  fireAt(dir, t, vy) {
    this.scene.spawnBullet(
      this.x + dir * (this.width / 2 + 2), this.body.center.y,
      dir * t.shotSpeed, vy || 0,
      false, t.shotDmg || 1
    );
  }

  /* ---------------------------------------------------------- Schaden */

  hurt(dmg, fromX) {
    if (!this.alive) return;
    this.hp -= dmg;

    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (this.alive) {
        if (this.def.behavior === 'charger') this.setTint(0xffbbbb);
        else this.clearTint();
      }
    });

    // Kleiner Rueckstoss, aber nicht bei unbeweglichen Zielen
    if (this.def.behavior !== 'turret' && this.body) {
      const dir = fromX > this.x ? -1 : 1;
      this.setVelocityX(dir * 55);
    }

    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.scene.onEnemyKilled(this);

    // Auflösung in ein paar Pixelbroecken
    for (let i = 0; i < 7; i++) {
      const p = this.scene.add.rectangle(
        this.x + Phaser.Math.Between(-4, 4),
        this.y + Phaser.Math.Between(-6, 6),
        2, 2, this.def.main
      ).setDepth(7);
      this.scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-22, 22),
        y: p.y + Phaser.Math.Between(-20, 6),
        alpha: 0, duration: Phaser.Math.Between(260, 460),
        onComplete: () => p.destroy()
      });
    }

    this.destroy();
  }
}
