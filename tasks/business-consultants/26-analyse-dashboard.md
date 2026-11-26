# 26 — Dashboard aus einer Excel-Liste

**Dauer:** 30–45 min
**Sozialform:** einzeln oder Paare
**Werkzeug:** Claude (Desktop-App oder Claude Code in VS Code). Alternativ GitHub Copilot im Agent-Modus in VS Code. Microsoft 365 Copilot geht mit Einschränkungen, siehe unten.
**Voraussetzung:** Excel-Datei [`material/chancen-export.xlsx`](material/chancen-export.xlsx)
**Ziel:** Aus einer Excel-Liste wird ein kleines Dashboard. Ihr stellt eigene Fragen an die Daten und prüft mindestens eine Zahl selbst nach.

Die Datei enthält die 40 Verkaufschancen aus dem Schulungs-CRM — dieselben
wie in Aufgabe 25: Firma, Branche, Kontaktperson, Phase, Wert,
Wahrscheinlichkeit und Datum. Alle Daten sind erfunden. Das Blatt „Info“
erklärt jede Spalte. Stichtag ist der 30.11.2026.

Ein Dashboard sieht schnell überzeugend aus. Ob die Zahlen stimmen, sieht
man ihm nicht an. Darum gehört das Nachprüfen zur Übung.

## Schritte

1. **Datei ansehen.** Öffnet die Excel-Datei. Lest das Blatt „Info“. Welche
   Frage würde euer Vertriebsleiter zuerst stellen? Schreibt sie auf.
2. **Dashboard bauen.** Gebt dem Assistenten die Datei und Prompt 1.
   - *Claude Desktop:* Datei in den Chat ziehen, Prompt einfügen. Das
     Dashboard erscheint als Artifact rechts neben dem Chat.
   - *Claude Code / Copilot in VS Code:* Datei in den Projektordner legen,
     Prompt einfügen. Der Agent schreibt `dashboard.html`. Die Datei im
     Browser öffnen.
3. **Nachprüfen.** Nehmt eine Kennzahl aus dem Dashboard, z. B. die
   gewichtete Pipeline. Rechnet sie in Excel selbst nach (Filter auf die
   Phase, Summe der Spalte). Stimmt sie? Vergleicht auch mit den
   Vergleichswerten unter „Abnahme“.
4. **Eigene Frage stellen.** Nehmt eure Frage aus Schritt 1. Lasst sie
   beantworten und ins Dashboard einbauen (Prompt 2). Keine Idee? Nehmt
   eine aus der Liste unten.
5. **Auffälligkeiten.** Lest die Liste der Auffälligkeiten, die der
   Assistent gefunden hat. Was davon ist ein echtes Datenproblem? Was ist
   eine Geschäftsfrage?

## Folienschritte

1. Excel öffnen, Blatt „Info“ lesen, eine eigene Frage notieren.
2. Dashboard bauen lassen (Prompt 1).
3. Eine Kennzahl in Excel selbst nachrechnen.
4. Eigene Frage stellen und einbauen lassen (Prompt 2).
5. Auffälligkeiten in den Daten besprechen.

## Prompt

Prompt 1:

```
Die angehängte Excel-Datei enthält Verkaufschancen aus einem CRM (Blatt
"Chancen", Spaltenbeschreibung im Blatt "Info"). Stichtag ist der 30.11.2026.
Offen sind alle Chancen außer GEWONNEN und VERLOREN.

Baue daraus ein Dashboard für einen Vertriebsleiter:
- Eine einzige HTML-Datei. Die Daten stecken direkt in der Datei, sie lädt
  nichts nach. Diagramme mit Chart.js aus einem CDN.
- Oben vier Kennzahlen: offene Pipeline (Summe Wert), gewichtete Pipeline
  (Summe gewichteter Wert), Gewinnquote (gewonnen / abgeschlossen) und
  Anzahl offener Chancen.
- Diagramme: offene Chancen je Phase (Wert, in Phasen-Reihenfolge),
  gewichtete Pipeline je Quartal nach erwartetem Abschlussdatum,
  Gewinnquote je Branche, Top 10 Firmen nach gewichteter Pipeline.
- Filter für Branche und Phase. Alle Kennzahlen und Diagramme reagieren
  darauf.
- Alle Texte auf Deutsch. Beträge in Euro mit Tausenderpunkt.

Rechne alle Zahlen mit Code aus, nicht im Kopf. Nenne mir danach die vier
Kennzahlen als Zahl im Chat, damit ich sie prüfen kann. Liste außerdem bis
zu fünf Auffälligkeiten in den Daten auf. Ändere die Daten dabei nicht.
```

Prompt 2:

```
Meine Frage an die Daten: …
Beantworte sie zuerst kurz im Chat, mit den Zahlen dazu. Baue dann ein
passendes Diagramm oder eine Tabelle ins Dashboard ein. Lass alles andere
unverändert.
```

## Eigene Fragen — Ideen

- Welche offenen Chancen sind überfällig? Das erwartete Abschlussdatum liegt
  vor dem Stichtag. Wie viel Wert hängt daran?
- Wie verteilt sich die gewichtete Pipeline auf die Firmen? Gibt es ein
  Klumpenrisiko, also eine Firma mit sehr großem Anteil?
- In welchen Branchen gewinnen wir oft, in welchen selten?
- Wie hat sich der durchschnittliche Auftragswert von Jahr zu Jahr
  entwickelt?
- In welchen Monaten schließen wir die meisten Aufträge ab? Gibt es einen
  Jahresendspurt?
- Wie lange dauert es von „Erstellt am“ bis zum Abschluss? Unterscheiden
  sich gewonnene und verlorene Chancen?
- Welche Kontaktpersonen (nach Position) sind an gewonnenen Chancen
  beteiligt: Geschäftsführer oder Fachabteilung?
- Wie viel Umsatz bringt das nächste Quartal, wenn alle Wahrscheinlichkeiten
  stimmen? Und wenn nur die Chancen in VERHANDLUNG kommen?
- Welche Datensätze sind unplausibel? Zum Beispiel: Abschluss vor dem
  Erstellungsdatum, gewonnen mit Datum in der Zukunft.

## Abnahme

- [ ] Das Dashboard öffnet sich und zeigt vier Kennzahlen und vier
      Diagramme.
- [ ] Die Filter ändern Kennzahlen und Diagramme.
- [ ] Ihr habt mindestens eine Kennzahl in Excel selbst nachgerechnet.
- [ ] Eure eigene Frage ist beantwortet und im Dashboard zu sehen.

Vergleichswerte ohne Filter:

| Kennzahl | Wert |
|---|---|
| Offene Chancen | 26 |
| Offene Pipeline | 10.316.596 € |
| Gewichtete Pipeline | 5.080.323 € |
| Gewinnquote | 71,4 % (10 gewonnen, 4 verloren) |
| Davon überfällig | 21 Chancen, 8.037.126 € |

Offene Chancen, offene und gewichtete Pipeline und die überfälligen
Chancen sind dieselben Zahlen wie im Pipeline-Bericht aus Aufgabe 25.

## Werkzeuge

| Werkzeug | Geht das? |
|---|---|
| Claude Desktop | Ja. Datei hochladen, Ergebnis als Artifact. Mit „Teilen“ als Link weitergeben. |
| Claude Code in VS Code | Ja. Schreibt `dashboard.html` in den Ordner. |
| GitHub Copilot in VS Code (Agent-Modus) | Ja. Kann die Excel-Datei manchmal nicht lesen. Dann in Excel als CSV speichern und die CSV geben. |
| Microsoft 365 Copilot (Chat oder Excel) | Teilweise. Analysiert die Datei und erzeugt Diagramme. Ein interaktives HTML-Dashboard mit Filtern liefert er meist nicht. Prompt 1 dann so ändern: „Erstelle die Diagramme in Excel“. |

## Troubleshooting

| Problem | Lösung |
|---|---|
| Der Assistent sagt, er kann die Excel-Datei nicht lesen | In Excel „Speichern unter“ → CSV (UTF-8). Die CSV geben. |
| Das Dashboard ist leer | Der Assistent lädt die Datei nach, statt sie einzubetten. Nachfragen: „Bette die Daten direkt als JSON in die HTML-Datei ein.“ |
| Diagramme fehlen im Browser | Chart.js kommt aus dem Internet. Ohne Internet bleibt die Seite leer. |
| Zahlen weichen von den Vergleichswerten ab | Nachfragen: „Zeig mir, wie du die gewichtete Pipeline berechnet hast. Welche Phasen zählen als offen?“ |
| Datumsangaben falsch | „Die Datumsspalten sind echte Excel-Daten. Zeige sie als TT.MM.JJJJ.“ |

## Diskussion

- Welche Zahl hätte euer Vertriebsleiter ungeprüft geglaubt?
- Welche Auffälligkeit ist ein Datenfehler, welche eine Geschäftserkenntnis?
- Was müsste passieren, damit so ein Dashboard jede Woche mit frischen
  Daten aus dem CRM entsteht?
