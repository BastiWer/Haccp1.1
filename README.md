# HACCP Reinigungs-Kontroll-App

Eine webbasierte Anwendung zur digitalen Dokumentation von Reinigungskontrollen nach HACCP-Richtlinien – speziell für Küchen, Bars und Veranstaltungsorte.

---

## Funktionen

- **Multi-Restaurant-Support** – Ein Login-System für mehrere Betriebe, Daten werden automatisch getrennt
- **Geräte- & Bereichsverwaltung** – Reinigungsobjekte anlegen, bearbeiten und löschen (täglich/wöchentlich/monatlich)
- **Reinigungs-Checkliste** – Kontrollen mit Mitarbeiterkürzel und Zeitstempel erfassen
- **Dashboard** – Tages-, Wochen- und Monatsstatistiken auf einen Blick
- **Historie** – Vollständige Übersicht aller durchgeführten Kontrollen
- **PDF-Export** – Reinigungsprotokolle als PDF herunterladen (inkl. Restaurant-Daten)
- **Restaurant-Einstellungen** – Name, Adresse, Verantwortlicher und E-Mail für den PDF-Export konfigurieren
- **Dark/Light Mode** – Umschaltbare Darstellung

---

## Tech-Stack

| Komponente | Technologie |
|---|---|
| Frontend | React 19, Tailwind CSS, Shadcn/UI, Lucide Icons |
| Backend | Python, FastAPI |
| Datenbank | MongoDB |
| Auth | JWT (JSON Web Tokens), bcrypt |
| PDF | ReportLab |

---

## Schnellstart

### Voraussetzungen

- Node.js 18+
- Python 3.11+
- MongoDB 5.0+

### 1. Repository klonen

```bash
git clone https://github.com/BastiWer/haccp-app.git
cd haccp-app
```

### 2. Umgebungsvariablen einrichten

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Passen Sie die Werte in `backend/.env` an:

```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="haccp_database"
JWT_SECRET_KEY="IHR-SICHERER-SCHLÜSSEL"
```

### 3. Backend starten

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

### 4. Frontend starten

```bash
cd frontend
yarn install
yarn start
```

Die App ist dann erreichbar unter: **http://localhost:3000**

---

## Projektstruktur

```
haccp-app/
├── backend/
│   ├── server.py          # FastAPI – Auth, CRUD, PDF-Export
│   ├── requirements.txt   # Python-Abhängigkeiten
│   ├── .env.example       # Vorlage für Umgebungsvariablen
│   └── .env               # Lokale Konfiguration (nicht im Git)
├── frontend/
│   ├── src/
│   │   ├── App.js         # Routing & Navigation
│   │   ├── App.css        # Styling & Dark Mode
│   │   ├── pages/         # Login, Register, Dashboard, Checklist, etc.
│   │   ├── components/    # UI-Komponenten (Shadcn)
│   │   └── utils/auth.js  # JWT-Token-Verwaltung
│   ├── .env.example       # Vorlage für Umgebungsvariablen
│   └── package.json
├── INSTALLATION.md         # Ausführliche Server-Installationsanleitung
└── README.md
```

---

## API-Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| POST | `/api/auth/register` | Neues Konto + Restaurant erstellen |
| POST | `/api/auth/login` | Anmelden |
| GET | `/api/auth/me` | Aktueller Benutzer |
| GET | `/api/items` | Alle Reinigungsobjekte |
| POST | `/api/items` | Neues Objekt anlegen |
| PUT | `/api/items/{id}` | Objekt bearbeiten |
| DELETE | `/api/items/{id}` | Objekt löschen |
| GET | `/api/checks` | Kontrollen abrufen |
| POST | `/api/checks` | Neue Kontrolle erfassen |
| GET | `/api/dashboard/stats` | Dashboard-Statistiken |
| PUT | `/api/restaurant` | Restaurant-Daten aktualisieren |
| GET | `/api/export/pdf` | PDF-Export herunterladen |

---

## Production-Deployment

Für eine vollständige Server-Installationsanleitung (inkl. Nginx, SSL, Systemd) siehe:
**[INSTALLATION.md](INSTALLATION.md)**

### Kurzfassung

```bash
# Backend als Service
uvicorn server:app --host 0.0.0.0 --port 8001

# Frontend Build
cd frontend && yarn build

# Mit Nginx als Reverse-Proxy bereitstellen
```

---

## Sicherheitshinweise

- `JWT_SECRET_KEY` in `backend/.env` durch einen sicheren Zufallsstring ersetzen
- `CORS_ORIGINS` in Production auf die eigene Domain beschränken
- MongoDB-Authentifizierung aktivieren
- SSL/HTTPS verwenden (z.B. Let's Encrypt)
- `.env`-Dateien sind über `.gitignore` vom Repository ausgeschlossen

---

## Lizenz

Dieses Projekt ist für den privaten und kommerziellen Gebrauch frei verwendbar.
