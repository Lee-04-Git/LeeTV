# Navigation

This folder contains navigation setup and configuration.

## Navigation Flow

1. **Auth Screen** → User Profile Screen (after sign in)
2. **User Profile Screen** → Home Screen (after selecting avatar)
3. **Home Screen** →
   - Show Details Screen (click on any show/movie)
   - Search Screen (click search icon)
   - User Profile Screen (click profile icon)
4. **Show Details Screen** → Back to Home (back button)
5. **Search Screen** → Show Details Screen (click search result)

## Components

- `AppNavigator.js` - Main navigation stack with all screens

## Features

- Top navbar only (no bottom navigation)
- Fade animations between screens
- Authentication flow: Auth → Profile → Home
