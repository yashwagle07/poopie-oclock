# Surprise Sounds - Project TODO

## Database & Backend
- [x] Create sounds table schema (id, url, title, type, active, rarity, description, order)
- [x] Create surprises table schema (id, createdAt, status, fireAt, soundId, soundUrl, openedAt, userId)
- [x] Create unlocks table schema (userId, soundId, unlockedAt, timesHeard, lastHeardAt)
- [x] Implement database query helpers for sounds
- [x] Implement database query helpers for surprises
- [x] Implement database query helpers for unlocks
- [x] Create tRPC routes for sounds management
- [x] Create tRPC routes for surprise arming
- [x] Create tRPC routes for unlock tracking

## UI Screens
- [ ] Build Onboarding screen with PWA install instructions (not needed - handled by browser)
- [x] Build Home screen with "Arm a Surprise" button
- [x] Build Home screen progress indicator
- [x] Build PlaySurprise screen with audio player
- [x] Build PlaySurprise unlock celebration animation
- [x] Build SurpriseDex screen with sound collection grid
- [x] Add tab navigation between Home and SurpriseDex
- [ ] Implement Settings screen (optional - not needed for MVP)

## Audio Features
- [x] Set up expo-audio with playsInSilentModeIOS
- [x] Implement audio playback with fallback "Tap to Play" button
- [x] Add audio player controls (play/pause/stop)
- [x] Handle autoplay blocking on iOS
- [x] Implement sound replay in SurpriseDex
- [x] Add visual feedback during audio playback

## Unlock Mechanics
- [x] Implement unlock check logic (first-time vs. repeat)
- [x] Create unlock celebration UI with animations
- [x] Add "Already discovered" message for repeat sounds
- [x] Update SurpriseDex when new sound unlocked
- [x] Track unlock timestamps and play counts
- [x] Display progress counter (X of Y collected)

## Push Notifications
- [x] Set up expo-notifications
- [x] Request notification permissions on first launch
- [x] Implement local notification scheduling
- [x] Configure deep linking to PlaySurprise screen
- [x] Add notification handlers for foreground/background
- [x] Test notification delivery and deep linking

## Surprise Scheduling
- [x] Implement random time selection (within min/max delay window)
- [x] Create surprise record when "Arm a Surprise" tapped
- [x] Schedule push notification with random delay
- [x] Select random sound from active sounds
- [x] Mark surprise as "sent" when notification delivered (handled by notification system)
- [x] Mark surprise as "opened" when user plays audio

## Branding & Assets
- [x] Generate custom app logo/icon
- [x] Update app.config.ts with app name and logo URL
- [x] Copy logo to all required asset locations
- [x] Update theme colors to romantic pink/red palette
- [x] Add gift box and celebration icons

## Testing & Polish
- [x] Test first-time onboarding flow
- [x] Test "Arm a Surprise" and notification delivery
- [x] Test audio playback on iOS and Android
- [x] Test unlock logic (new vs. repeat sounds)
- [x] Test SurpriseDex display and replay
- [x] Test deep linking from notifications
- [x] Add haptic feedback to key interactions
- [x] Verify PWA installation on iOS (requires user to add to Home Screen)
- [ ] Test offline functionality (optional - requires service worker)

## Documentation
- [x] Add setup instructions for audio file upload
- [x] Document notification scheduling configuration
- [x] Create user guide for girlfriend
- [x] Add troubleshooting section for common issues


## UI Redesign (New)
- [x] Create app icon from user photo
- [x] Update app name to "Poopie O'clock"
- [x] Create Valentine's Day splash screen
- [x] Update color scheme to purple/dark theme
- [x] Add smooth animations and transitions
- [x] Redesign Home screen with sleek layout
- [x] Redesign SurpriseDex with modern grid
- [x] Add micro-interactions and haptic feedback
- [x] Test all animations and transitions
