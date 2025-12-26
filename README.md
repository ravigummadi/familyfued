# 🎯 Family Feud - feud.family

A multi-player Family Feud game where anyone can create games, share 4-character codes, and play with friends!

**Live:** https://feud-family.web.app | https://feud.family

## Features

- 🎮 **4-character game codes** - Easy to share (e.g., ABCD)
- 🔄 **Two game modes** - Auto-advance or Host-controlled
- ➕ **Custom questions** - Hosts can add questions on the fly
- 📱 **Responsive design** - Works on desktop and mobile
- ⚡ **Real-time updates** - Scores update instantly

## Tech Stack

- **Frontend:** React + TypeScript
- **Backend:** FastAPI (Python)
- **Database:** Firebase Firestore
- **Hosting:** Firebase Hosting + Cloud Run
- **Domain:** feud.family

## Project Structure

```
familyfued/
├── backend/           # FastAPI backend
│   ├── main.py        # API endpoints
│   ├── models.py      # Pydantic models
│   ├── game_service.py    # Game logic
│   ├── firebase_config.py # Firebase setup
│   └── Dockerfile
├── frontend/          # React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── Home.tsx   # Create/Join game
│   │   ├── Host.tsx   # Host control panel
│   │   ├── Player.tsx # Player game view
│   │   └── api.ts     # API client
│   └── package.json
├── firebase.json      # Firebase config
└── firestore.rules    # Security rules
```

## Local Development

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## Deployment

### Backend (Cloud Run)
```bash
cd backend
gcloud run deploy feud-api --source . --region us-central1 --allow-unauthenticated
```

### Frontend (Firebase Hosting)
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## Environment Variables

For production deployment, set these in `.env.production`:
```
REACT_APP_API_URL=https://your-cloud-run-url.run.app
```

## License

MIT
