# HACCP-Kontroll-App - Installations-Anleitung

## 📋 Voraussetzungen

### Server-Anforderungen:
- Ubuntu 20.04 / 22.04 (oder ähnliche Linux-Distribution)
- Mindestens 2GB RAM
- 10GB freier Speicherplatz
- Root- oder Sudo-Zugriff

### Benötigte Software:
- Node.js 18.x oder höher
- Python 3.11 oder höher
- MongoDB 5.0 oder höher
- Nginx (für Production)
- Git

---

## 🚀 Installation - Schritt für Schritt

### Schritt 1: System-Updates und Software installieren

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js 18.x installieren
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Python 3.11 installieren (falls nicht vorhanden)
sudo apt install -y python3.11 python3.11-venv python3-pip

# MongoDB installieren
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt update
sudo apt install -y mongodb-org

# MongoDB starten und automatisch beim Booten starten
sudo systemctl start mongod
sudo systemctl enable mongod

# Nginx installieren (optional für Production)
sudo apt install -y nginx

# Yarn installieren (optional, aber empfohlen)
npm install -g yarn
```

### Schritt 2: Projektverzeichnis erstellen

```bash
# Projektverzeichnis erstellen
sudo mkdir -p /var/www/haccp-app
cd /var/www/haccp-app

# Berechtigungen setzen
sudo chown -R $USER:$USER /var/www/haccp-app
```

### Schritt 3: Code herunterladen

**Option A: Von GitHub (wenn Sie "Save to GitHub" verwendet haben)**
```bash
cd /var/www/haccp-app
git clone https://github.com/IHR-USERNAME/IHR-REPO.git .
```

**Option B: Manuell - Projektstruktur erstellen**
```bash
cd /var/www/haccp-app
mkdir -p backend frontend/src/pages frontend/src/components frontend/src/utils frontend/public
```

Dann kopieren Sie alle Dateien, die ich Ihnen im nächsten Schritt zeige.

---

## 📁 Backend-Dateien

### backend/requirements.txt
```
fastapi==0.110.1
uvicorn==0.25.0
python-dotenv>=1.0.1
pymongo==4.5.0
motor==3.3.1
pydantic>=2.6.4
email-validator>=2.2.0
pyjwt>=2.10.1
bcrypt==4.1.3
passlib>=1.7.4
python-jose>=3.3.0
reportlab>=4.0.0
python-multipart>=0.0.9
```

### backend/.env
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="haccp_database"
CORS_ORIGINS="*"
JWT_SECRET_KEY="ÄNDERN-SIE-DIESEN-SCHLÜSSEL-FÜR-PRODUCTION"
```

**WICHTIG:** Ändern Sie `JWT_SECRET_KEY` zu einem sicheren, zufälligen String!

### backend/server.py
Diese Datei ist zu groß - ich zeige Ihnen im nächsten Schritt, wie Sie sie kopieren.

---

## 📁 Frontend-Dateien

### frontend/.env
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

**WICHTIG:** Für Production ändern Sie dies zu Ihrer Domain:
```
REACT_APP_BACKEND_URL=https://ihre-domain.de
```

### frontend/package.json
```json
{
  "name": "haccp-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "@hookform/resolvers": "^5.0.1",
    "@radix-ui/react-accordion": "^1.2.8",
    "@radix-ui/react-alert-dialog": "^1.1.11",
    "@radix-ui/react-avatar": "^1.1.7",
    "@radix-ui/react-checkbox": "^1.2.3",
    "@radix-ui/react-dialog": "^1.1.11",
    "@radix-ui/react-dropdown-menu": "^2.1.12",
    "@radix-ui/react-label": "^2.1.4",
    "@radix-ui/react-popover": "^1.1.11",
    "@radix-ui/react-select": "^2.2.2",
    "@radix-ui/react-separator": "^1.1.4",
    "@radix-ui/react-slot": "^1.2.0",
    "@radix-ui/react-switch": "^1.2.2",
    "@radix-ui/react-tabs": "^1.1.9",
    "@radix-ui/react-toast": "^1.2.11",
    "axios": "^1.8.4",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "date-fns": "^4.1.0",
    "lucide-react": "^0.507.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.5.1",
    "react-scripts": "5.0.1",
    "sonner": "^2.0.3",
    "tailwind-merge": "^3.2.0",
    "tailwindcss-animate": "^1.0.7"
  },
  "scripts": {
    "start": "craco start",
    "build": "craco build",
    "test": "craco test"
  },
  "devDependencies": {
    "@craco/craco": "^7.1.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17"
  }
}
```

---

## ⚙️ Installation durchführen

### Backend einrichten
```bash
cd /var/www/haccp-app/backend

# Virtuelle Python-Umgebung erstellen
python3 -m venv venv

# Virtuelle Umgebung aktivieren
source venv/bin/activate

# Dependencies installieren
pip install -r requirements.txt
```

### Frontend einrichten
```bash
cd /var/www/haccp-app/frontend

# Dependencies installieren (mit yarn oder npm)
yarn install
# ODER
npm install

# Production-Build erstellen
yarn build
# ODER
npm run build
```

---

## 🔧 Services einrichten (Production)

### Systemd-Service für Backend

Erstellen Sie: `/etc/systemd/system/haccp-backend.service`

```ini
[Unit]
Description=HACCP Backend API
After=network.target mongodb.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/haccp-app/backend
Environment="PATH=/var/www/haccp-app/backend/venv/bin"
ExecStart=/var/www/haccp-app/backend/venv/bin/uvicorn server:app --host 0.0.0.0 --port 8001
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Systemd-Service für Frontend

Erstellen Sie: `/etc/systemd/system/haccp-frontend.service`

```ini
[Unit]
Description=HACCP Frontend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/haccp-app/frontend
Environment="PATH=/usr/bin:/usr/local/bin"
Environment="PORT=3000"
ExecStart=/usr/bin/serve -s build -l 3000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Serve installieren (für Frontend-Serving)
```bash
sudo npm install -g serve
```

### Services starten
```bash
# Services neu laden
sudo systemctl daemon-reload

# Services starten
sudo systemctl start haccp-backend
sudo systemctl start haccp-frontend

# Services beim Booten starten
sudo systemctl enable haccp-backend
sudo systemctl enable haccp-frontend

# Status überprüfen
sudo systemctl status haccp-backend
sudo systemctl status haccp-frontend
```

---

## 🌐 Nginx-Konfiguration (Production)

Erstellen Sie: `/etc/nginx/sites-available/haccp-app`

```nginx
server {
    listen 80;
    server_name ihre-domain.de www.ihre-domain.de;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Nginx aktivieren
```bash
# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/haccp-app /etc/nginx/sites-enabled/

# Nginx-Konfiguration testen
sudo nginx -t

# Nginx neu starten
sudo systemctl restart nginx
```

---

## 🔒 SSL/HTTPS mit Let's Encrypt (Optional aber empfohlen)

```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d ihre-domain.de -d www.ihre-domain.de

# Automatische Erneuerung testen
sudo certbot renew --dry-run
```

---

## 🧪 Testen

### Backend testen
```bash
curl http://localhost:8001/api/
# Sollte zurückgeben: {"message":"Hello World"}
```

### Frontend testen
```bash
curl http://localhost:3000
# Sollte HTML zurückgeben
```

### Über Domain testen (wenn Nginx konfiguriert)
Öffnen Sie im Browser: `http://ihre-domain.de`

---

## 📊 Logs anzeigen

```bash
# Backend-Logs
sudo journalctl -u haccp-backend -f

# Frontend-Logs
sudo journalctl -u haccp-frontend -f

# Nginx-Logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# MongoDB-Logs
sudo journalctl -u mongod -f
```

---

## 🔄 Updates durchführen

```bash
# Code aktualisieren (wenn von GitHub)
cd /var/www/haccp-app
git pull

# Backend aktualisieren
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart haccp-backend

# Frontend aktualisieren
cd ../frontend
yarn install
yarn build
sudo systemctl restart haccp-frontend
```

---

## 🛠️ Troubleshooting

### Backend startet nicht
```bash
# Logs prüfen
sudo journalctl -u haccp-backend -n 50

# Manuell testen
cd /var/www/haccp-app/backend
source venv/bin/activate
uvicorn server:app --host 0.0.0.0 --port 8001
```

### MongoDB-Verbindungsprobleme
```bash
# MongoDB-Status prüfen
sudo systemctl status mongod

# MongoDB neu starten
sudo systemctl restart mongod

# MongoDB-Logs prüfen
sudo journalctl -u mongod -n 50
```

### Port bereits in Verwendung
```bash
# Prozess auf Port 8001 finden
sudo lsof -i :8001

# Prozess auf Port 3000 finden
sudo lsof -i :3000

# Prozess beenden (PID ersetzen)
sudo kill -9 PID
```

---

## 📞 Support

Bei Problemen:
1. Logs überprüfen (siehe oben)
2. Nginx-Konfiguration testen: `sudo nginx -t`
3. Services-Status prüfen: `sudo systemctl status haccp-*`
4. Firewall-Regeln prüfen: `sudo ufw status`

---

## 🔐 Sicherheitshinweise für Production

1. **JWT_SECRET_KEY ändern** in `backend/.env`
2. **MongoDB-Authentifizierung aktivieren**
3. **Firewall konfigurieren** (nur Port 80/443 öffnen)
4. **Regelmäßige Backups** der MongoDB-Datenbank
5. **SSL/HTTPS verwenden** (Let's Encrypt)
6. **CORS_ORIGINS** auf Ihre Domain beschränken

```bash
# Firewall-Beispiel (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## ✅ Fertig!

Ihre HACCP-Kontroll-App läuft jetzt auf Ihrem Server! 🎉

- Frontend: `http://ihre-domain.de`
- Backend-API: `http://ihre-domain.de/api/`
- MongoDB: `localhost:27017`
