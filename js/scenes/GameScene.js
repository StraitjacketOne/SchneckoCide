/*
 * Die Spielszene: baut das Gebaeude, haelt Spieler, Gegner und Projektile
 * zusammen und wertet Treffer aus.
 */
class GameScene extends Phaser.Scene {

  constructor() { super('game'); }

  create() {
    // Gelaufen wird nur INNERHALB der Aussenmauern.
    this.physics.world.setBounds(innerLeft(), 0, innerRight() - innerLeft(), CFG.H);
    this.score = 0;
    this.gameOver = false;
    this.won = false;
    this.swordHits = new Set();      // pro Hieb wird jeder Gegner nur einmal getroffen

    Backdrop.sky(this);
    Backdrop.building(this);
    this.buildFloors();
    this.buildLadders();

    Player.createAnims(this);
    Enemy.createAnims(this);

    // Projektile
    this.bullets = this.physics.add.group({
      classType: Bullet,
      runChildUpdate: true,
      maxSize: 60
    });

    // Spieler
    const ps = LEVEL.playerStart;
    this.player = new Player(this, ps.x, floorTop(ps.floor) - 20);
    this.player.setDepth(5);
    this.player.snapFeetTo(floorTop(ps.floor));

    // Gegner
    this.enemies = this.add.group();
    LEVEL.enemies.forEach(spawn => {
      const e = new Enemy(this, spawn);
      e.setDepth(4);
      this.enemies.add(e);
      this.physics.add.collider(e, this.floors);
    });

    // Kollisionen
    this.platformCollider = this.physics.add.collider(this.player, this.floors);
    this.physics.add.overlap(this.player, this.enemies, this.onTouchEnemy, null, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.onBulletHitsEnemy, null, this);
    this.physics.add.overlap(this.bullets, this.player, this.onBulletHitsPlayer, null, this);
    this.physics.add.collider(this.bullets, this.floors, b => b.kill());

    // Fassade zuletzt: sie deckt die Bodenkacheln an den Aussenkanten ab.
    Backdrop.facade(this);
    this.sign = new NeonSign(this, CFG.SIGN, CFG.BUILDING.ROOF_Y - 5);

    this.keys = this.buildInput();
    this.scene.launch('ui');

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  /* ------------------------------------------------------------- Aufbau */

  buildFloors() {
    this.floors = this.physics.add.staticGroup();
    CFG.FLOOR_TOPS.forEach(top => {
      for (let x = CFG.BUILDING.LEFT; x < CFG.BUILDING.RIGHT; x += 16) {
        this.floors.create(x + 8, top + 4, 'tile');
      }
    });
  }

  buildLadders() {
    // Leitern sind reine Rechtecke - keine Physik. Siehe Kommentar in Player.js.
    this.ladders = CFG.LADDERS.map(def => ({
      x: def.x,
      top: CFG.FLOOR_TOPS[def.from + 1],
      bottom: CFG.FLOOR_TOPS[def.from] + 2,
      floorBelow: def.from,
      floorAbove: def.from + 1
    }));

    this.ladders.forEach(l => {
      for (let y = l.top; y < l.bottom; y += 8) {
        this.add.image(l.x, y + 4, 'ladder').setDepth(1);
      }
    });
  }

  buildInput() {
    const K = Phaser.Input.Keyboard.KeyCodes;
    const kb = this.input.keyboard;

    // Pfeiltasten und WASD sollen beide funktionieren. Ein Phaser-Key kennt nur
    // eine Taste, deshalb buendelt `either` mehrere zu einem isDown.
    const either = (...keys) => ({ get isDown() { return keys.some(k => k.isDown); } });

    return {
      left:   either(kb.addKey(K.LEFT),  kb.addKey(K.A)),
      right:  either(kb.addKey(K.RIGHT), kb.addKey(K.D)),
      up:     either(kb.addKey(K.UP),    kb.addKey(K.W)),
      down:   either(kb.addKey(K.DOWN),  kb.addKey(K.S)),
      jump:   kb.addKey(K.SPACE),
      attack: kb.addKey(K.J),
      shoot:  kb.addKey(K.K),
      restart: kb.addKey(K.R)
    };
  }

  /* ------------------------------------------------------------- Leitern */

  /** Leiter, auf der sich der Koerper gerade befindet (zum Hochklettern). */
  ladderAt(body) {
    const half = CFG.LADDER_W / 2;
    return this.ladders.find(l =>
      body.center.x > l.x - half && body.center.x < l.x + half &&
      body.bottom > l.top && body.top < l.bottom
    ) || null;
  }

  /** Leiter, die direkt unter den Fuessen nach unten fuehrt. */
  ladderBelow(body) {
    const half = CFG.LADDER_W / 2;
    return this.ladders.find(l =>
      body.center.x > l.x - half && body.center.x < l.x + half &&
      Math.abs(l.top - body.bottom) < 5
    ) || null;
  }

  /** Die Leiter, die von `fromFloor` in Richtung `toFloor` fuehrt. */
  ladderToward(fromFloor, toFloor) {
    if (toFloor > fromFloor) return this.ladders.find(l => l.floorBelow === fromFloor) || null;
    if (toFloor < fromFloor) return this.ladders.find(l => l.floorAbove === fromFloor) || null;
    return null;
  }

  setPlatformCollision(on) {
    if (this.platformCollider) this.platformCollider.active = on;
  }

  /* ----------------------------------------------------------- Projektile */

  spawnBullet(x, y, vx, vy, fromPlayer, dmg) {
    const b = this.bullets.get();
    if (!b) return null;
    b.fire(x, y, vx, vy, fromPlayer, dmg);
    return b;
  }

  /* -------------------------------------------------------------- Treffer */

  onSwordSwing() { this.swordHits.clear(); }

  /*
   * ACHTUNG: Arcade Physics uebergibt die beiden Objekte NICHT verlaesslich in
   * der Reihenfolge, in der man sie bei add.overlap() angemeldet hat - bei
   * Gruppe-gegen-Gruppe kommen sie vertauscht an. Deshalb werden die Rollen
   * hier immer am Objekt selbst erkannt, nie an der Argumentposition.
   */
  onBulletHitsEnemy(a, b) {
    const bullet = (a instanceof Bullet) ? a : b;
    const enemy  = (a instanceof Bullet) ? b : a;
    if (!bullet.active || !bullet.fromPlayer || !enemy.alive) return;
    this.bulletImpact(bullet.x, bullet.y, bullet.fromPlayer);
    bullet.kill();
    enemy.hurt(bullet.dmg, bullet.x);
  }

  onBulletHitsPlayer(a, b) {
    const bullet = (a instanceof Bullet) ? a : b;
    const player = (a instanceof Bullet) ? b : a;
    if (!bullet.active || bullet.fromPlayer || !player.alive) return;
    this.bulletImpact(bullet.x, bullet.y, bullet.fromPlayer);
    bullet.kill();
    player.hurt(bullet.dmg, bullet.x);
  }

  onTouchEnemy(a, b) {
    const player = (a instanceof Player) ? a : b;
    const enemy  = (a instanceof Player) ? b : a;
    if (!enemy.alive || !player.alive) return;
    player.hurt(enemy.def.touchDmg, enemy.x);
  }

  /** Kurzer Funkenschlag an der Einschlagstelle. */
  bulletImpact(x, y, fromPlayer) {
    const col = fromPlayer ? 0xfff09a : 0xff9a7a;
    for (let i = 0; i < 4; i++) {
      const p = this.add.rectangle(x, y, 1, 1, col).setDepth(8);
      this.tweens.add({
        targets: p,
        x: x + Phaser.Math.Between(-7, 7),
        y: y + Phaser.Math.Between(-7, 7),
        alpha: 0, duration: Phaser.Math.Between(90, 180),
        onComplete: () => p.destroy()
      });
    }
  }

  onEnemyKilled(enemy) {
    this.score += enemy.def.score;
    if (enemy.typeId === 'boss') this.win();
  }

  onPlayerDead() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.events.emit('gameover');
  }

  win() {
    if (this.won) return;
    this.won = true;
    this.gameOver = true;
    this.score += 1000;
    this.events.emit('win');
  }

  /* ------------------------------------------------------------ Game-Loop */

  update(time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.restart)) {
      this.scene.stop('ui');
      this.scene.restart();
      return;
    }
    // Die Reklame flackert auch nach Spielende weiter.
    if (this.sign) this.sign.update(time);

    if (this.gameOver) {
      // Nach dem Ende laeuft nur noch die Physik aus.
      this.player.setVelocityX(0);
      return;
    }

    this.player.update(time, this.keys);

    const playerFloor = floorIndexOf(this.player.body.bottom);
    this.playerFloor = playerFloor;

    this.enemies.getChildren().forEach(e => e.update(time, delta, this.player, playerFloor));

    this.resolveSword();
  }

  /** Schwert-Trefferzone gegen Gegner und gegnerische Projektile pruefen. */
  resolveSword() {
    if (!this.player.swordActive) return;
    const rect = this.player.swordRect();

    this.enemies.getChildren().forEach(e => {
      if (!e.alive || this.swordHits.has(e)) return;
      const eb = new Phaser.Geom.Rectangle(e.body.x, e.body.y, e.body.width, e.body.height);
      if (Phaser.Geom.Intersects.RectangleToRectangle(rect, eb)) {
        this.swordHits.add(e);
        e.hurt(CFG.PLAYER.SWORD_DMG, this.player.x);
      }
    });

    // Gegnerische Schuesse lassen sich mit dem Schwert aus der Luft schlagen.
    this.bullets.getChildren().forEach(b => {
      if (!b.active || b.fromPlayer) return;
      const bb = new Phaser.Geom.Rectangle(b.body.x, b.body.y, b.body.width, b.body.height);
      if (Phaser.Geom.Intersects.RectangleToRectangle(rect, bb)) b.kill();
    });
  }
}
