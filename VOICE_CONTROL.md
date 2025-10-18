# Voice Control Feature

LumaFeed now supports hands-free voice control for starting and ending feeding sessions. This is particularly useful when you don't have free hands while feeding your baby.

## Supported Commands

### Starting a Feed
- "start feed"
- "start feeding"
- "begin feed"
- "begin feeding"

### Ending a Feed
- "end feed"
- "end feeding"
- "finish feed"
- "finish feeding"
- "stop feed"
- "stop feeding"
- "done feeding"

## How to Use

### 1. Enable Voice Control
Click the microphone button (🎤) in the bottom right corner of the home page to start listening for voice commands. The button will change to a microphone with a darker background (🎙️) to indicate it's actively listening.

### 2. Start a Feed with Voice
When you're ready to start a feeding session, simply say one of the start commands like "start feed" or "start feeding". The app will:
- Open the feeding dialog
- Automatically start the timer
- Begin tracking the feeding session

### 3. End a Feed with Voice
When the feeding is complete, say one of the end commands like "end feed" or "finish feeding". The app will:
- Stop the timer
- Display the feeding details form
- Pre-fill the start and end times based on the timer

### 4. Disable Voice Control
Click the microphone button again to stop listening for voice commands.

## Browser Compatibility

Voice control uses the Web Speech API, which is supported by:
- Chrome/Edge (desktop and mobile)
- Safari (iOS and macOS)
- Samsung Internet

**Note:** You will need to grant microphone permission when first enabling voice control.

## Privacy

All voice recognition is performed locally in your browser using the browser's built-in speech recognition API. No audio or voice data is sent to external servers.

## Troubleshooting

### Voice commands not working
- Make sure you've granted microphone permission to the app
- Check that your microphone is working properly
- Ensure you're in a quiet environment for better recognition
- Speak clearly and at a normal pace

### Button shows as disabled
If the microphone button appears disabled, your browser may not support the Web Speech API. Try using a supported browser (Chrome, Edge, or Safari).

### Continuous listening
Voice control will automatically restart if it stops unexpectedly (e.g., due to network issues or silence timeout). Click the button to manually stop listening.
