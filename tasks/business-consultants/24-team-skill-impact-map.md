# 24 — Ein Team-Skill: Protokolle in die Impact Map, mit neuen Ideen

**Dauer:** 25 min
**Sozialform:** einzeln oder Paare
**Werkzeug:** Claude Code oder GitHub Copilot CLI
**Voraussetzung:** Aufgabe 22 erledigt; euer Agent startet im Projektordner. Material: Rohnotizen [`material/vertriebsrunde-rohnotizen.md`](material/vertriebsrunde-rohnotizen.md) aus Aufgabe 01 und das Gerüst [`material/impact-map-vertrieb.md`](material/impact-map-vertrieb.md)
**Ziel:** Ein Skill im Projekt schreibt Protokolle in die Impact Map des Teams und schlägt neue Ideen vor — Belegtes und Ideen sind dabei getrennt markiert, und ihr habt jede Idee selbst bewertet.

Eine Impact Map nutzt ihr in der Discovery: Welches Ziel verfolgen wir, wer
trägt dazu bei, wie müsste sich sein Verhalten ändern — und was bauen wir
dafür? Die KI ist dabei doppelt nützlich: Sie trägt ein, was in neuen
Protokollen steht, und sie schlägt Ideen vor, auf die noch niemand gekommen
ist.

Allein im eigenen Chat hilft das nur euch. Ein **Skill** ist eine
Arbeitsanweisung für den Agenten, die als Datei im Projekt liegt. Wer das
Projekt hat, hat den Skill: Kommt er per Pull Request ins gemeinsame
Repository, ruft jede Person im Team ihn mit `/impact-map-fortschreiben`
auf — und alle arbeiten nach denselben Regeln an derselben Map.

Die wichtigste Regel: **Belegtes und Ideen bleiben getrennt.** Arbeitet ein
ganzes Team an einer Map, muss jede Person sehen, was in einem Protokoll
stand und was die KI vorgeschlagen hat. Sonst ist eine KI-Idee nach zwei
Wochen „eine Anforderung aus dem Vertrieb“.

<!-- include: warnung-rechte -->

## Schritte

1. **Einen Skill ansehen.** Öffnet im Nachprüf-Fenster
   `open -a TextEdit .claude/skills/write-ticket/SKILL.md` (Windows:
   `notepad .claude\skills\write-ticket\SKILL.md`) und lest die ersten
   Zeilen. Ein Skill ist nur Text: oben Name und Beschreibung, darunter der
   Ablauf in Worten. Schließt die Datei wieder.
2. **Den Skill schreiben lassen.** Gebt im Agentenfenster Prompt 1 ein. Er
   legt einen Branch an, legt die Impact Map unter `docs/impact-map.md` ab
   und schreibt den Skill. Lest die Regeln im Prompt, bevor ihr ihn
   abschickt — das sind die Regeln, nach denen später das ganze Team
   arbeitet. Wollt ihr eine Regel anders, ändert sie jetzt.
   **Fragt der Agent, ob er in `.claude/` schreiben darf:** Ja, einmal
   erlauben. Dort liegen die Regeln des Projekts — darum fragt er auch im
   Auto-Modus nach.
3. **Den Agenten neu starten.** Beendet ihn (Claude Code `/exit`, Copilot
   zweimal `Ctrl+C`) und startet ihn wieder mit `claude` bzw. `copilot`.
   `/skills` zeigt jetzt auch `impact-map-fortschreiben`.
4. **Den Skill anwenden.** Gebt Prompt 2 ein. Der Skill zeigt einen
   Vorschlag in zwei Teilen — **A** belegt, **B** Ideen — und wartet, bevor
   er etwas in die Map schreibt.
5. **Teil A prüfen wie bei der Fehlerjagd.** Steht jeder Eintrag mit dieser
   Quelle so in den Rohnotizen? Achtet besonders darauf, ob aus einer
   offenen Frage („-> unklar“, „-> offen“) eine Tatsache geworden ist — und
   was mit einem Wunsch mit Fragezeichen passiert („gewichteter Wert
   daneben??“). Was nicht stimmt, gebt ihr mit Nummer zurück.
6. **Teil B bewerten.** Entscheidet je Idee: behalten oder streichen.
   Streicht mindestens eine bewusst und sagt dem Agenten, warum — etwa „B3
   streichen: Das löst kein Problem aus den Notizen.“ Dann: „Okay, schreib
   die Map.“
7. **Committen und nachsehen.** Sagt dem Agenten: „Committe Skill und
   Impact Map.“ Im Nachprüf-Fenster zeigt `git log --oneline -3` den
   Commit, `open -a TextEdit docs/impact-map.md` (Windows:
   `notepad docs\impact-map.md`) die Map. Hat jede Idee die Marke
   `[Idee, ungeprüft]`?

## Folienschritte

1. Einen vorhandenen Skill ansehen: nur Text.
2. Prompt 1: Skill und Impact Map anlegen lassen.
3. Agent neu starten, Prompt 2: Protokoll einarbeiten.
4. Teil A gegen die Notizen prüfen, Teil B bewerten.
5. Committen, Map ansehen: Ideen markiert?

## Prompt 1 — den Skill anlegen

```
Ich möchte für mein Team einen Skill anlegen. So gehst du vor:

1. Lege von main aus den Branch feature/team-skill-impact-map an.
2. Kopiere tasks/business-consultants/material/impact-map-vertrieb.md
   nach docs/impact-map.md.
3. Lege den Skill .claude/skills/impact-map-fortschreiben/SKILL.md an,
   im Stil der anderen Skills in .claude/skills/, aber kurz und auf Deutsch.
   Er bekommt als Argument den Pfad zu einem Protokoll.
4. Zeig mir den Skill und committe noch nicht.

Diese Regeln stehen im Skill:
- Lies zuerst docs/impact-map.md, vor allem den Abschnitt „Kennzeichnung“,
  dann das Protokoll.
- Teil A, belegt: Trag ein, was im Protokoll steht — neue Beteiligte (Wer),
  Verhaltensänderungen (Wie) und Wünsche (Was). Jeder Eintrag bekommt
  [Quelle: <Protokoll>, <Stelle>]. Offene Fragen aus dem Protokoll kommen
  unter „Offene Fragen“, nie als Tatsache in die Map. Namen und Zahlen nur
  so, wie sie im Protokoll stehen.
- Teil B, Ideen: Schlag neue Was-Einträge vor, die niemand gesagt hat —
  mindestens eine Idee je Beteiligtem und mindestens eine ungewöhnliche.
  Jede Idee bekommt [Idee, ungeprüft] und darunter drei Zeilen: Wirkung,
  Annahme, Prüfen.
- Zeig erst den Vorschlag, Teil A und Teil B nummeriert (A1, A2 …, B1,
  B2 …), und warte auf mein Okay. Erst dann schreibst du in die Map.
- Lösche nichts, was schon in der Map steht. Mach aus einer Idee nie einen
  belegten Eintrag.
- Ändere nur docs/impact-map.md. Erstelle keinen PR und pushe nicht.
```

## Prompt 2 — ein Protokoll einarbeiten

```
/impact-map-fortschreiben tasks/business-consultants/material/vertriebsrunde-rohnotizen.md
```

## Abnahme

- [ ] Der Skill liegt unter `.claude/skills/impact-map-fortschreiben/SKILL.md`
      und enthält eure Regeln — auch die Trennung von belegt und Idee.
- [ ] Jeder belegte Eintrag in `docs/impact-map.md` steht so in den
      Rohnotizen; die Frage „zählt eine Wiedervorlage als Aktivität?“ steht
      unter „Offene Fragen“, nicht als Tatsache.
- [ ] Jede Idee trägt `[Idee, ungeprüft]` mit Wirkung, Annahme und Prüfen.
- [ ] Mindestens eine Idee habt ihr gestrichen und könnt sagen, warum.
- [ ] `git log --oneline -3` zeigt den Commit auf eurem Branch.

## Troubleshooting

| Problem | Lösung |
|---|---|
| Der Agent meldet, dass er `.claude/skills/…` nicht schreiben darf | Die Rückfrage zum Schreiben in `.claude/` wurde abgelehnt oder übersehen. Sagt: „Leg die Datei noch einmal an“, und erlaubt es diesmal. |
| `/impact-map-fortschreiben` ist unbekannt | Agent einmal beenden und neu starten; er liest die Skills beim Start. Liegt die Datei im falschen Ordner, hilft `ls .claude/skills` im Nachprüf-Fenster. |
| Der Skill schreibt sofort in die Map, ohne Vorschlag | Stoppen mit `Esc`: „Erst den Vorschlag zeigen und warten — so steht es im Skill.“ Danach die Regel im Skill nachschärfen lassen. |
| Eine Idee steht ohne Marke in der Map | „B… ist eine Idee, kein Protokoll-Inhalt. Markiere sie mit [Idee, ungeprüft].“ |
| Nur naheliegende Ideen | „Gib mir drei Ideen, auf die niemand in der Runde gekommen wäre — eine davon ohne Software.“ |
| Agent will in `docs/specs/` oder an anderen Skills etwas ändern | Ablehnen: „Nur docs/impact-map.md und der neue Skill.“ |
| Agent will pushen oder einen Pull Request anlegen | Ablehnen. Im Lab-Repo fehlen euch die Rechte, und euer Branch bleibt lokal. |

## Diskussion

- Welche Regel im Skill war am wichtigsten — und welche fehlt noch, wenn
  zwölf Leute im Team damit arbeiten?
- Wie viel Kontext gehört in so ein gemeinsames „Second Brain“? Was würdet
  ihr bewusst draußen lassen — und wer räumt die Map auf, wenn sie wächst?
- Welche Idee aus Teil B würdet ihr in der nächsten Vertriebsrunde
  ansprechen, und mit welcher Frage?
