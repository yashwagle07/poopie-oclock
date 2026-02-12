# Surprise Sounds - Setup Guide

This guide will help you set up the app with audio files and initial data.

## Prerequisites

- Audio files (.mp3 or .m4a format) for your surprise sounds
- Access to the database (via Management UI → Database panel)

## Step 1: Upload Audio Files

You have two options for hosting audio files:

### Option A: Use Firebase Storage (Recommended for production)

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Firebase Storage
3. Upload your audio files to Firebase Storage
4. Set the files to be publicly accessible
5. Copy the public URLs for each file

### Option B: Use S3 or Any Public URL

1. Upload your audio files to any public hosting service (S3, Cloudflare R2, etc.)
2. Ensure the files are publicly accessible via HTTPS
3. Copy the public URLs for each file

### Option C: Use Free Audio from Pixabay (For Testing)

You can find free sound effects at [pixabay.com/sound-effects](https://pixabay.com/sound-effects/). To get direct MP3 links:

1. Open a sound page on Pixabay
2. Open browser DevTools console (F12)
3. Paste this code:
   ```javascript
   const urls = document.documentElement.innerHTML.match(/https?:\/\/[^"'\s]+\.mp3[^"'\s]*/g) || [];
   console.log(urls);
   ```
4. Copy the MP3 URLs from the console output

## Step 2: Add Sounds to Database

### Using the Management UI (Easiest)

1. Open the Management UI (right panel in the app)
2. Go to **Database** panel
3. Select the `sounds` table
4. Click **Add Row** for each sound you want to add
5. Fill in the fields:
   - `url`: The public URL of your audio file
   - `title`: A friendly name for the sound (e.g., "Funny Laugh", "Sweet Message")
   - `description`: Optional description
   - `type`: "normal" or "punishment" (default: "normal")
   - `rarity`: "common", "rare", or "legendary" (default: "common")
   - `active`: true (must be true for the sound to be selectable)
   - `order`: Display order in SurpriseDex (0, 1, 2, etc.)

### Using SQL (Advanced)

Alternatively, you can insert sounds directly via SQL in the Database panel:

```sql
INSERT INTO sounds (url, title, description, type, rarity, active, `order`)
VALUES 
  ('https://example.com/sound1.mp3', 'Funny Laugh', 'A hilarious laugh', 'normal', 'common', true, 0),
  ('https://example.com/sound2.mp3', 'Sweet Message', 'A loving message', 'normal', 'rare', true, 1),
  ('https://example.com/sound3.mp3', 'Epic Moment', 'An epic sound', 'normal', 'legendary', true, 2);
```

## Step 3: Test the App

### 3.1 Login

1. Open the app in the preview panel
2. Click the login button (if not already logged in)
3. Complete the OAuth flow

### 3.2 Check Sounds

1. Go to the **Database** panel
2. Verify that your sounds are in the `sounds` table with `active = true`

### 3.3 Arm a Surprise

1. On the Home screen, tap **"Arm a Surprise"**
2. You should see a success message with the scheduled time
3. The app will schedule a local notification (1-5 minutes for testing)

### 3.4 Wait for Notification

1. Wait for the notification to arrive (1-5 minutes)
2. When it arrives, tap the notification
3. You should be taken to the PlaySurprise screen
4. Tap **"Tap to Play"** to hear the audio
5. You should see either:
   - **"New Sound Unlocked! 🎉"** if it's your first time hearing this sound
   - **"You've heard this one before!"** if you've already unlocked it

### 3.5 Check SurpriseDex

1. Go to the **SurpriseDex** tab
2. You should see the unlocked sound in your collection
3. Tap the play button to replay the sound

## Step 4: Adjust Timing (Optional)

By default, surprises are scheduled between 1-5 minutes for testing. To change this:

1. Open `app/(tabs)/index.tsx`
2. Find the `armMutation.mutate()` call
3. Change `minDelayMinutes` and `maxDelayMinutes`:
   ```typescript
   armMutation.mutate({
     minDelayMinutes: 30,  // 30 minutes minimum
     maxDelayMinutes: 240, // 4 hours maximum
   });
   ```

## Step 5: Production Deployment

When you're ready to deploy:

1. Update the delay timing to production values (30 min - 4 hours)
2. Ensure all audio files are hosted on reliable, fast CDN
3. Test on a real iOS/Android device (not just web)
4. Create a checkpoint via the **Save Checkpoint** button
5. Click **Publish** in the Management UI header

## Troubleshooting

### Notifications Not Appearing

- **iOS**: Make sure you've added the app to your Home Screen (PWA requirement)
- **iOS**: Check that notification permissions are granted in Settings → Notifications
- **Android**: Check that notification permissions are granted

### Audio Not Playing

- **iOS**: Make sure the device is not in silent mode, or the audio mode is configured correctly
- **All platforms**: Check that the audio URL is publicly accessible (try opening it in a browser)
- **All platforms**: Ensure the audio file format is supported (.mp3 or .m4a)

### Unlock Not Working

- Check that the user is logged in
- Check the `unlocks` table in the Database panel to see if the unlock was recorded
- Check browser console for any errors

## Example Sounds Setup

Here's a complete example with 5 sounds:

```sql
INSERT INTO sounds (url, title, description, type, rarity, active, `order`)
VALUES 
  ('https://cdn.pixabay.com/download/audio/2022/03/15/audio_1234.mp3', 'Giggle', 'A cute giggle', 'normal', 'common', true, 0),
  ('https://cdn.pixabay.com/download/audio/2022/03/15/audio_5678.mp3', 'Love You', 'A sweet message', 'normal', 'common', true, 1),
  ('https://cdn.pixabay.com/download/audio/2022/03/15/audio_9012.mp3', 'Surprise!', 'A fun surprise', 'normal', 'rare', true, 2),
  ('https://cdn.pixabay.com/download/audio/2022/03/15/audio_3456.mp3', 'Epic Win', 'An epic moment', 'normal', 'rare', true, 3),
  ('https://cdn.pixabay.com/download/audio/2022/03/15/audio_7890.mp3', 'Ultra Rare', 'The rarest sound', 'normal', 'legendary', true, 4);
```

## Next Steps

- Add more sounds to increase variety
- Customize the app colors in `theme.config.js`
- Add custom descriptions for each sound
- Share the app with your girlfriend! 💝

## Support

If you encounter any issues, check the browser console for error messages and refer to the main README.md for more information.
