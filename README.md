# SkateList - Development Guide

Skateboard tricks video showcase web application.

## Quick Start

```bash
git clone https://github.com/Swik-Swik/SkateList.git
cd SkateList
npm install
npm start
```

Access at `http://localhost:3001`

## Development

### Local Development

```bash
npm run dev    # Start with SCSS watching
npm start      # Start server only
```

### File Structure

- `js/script.js` - Main application code
- `json/` - Data files (videos.json, todo.json)
- `scss/` - Stylesheets (compiled to public/css/)
- `server.js` - Express server
- `index.html` - Main page

### Key Commands

```bash
npm run scss           # Compile SCSS once
npm run scss:watch     # Watch SCSS changes
npm run build          # Build for production
npm run clean          # Remove build files
```

## Production

### Build & Deploy

```bash
npm run build          # Minify JS/CSS
NODE_ENV=production npm start
```

### Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Data Management

### Adding Videos

Edit `json/videos.json`:

```json
{
  "title": "Trick Name",
  "types": ["FLIPTRICK", "NORMAL"],
  "path": "youtube-video-id"
}
```

### Adding Todo Tricks

Edit `json/todo.json`:

```json
{
  "name": "Trick Name"
}
```

## Technical Notes

- Uses Express.js server with security middleware
- Bootstrap 5 for UI components
- YouTube iframe API for video embedding
- SCSS compilation with Sass
- Namespace pattern (SkateApp) to avoid global pollution

## API Endpoints

- `GET /` - Main application
- `GET /health` - Health check
- `GET /json/videos.json` - Video data
- `GET /json/todo.json` - Todo data

## Troubleshooting

**Videos not loading:** Check YouTube video IDs in videos.json
**SCSS not compiling:** Run `npm run scss` manually
**Port conflicts:** Set `PORT=3001` or different port
