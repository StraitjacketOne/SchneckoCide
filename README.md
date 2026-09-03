# Schneckocide

2D-Jump-and-Run im 16-Bit-Stil. Sechs Etagen, Leitern nach Donkey-Kong-Prinzip,
Schwert und Schusswaffe, zehn Gegnertypen, Boss auf Etage 6.

## Starten

`index.html` im Browser oeffnen. Doppelklick genuegt - es gibt keinen
Build-Schritt, keine Installation, kein npm. Phaser liegt als fertige
JavaScript-Datei unter `vendor/` und wird per `<script>`-Tag eingebunden.

Zum Entwickeln besser den mitgelieferten Server nehmen und
`http://127.0.0.1:8123` aufrufen:

```
python dev_server.py
```

**Wichtig, wenn du Code aenderst:** Nimm nicht `python -m http.server`. Der
Browser liefert geaenderte JS-Dateien sonst aus seinem Cache - du aenderst
etwas, laedst neu und siehst weiterhin die alte Version. `dev_server.py` ist
ein normaler Webserver, der zusaetzlich das Caching verbietet.

## Steuerung

| Taste | Wirkung |
|---|---|
| Pfeiltasten / WASD | laufen |
| Hoch / Runter an einer Leiter | klettern |
| Leertaste | springen (auch von der Leiter abspringen) |
| J | Schwert |
| K | schiessen |
| R | Neustart |

## Wo was liegt

```
index.html              Ladereihenfolge der Skripte
css/style.css
vendor/phaser.min.js    Phaser 3.80.1, unveraendert
js/
  config.js             ALLE Tuning-Werte: Tempo, Sprunghoehe, Schaden, Etagen
  data/enemyTypes.js    die zehn Gegnertypen (Werte + Farben)
  data/level.js         wer auf welcher Etage steht
  gfx/textures.js       Sprites als Pixel-Maps (ein Zeichen = ein Pixel)
  entities/             Player, Enemy, Bullet
  scenes/               Boot, Title, Game, UI
_ref/                   die urspruenglichen Entwuerfe aus dem Gemini-Chat
```

## Layout anpassen

Grundregel: **Layout-Zahlen stehen in `js/config.js`, der Zeichencode liest nur
daraus.** Nichts ist doppelt hinterlegt - eine Zahl aendern reicht, der Rest
zieht mit.

| Was du aendern willst | Wo |
|---|---|
| Hoehe/Anzahl der Etagen | `CFG.FLOOR_TOPS` |
| Groesse des Spielfelds | `CFG.W`, `CFG.H` |
| Gebaeudeumriss, Fassaden- und Fensterfarben | `CFG.BUILDING` |
| Text und Aussehen der Leuchtreklame | `CFG.SIGN` |
| Position der Leitern | `CFG.LADDERS` |
| Nachthimmel | `CFG.COLORS` |

Beispiel: Die Leuchtreklame auf dem Dach umbenennen ist genau eine Zeile -
`CFG.SIGN.TEXT`. Rahmenbreite, Position des defekten Zeichens und die
Halterungen zum Dach rechnen sich daraus selbst aus.

Genauso entstand das Dach: `CFG.H` von 240 auf 264 erhoehen und `FLOOR_TOPS`
um 24 nach unten schieben - schon war ueber der sechsten Etage Platz fuer das
Banner, und Leitern, Gegner-Spawns, Hintergrund und Etagenanzeige sind
automatisch mitgewandert.

**Die eine Abhaengigkeit, auf die du achten musst:** `BUILDING.ROOF_Y` muss
ueber der obersten Figur liegen. Der Boss ist 24 Pixel hoch und steht auf
`FLOOR_TOPS[5]` - liegt das Dach zu tief, ragt er oben heraus und steht
scheinbar im Freien.

## Die drei Stellen, an denen du weiterbaust

**Balancing.** Alles in `js/config.js`. Zu schwer? `PLAYER.HP` hoch,
`SWORD_CD` runter. Zu traege? `PLAYER.SPEED` hoch.

**Einen elften Gegner.** In `data/enemyTypes.js` einen Eintrag ergaenzen
(Farbe, HP, Tempo, `behavior`) und in `data/level.js` platzieren. Sprite und
Animation entstehen automatisch. Ein neues Verhalten kommt als weiterer `case`
in `Enemy.behave()` dazu.

**Eigene Grafiken.** Die Sprites sind Pixel-Maps in `gfx/textures.js` - jede
Zeile ein String, ein Zeichen ein Pixel, `.` ist transparent. Direkt im Editor
aenderbar. Beim Laden wird geprueft, ob jede Zeile die richtige Laenge hat;
Abweichungen landen als Warnung in der Browser-Konsole.

Wenn du spaeter auf echte PNG-Spritesheets umsteigst: in `BootScene.preload`
`this.load.spritesheet('hero', ...)` mit denselben Keys laden und
`buildAllTextures()` weglassen. Der uebrige Code bleibt unveraendert.

## Debugging

* `physics.arcade.debug` in `js/main.js` auf `true` setzt - zeigt alle
  Trefferboxen.
* In der Browser-Konsole: `game.scene.getScene('game')` liefert die Spielszene,
  z.B. `game.scene.getScene('game').player.hp = 99`.

## Wie das Klettern funktioniert

Die Leitern sind keine Physik-Koerper, sondern einfache Rechtecke
(`CFG.LADDERS`). Beim Klettern wird die Kollision zwischen Spieler und
Etagenboeden kurzzeitig abgeschaltet, dadurch geht die Figur sauber durch den
Boden hindurch. So braucht keine Etage eine Luecke - das ist die Variante mit
den wenigsten Fehlerquellen.
