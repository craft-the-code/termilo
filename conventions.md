# Termilo Project Conventions

## Tech Stack
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Component Library**: Shadcn UI (Radix UI primitives)
- **State Management**: Zustand (with persist middleware)
- **Forms**: React Hook Form + Zod
- **Build Target**: Tauri v2

## Styling & Theme
- **Theme**: Premium Dark (Slate/Blue palette).
- **CSS**: Use `tailwind-merge` and `clsx` (via `cn` utility) for class composition.
- **Animations**: `tailwindcss-animate` is available.

## Iconography
- **Primary Source**: Google Material Symbols (Outlined).
- **Usage**: `<span className="material-symbols-outlined">icon_name</span>`
- **Note**: `lucide-react` is installed but Material Symbols are preferred for consistency with the Sidebar design.

## File Structure
- `src/components/`: Reusable UI components.
- `src/store/`: Zustand stores.
- `src/pages/`: Main application views.
- `src/layouts/`: Layout wrappers (Sidebar, etc).
- `src/lib/`: Utilities (`utils.ts`).

## Coding Standards
- **Imports**: Use absolute paths with `@/` alias.
- **Components**: Functional components with named exports.
- **Types**: Define interfaces for Props and Domain models.
