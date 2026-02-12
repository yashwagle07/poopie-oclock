# Surprise Sounds - Mobile App Design

## Overview
A playful Valentine's Day PWA gift that delivers random audio surprises via push notifications. The app features a collectible "SurpriseDex" (Pokédex-style) where each audio clip is unlocked the first time it's heard.

## Target Platform
- **Primary**: iOS 16.4+ (PWA via Safari, added to Home Screen)
- **Secondary**: Android (PWA support)
- **Orientation**: Portrait (9:16)
- **Usage Pattern**: One-handed, quick interactions

## Design Philosophy
- **Simple & Playful**: Gift-like experience with cute, encouraging copy
- **Collectible Game Feel**: Unlock sounds like catching Pokémon
- **Fast Interactions**: Primary actions should be one tap
- **iOS-Native Feel**: Follow Apple Human Interface Guidelines

## Color Palette
- **Primary**: Romantic pink/red gradient (#FF6B9D to #C9356C)
- **Background**: Clean white (#FFFFFF) / Dark mode (#151718)
- **Surface**: Light pink (#FFF0F5) / Dark surface (#1E2022)
- **Accent**: Gold for unlocks (#FFD700)
- **Text**: Dark gray (#11181C) / Light gray (#ECEDEE)

## Screen List

### 1. Onboarding Screen
**Purpose**: First-time setup for PWA installation and notification permissions

**Content**:
- App logo and title "Surprise Sounds"
- Subtitle: "Random audio surprises just for you 💝"
- Step-by-step instructions:
  1. "Add to Home Screen" (with Safari share icon visual)
  2. "Enable Notifications" (with permission prompt preview)
- Large "Get Started" button

**User Flow**:
- User opens URL in Safari → sees onboarding
- Follows steps to add to Home Screen
- Opens from Home Screen → requests notification permission
- After permission granted → navigate to Home

### 2. Home Screen
**Purpose**: Main hub for arming surprises and viewing collection progress

**Primary Content**:
- **Hero Section** (top):
  - Large "Arm a Surprise" button (primary CTA)
  - Gradient background, pulsing animation
  - Icon: 🎁 or gift box
  
- **Progress Section** (middle):
  - "SurpriseDex Progress"
  - Large circular progress indicator
  - Text: "X of Y sounds collected"
  - Visual: partially filled circle with percentage
  
- **Secondary Action** (bottom):
  - "Open SurpriseDex" button
  - Icon: 📖 or collection grid icon

**User Flow**:
- User taps "Arm a Surprise" → confirmation message appears → surprise scheduled
- User taps "Open SurpriseDex" → navigate to collection screen

### 3. PlaySurprise Screen
**Purpose**: Play the surprise audio when notification is tapped

**Content**:
- **Before Playback**:
  - Large animated gift box icon (unopened)
  - "Tap to Play Your Surprise!" text
  - Big play button (fallback for autoplay block)
  
- **During Playback**:
  - Animated gift box (opening animation)
  - Audio waveform or pulsing circle
  - Sound title appears
  
- **After Playback** (New Unlock):
  - 🎉 Celebration animation
  - "New Sound Unlocked!" banner
  - Sound card with:
    - Title
    - Description
    - Rarity badge (if applicable)
  - "Add to SurpriseDex" button (auto-adds)
  
- **After Playback** (Already Unlocked):
  - ✓ Checkmark icon
  - "You've heard this one before"
  - Sound card (same as above)
  - "Play Again" button

**User Flow**:
- Notification arrives → user taps → opens to this screen
- Auto-play attempts → if blocked, user taps play button
- Audio plays → unlock logic runs → celebration or "seen before" message
- User can navigate back to Home or open SurpriseDex

### 4. SurpriseDex Screen
**Purpose**: View all unlocked sounds and replay them

**Content**:
- **Header**:
  - Title: "SurpriseDex"
  - Progress: "X / Y Collected"
  - Optional filter: "All | Common | Rare | Legendary"
  
- **Sound Grid/List**:
  - **Unlocked Sounds**:
    - Card with sound icon/thumbnail
    - Title
    - Rarity badge
    - "Play" button
    - Timestamp: "Unlocked on [date]"
  
  - **Locked Sounds** (optional):
    - Silhouette card with "???"
    - Grayed out
    - "Not yet discovered"

**User Flow**:
- User browses collection
- Taps "Play" on any unlocked sound → audio plays inline
- Can filter by rarity (optional)
- Navigate back to Home

### 5. Settings Screen (Optional)
**Purpose**: Manage notifications and app preferences

**Content**:
- Notification settings
- How to re-enable notifications (if denied)
- Reset collection (dangerous action, requires confirmation)
- About section (version, credits)

## Key User Flows

### Flow A: First-Time Setup
1. User opens URL in Safari
2. Sees onboarding with "Add to Home Screen" instructions
3. Adds app to Home Screen
4. Opens app from Home Screen
5. Taps "Enable Notifications"
6. Grants permission
7. Lands on Home screen

### Flow B: Arm a Surprise
1. User opens app (Home screen)
2. Taps "Arm a Surprise" button
3. App creates surprise record (status: armed)
4. Backend schedules push notification (random time)
5. Confirmation message: "Surprise armed! 🎁 You'll get a notification soon..."
6. User closes app

### Flow C: Surprise Delivery
1. Push notification arrives at random time
2. Notification copy: "Your surprise is ready! 🎁 Tap to reveal..."
3. User taps notification
4. App opens to PlaySurprise screen
5. Auto-play attempts (or shows "Tap to Play" button)
6. Audio plays
7. App checks if sound is unlocked:
   - **If new**: Show celebration, add to SurpriseDex
   - **If already unlocked**: Show "seen before" message
8. User can navigate to SurpriseDex or Home

### Flow D: Browse Collection
1. User opens app (Home screen)
2. Taps "Open SurpriseDex"
3. Sees grid of unlocked sounds
4. Taps "Play" on any sound → audio plays
5. Can filter by rarity (optional)
6. Navigate back to Home

## Interaction Design

### Button Hierarchy
1. **Primary**: "Arm a Surprise" (large, gradient, centered)
2. **Secondary**: "Open SurpriseDex" (outlined or subtle fill)
3. **Tertiary**: "Play" buttons in collection (small, icon-based)

### Feedback
- **Button Press**: Scale to 0.97 + light haptic
- **Surprise Armed**: Success haptic + toast message
- **New Unlock**: Success haptic + celebration animation
- **Audio Playing**: Pulsing visual indicator

### Animations
- **Gift Box**: Bounce on load, shake when tappable
- **Unlock Celebration**: Confetti or sparkle particles
- **Progress Circle**: Smooth fill animation
- **Card Reveals**: Fade in + slide up

## Technical Notes

### Audio Playback
- Use `expo-audio` with `playsInSilentModeIOS: true`
- Fallback to "Tap to Play" button if autoplay blocked
- Store audio files in Firebase Storage or S3
- Support .mp3 and .m4a formats

### Push Notifications
- Use `expo-notifications` for local scheduling
- Deep link format: `manus{timestamp}://play/{surpriseId}`
- Notification copy should be playful and encouraging

### Data Storage
- **Backend**: Database for sounds, surprises, user unlocks
- **Local**: Cache unlocked sound IDs for offline access

### PWA Requirements
- HTTPS hosting (Firebase Hosting)
- Service worker for offline support
- Manifest for "Add to Home Screen"
- iOS 16.4+ for web push support

## Content Guidelines

### Notification Copy Examples
- "Your surprise is ready! 🎁 Tap to reveal..."
- "Something special is waiting for you! 💝"
- "A new surprise has arrived! 🎉 Open me!"

### UI Copy Tone
- Playful, warm, encouraging
- Use emojis sparingly but meaningfully
- Keep instructions clear and simple
- Celebrate unlocks enthusiastically

### Error Messages
- "Oops! Couldn't play that sound. Try again?"
- "Notification permission needed to send surprises!"
- "No surprises armed yet. Tap the button to start!"

## Accessibility
- Large tap targets (minimum 44x44 points)
- High contrast text (WCAG AA)
- VoiceOver support for all interactive elements
- Haptic feedback for key actions
- Clear focus states for navigation

## Performance
- Lazy load audio files
- Cache unlocked sounds locally
- Optimize images (WebP format)
- Minimize bundle size for fast PWA load
- Smooth animations (60fps)
