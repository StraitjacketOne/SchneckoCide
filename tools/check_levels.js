/*
 * Prueft die Leveldaten auf Widersprueche, ohne das Spiel zu starten.
 *
 *   node tools/check_levels.js
 *
 * Faengt genau die Fehler, die man sonst erst mitten im Spiel bemerkt:
 * Gegner auf einer Etage, die es im Level nicht gibt; Portale, die ins Leere
 * fuehren; Leitern ohne Anschluss; Gegner ausserhalb der Mauern.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const lade = f => fs.readFileSync(path.join(root, f), 'utf8');

// config.js und levels.js in einen gemeinsamen Kontext holen
const ctx = {};
new Function('g', lade('js/config.js') + '\n;g.CFG=CFG;g.innerLeft=innerLeft;g.innerRight=innerRight;')(ctx);
new Function('g', lade('js/data/levels.js') + '\n;g.LEVELS=LEVELS;')(ctx);
new Function('g', lade('js/data/enemyTypes.js') + '\n;g.ENEMY_TYPES=ENEMY_TYPES;')(ctx);

new Function('g', lade('js/data/story.js') + '\n;g.STORY=STORY;')(ctx);
new Function('g', lade('js/gfx/PanelArt.js') + '\n;g.PanelArt=PanelArt;')(ctx);

const { CFG, LEVELS, ENEMY_TYPES, STORY, PanelArt, innerLeft, innerRight } = ctx;

const fehler = [];
const warnung = [];

LEVELS.forEach((lv, li) => {
  const etiketten = `[${li}] ${lv.id}`;
  const etagen = (lv.floors || CFG.FLOOR_TOPS).length;
  const links = innerLeft(), rechts = innerRight();

  if (!lv.id || !lv.name) fehler.push(`${etiketten}: id oder name fehlt`);

  // Leitern muessen zwei vorhandene Etagen verbinden
  (lv.ladders || CFG.LADDERS).forEach(l => {
    if (l.from < 0 || l.from + 1 >= etagen) {
      fehler.push(`${etiketten}: Leiter bei x=${l.x} verbindet Etage ${l.from} mit ${l.from + 1}, es gibt aber nur ${etagen}`);
    }
    if (l.x < links || l.x > rechts) {
      fehler.push(`${etiketten}: Leiter bei x=${l.x} steht ausserhalb der Mauern (${links}..${rechts})`);
    }
  });

  // Gegner
  (lv.enemies || []).forEach(e => {
    if (!ENEMY_TYPES[e.type]) fehler.push(`${etiketten}: unbekannter Gegnertyp "${e.type}"`);
    if (e.floor < 0 || e.floor >= etagen) {
      fehler.push(`${etiketten}: Gegner "${e.type}" auf Etage ${e.floor}, es gibt nur ${etagen}`);
    }
    if (e.x < links || e.x > rechts) {
      fehler.push(`${etiketten}: Gegner "${e.type}" bei x=${e.x} steht in der Mauer (${links}..${rechts})`);
    }
    if (e.from !== undefined && e.to !== undefined && e.from >= e.to) {
      fehler.push(`${etiketten}: Gegner "${e.type}" hat from=${e.from} >= to=${e.to}`);
    }
  });

  // Portale
  (lv.portals || []).forEach(p => {
    if (p.floor < 0 || p.floor >= etagen) {
      fehler.push(`${etiketten}: Portal auf Etage ${p.floor}, es gibt nur ${etagen}`);
    }
    const ziel = LEVELS[p.to];
    if (!ziel) {
      fehler.push(`${etiketten}: Portal zeigt auf Level ${p.to} - existiert nicht`);
      return;
    }
    const zielEtagen = (ziel.floors || CFG.FLOOR_TOPS).length;
    if (p.toFloor < 0 || p.toFloor >= zielEtagen) {
      fehler.push(`${etiketten}: Portal landet auf Etage ${p.toFloor} von "${ziel.id}", das hat nur ${zielEtagen}`);
    }
    if (p.toX < links || p.toX > rechts) {
      fehler.push(`${etiketten}: Portal setzt den Spieler auf x=${p.toX} - das liegt in der Mauer`);
    }
    // Zwischensequenz vorhanden?
    if (p.story && !STORY[p.story]) {
      fehler.push(`${etiketten}: Portal verweist auf Sequenz "${p.story}" - gibt es nicht in story.js`);
    }

    // Landet man direkt auf einem Portal des Ziellevels?
    (ziel.portals || []).forEach(zp => {
      if (zp.floor === p.toFloor && Math.abs(zp.x - p.toX) < 14) {
        warnung.push(`${etiketten}: Ankunft bei x=${p.toX} liegt fast auf einem Portal von "${ziel.id}" (x=${zp.x})`);
      }
    });
  });

  // Dach muss ueber der groessten Figur liegen (Boss ist 24 hoch)
  const dach = (lv.theme && lv.theme.BUILDING && lv.theme.BUILDING.ROOF_Y) || CFG.BUILDING.ROOF_Y;
  const obersteEtage = (lv.floors || CFG.FLOOR_TOPS)[etagen - 1];
  if (obersteEtage - 26 < dach) {
    fehler.push(`${etiketten}: Dach bei y=${dach} zu tief - Figuren auf der obersten Etage (Boden y=${obersteEtage}) ragen darueber`);
  }
});

// --- Zwischensequenzen
Object.keys(STORY).forEach(id => {
  const seq = STORY[id];
  if (!seq.panels || !seq.panels.length) {
    fehler.push(`Sequenz "${id}": keine Panels`);
    return;
  }
  seq.panels.forEach((panel, pi) => {
    if (typeof PanelArt[panel.art] !== 'function') {
      fehler.push(`Sequenz "${id}" Panel ${pi + 1}: Motiv "${panel.art}" fehlt in PanelArt.js`);
    }
    if (!panel.text) warnung.push(`Sequenz "${id}" Panel ${pi + 1}: kein Text`);
    if (panel.text && panel.text.length > 190) {
      warnung.push(`Sequenz "${id}" Panel ${pi + 1}: Text sehr lang (${panel.text.length} Zeichen), passt evtl. nicht in den Kasten`);
    }
    if (panel.choice) {
      if (pi !== seq.panels.length - 1) {
        warnung.push(`Sequenz "${id}": Entscheidung steht in Panel ${pi + 1} statt im letzten - alles danach wird nie gezeigt`);
      }
      if (!panel.choice.optionen || panel.choice.optionen.length < 2) {
        fehler.push(`Sequenz "${id}": Entscheidung braucht mindestens zwei Optionen`);
      }
      (panel.choice.optionen || []).forEach(o => {
        if (!o.label) fehler.push(`Sequenz "${id}": Option ohne Beschriftung`);
      });
    }
  });
});

console.log(`${LEVELS.length} Level und ${Object.keys(STORY).length} Sequenzen geprueft.\n`);
warnung.forEach(w => console.log('  Hinweis: ' + w));
if (fehler.length === 0) {
  console.log('Keine Fehler gefunden.');
} else {
  fehler.forEach(f => console.log('  FEHLER: ' + f));
  process.exit(1);
}
