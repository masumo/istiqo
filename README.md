# Istiqo
Istiqo is a web-based Progressive Web App (PWA) designed to help Muslims understand the meaning of Quranic vocabulary in a simple and enjoyable way—without needing to learn complex Arabic grammar first.

## App Description
Istiqo focuses on a *Vocabulary First* method, where users learn the meaning of the most frequently occurring words in the Quran. With a gamified approach (XP, streaks, and achievements), learning becomes a daily habit that feels engaging and effective.

### Key Features
- **Gamified Micro-Learning**: Learn vocabulary in small, daily sessions.
- **Contextual Verse Translation**: Each learned word is paired with its original Quran verse to understand the real context.
- **Progressive Web App (PWA)**: Install directly to your phone’s home screen like a native app—no App Store or Play Store download required.
- **Secure Authentication**: Uses the secure *Sign in with Quran Foundation* flow.

## Quran Foundation API Integration & Infrastructure
This app leverages the Quran Foundation ecosystem to provide accurate and trustworthy data:

1. **OAuth 2.0 PKCE Flow**: Enables secure login and connects user identity directly to the Quran Foundation ecosystem.
2. **Content API**: Fetches verse text and translations dynamically to ensure vocabulary meaning stays accurate.
3. **Activity Days API**: Stores and tracks daily user progress (via POST requests to `activity_days`), forming the basis for streak calculations and motivation.
4. **Audio Assets**: Uses Quran Foundation’s audio infrastructure from `verses.quran.com` for stable and fast verse audio streaming during learning sessions.

## Live Demo
Try the app here:
https://istiqo.vercel.app/

---
