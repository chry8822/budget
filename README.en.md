# Hanunssok Budget (한눈쏙 가계부)

> Income and expenses at a glance — A local-first personal budget app

Hanunssok Budget is a **device-only** personal budget app: all data stays on your device.  
Track income and expenses, browse a monthly calendar, view statistics by category and payment method, and set budgets — all in one app.

***

## ✨ Features

| Feature | Description |
|--------|-------------|
| **Income / Expense** | Add, edit, delete entries with amount, category, payment method, and memo |
| **Home (Calendar / Summary)** | Monthly calendar view, daily income/expense summary, FAB for quick add |
| **Transactions** | Full transaction list, period/tab filters, delete and edit |
| **Statistics** | Current/previous/selected month, category pie charts, payment-method bar charts |
| **Summary / Budget** | Monthly income, expense, balance, budget vs. spending, budget settings |
| **Settings** | Dark mode toggle (persisted with AsyncStorage) |

- **Dark mode** supported app-wide (theme context + dynamic styles)
- **Onboarding** once on first launch (swipe slides, “Don’t show again” saved)
- **Local DB** SQLite (expo-sqlite), no server

***

## 🛠 Tech Stack

- **Runtime** — Expo 54, React Native 0.81, React 19
- **Language** — TypeScript 5.9
- **DB** — expo-sqlite (local SQLite)
- **Navigation** — React Navigation 7 (Bottom Tabs + Native Stack)
- **UI** — Custom theme (light/dark), react-native-calendars, react-native-chart-kit, Toast messages

***

## 📁 Project Structure

```
BudgetBook/
├── App.tsx                    # Entry, DB init, ErrorBoundary, theme, tabs/stack
├── app.json                   # Expo app config (Hanunssok Budget)
├── src/
│   ├── db/                    # SQLite schema, init, CRUD
│   ├── theme/                 # Light/dark colors, typography, ThemeContext
│   ├── navigation/            # RootStackParamList
│   ├── screens/               # Home, transactions, stats, summary, settings, budget, add/edit
│   ├── components/            # Shared UI, calendar, transaction form, FAB, modals
│   ├── hooks/                 # useScrollability
│   ├── types/                 # Transaction types, categories, payment methods
│   └── utils/                 # formatWon, formatAmount
└── assets/                    # App icon, splash, etc.
```

***

## 🚀 Getting Started

### Requirements
- Node.js 18+
- npm or yarn

### Install and run
```bash
git clone <repository-url>
cd BudgetBook
npm install
npm start
```

Scan the QR code with **Expo Go**, or run `npm run ios` / `npm run android` for simulator/emulator.

### Build (EAS)
EAS Build is configured via `eas.json` and `app.json`.  
**iOS**: com.chrys.hanunssok  
**Android**: com.chrys.hanunssok

***

## 🎨 Design System

### Main and secondary colors

| Role | Color | HEX | Use |
|------|--------|-----|------|
| **Primary** | Coral red | `#FF6B6B` | Expense, CTAs, emphasis, FAB, buttons, focus |
| **Secondary** | Teal / mint | `#4ECDC4` | Income, success, secondary emphasis, charts, links |

- **Primary Soft**: Light background for primary (light `#FFE5E5` / dark `#3D2A2A`)
- **On Primary**: Text/icons on primary — `#FFFFFF`

### Color palette (light / dark)

| Token | Light | Dark | Use |
|-------|--------|------|------|
| `background` | `#FFFFFF` | `#121212` | Screen background |
| `surface` | `#F2F2F2` | `#2C2C2C` | Cards, sheets, input areas |
| `text` | `#222222` | `#E8E8E8` | Body text |
| `textMuted` | `#666666` | `#9E9E9E` | Secondary copy, captions |
| `border` | `#E5E5E5` | `#404040` | Dividers, borders |
| `income` | `#1e88e5` | `#64B5F6` | Income amounts, icons |
| `danger` | `#FF4D4F` | `#FF4D4F` | Delete, warning, over-budget |
| `success` | `#4ECDC4` | `#4ECDC4` | Success, done (same as Secondary) |

### Spacing

| Token | Value | Use |
|-------|--------|------|
| `xs` | 4px | Minimal gap between elements |
| `sm` | 8px | Small padding, icon–text |
| `md` | 16px | Default padding, inside cards |
| `lg` | 24px | Section spacing |
| `xl` | 32px | Large block spacing |

### Typography

| Scale | Size | Use |
|-------|------|------|
| `xs` | 13px | Captions, secondary info |
| `sm` | 14px | Secondary body |
| `md` | 16px | Body |
| `lg` | 18px | Subheadings |
| `xl` | 24px | Titles |
| `xxl` | 30px | Large titles |
| `display` | 34px | Big numbers, headlines |

- **title**: 24px, bold  
- **subtitle**: 18px, textMuted  
- **body**: 16px, text  
- **caption**: 13px, textMuted  

### Theme switching

- **Light / dark** can be toggled in Settings.
- The choice is stored in **AsyncStorage** and restored on next launch.
- Colors, spacing, and typography are defined in `src/theme/` (colorsLight, colorsDark, spacing, typography, ThemeContext).

***

## 📄 License

© 2025 [Name]. All rights reserved.  
**Unauthorized use, distribution, or commercial use is prohibited.**
