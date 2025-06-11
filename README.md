# SkateList

A modern web application for displaying and organizing skateboarding trick videos with a beautiful dark theme interface.

## ✨ Features

- **Featured Carousel**: Highlights videos with YouTube paths in an elegant carousel
- **Organized Categories**: Automatically categorizes tricks into tabs:
  - **Flat Tricks**: Flip tricks, rotations, pivots, and basic stances
  - **Grinds**: Grinding tricks (expandable for future content)
  - **Other**: All remaining tricks
- **Dynamic Search**: Real-time filtering across all categories
- **Progress Tracking**:
  - "Tricks Done" dropdown with completed tricks
  - "Tricks Todo" dropdown for planned tricks
- **Responsive Design**: Mobile-first design that works on all devices
- **Dark Theme**: Modern, eye-friendly dark interface
- **YouTube Integration**: Embedded video players with controls

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher, includes npm)

### Recommended Global Tools

For the best development experience, install these tools globally:

```bash
npm install -g nodemon sass
```

- **Nodemon**: Auto-restarts server on file changes
- **Sass**: Enables SCSS compilation and watching

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Swik-Swik/SkateList.git
   cd SkateList
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### 🛠 Development Workflow

This project uses **SCSS** for styling, which must be compiled to CSS.

#### Option 1: Development Mode (Recommended)

Run both processes simultaneously for live development:

**Terminal 1 - SCSS Watcher:**

```bash
npm run scss
```

**Terminal 2 - Server:**

```bash
npm start
```

#### Option 2: Manual Build

For single builds without watching:

```bash
npm run build  # Compile SCSS to CSS
npm start      # Start server
```

Visit `http://localhost:3000` to view the application.

## 📁 Project Structure

```
SkateList/
├── index.html              # Main application page
├── server.js               # Express.js server
├── package.json            # Dependencies and scripts
├── scss/                   # SCSS source files
│   ├── main.scss          # Main SCSS entry point
│   ├── style.scss         # Core application styles
│   └── search.scss        # Search functionality styles
├── public/css/            # Compiled CSS output
│   └── style.css          # Generated from SCSS
├── js/                    # JavaScript files
│   └── script.js          # Main application logic
├── json/                  # Data files
│   ├── videos.json        # Video metadata and categories
│   └── todo.json          # Todo tricks list
├── images/                # Image assets
│   ├── swik_logo.svg      # Main logo
│   ├── normal.jpg         # Stance images...
│   ├── nollie.jpg
│   ├── fakie.jpg
│   ├── switch.jpg
│   └── unknown.jpg
└── videos/                # Video files (if any local videos)
```

## 🎨 Customization

### Adding New Tricks

1. **Completed Tricks**: Add to `json/videos.json`

   ```json
   {
     "title": "Kickflip",
     "types": ["NORMAL", "FLIPTRICK"],
     "path": "youtube-video-id" // Optional: for featured carousel
   }
   ```

2. **Todo Tricks**: Add to `json/todo.json`
   ```json
   {
     "name": "Tre Flip"
   }
   ```

### Styling

- Edit SCSS files in `scss/` directory
- Run `npm run scss` for live compilation
- Main variables are in `scss/style.scss` at the top

### Categories

Tricks are automatically categorized by their `types`:

- **Flat Tricks**: `FLIPTRICK`, `ROTATION`, `PIVOT`, `NORMAL`, `NOLLIE`, `FAKIE`, `SWITCH`
- **Grinds**: Any type containing "grind"
- **Other**: Everything else

## 🧰 Technologies

- **Backend**: Express.js server
- **Frontend**: Vanilla JavaScript, Bootstrap 5
- **Styling**: SCSS/Sass with custom dark theme
- **Video**: YouTube embed integration
- **Build**: npm scripts for SCSS compilation

## 📱 Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive design
- YouTube embed support required for video playback

## 🔧 Available Scripts

- `npm start` - Start the Express server
- `npm run scss` - Watch and compile SCSS files
- `npm run build` - One-time SCSS compilation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with `npm run build && npm start`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
