# 💧 Water Tracker

A simple, beautiful water intake tracking app built with React Native and Expo.

## Features

- 📱 Single-screen interface for quick access
- 💧 Tap to add a glass of water (250ml)
- 📊 Visual progress bar showing daily goal completion
- 🎯 Daily goal of 2000ml (8 glasses)
- 🎉 Celebration animation when goal is reached
- 📳 Haptic feedback for interactions
- 💾 Persistent storage with AsyncStorage
- 🌅 Automatic reset at midnight
- 🎨 Clean, calming blue color scheme

## Tech Stack

- React Native
- Expo
- AsyncStorage for data persistence
- Expo Haptics for feedback

## Running the App

```bash
# Install dependencies
npm install

# Start Expo
npm start

# Run on specific platform
npm run web      # Browser
npm run android  # Android
npm run ios      # iOS (macOS required)
```

## How It Works

- Tap the big water drop button to add 250ml (one glass)
- Watch your progress bar fill up as you drink
- Get a celebration when you hit 2000ml
- Data persists across app restarts
- Automatically resets at midnight

## Development

Built as part of the miniapps system - rapid prototyping of simple, focused mobile applications.

Plan: `~/plans/miniapps/ideas/approved/water-tracker.md`
