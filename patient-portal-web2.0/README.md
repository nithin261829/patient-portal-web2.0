# Patient Portal Web 2.0

A modern, professional dental patient portal built with React + Vite + TypeScript.

## Tech Stack

- **Framework:** React 19 + Vite 6
- **Language:** TypeScript 5.6
- **Styling:** Tailwind CSS 4 + CSS Variables
- **UI Components:** Radix UI (headless, accessible)
- **State Management:** Zustand
- **Routing:** React Router v6
- **Forms:** React Hook Form + Zod
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **Notifications:** Sonner

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_API_BASE_URL=https://apis.tensorlinks.app/patient-portal
VITE_DEFAULT_CLIENT_ID=your-client-id
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Base UI components (Button, Card, Input, etc.)
│   └── layout/          # Layout components (Header, DashboardLayout)
├── features/
│   ├── auth/            # Authentication pages
│   ├── dashboard/       # Dashboard pages
│   ├── appointments/    # Appointment scheduling (TODO)
│   ├── forms/           # Dynamic forms (TODO)
│   ├── payments/        # Payment center (TODO)
│   └── profile/         # Profile management (TODO)
├── stores/              # Zustand state stores
├── services/            # API services
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── types/               # TypeScript type definitions
└── styles/              # Global styles and theme
```

## Features

### Completed
- [x] Project setup with Vite + React + TypeScript
- [x] Tailwind CSS with custom dental theme (teal color scheme)
- [x] Base UI component library (12+ components)
- [x] Authentication store with Zustand
- [x] API service layer with Axios
- [x] Routing with protected routes
- [x] Login page with form validation
- [x] Dashboard page with stats and quick actions
- [x] Responsive header with navigation

### TODO
- [ ] Appointment list page
- [ ] Appointment scheduling wizard
- [ ] Dynamic forms engine
- [ ] Payment center
- [ ] Profile management
- [ ] Insurance information
- [ ] Document viewer
- [ ] Notifications

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## Design System

### Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | #0891b2 | Brand, buttons, links |
| Success | #22c55e | Confirmations, positive states |
| Warning | #f59e0b | Pending, cautions |
| Error | #ef4444 | Errors, destructive actions |
| Info | #3b82f6 | Informational messages |

### Components

All UI components are built on Radix UI primitives with Tailwind styling:

- Button (6 variants: default, destructive, outline, secondary, ghost, link)
- Card (with Header, Title, Description, Content, Footer)
- Input, Label, Checkbox
- Select, Tabs
- Dialog, Avatar, Badge
- Progress, Separator

## License

Private - TensorLinks
