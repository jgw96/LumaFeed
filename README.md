# feeding-tracker

A Progressive Web App for tracking feeding built with Lit web components and a custom router based on the URL Pattern API.

## Features

- 🚀 Built with Lit web components
- 🔀 Custom router using URL Pattern API
- 📱 Progressive Web App capabilities
- 🔌 Offline support
- ⚡ Fast build with Vite
- 💪 TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm

### Installation

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run type-check
```

## Project Structure

```
feeding-tracker/
├── src/
│   ├── pages/           # Page components
│   │   ├── home-page.ts
│   │   ├── settings-page.ts
│   │   └── not-found-page.ts
│   ├── router/          # Custom router implementation
│   │   └── router.ts
│   ├── app-root.ts      # Main app component
│   └── main.ts          # Entry point
├── public/              # Static assets
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── package.json
```

## Router Usage

The custom router is based on the URL Pattern API and provides simple, declarative routing:

```typescript
const router = new Router([
  { pattern: '/', component: 'home-page' },
  { pattern: '/settings', component: 'settings-page' },
]);

router.onRouteChange((route, params) => {
  // Handle route changes
});

router.navigate('/settings'); // Navigate programmatically
```

## Technologies Used

- **Lit** - Fast, lightweight web components library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Next-generation frontend tooling
- **URL Pattern API** - Modern routing without external dependencies
- **Vite PWA Plugin** - Progressive Web App capabilities

## License

MIT
