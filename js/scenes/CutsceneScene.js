/*
 * Die Graphic-Novel-Zwischensequenz.
 *
 * Ablauf pro Panel: die Bildebenen blenden nacheinander ein, danach laeuft der
 * Text zeichenweise. Leertaste beendet zuerst den laufenden Text (wer schnell
 * lesen will, soll nicht warten muessen) und blaettert erst beim naechsten
 * Druck weiter.
 *
 * Traegt das letzte Panel eine Entscheidung, erscheint statt "weiter" ein
 * Auswahlmenue. Die getroffene Wahl setzt Flags und darf den Ankunftspunkt
 * im Ziellevel ueberschreiben.
 *
 * Aufruf:
 *   scene.start('cutscene', { story: 'enter_datacenter', then: {...} })
 * `then` ist der Datensatz, mit dem anschliessend GameScene startet.
 */
class CutsceneScene extends Phaser.Scene {

  constructor() { super('cutscene'); }

  init(data) {
    this.story = STORY[data.story];
    this.then = data.then || {};
    this.panelIndex = 0;
  }

  create() {
    this.add.rectangle(CFG.W / 2, CFG.H / 2, CFG.W, CFG.H, 0x05040c).setDepth(-1);

    this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.keyUp    = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.UP);
    this.keyDown  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN);
    this.keySkip  = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    this.showPanel(0);
    this.cameras.main.fadeIn(240, 0, 0, 0);
  }

  /* ------------------------------------------------------------- Panels */

  showPanel(i) {
    if (this.current) this.current.destroy();
    this.current = this.add.container(0, 0);

    const panel = this.story.panels[i];
    this.panel = panel;
    this.choosing = false;
    this.choiceIndex = 0;

    const bildH = 150;
    const rahmen = 6;

    // Bildrahmen im Comic-Stil
    const rand = this.add.graphics();
    rand.fillStyle(0x000000, 1).fillRect(rahmen - 2, rahmen - 2, CFG.W - (rahmen - 2) * 2, bildH + 4);
    rand.lineStyle(1, 0x6f66b8, 1).strokeRect(rahmen - 2, rahmen - 2, CFG.W - (rahmen - 2) * 2, bildH + 4);
    this.current.add(rand);

    // Die Ebenen des Motivs nacheinander einblenden
    const ebenen = PanelArt[panel.art](this, rahmen, rahmen, CFG.W - rahmen * 2, bildH);
    ebenen.forEach((ebene, n) => {
      this.current.add(ebene);
      ebene.setAlpha(0);
      this.tweens.add({ targets: ebene, alpha: 1, duration: 260, delay: n * 170 });
    });
    this.layerCount = ebenen.length;

    // Textkasten
    const kastenY = bildH + 18;
    const kasten = this.add.graphics();
    kasten.fillStyle(0x0d0b1c, 0.95).fillRect(rahmen, kastenY, CFG.W - rahmen * 2, CFG.H - kastenY - rahmen);
    kasten.lineStyle(1, 0x3d3670, 1).strokeRect(rahmen, kastenY, CFG.W - rahmen * 2, CFG.H - kastenY - rahmen);
    this.current.add(kasten);

    this.textObj = this.add.text(rahmen + 8, kastenY + 8, '', {
      fontFamily: 'monospace', fontSize: '8px', color: '#d8dde8',
      wordWrap: { width: CFG.W - rahmen * 2 - 16 }, lineSpacing: 3
    });
    this.current.add(this.textObj);

    // Fortschritt: Panel x von y
    this.current.add(this.add.text(CFG.W - rahmen - 6, kastenY - 10,
      (i + 1) + '/' + this.story.panels.length, {
        fontFamily: 'monospace', fontSize: '7px', color: '#6f66b8'
      }).setOrigin(1, 1));

    this.hinweis = this.add.text(CFG.W / 2, CFG.H - 12, '', {
      fontFamily: 'monospace', fontSize: '7px', color: '#8ce8d0'
    }).setOrigin(0.5);
    this.current.add(this.hinweis);

    // Text startet, sobald die Ebenen stehen
    this.volltext = panel.text;
    this.textPos = 0;
    this.textFertig = false;
    this.textStart = this.time.now + this.layerCount * 170 + 120;
  }

  /* ------------------------------------------------------------ Auswahl */

  showChoice() {
    this.choosing = true;
    const c = this.panel.choice;
    const basisY = 176;

    this.textObj.setText(c.frage);
    this.hinweis.setText('');

    this.optionTexte = [];
    c.optionen.forEach((opt, n) => {
      const y = basisY + n * 26;
      const label = this.add.text(24, y, opt.label, {
        fontFamily: 'monospace', fontSize: '8px', color: '#ffffff'
      });
      const hint = this.add.text(34, y + 10, opt.hint, {
        fontFamily: 'monospace', fontSize: '7px', color: '#8a86b8'
      });
      const marke = this.add.text(12, y, '>', {
        fontFamily: 'monospace', fontSize: '8px', color: '#ffe36e'
      });
      this.current.add([label, hint, marke]);
      this.optionTexte.push({ label, hint, marke });
    });

    this.markChoice(0);
    this.hinweis.setText('HOCH / RUNTER waehlen   -   LEERTASTE bestaetigen');
  }

  markChoice(n) {
    this.choiceIndex = n;
    this.optionTexte.forEach((o, i) => {
      const aktiv = i === n;
      o.marke.setVisible(aktiv);
      o.label.setColor(aktiv ? '#ffe36e' : '#8a86b8');
      o.hint.setColor(aktiv ? '#8ce8d0' : '#4d4a70');
    });
  }

  /** Auswahl uebernehmen: Flags setzen, Ankunftspunkt ggf. ueberschreiben. */
  applyChoice() {
    const opt = this.panel.choice.optionen[this.choiceIndex];
    this.then.flags = Object.assign({}, this.then.flags || {}, opt.flags || {});
    if (opt.goto) {
      this.then.spawnFloor = opt.goto.floor;
      this.then.spawnX = opt.goto.x;
    }
    this.finish();
  }

  finish() {
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('game', this.then);
    });
  }

  /* ------------------------------------------------------------ Ablauf */

  update(time) {
    // ESC ueberspringt die ganze Sequenz - aber nicht die Entscheidung.
    if (Phaser.Input.Keyboard.JustDown(this.keySkip) && !this.panel.choice) {
      this.finish();
      return;
    }

    if (this.choosing) {
      if (Phaser.Input.Keyboard.JustDown(this.keyUp)) {
        this.markChoice((this.choiceIndex + this.optionTexte.length - 1) % this.optionTexte.length);
      }
      if (Phaser.Input.Keyboard.JustDown(this.keyDown)) {
        this.markChoice((this.choiceIndex + 1) % this.optionTexte.length);
      }
      if (Phaser.Input.Keyboard.JustDown(this.keySpace)) this.applyChoice();
      return;
    }

    // Text zeichenweise aufbauen
    if (!this.textFertig && time > this.textStart) {
      const soll = Math.floor((time - this.textStart) / 18);
      if (soll > this.textPos) {
        this.textPos = Math.min(soll, this.volltext.length);
        this.textObj.setText(this.volltext.substring(0, this.textPos));
      }
      if (this.textPos >= this.volltext.length) {
        this.textFertig = true;
        this.hinweis.setText(this.panel.choice ? '' : 'LEERTASTE  -  weiter');
        if (this.panel.choice) this.showChoice();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
      if (!this.textFertig) {
        // Erster Druck: Text sofort fertig zeigen, nicht weiterblaettern.
        this.textPos = this.volltext.length;
        this.textObj.setText(this.volltext);
        this.textFertig = true;
        this.hinweis.setText(this.panel.choice ? '' : 'LEERTASTE  -  weiter');
        if (this.panel.choice) this.showChoice();
        return;
      }
      this.panelIndex++;
      if (this.panelIndex < this.story.panels.length) this.showPanel(this.panelIndex);
      else this.finish();
    }
  }
}
