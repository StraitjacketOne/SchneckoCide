// Konfiguration des Spiels
const config = {
    type: Phaser.AUTO,
    width: 320,           // Typische Retro-Auflösung (wird hochskaliert)
    height: 180,
    pixelArt: true,       // Verhindert Weichzeichnen von Pixel-Grafiken
    zoom: 3,              // Skaliert das Fenster auf 960x540 Pixel hoch
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }, // Gravitation für Jump&Run-Physik
            debug: true          // Zeigt Hitboxen zum Testen an (später auf false setzen)
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// 1. Assets laden (Bilder, Sounds, Spritesheets)
function preload() {
    // Beispiel: Standhalter-Grafiken
    // this.load.image('player', 'assets/images/player.png');
}

// 2. Spielobjekte & Logik initialisieren
function create() {
    // Provisorischer Text als Bestätigung, dass die Engine läuft
    this.add.text(10, 10, 'Phaser 3 bereit!', {
        fontSize: '12px',
        fill: '#ffffff'
    });
}

// 3. Game-Loop (wird ca. 60x pro Sekunde aufgerufen)
function update() {
    // Hier folgt die Eingabelogik und Bewegungsberechnung
}