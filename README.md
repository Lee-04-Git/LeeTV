# LeeTV

A React Native application built with Expo for iOS, Android, and Web.

## Project Structure

```
LeeTV/
├── App.js                  # Main entry point
├── src/
│   ├── components/        # Reusable components
│   │   └── WebViewComponent.js
│   ├── screens/          # App screens/pages (to be added)
│   ├── navigation/       # Navigation setup (to be added)
│   ├── assets/          # Images, icons, and static files
│   └── constants/       # Colors, styles, and config
│       ├── colors.js
│       └── styles.js
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- Expo CLI

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Running the App

**For Web:**

```bash
npm run web
```

**For Android:**

```bash
npm run android
```

**For iOS (macOS only):**

```bash
npm run ios
```

Alternatively, scan the QR code with the Expo Go app on your mobile device.

## Features

- ✅ Clean, organized project structure
- ✅ WebView component ready to use
- ✅ Cross-platform support (iOS, Android, Web)
- ✅ Customizable colors and styles
- ✅ Loading indicators for WebView content

## Next Steps

1. Add your screens in `/src/screens/`
2. Set up navigation in `/src/navigation/`
3. Create additional reusable components in `/src/components/`
4. Customize colors and styles in `/src/constants/`

## Technologies

- **React Native** - Mobile framework
- **Expo** - Development platform
- **react-native-webview** - WebView implementation

## License

MIT
