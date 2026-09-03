/*
 * HUD und Endbildschirme. Laeuft als eigene Szene ueber dem Spiel, damit das
 * Spielgeschehen und die Anzeige sich nicht gegenseitig ins Gehege kommen.
 */
class UIScene extends Phaser.Scene {

  constructor() { super('ui'); }

  create() {
    this.gs = this.scene.get('game');

    const font = { fontFamily: 'monospace', fontSize: '8px', color: CFG.COLORS.HUD };

    // Lebensanzeige
    this.hearts = [];
    for (let i = 0; i < CFG.PLAYER.HP; i++) {
      this.hearts.push(this.add.image(8 + i * 9, 9, 'heart', 0));
    }

    this.floorText = this.add.text(CFG.W - 4, 5, '', font).setOrigin(1, 0);
    this.scoreText = this.add.text(CFG.W / 2, 5, '', font).setOrigin(0.5, 0);

    // Boss-Leiste, erst sichtbar wenn der Boss in Sicht ist
    this.bossBarBg = this.add.rectangle(CFG.W / 2, 20, 120, 5, 0x2a1a2e)
      .setStrokeStyle(1, 0x000000).setVisible(false);
    this.bossBar = this.add.rectangle(CFG.W / 2 - 59, 20, 118, 3, 0xc0392b)
      .setOrigin(0, 0.5).setVisible(false);

    this.overlay = null;

    this.onGameOver = () => this.showOverlay('GAME OVER', '#ff6b6b');
    this.onWin = () => this.showOverlay('GEBAEUDE GESICHERT', '#7dffb0');
    this.gs.events.on('gameover', this.onGameOver);
    this.gs.events.on('win', this.onWin);

    this.events.on('shutdown', () => {
      this.gs.events.off('gameover', this.onGameOver);
      this.gs.events.off('win', this.onWin);
    });
  }

  update() {
    const p = this.gs.player;
    if (!p) return;

    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setFrame(i < p.hp ? 0 : 1);
    }

    const floor = (this.gs.playerFloor || 0) + 1;
    this.floorText.setText('ETAGE ' + floor + '/6');
    this.scoreText.setText(String(this.gs.score).padStart(6, '0'));

    const boss = this.gs.enemies.getChildren().find(e => e.typeId === 'boss' && e.alive);
    if (boss && this.gs.playerFloor === boss.floor) {
      this.bossBarBg.setVisible(true);
      this.bossBar.setVisible(true).setSize(118 * (boss.hp / boss.maxHp), 3);
    } else {
      this.bossBarBg.setVisible(false);
      this.bossBar.setVisible(false);
    }
  }

  showOverlay(text, color) {
    if (this.overlay) return;
    this.overlay = this.add.container(0, 0).setDepth(50);

    this.overlay.add(this.add.rectangle(CFG.W / 2, CFG.H / 2, CFG.W, CFG.H, 0x000000, 0.88));
    this.overlay.add(this.add.text(CFG.W / 2, CFG.H / 2 - 14, text, {
      fontFamily: 'monospace', fontSize: '14px', color: color
    }).setOrigin(0.5));
    this.overlay.add(this.add.text(CFG.W / 2, CFG.H / 2 + 6,
      'PUNKTE ' + this.gs.score, {
        fontFamily: 'monospace', fontSize: '8px', color: '#ffffff'
      }).setOrigin(0.5));
    this.overlay.add(this.add.text(CFG.W / 2, CFG.H / 2 + 22, 'R = NEUSTART', {
      fontFamily: 'monospace', fontSize: '8px', color: '#9aa4b2'
    }).setOrigin(0.5));
  }
}
