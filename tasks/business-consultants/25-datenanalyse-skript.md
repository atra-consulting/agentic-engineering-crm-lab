# 25 — Wiederholbare Datenanalyse: der Pipeline-Bericht per Skript

**Dauer:** 30 min
**Sozialform:** einzeln
**Werkzeug:** Claude Code oder GitHub Copilot CLI, Terminal, Browser; Python 3 (oder Node.js, siehe Schritt 2)
**Voraussetzung:** Aufgabe 22 erledigt; Lab läuft unter `localhost:7200`
**Ziel:** Ein Skript im Projekt rechnet den Pipeline-Bericht nach euren Regeln — zweimal ausgeführt, kommt Zeichen für Zeichen dasselbe heraus, und die Kontrollsummen gehen auf.

Fragt ihr einen Chat-Assistenten nach Summen über viele Zeilen, rechnet ein
Sprachmodell — und Rechnen ist seine Schwäche: Es schätzt, rundet unterwegs
und übersieht Zusammenhänge. Fragt ihr zweimal, kann zweimal etwas anderes
herauskommen.

Der Ausweg: **Die KI rechnet nicht, sie schreibt ein Skript — und das Skript
rechnet.** Ein Skript ist eine kleine Datei mit Rechenschritten. Mit
denselben Daten liefert es jedes Mal dasselbe Ergebnis, und eure Regeln
stehen darin nachlesbar. Prüfen müsst ihr dann nicht jede Zahl in jedem
Bericht, sondern einmal die Regeln — und jedes Mal die Kontrollsummen.

Zwei Nebeneffekte: Die Rohdaten gehen gar nicht in den Chat, nur das Skript
und die fertigen Summen. Das schont Tokens — und hält Kundendaten aus dem
Chat heraus.

<!-- include: warnung-rechte -->

## Die Rechenregeln

Diese Regeln stehen im Prompt. Lest sie, bevor ihr ihn abschickt — wollt
ihr eine anders, ändert sie jetzt. Was ihr nicht festlegt, entscheidet der
Agent still.

| Nr. | Regel |
|---|---|
| R1 | Stichtag ist der 30.11.2026 — fest, nicht „heute“. Sonst ändert sich der Bericht jeden Tag, ohne dass sich die Daten ändern. |
| R2 | In die Pipeline zählen nur offene Chancen: alle Phasen außer GEWONNEN und VERLOREN. |
| R3 | Gewichteter Wert = Wert × Wahrscheinlichkeit ÷ 100. Eine offene Chance ohne Wahrscheinlichkeit zählt im gewichteten Wert mit 0 und wird eigens gezählt. |
| R4 | Überfällig ist eine offene Chance, deren erwartetes Datum vor dem Stichtag liegt. Sie bleibt in der Pipeline und wird eigens gezählt. |
| R5 | Je Branche eine Zeile: Anzahl offen, Summe Wert, Summe gewichtet, davon überfällig. Firmen ohne Branche: „ohne Branche“. Darunter eine Zeile „Gesamt“. |
| R6 | Gerundet wird erst bei der Ausgabe, auf ganze Euro. |

## Schritte

1. **Regeln lesen.** Lest die Tabelle oben. Ändert ihr eine Regel, ändert
   sie auch im Prompt.
2. **Python prüfen.** Im Nachprüf-Fenster `python3 --version` (Windows:
   `python --version`). Erscheint eine Versionsnummer ab 3.9, ist alles da.
   Sonst ersetzt ihr im Prompt „Python-Skript“ durch „Node.js-Skript ohne
   zusätzliche Pakete“ — Node.js ist für das Lab ohnehin installiert.
3. **Den Agenten das Skript schreiben lassen.** Gebt Prompt 1 ein. Am
   Plan-Checkpoint hakt ihr ab: Steht jede Regel R1 bis R6 drin? Liest das
   Skript die Daten nur, ändert es nichts? Passt alles: „Okay, setz um.“
4. **Zweimal ausführen.** Gebt Prompt 2 ein. Der Agent führt das Skript
   zweimal aus und vergleicht beide Berichte. Erwartet: kein Unterschied.
   Öffnet den Bericht im Nachprüf-Fenster mit
   `open -a TextEdit analysen/ausgabe/pipeline-bericht.md` (Windows:
   `notepad analysen\ausgabe\pipeline-bericht.md`).
5. **Kontrollsummen prüfen — selbst, nicht vom Agenten.** Unter der Tabelle
   stehen die Kontrollsummen. Geht auf: offen + GEWONNEN + VERLOREN = alle
   Chancen? Stimmt die Zeile „Gesamt“ mit der Summe der Branchenzeilen?
   Stimmt die Zahl aller Chancen mit der Chancen-Liste im CRM?
   Fallen euch viele überfällige Chancen auf? In den Testdaten liegt das
   erwartete Datum oft in der Vergangenheit — im Projekt wäre genau das eine
   Frage an den Vertrieb: Datenpflege oder echtes Problem?
6. **Die Daten ändern, das Skript bleibt.** Legt im CRM unter
   **Chancen › Neue Chance** eine Chance an: Firma beliebig, Wert 10.000,
   Phase NEU, Wahrscheinlichkeit **leer lassen**, erwartetes Datum im
   Dezember 2026. Merkt euch die Branche der Firma (Firmenliste). Schreibt
   vorher auf, was sich im Bericht ändern muss: In welcher Zeile steigen
   Anzahl und Wert? Was passiert mit dem gewichteten Wert? Welche
   Kontrollsumme ändert sich? Dann Prompt 3 — im selben Gespräch, damit der
   Agent den alten Bericht noch kennt. Ändert sich genau das — und nur das?
7. **Committen.** Sagt dem Agenten: „Committe nur das Skript, nicht die
   Ausgabe.“ Nächsten Monat, oder für eine Kollegin, reicht ein Befehl.

**Wer noch Zeit hat — drei Folien:** Gebt dem Chat-Assistenten nur
`pipeline-bericht.md` und bittet um drei Folientexte für die
Vertriebsleitung. Prüft danach jede Zahl auf den Folien gegen den Bericht:
Die Zahlen kommen aus dem Skript, die Worte von der KI.

## Folienschritte

1. Rechenregeln R1 bis R6 lesen, `python3 --version`.
2. Prompt 1: Skript schreiben lassen, Plan gegen die Regeln abhaken.
3. Prompt 2: zweimal ausführen — gleich?
4. Kontrollsummen selbst prüfen.
5. Chance ohne Wahrscheinlichkeit anlegen, Prompt 3: Ändert sich genau das Erwartete?

## Prompt 1 — das Skript schreiben

```
Ich möchte einen Pipeline-Bericht, den ich jeden Monat wiederholen kann.
Rechne nicht selbst — schreib ein Python-Skript, das rechnet. So gehst du vor:

1. Lege von main aus den Branch feature/pipeline-bericht an.
2. Zeig mir einen kurzen Plan: welche Daten du liest und wie du jede Regel
   R1 bis R6 umsetzt, je Regel eine Zeile. Warte dann auf mein Okay.
3. Schreib das Skript analysen/pipeline_bericht.py. Es liest die
   CRM-Datenbank backend/data/crmdb.sqlite nur lesend und ändert nichts. Es
   braucht keine zusätzlichen Pakete. Es schreibt zwei Dateien nach
   analysen/ausgabe/: chancen.csv (alle Chancen mit Firma und Branche) und
   pipeline-bericht.md (Tabelle nach R5, darunter die Kontrollsummen).
4. Führ das Skript einmal aus und zeig mir den Bericht. Committe noch nicht.

Regeln:
R1 Stichtag ist der 30.11.2026, fest im Skript, nicht das heutige Datum.
R2 In die Pipeline zählen nur offene Chancen: alle Phasen außer GEWONNEN und
   VERLOREN.
R3 Gewichteter Wert = Wert × Wahrscheinlichkeit ÷ 100. Eine offene Chance ohne
   Wahrscheinlichkeit zählt im gewichteten Wert mit 0 und wird eigens gezählt.
R4 Überfällig ist eine offene Chance, deren erwartetes Datum vor dem Stichtag
   liegt. Sie bleibt in der Pipeline und wird eigens gezählt.
R5 Je Branche eine Zeile: Anzahl offen, Summe Wert, Summe gewichtet, davon
   überfällig. Firmen ohne Branche: „ohne Branche“. Darunter „Gesamt“.
R6 Gerundet wird erst bei der Ausgabe, auf ganze Euro, deutsches Zahlenformat.

Kontrollsummen unter der Tabelle: Anzahl aller Chancen; davon offen,
GEWONNEN, VERLOREN; offene ohne Wahrscheinlichkeit; überfällige; und ob die
Zeile „Gesamt“ der Summe der Branchenzeilen entspricht.

Ändere keine Datei außerhalb von analysen/. Erstelle keinen PR und pushe nicht.
```

## Prompt 2 — zweimal ausführen

```
Führ das Skript zweimal hintereinander aus und vergleiche die beiden
pipeline-bericht.md Zeichen für Zeichen. Sag mir nur, ob sie gleich sind.
```

## Prompt 3 — mit neuen Daten

```
Ich habe im CRM eine Chance angelegt. Führ das Skript noch einmal aus und
zeig mir, welche Zeilen im Bericht sich gegenüber vorher geändert haben.
Erkläre die Änderung nicht, zeig sie nur.
```

## Abnahme

- [ ] `analysen/pipeline_bericht.py` setzt R1 bis R6 um; der Stichtag steht
      fest im Skript.
- [ ] Zweimal ausgeführt, sind beide Berichte gleich.
- [ ] Ihr habt die Kontrollsummen selbst geprüft: offen + GEWONNEN +
      VERLOREN = alle Chancen, und „Gesamt“ = Summe der Branchenzeilen.
- [ ] Nach der neuen Chance ändern sich genau die Zahlen, die ihr vorher
      aufgeschrieben habt — die Chance ohne Wahrscheinlichkeit erscheint in
      der Kontrollsumme.
- [ ] `git log --oneline -3` zeigt den Commit mit dem Skript, ohne
      `analysen/ausgabe/`.

## Troubleshooting

| Problem | Lösung |
|---|---|
| `python3: command not found` (Windows: `python` öffnet den Microsoft Store) | Kein Python installiert. Im Prompt „Python-Skript“ durch „Node.js-Skript ohne zusätzliche Pakete“ ersetzen, ebenso den Dateinamen auf `pipeline_bericht.mjs`. |
| Das Skript findet die Datenbank nicht | Die Anwendung ist noch nie gelaufen, oder ihr seid nicht im Projektordner. Erst `./start.sh` in Fenster 1, Agent im Ordner `agentic-engineering-crm-lab` starten. |
| Der Agent rechnet die Summen selbst im Chat aus | Stoppen mit `Esc`: „Rechne nicht selbst. Die Zahlen kommen nur aus dem Skript.“ |
| Die Kontrollsummen gehen nicht auf | Gut bemerkt — genau dafür sind sie da. Zeigt dem Agenten die Zahlen: „Offen + GEWONNEN + VERLOREN ergibt …, alle Chancen sind … Finde den Fehler im Skript.“ |
| Die neue Chance taucht im Bericht nicht auf | Gespeichert? In der Chancen-Liste im CRM nachsehen. Liegt ihr erwartetes Datum vor dem Stichtag, zählt sie als überfällig. |
| Der Agent will die Datenbank ändern oder die Anwendung beenden | Ablehnen: „Nur lesen. Die Anwendung läuft weiter.“ |
| Der Agent will pushen oder einen Pull Request anlegen | Ablehnen. Im Lab-Repo fehlen euch die Rechte, und euer Branch bleibt lokal. |

## Diskussion

- Was müsst ihr bei einem Skript prüfen — und was nicht mehr bei jedem Lauf?
- Welche eurer Regeln hätte der Agent ohne Vorgabe anders entschieden?
  (Probiert es: Prompt ohne R3 und R4, Plan lesen, dann mit `Esc` abbrechen.)
- Ein Werkzeug sagt Umsätze mit „90 % Genauigkeit“ voraus. Wie würdet ihr
  das so prüfen, dass bei jeder Prüfung dasselbe herauskommt?
