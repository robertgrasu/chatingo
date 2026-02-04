# RAG Chatbot - Embeddable Widget

Chatbot cu RAG (Retrieval-Augmented Generation) care se integrează în orice site web printr-un snippet JavaScript.

## Structură

```
chatbot/
├── backend/          # FastAPI API + RAG engine
├── widget/           # React widget embeddable (compilat în widget.js)
├── admin-panel/      # React admin dashboard
├── test.html         # Pagină de test pentru widget
└── README.md
```

## Prerequisite

- Python 3.11+
- Node.js 18+
- PostgreSQL (rulând local sau remote)
- OpenAI API Key

## Setup

### 1. Backend

```bash
cd backend

# Creează virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Instalează dependențe
pip install -r requirements.txt

# Configurează environment
cp .env.example .env
# Editează .env cu valorile tale:
#   OPENAI_API_KEY=sk-...
#   DATABASE_URL=postgresql://user:pass@localhost/chatbot_db

# Creează baza de date PostgreSQL
# (rulează în psql sau pgAdmin):
#   CREATE DATABASE chatbot_db;

# Pornește serverul
uvicorn app.main:app --reload
```

Backend-ul rulează pe `http://localhost:8000`.
Documentația API: `http://localhost:8000/docs`

### 2. Widget

```bash
cd widget

# Instalează dependențe
npm install

# Build widget
npm run build

# Copiază widget.js în backend/static/
# Windows:
copy dist\widget.js ..\backend\static\widget.js
# Linux/Mac:
cp dist/widget.js ../backend/static/widget.js
```

### 3. Admin Panel

```bash
cd admin-panel

# Instalează dependențe
npm install

# Pornește dev server
npm start
```

Admin panel-ul rulează pe `http://localhost:3000`.

## Testare Flow Complet

1. **Pornește backend-ul** (uvicorn, port 8000)
2. **Build widget** și copiază `widget.js` în `backend/static/`
3. **Pornește admin panel** (npm start, port 3000)
4. **În admin panel:**
   - Creează o categorie (ex: "Produse")
   - Upload un fișier TXT în acea categorie
   - Configurează widget-ul din Settings
5. **Deschide `test.html`** în browser
6. **Click pe bubble 💬** și pune o întrebare despre conținutul documentului

## Environment Variables

| Variabilă | Descriere | Exemplu |
|-----------|-----------|---------|
| `OPENAI_API_KEY` | API key OpenAI | `sk-...` |
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@localhost/chatbot_db` |
| `CHROMA_PERSIST_DIR` | Director pentru ChromaDB | `./chroma_data` |
| `SECRET_KEY` | Secret key aplicație | `random-secret-key` |

## API Endpoints

| Metoda | Endpoint | Descriere |
|--------|----------|-----------|
| POST | `/api/chat` | Trimite mesaj și primește răspuns RAG |
| GET | `/api/admin/categories` | Lista categorii |
| POST | `/api/admin/categories` | Creează categorie |
| DELETE | `/api/admin/categories/{id}` | Șterge categorie |
| GET | `/api/admin/documents` | Lista documente |
| POST | `/api/admin/upload` | Upload document TXT |
| DELETE | `/api/admin/documents/{id}` | Șterge document |
| GET | `/api/widget/config/{bot_id}` | Configurație widget |
| PUT | `/api/widget/config/{bot_id}` | Actualizează configurație widget |

## Embed Code

```html
<script>
  window.chatbotConfig = {
    botId: 'bot_123',
    apiUrl: 'http://localhost:8000'
  };
</script>
<script src="http://localhost:8000/static/widget.js"></script>
```
