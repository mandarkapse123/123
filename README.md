# 📖 Novel Writer - Web-Based Writing Platform

A minimalist, offline-capable novel writing platform designed for distraction-free writing with comprehensive organization tools.

## 🚀 Quick Start

### Option 1: Use Locally (Recommended)
1. Download all files to your computer
2. Open `index.html` in any modern web browser
3. Start writing! Your data is saved locally in your browser

### Option 2: Deploy Online
- **Netlify**: Drag and drop the files to [netlify.com](https://netlify.com)
- **Vercel**: Connect your GitHub repository to [vercel.com](https://vercel.com)
- **GitHub Pages**: Enable in your repository settings

## ✨ Features

### 📝 **Writing**
- Distraction-free writing interface
- Auto-save every 30 seconds
- Real-time word count and statistics
- Focus mode for maximum concentration
- Chapter and scene organization

### 👥 **Character Management**
- Detailed character profiles
- Role categorization
- Appearance, personality, and background tracking
- Relationship mapping

### 📋 **Plot Organization**
- Three-act structure support
- Plot point tracking (Inciting Incident, Climax, etc.)
- Scene and chapter organization
- Timeline management

### 📊 **Progress Tracking**
- Writing goals and targets
- Daily word count statistics
- Session tracking
- Progress visualization

### 🔬 **Research Tools**
- Research notes with categorization
- Source tracking and URL links
- Tagging system for easy organization

## 📤 Export Options

### 📖 **Complete Novel Export**
- Downloads your entire novel as a formatted text file
- Includes all chapters and scenes in order
- Perfect for sharing or further editing

### 📄 **PDF Export**
- Generates a professionally formatted PDF
- Uses your browser's print-to-PDF feature
- Includes chapter breaks and proper formatting

### 🗜️ **ZIP Package Export**
- Complete package with separate files for each chapter
- Includes character profiles, plot outline, and research notes
- Contains backup JSON file for re-importing

### 💾 **JSON Backup**
- Technical backup file containing all your data
- Can be imported back into the application
- Useful for transferring between devices

## 📁 Understanding the JSON Export

The JSON export contains all your novel data in a structured format:

```json
{
  "chapters": [
    {
      "id": 1,
      "title": "Chapter 1",
      "content": "Your chapter content...",
      "order": 0,
      "createdAt": "2023-12-07T10:00:00.000Z"
    }
  ],
  "characters": [
    {
      "id": 1,
      "name": "Character Name",
      "role": "Protagonist",
      "description": "Character description..."
    }
  ],
  "scenes": [...],
  "plotPoints": [...],
  "research": [...],
  "timeline": [...],
  "goals": [...],
  "stats": [...]
}
```

### How to Use JSON Export:
1. **Backup**: Keep as a backup of all your work
2. **Transfer**: Move your novel between devices
3. **Import**: Use the import feature (coming soon) to restore data
4. **Analysis**: Use with other tools to analyze your writing

## 🔧 Technical Details

### Browser Compatibility
- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers with IndexedDB support

### Data Storage
- **Primary**: IndexedDB (browser database)
- **Fallback**: localStorage
- **Backup**: Automatic backup every 5 minutes

### Offline Capability
- Works completely offline after initial load
- All data stored locally on your device
- No internet required for writing

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + 1-4`: Switch between main tabs
- `Ctrl/Cmd + S`: Manual save
- `Ctrl/Cmd + F`: Toggle focus mode
- `Ctrl/Cmd + E`: Open export menu
- `Escape`: Exit focus mode

## 🛡️ Privacy & Security

- **100% Local**: All data stays on your device
- **No Tracking**: No analytics or tracking
- **No Account Required**: No sign-up needed
- **Offline First**: Works without internet

## 🔄 Data Management

### Backup Strategy
1. **Automatic**: App backs up every 5 minutes to localStorage
2. **Manual**: Use JSON export for manual backups
3. **ZIP Export**: Complete package for archival

### Moving Between Devices
1. Export as JSON from old device
2. Save the JSON file
3. Open app on new device
4. Import the JSON file (feature coming soon)

## 🆘 Troubleshooting

### Data Not Saving?
- Check if browser allows local storage
- Try refreshing the page
- Use JSON export as backup

### Export Not Working?
- Ensure you have content to export
- Check browser permissions for downloads
- Try a different export format

### Performance Issues?
- Clear browser cache
- Close other browser tabs
- Use focus mode for better performance

## 🔮 Future Features

- Import functionality for JSON backups
- Collaboration features
- Cloud sync options
- Advanced formatting tools
- Plugin system
- Mobile app versions

## 📞 Support

This is an open-source project. For issues or feature requests:
1. Check existing issues in the repository
2. Create a new issue with details
3. Contribute improvements via pull requests

---

**Happy Writing! ✍️**

Start your novel today with this powerful, privacy-focused writing platform.