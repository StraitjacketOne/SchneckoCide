/*
 * Die Zwischensequenzen.
 *
 * Eine Sequenz ist eine Folge von Panels. Jedes Panel hat ein Bildmotiv
 * (`art`, siehe PanelArt.js) und Text. Das letzte Panel darf eine
 * Entscheidung tragen.
 *
 * PANEL
 *   art     Name des Motivs aus PanelArt
 *   text    was unten im Kasten steht
 *
 * CHOICE (optional, nur im letzten Panel sinnvoll)
 *   frage   die Fragestellung
 *   optionen[]
 *     label   Text der Auswahl
 *     hint    kurze Folgenbeschreibung (grau darunter)
 *     flags   werden gesetzt und ueberdauern den Levelwechsel
 *     goto    { floor, x } - ueberschreibt den Ankunftspunkt des Portals
 *
 * Die Flags landen in GameScene.flags. Gegner in levels.js koennen per
 * `skipIf` / `onlyIf` darauf reagieren - so hat die Entscheidung echte Folgen.
 */
const STORY = {

  /* ------------------------------ Hinweg: Hochhaus -> Serverkeller */
  enter_datacenter: {
    panels: [
      {
        art: 'elevator',
        text: 'Der Lastenaufzug im dritten Stock steht offen. Kein Licht, ' +
              'kein Motor. Nur ein Summen, das nicht von Maschinen kommt.'
      },
      {
        art: 'portal',
        text: 'Wo der Schacht sein muesste, dreht sich etwas. ' +
              'Kinde$woolworth hat nicht nur Bueros.'
      },
      {
        art: 'servers',
        text: 'Darunter liegt NODE 7. Hier rechnet die Buchhaltung, ' +
              'die in keinem Bericht auftaucht - und sie bewacht sich selbst.'
      },
      {
        art: 'crossroads',
        text: 'Zwei Zugaenge. Einer ist bequem. Einer ist leise.',
        choice: {
          frage: 'Wie gehst du rein?',
          optionen: [
            {
              label: 'Durch das Hauptgatter',
              hint: 'Kurzer Weg, aber die Wachschicht ist wach.',
              flags: { laut: true },
              goto: { floor: 0, x: 40 }
            },
            {
              label: 'Durch den Kuehlschacht',
              hint: 'Du kommst weiter oben raus. Niemand hat dich gesehen.',
              flags: { leise: true },
              goto: { floor: 1, x: 40 }
            }
          ]
        }
      }
    ]
  },

  /* ------------------------------ Rueckweg: Serverkeller -> Hochhaus */
  leave_datacenter: {
    panels: [
      {
        art: 'ascent',
        text: 'Der Schacht endet an einer Wartungstuer. Dahinter: Teppich, ' +
              'Neonlicht, der Geruch von Kaffee aus der Kanne von gestern.'
      },
      {
        art: 'elevator',
        text: 'Zurueck im dritten Stock. Oben warten noch vier Etagen - ' +
              'und der Direktor weiss jetzt, dass du hier bist.'
      }
    ]
  }
};
