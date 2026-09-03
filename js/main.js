/* Phaser-Konfiguration und Start. */

/**
 * Vergroesserungsfaktor in HALBEN Stufen (1; 1,5; 2; 2,5; 3 ...).
 *
 * Reine Ganzzahlen waeren fuer Pixel-Art zwar ideal, lassen aber je nach
 * Fenstergroesse bis zu einer ganzen Stufe Platz ungenutzt - das Spiel wirkt
 * dann winzig. Halbe Stufen fuellen den Bildschirm deutlich besser und bleiben
 * ansehnlich, weil sich die Pixelbreiten regelmaessig abwechseln (2-3-2-3)
 * statt unregelmaessig zu springen wie bei einem krummen Faktor.
 *
 * Der Abzug laesst Platz fuer Rahmen und die Steuerungszeile darunter.
 */
function screenZoom() {
  const frei = Math.min(
    (window.innerWidth - 24) / CFG.W,
    (window.innerHeight - 40) / CFG.H
  );
  return Math.max(1, Math.floor(frei * 2) / 2);
}

const gameConfig = {
  type: Phaser.AUTO,
  pixelArt: true,          // kein Weichzeichnen - Pixel bleiben scharf
  roundPixels: true,
  // Skalierung bewusst selbst gerechnet statt per Scale.FIT:
  // FIT streckt das Canvas per CSS auf eine beliebige krumme Groesse (gemessen:
  // Faktor 1,64) - dabei werden Pixel unregelmaessig breit. Wir rechnen den
  // Faktor selbst und halten ihn auf halben Stufen (siehe screenZoom).
  // Zentriert wird ausserdem allein per CSS; Phasers autoCenter wuerde dem
  // Canvas zusaetzlich eigene Raender verpassen und alles verschieben.
  scale: {
    parent: 'game-container',
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: CFG.W,
    height: CFG.H,
    zoom: screenZoom()
  },
  backgroundColor: '#0d0c18',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: CFG.GRAVITY },
      debug: false         // auf true setzen, um alle Trefferboxen zu sehen
    }
  },
  scene: [BootScene, TitleScene, CutsceneScene, GameScene, UIScene]
};

const game = new Phaser.Game(gameConfig);

// Fuer die Browser-Konsole: game.scene.getScene('game') liefert die Spielszene,
// z.B. game.scene.getScene('game').player.hp = 99
window.game = game;

// Bei Fenstergroessenaenderung den ganzzahligen Faktor neu bestimmen.
window.addEventListener('resize', () => game.scale.setZoom(screenZoom()));
