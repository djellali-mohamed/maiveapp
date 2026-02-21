# MAIVÉ POS

Point of Sale application for MAIVÉ luxury leather bags brand.

## Features

- **Point of Sale**: Fast, intuitive selling interface with product catalog, cart management, and checkout
- **Inventory Management**: Track products, variants, and stock levels
- **Sales History**: View and manage transactions with refund capabilities
- **Reports**: Daily summaries, sales charts, and top products analytics
- **Multi-language**: French and English support
- **Offline-first**: Works without internet connection using local SQLite database
- **Thermal Printing**: Print receipts on 80mm thermal printers

## Tech Stack

- **Runtime**: Electron 28+
- **Frontend**: React 18 + TypeScript 5 + Vite 5
- **Styling**: Tailwind CSS v3 + shadcn/ui
- **State**: Zustand
- **Database**: SQLite via better-sqlite3
- **ORM**: Drizzle ORM
- **Charts**: Recharts
- **i18n**: i18next + react-i18next

## Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
# Start Vite dev server
npm run dev

# In another terminal, start Electron
npm run electron:dev
```

### Build for Production

```bash
# Build the React app
npm run build

# Build Electron app for Windows
npm run electron:build:win
```

The installer will be created in the `dist-electron` folder.

## Default Login

- **PIN**: 1234 (Admin account)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| F1 | Clear cart |
| F2 | Focus search |
| F4 | Open checkout |
| ESC | Close modal |
| Ctrl+D | Open discount panel |
| Delete | Remove selected cart item |

## Project Structure

```
maive-pos/
├── electron/              # Electron main process
│   ├── main.ts           # Main entry point
│   ├── preload.ts        # IPC bridge
│   └── handlers/         # IPC handlers
│       ├── products.handler.ts
│       ├── sales.handler.ts
│       ├── customers.handler.ts
│       ├── reports.handler.ts
│       └── printer.handler.ts
├── src/
│   ├── components/       # React components
│   │   ├── layout/       # Sidebar, TopBar, StatusBar
│   │   ├── pos/          # POS components
│   │   └── ...
│   ├── pages/            # Page components
│   ├── store/            # Zustand stores
│   ├── db/               # Database schema and migrations
│   ├── i18n/             # Translations
│   ├── utils/            # Utility functions
│   └── styles/           # CSS styles
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## Database Schema

All monetary values are stored as integers in **centimes** (DZD × 100).

### Tables

- **products**: Product catalog
- **variants**: Product variants (color, size)
- **transactions**: Sales transactions
- **transaction_items**: Line items for transactions
- **customers**: Customer database
- **cashiers**: Cashier accounts
- **drawer_sessions**: Cash drawer sessions
- **settings**: Application settings

## License

Private - For MAIVÉ use only
