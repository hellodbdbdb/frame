# frame — Einrichtung (Deutsch)

Schritt-für-Schritt-Anleitung mit den exakten deutschen Menübezeichnungen aus der Firebase-Konsole und GitHub. Dauer: ca. 10–15 Minuten.

---

## 1. Firebase-Projekt anlegen

1. Öffne **https://console.firebase.google.com/** und melde dich mit deinem Google-Account an.
2. Klicke auf **„Projekt hinzufügen"**.
3. Projektname: `frame` (oder frei wählbar) → **„Weiter"**.
4. Google Analytics: **„Google Analytics für dieses Projekt aktivieren"** → aus. → **„Projekt erstellen"**.
5. Warte bis das Projekt bereit ist → **„Weiter"**.

## 2. Google-Anmeldung aktivieren

1. Linke Seitenleiste → **„Erstellen"** → **„Authentifizierung"**.
2. Klicke **„Jetzt starten"**.
3. Reiter **„Sign-in-Methode"** → Liste **„Zusätzliche Anbieter"** → **„Google"** wählen.
4. Rechts oben Schalter auf **„Aktiviert"**.
5. **„Support-E-Mail für das Projekt"**: deine E-Mail wählen.
6. **„Speichern"**.

## 3. Firestore-Datenbank anlegen

1. Linke Seitenleiste → **„Erstellen"** → **„Firestore-Datenbank"**.
2. Klicke **„Datenbank erstellen"**.
3. **Speicherort**: `eur3 (europe-west)` (für Berlin ideal) → **„Weiter"**.
4. **Sicherheitsregeln**: **„Im Produktionsmodus starten"** wählen → **„Erstellen"**.

## 4. Sicherheitsregeln setzen (wichtig — sonst kann jeder alles lesen)

1. In der Firestore-Ansicht oben den Reiter **„Regeln"** öffnen.
2. Den kompletten Inhalt ersetzen durch:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

3. **„Veröffentlichen"** klicken.

Das sperrt deine Daten strikt auf deine eigene User-ID.

## 5. Web-App registrieren und Config kopieren

1. Oben links Zahnrad-Symbol → **„Projekteinstellungen"**.
2. Reiter **„Allgemein"** → nach unten scrollen zu **„Meine Apps"**.
3. Auf das Web-Symbol `</>` klicken (**„Apps zum Einstieg hinzufügen"**).
4. **App-Alias**: `frame-web` → **„App registrieren"**.
5. Firebase-Hosting: **nicht** aktivieren → **„Weiter"**.
6. Du siehst jetzt einen Codeblock mit `const firebaseConfig = { ... }`. Werte merken oder kopieren.
7. **„Weiter zur Konsole"**.

## 6. Config-Datei lokal anlegen

Im `frame/`-Ordner im Terminal:

```bash
cp firebase-config.example.js firebase-config.js
```

Öffne `firebase-config.js` und ersetze alle `YOUR_...`-Werte mit den Werten aus Schritt 5.6.

> `firebase-config.js` steht in `.gitignore` — sie wird nie zu GitHub hochgeladen.

## 7. Lokal testen

ES-Module brauchen einen HTTP-Server (öffnen über `file://` funktioniert nicht):

```bash
cd frame
python3 -m http.server 8000
```

Öffne **http://localhost:8000** im Browser. **„sign in with Google"** klicken → Google-Popup → nach Anmeldung werden deine 26 Fragen automatisch in Firestore gesät.

## 8. GitHub-Repo anlegen

1. Gehe auf **https://github.com/new**.
2. **Repository name**: `frame`.
3. **Sichtbarkeit**: privat (empfohlen) oder öffentlich — Firestore-Regeln schützen deine Daten in beiden Fällen.
4. Keine README/Lizenz/Gitignore ankreuzen — die gibt es schon lokal.
5. **„Create repository"**.

Dann im Terminal im `frame/`-Ordner:

```bash
git init
git add .
git commit -m "frame mvp"
git branch -M main
git remote add origin https://github.com/DEIN-USERNAME/frame.git
git push -u origin main
```

## 9. GitHub Pages aktivieren

Im Repo auf github.com:

1. Reiter **„Settings"**.
2. Linke Seitenleiste → **„Pages"**.
3. **Source**: **„Deploy from a branch"**.
4. **Branch**: `main` · **Folder**: `/ (root)` → **„Save"**.
5. Nach ca. 30–60 Sekunden oben grünes Feld mit deiner URL: `https://DEIN-USERNAME.github.io/frame/`.

## 10. Domain in Firebase autorisieren

Sonst blockiert Firebase den Login von der Pages-URL.

1. Zurück in der Firebase-Konsole → linke Seitenleiste → **„Erstellen"** → **„Authentifizierung"**.
2. Reiter **„Einstellungen"** → Abschnitt **„Autorisierte Domains"**.
3. **„Domain hinzufügen"** → eingeben: `DEIN-USERNAME.github.io` → **„Hinzufügen"**.

## 11. Fertig

Öffne `https://DEIN-USERNAME.github.io/frame/` auf Handy oder Desktop, melde dich mit Google an — deine Daten synchronisieren automatisch zwischen allen Geräten.

---

## Später: Antworten bearbeiten

In der App: Frage öffnen → **„edit"** → Anchor, Antwort, Beats anpassen → **„save"**. Änderungen landen direkt in Firestore und erscheinen auf allen Geräten.

## Später: Neuer Interview-Zyklus

Wenn du für ein nächstes Interview startest und Fortschritt zurücksetzen willst:

1. Firebase-Konsole → **„Firestore Database"** → Reiter **„Daten"**.
2. Deinen User-Dokumentpfad öffnen: `users/DEINE-UID`.
3. Drei-Punkte-Menü neben dem Dokument → **„Dokument löschen"**.
4. Beim nächsten Login werden die 26 Seed-Fragen neu geschrieben. Alte Logs bleiben erhalten, wenn du nur das User-Dokument löschst — die ganze Sammlung löschen, wenn du wirklich bei null starten willst.

## Fehlersuche

- **„auth/unauthorized-domain"** beim Login → Schritt 10 vergessen. Domain in Firebase autorisieren.
- **„Missing or insufficient permissions"** → Firestore-Regeln aus Schritt 4 nicht veröffentlicht.
- **Popup wird blockiert** (Safari Mobile) → die App fällt automatisch auf Redirect-Login zurück. Einfach nochmal klicken.
- **Seite lädt weiß auf GitHub Pages** → Browser-Konsole öffnen (`F12`). Fehlt `firebase-config.js`? Die musst du lokal erstellen **und** committen — oder alternativ direkt in GitHub über **„Add file → Create new file"** hochladen. Achtung: Config-Werte sind nicht geheim (Firebase-Regeln schützen die Daten), aber öffentliche Repos zeigen sie — daher am besten privates Repo.
- **„sign in with Google"-Button bleibt ohne Reaktion** → Browser blockiert das Popup. Einmal manuell erlauben und neu klicken.
