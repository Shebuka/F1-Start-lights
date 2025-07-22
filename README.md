# F1 Starting Lights Semaphore 🏁

A professional Formula 1 starting lights semaphore web application for slot car racing and motorsport enthusiasts. Experience the authentic F1 race start sequence with realistic light configuration, accurate timing, and audio effects.

## Features

- **Authentic F1 Light Configuration**: 5 vertical strips with 4 lights each (top 2 green, bottom 2 red)
- **Race Start Sequence**: 5 red light strips activate sequentially (1-second intervals), then all turn off simultaneously after 1-5 seconds
- **Formation Lap Sequence**: All red lights activate, then turn off and green lights signal the start
- **Audio Effects**: Web Audio API-generated sine wave at M-key frequency (493.883 Hz)
- **Sound Control**: Toggle sound on/off as needed
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Touch-Friendly**: Large buttons designed for touch interaction

## Quick Start

### Try out now!

Go to https://shebuka.github.io/F1-Start-lights/ and give it a Go!!!

### Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Deployment to GitHub Pages

1. **Fork/Clone this repository**
2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Set source to "GitHub Actions"
3. **Push changes** - GitHub Actions will automatically build and deploy

## Usage

1. **Race Start**: Click "START RACE" for official F1 timing
   - Red light strips activate one by one
   - When all lights turn off simultaneously - that's GO!
2. **Formation Lap**: Use "FORMATION LAP" for formation lap starts
3. **Reset**: Click "RESET" to stop any sequence and return to start

## Light Sequence Logic

### Race Start Sequence
- Strip 1: 0 seconds
- Strip 2: 1 second  
- Strip 3: 2 seconds
- Strip 4: 3 seconds
- Strip 5: 4 seconds
- All Off: 5 + (1-5 seconds random) = GO!

### Formation Lap Sequence
- All Red On: 0 seconds
- Red Off + Green On: 2-5 seconds random
- All Off: +2 seconds = GO!

## Technical Details

- **Built with**: React, TypeScript, Tailwind CSS
- **Audio**: Web Audio API with M-key frequency (493.883 Hz)
- **Responsive**: Mobile-first design with touch support
- **PWA Ready**: Can be installed as a standalone app

## Browser Compatibility

- Chrome/Edge: Full support (recommended)
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Optimized for touch interaction

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is open source and available under the GPL-3.0 License.

---

**Ready to race?** Fire up your engines and experience the thrill of Formula 1 starting lights! 🏁
