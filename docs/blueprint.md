# **App Name**: FocusFlow

## Core Features:

- Accountability Grid: 24-hour grid with interactive time tracking boxes that cycle through focus, partial, and rest states.
- State Persistence: Instantly saves the grid state and solved state using LocalStorage to persist data.
- Total Focused Time: Calculates and displays total focused time (hours and minutes) with animated updates.
- Daily Question Challenge: Simulated daily API displaying one question (Sinhala/English, LaTeX support) for Combined Maths, Chemistry, and Physics.
- Guaranteed Daily Reset: Rotates the daily question and resets the 'Solved Today' checkbox automatically each day by checking LocalStorage and the system date, while saving system date.
- Dark/Light Mode Toggle: Allows users to switch between dark and light modes and saves the preferences to LocalStorage for persistent user settings.
- User Authentication: Store each person session with email/username password authentication and a database connection.

## Style Guidelines:

- Primary color: Electric purple (#BE4BFF) to represent focus and energy.
- Background color: Dark charcoal (#212529) for a sleek, modern dark mode.
- Accent color: Neon cyan (#47FFDC) for highlighting active elements and interactive states.
- Body and headline font: 'Inter' for a modern, neutral, and readable design.
- Use a consistent set of minimalist icons for the grid states and interface elements.
- Implement micro-interactions with CSS transitions and scaling effects (bouncy scale-up, subtle glows, counting animations) on clicks and data updates to enhance user engagement.
- Use a responsive layout based on the 24-hour grid concept, ensuring elements are intuitive to use.