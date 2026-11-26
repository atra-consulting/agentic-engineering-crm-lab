# 13 — Vom Screenshot zum Ticket

**Dauer:** 25 min
**Sozialform:** einzeln
**Werkzeug:** Chat-Assistent mit Bild-Upload (Claude, ChatGPT, Gemini oder Microsoft 365 Copilot), Ticket-Board
**Voraussetzung:** Lab läuft unter `localhost:7200`; Screenshot [`bilder/13-chancen-neu-blau.png`](bilder/13-chancen-neu-blau.png) oder ein eigener vom Trainer
**Ziel:** Aus einem Screenshot mit handschriftlicher Änderung wird ein Ticket im Ticket-Board: geprüfte User Story mit Akzeptanzkriterien, Status Definition, nichts verloren und nichts dazuerfunden.

Ein Screenshot aus dem CRM, auf dem jemand von Hand eine Änderung eingezeichnet
hat — so landen Anforderungen oft auf eurem Tisch. Ihr macht daraus ein Ticket,
mit dem das Team arbeiten kann: Der Chat-Assistent liest das Bild und schreibt
eine User Story, ihr prüft sie gegen den Screenshot und legt das Ticket im
Ticket-Board des Labs an.

Das CRM braucht ihr erst ab Schritt 4. Bis dahin arbeitet ihr nur mit dem
Screenshot und eurem Chat-Assistenten. Das Ticket-Board kennt keine Anhänge:
Was im Bild steckt, kommt als Text ins Ticket — genau das ist die Übung.

## Schritte

1. **Erst selbst hinsehen.** Öffnet den Screenshot. Notiert in zwei, drei
   Stichpunkten, was sich ändern soll und welcher Bildschirm des CRM betroffen
   ist. Was könnt ihr nicht eindeutig lesen? Eure Stichpunkte sind der
   Vergleich: So merkt ihr, ob der Assistent etwas übersieht oder
   dazuerfindet.
2. **Den Assistenten das Bild lesen lassen.** Öffnet euren Chat-Assistenten —
   Claude, ChatGPT, Gemini oder Copilot, im Browser oder in der App, **nicht
   das CRM** — und beginnt einen neuen Chat. Zieht den Screenshot ins
   Chatfenster (oder hängt ihn über die Büroklammer an), fügt den Prompt
   unten ein und schickt beides zusammen ab. Der Prompt verlangt erst eine
   Beschreibung: So seht ihr, ob der Assistent das Bild richtig gelesen hat,
   bevor er daraus eine Story macht.
3. **Gegen das Bild prüfen.** Vergleicht die Antwort mit dem Screenshot und mit
   euren Notizen: Steht jede handschriftliche Änderung in der Story? Hat der
   Assistent etwas dazuerfunden? Sind seine offenen Fragen berechtigt?
   Beantwortet sie oder lasst sie bewusst als offene Frage im Ticket stehen.
4. **Gibt es das schon?** Öffnet <http://localhost:7200/admin/tickets>
   (Kachel `admin` anklicken) und überfliegt die Titel in **allen** Spalten.
   Öffnet jedes Ticket, das nach demselben Thema klingt, und lest es: Deckt
   es eure Anforderung schon ab — oder entscheidet es etwas anders als ihr?
   Bevor man ein Ticket anlegt, sucht man nach einem vorhandenen; zwei
   Tickets zum selben Thema mit verschiedenen Antworten bringen jedes Team
   durcheinander. Findet ihr eines, legt euer Ticket trotzdem an und
   schreibt in die Beschreibung eine Zeile: „Verwandt: #‹Nr› — Unterschied:
   …“. Offene Widersprüche kommen zu den offenen Fragen.
5. **Ticket anlegen.** Klickt auf dem Board **Neues Ticket**.
   - **Typ:** `FEATURE` — oder `BUG`, wenn der Screenshot einen Fehler zeigt.
   - **Titel:** kurz und fachlich, aus Sicht des Nutzers.
   - **Beschreibung:** die geprüfte User Story mit Akzeptanzkriterien, offenen
     Fragen und einer Zeile zur Herkunft: „Vorlage: Screenshot
     ‹Dateiname› vom ‹Datum›". Der Screenshot kommt nicht mit ins
     Ticket — die Zeile sagt allen, woher die Anforderung stammt.
6. **Ticket prüfen.** Das Ticket steht in der Spalte **Definition**, Owner
   (zuständig) ist der Mensch. Öffnet es und lest es so, als hättet ihr den
   Screenshot nie gesehen: Versteht man, was zu tun ist? Merkt euch die Ticketnummer — Aufgabe
   23 macht mit genau diesem Ticket weiter. Dort liest die KI euer Ticket genau so:
   nur Beschreibung und Kommentare, nicht den Screenshot.

**Gebt das Ticket noch nicht an die KI ab** — kein „An KI übergeben", kein „Nach
Bereit". Es bleibt in Definition; die nächsten Schritte im Prozess kommen in
Aufgabe 23.

## Folienschritte

1. Screenshot ansehen, Änderung in Stichpunkten notieren.
2. Screenshot und Prompt an den Chat-Assistenten.
3. Antwort gegen das Bild prüfen: nichts fehlt, nichts erfunden.
4. Auf dem Board nach einem Ticket zum selben Thema suchen.
5. Ticket im Ticket-Board anlegen — es bleibt in Definition.

## Prompt

```
Im angehängten Screenshot aus unserem CRM hat jemand von Hand eine Änderung
eingezeichnet.

1. Beschreibe zuerst nur, was du siehst: Welcher Bildschirm ist das, und was
   ist von Hand eingezeichnet oder dazugeschrieben?
2. Schreibe daraus eine User Story („Als … möchte ich …, damit …") mit
   3 bis 5 prüfbaren Akzeptanzkriterien.
3. Liste offene Fragen auf: alles, was im Bild nicht eindeutig ist. Rate
   nicht — wenn du etwas nicht sicher lesen kannst, schreib es als Frage.

Halte dich an das, was im Bild steht. Keine zusätzlichen Features.
```

## Abnahme

- [ ] Im Ticket-Board steht ein neues Ticket in der Spalte **Definition**,
      Owner Mensch.
- [ ] Die Beschreibung enthält eine User Story und mindestens drei prüfbare
      Akzeptanzkriterien.
- [ ] Jede handschriftliche Änderung aus dem Screenshot findet sich im Ticket
      wieder — und nichts, was nicht im Bild steht.
- [ ] Offene Fragen sind beantwortet oder ausdrücklich als offen markiert.
- [ ] Ihr habt nach einem Ticket zum selben Thema gesucht; gibt es eines,
      verweist euer Ticket darauf und nennt den Unterschied.
- [ ] Jemand, der den Screenshot nicht kennt, versteht das Ticket.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Kein „Neues Ticket" auf dem Board | Anlegen dürfen nur Admins: abmelden und die Kachel `admin` anklicken. |
| Der Assistent liest die Handschrift falsch | Nachfragen mit dem, was ihr seht: „Im Kreis steht ‚…', nicht ‚…'." Oder den Ausschnitt größer zuschneiden und noch einmal geben. |
| Die Story enthält Dinge, die nicht im Bild stehen | Streichen. Wenn sie euch sinnvoll erscheinen: als offene Frage ins Ticket, nicht als Anforderung. |
| Kein Bild-Upload im Chat-Assistenten | Freie Stufen begrenzen manchmal Uploads — zu zweit an einem Rechner weiterarbeiten, auf dem es geht. |

## Diskussion

- Was hat der Assistent im Bild gesehen, das euch entgangen war — und umgekehrt?
- Welche Information aus dem Screenshot ging auf dem Weg ins Ticket verloren?
- Zwei Tickets zum selben Thema, verschieden entschieden: Welches gilt — und
  wer entscheidet das?
- Hätte ein Entwickler (oder ein Agent) mit dem Screenshot allein mehr oder
  weniger verstanden als mit eurem Ticket?
