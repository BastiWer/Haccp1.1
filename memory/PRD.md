# HACCP Reinigungs-Kontroll-App – PRD

## Problem Statement
HACCP-Kontroll-App für Küche/Bar und Veranstaltungsorte. Fokus auf Reinigungsroutinen (Geräte und Bereiche), nicht auf Temperaturüberwachung.

## Kernfunktionen (alle implementiert)
- Multi-Restaurant-Support mit JWT-Auth
- Geräte-/Bereichsverwaltung (CRUD)
- Reinigungs-Checkliste mit Zeitstempel + Mitarbeitername
- Dashboard mit Statistiken (Heute/Woche/Monat)
- Historie-Ansicht
- PDF-Export mit Restaurant-Einstellungen
- Dark/Light Mode
- Restaurant-Profil (Name, Adresse, Verantwortlicher, E-Mail)

## Tech-Stack
- Frontend: React 19, Tailwind CSS, Shadcn/UI
- Backend: FastAPI (Python)
- Datenbank: MongoDB
- Auth: JWT + bcrypt (direkt, ohne passlib)
- PDF: ReportLab

## Architektur
- `backend/server.py` – Gesamte Backend-Logik
- `frontend/src/pages/` – Login, Register, Dashboard, Checklist, ManageItems, History, Settings
- `frontend/src/utils/auth.js` – JWT-Token-Verwaltung

## Was wurde erledigt
- Alle Kernfunktionen implementiert und getestet
- bcrypt-Warnung behoben (passlib durch direktes bcrypt ersetzt)
- .gitignore abgesichert (.env-Dateien ausgeschlossen)
- .env.example Dateien für Backend + Frontend erstellt
- README.md für GitHub erstellt (Deutsch)
- INSTALLATION.md für Self-Hosting vorhanden

## Backlog
- P0: Deployment (Emergent oder GitHub-Export)
- P2: Code-Refactoring (server.py aufteilen)
