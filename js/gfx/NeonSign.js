/*
 * Flackernde Leuchtreklame im 80er-Film-Klischee.
 *
 * Aufbau in drei Lagen, damit es nach Neonrohr aussieht und nicht nach Text:
 *   1. GLOW   - groesser skalierte, halbtransparente Kopie = Schimmer
 *   2. BASE   - der eigentliche Schriftzug
 *   3. CHR    - EIN Zeichen liegt separat obendrauf und zuckt eigenstaendig
 *               (der Klassiker: ein Buchstabe ist kaputt)
 *
 * Das Flackern besteht aus zwei unabhaengigen Rhythmen: lange ruhige Phasen,
 * unterbrochen von kurzen hektischen Aussetzern - regelmaessiges Blinken wuerde
 * sofort billig wirken.
 *
 * Verwendung:  new NeonSign(scene, CFG.SIGN, dachHoehe)
 */
class NeonSign {

  constructor(scene, cfg, roofY) {
    this.scene = scene;
    this.cfg = cfg;

    const style = { fontFamily: 'monospace', fontSize: cfg.SIZE + 'px', color: cfg.COLOR };
    const cx = centerX();
    const i = cfg.FLICKER_CHAR;

    // Der Basistext laesst an der Flackerstelle eine Luecke - dort sitzt CHR.
    const baseText = (i >= 0 && i < cfg.TEXT.length)
      ? cfg.TEXT.substring(0, i) + ' ' + cfg.TEXT.substring(i + 1)
      : cfg.TEXT;

    this.glow = scene.add.text(cx, cfg.Y, cfg.TEXT, { ...style, color: cfg.GLOW })
      .setOrigin(0.5).setScale(1.08).setAlpha(0.5).setDepth(3);

    this.base = scene.add.text(cx, cfg.Y, baseText, style)
      .setOrigin(0.5).setDepth(4);

    // Monospace: alle Zeichen gleich breit, deshalb laesst sich die Position
    // des defekten Zeichens einfach ausrechnen.
    const charW = this.base.width / cfg.TEXT.length;
    const left = cx - this.base.width / 2;
    this.chr = scene.add.text(left + i * charW + charW / 2, cfg.Y, cfg.TEXT.charAt(i), style)
      .setOrigin(0.5).setDepth(4);

    this.buildFrame(cx, cfg.Y, roofY);

    // Flacker-Zustand. Bewusst ueber update() statt ueber verschachtelte Timer:
    // so haengt das Flackern an der Spiellaufzeit, laesst sich nachrechnen und
    // bleibt beim Neustart der Szene sauber.
    const now = scene.time.now;
    this.on = true;
    this.chrOn = true;
    this.chrNext = now + 600;
    this.signNext = now + 3000;
    this.burst = 0;
  }

  /** Wird aus GameScene.update() aufgerufen. */
  update(time) {
    this.tickChar(time);
    this.tickSign(time);

    // Der Schimmer atmet leicht, damit nie voellige Ruhe herrscht.
    if (this.on) this.glow.setAlpha(0.42 + Math.sin(time * 0.003) * 0.12);
  }

  /** Das defekte Zeichen: lange an, dann ein kurzes Zucken. */
  tickChar(time) {
    if (time < this.chrNext) return;
    this.chrOn = !this.chrOn;
    this.chr.setAlpha(this.chrOn ? 1 : Phaser.Math.FloatBetween(0.05, 0.3));
    this.chrNext = time + (this.chrOn
      ? Phaser.Math.Between(300, 1800)     // lange Ruhe
      : Phaser.Math.Between(30, 120));     // kurzes Zucken
  }

  /** Die ganze Reklame setzt selten fuer ein paar Zuckungen aus. */
  tickSign(time) {
    if (time < this.signNext) return;

    if (this.burst > 0) {
      this.burst--;
      this.setOn(this.burst % 2 === 1);
      if (this.burst === 0) {
        this.setOn(true);
        this.signNext = time + Phaser.Math.Between(2600, 7000);
      } else {
        this.signNext = time + Phaser.Math.Between(30, 90);
      }
    } else {
      this.burst = Phaser.Math.Between(4, 8);
      this.signNext = time;
    }
  }

  /** Neonrahmen um die Schrift plus zwei Streben hinunter aufs Dach. */
  buildFrame(cx, y, roofY) {
    // Am Schimmer messen, nicht am Text: der Schimmer ist die breiteste Lage
    // und wuerde sonst links und rechts aus dem Rahmen herausschauen.
    const w = this.glow.displayWidth + 8;
    const h = this.cfg.SIZE + 10;
    const col = Phaser.Display.Color.HexStringToColor(this.cfg.GLOW).color;

    this.frame = this.scene.add.rectangle(cx, y, w, h)
      .setStrokeStyle(1, col, 0.9).setDepth(3);

    const g = this.scene.add.graphics().setDepth(2).fillStyle(0x15122b, 1);
    const strutY = y + h / 2;
    for (const sx of [cx - w / 4, cx + w / 4]) {
      g.fillRect(sx - 1, strutY, 2, roofY - strutY);
    }
  }

  /** Schaltet die ganze Reklame an oder aus. */
  setOn(on) {
    this.on = on;
    this.base.setAlpha(on ? 1 : 0.1);
    this.glow.setAlpha(on ? 0.5 : 0.04);
    this.frame.setAlpha(on ? 1 : 0.25);
  }

}
