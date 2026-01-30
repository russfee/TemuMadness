# Temu Keyboard Mapper

A visual, web-based interface for mapping your Temu side keyboard on macOS. No more wrestling with PC-optimized configuration tools!

## Features

- **Visual Button Layout**: Click-and-configure interface for all your buttons
- **Press-to-Detect**: Click "Detect" and press any button to automatically identify it
- **Multiple Action Types**:
  - Keyboard shortcuts (cmd+c, ctrl+shift+t, etc.)
  - Text macros (type snippets with one button)
  - Shell commands (launch apps, run scripts)
- **App-Specific Mappings**: Different actions for different apps
- **Karabiner-Elements Export**: Export configuration for powerful macOS remapping

## Quick Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup Karabiner-Elements (one-time)
./setup-karabiner.sh

# 3. Start the mapper
npm start
```

Open `http://localhost:3000` and you're ready to go!

## How It Works

1. **Configure buttons** in the web interface
2. **Click Save** - your mappings automatically sync to Karabiner-Elements
3. **Enable rules** in Karabiner-Elements (one-time)
4. **Done!** Your buttons now work

No manual exporting or file copying needed!

## Usage

### Basic Mapping

1. Click **"+ Add Button"** to create a new button mapping
2. Click the button in the grid to select it
3. Click **"🎯 Detect"** next to "Physical Key"
4. Press the button on your Temu keyboard
5. Configure the action (shortcut, macro, or shell command)
6. Click **"💾 Save"**

### Action Types

**Keyboard Shortcut**
- Format: `cmd+c`, `ctrl+shift+t`, `alt+f4`
- Can combine modifiers: `cmd+shift+alt+key`

**Text Macro**
- Types text when you press the button
- Great for email signatures, code snippets, etc.

**Shell Command**
- Runs any terminal command
- Examples:
  - `open -a Spotify` - Launch Spotify
  - `osascript -e 'set volume 5'` - Set volume
  - Any bash command you'd run in terminal

### App-Specific Mappings

Make buttons do different things in different apps:

1. Find the app's bundle ID:
   - Right-click the app in Applications
   - Show Package Contents
   - Open Contents/Info.plist
   - Look for `CFBundleIdentifier`

2. Common bundle IDs:
   - Chrome: `com.google.Chrome`
   - VS Code: `com.microsoft.VSCode`
   - Spotify: `com.spotify.client`
   - Safari: `com.apple.Safari`

3. Enter the bundle ID in the "App-Specific" field

### First-Time Karabiner Setup (One-Time Only)

After saving your first button mapping:

1. Open **Karabiner-Elements** app
2. Go to **Complex Modifications** tab
3. Click **Add Rule**
4. Find **"Temu Side Keyboard Mappings"**
5. Click **Enable** for each rule

After this, any changes you make in the web interface auto-sync when you click Save!

## Configuration File

Settings are saved to `keyboard-config.json` in the project directory.

You can back this up or share it with others who have the same keyboard.

## Troubleshooting

**"No key detected when pressing buttons"**
- Make sure the detection modal is open when you press the key
- Try pressing the key again - browser needs focus
- Some special keys may not be detected (use Karabiner export for those)

**"Keyboard shortcuts not working"**
- This tool creates configuration only - use Karabiner-Elements to apply it
- Export config and load it in Karabiner-Elements
- Check for conflicts with existing shortcuts

**"Shell commands not executing"**
- Shell commands require Karabiner-Elements + additional automation setup
- Recommend using keyboard shortcuts instead for reliability

## Tips

- Start with simple shortcuts before trying complex macros
- Use F13-F24 keys if your keyboard supports them (no conflicts!)
- Always export and use with Karabiner-Elements for best results
- The detect feature works for most keys - for special keys, type them manually

## Architecture

- **Backend**: Minimal Express server (config storage + export)
- **Frontend**: Vanilla JavaScript (no framework bloat)
- **Detection**: Browser KeyboardEvent API (no native dependencies!)
- **Config**: JSON format, exportable to Karabiner-Elements
- **Styling**: Custom CSS with dark mode vibes

Built with Claude Code 🎹
