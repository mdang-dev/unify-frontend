# Unify Frontend

## ⚙️ Versions

- ![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white&style=flat-square)
- ![pnpm](https://img.shields.io/badge/pnpm-9.9.0-F69220?logo=pnpm&logoColor=white&style=flat-square)
- ![Next.js](https://img.shields.io/badge/Next.js-15.1.4-000000?logo=nextdotjs&logoColor=white&style=flat-square)
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-06B6D4?logo=tailwindcss&logoColor=white&style=flat-square)

## Getting Started

### 1. Clone the repository

```sh
git clone https://github.com/mdang-dev/unify-frontend
cd unify-frontend
```

### 2. Install Node.js & pnpm

#### Windows & macOS

- [Install Node.js 20.x](https://nodejs.org/en/download)
- Install pnpm globally:

```sh
npm install -g pnpm@9.9.0
```

#### Ubuntu/Linux

```sh
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm@9.9.0
```

### 3. Install dependencies

```sh
pnpm install
```

### 4. Run the development server

```sh
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
├── public/            # Static resources (images, fonts, favicon, robots.txt, etc.) served at the root URL
├── messages/          # Stores locale-based .json files for next-intl to handle app internationalization (i18n)
├── src/               # Root source folder for all application code
│   ├── apis/                    # Organizes API request logic by domain or feature
│   │   ├── user-api/            # Handles user-related API requests
│   │   │   ├── command/         # Contains API calls that mutate user data (e.g., POST, PUT, DELETE)
│   │   │   │   └── user.api.command.js
│   │   │   └── query/           # Contains API calls that fetch user data (e.g., GET)
│   │   │       └── user.api.query.js
│   │   └── ...                  # Other API modules (e.g., product-api, order-api, etc.)
│   ├── app/                     # Next.js or main application configuration (e.g., _app.js, routing)
│   ├── components/              # Reusable UI components (buttons, modals, etc.)
│   ├── configs/                 # Application-wide configuration settings
│   │   └── app.config.js
│   ├── constants/               # Constant values used across the app (e.g., API endpoints, enums)
│   │   └── api.constant.js
│   ├── hooks/                   # Custom React hooks for abstracting logic (e.g., useAuth, useForm)
│   ├── layouts/                 # Layout components to wrap pages with consistent structure
│   │   └── main-layout.jsx
│   ├── modules/                 # Feature modules containing logic, components, and state for a domain
│   ├── stores/                  # Global state management (e.g., Zustand, Redux stores)
│   │   ├── auth.store.js
│   │   └── ...
│   ├── styles/                  # Global and modular styles (SCSS, Tailwind config, etc.)
│   └── utils/                   # Utility functions and helpers (e.g., formatters, validators)
│       ├── date.util.js
│       └── ...
```

**Naming conventions:**

- Use `kebab-case` for all file and folder names.
- Utility files: `name.util.js` (e.g., `date.util.js`)
- Store files: `name.store.js` (e.g., `auth.store.js`)
- API command files: `apis/name-api/command/name.api.command.js`
- API query files: `apis/name-api/query/name.api.query.js`
- Layout files: `name-layout` (e.g., `main-layout.jsx`)
- Config files: `name.config.js` (e.g., `app.config.js`)

**Git Workflow & Conventions**

**Branching:**

- Create a new branch for your feature or fix:
  ```sh
  git checkout -b feature/your-feature-name
  # or for a bugfix
  git checkout -b fix/your-bugfix-description
  ```

**Making Changes & Commit:**

- Stage and commit your changes.
- Use [Conventional Commits](https://www.conventionalcommits.org/) with a scope for clarity:
  ```sh
  git add .
  git commit -m "feat(auth): add login functionality"
  # or
  git commit -m "fix(api): correct user fetch endpoint"
  ```
  - **Types:** feat, fix, chore, docs, refactor, test, style, perf, ci
  - **Scope:** (in parentheses) refers to the area of code affected (e.g., auth, api, ui, store, util, etc.)

**Sync with Main:**

- Pull the latest changes from main and rebase your branch:
  ```sh
  git checkout main
  git pull origin main
  git checkout feature/your-feature-name
  git rebase main
  ```

**Push & PR:**

- Push your branch to the remote repository:
  ```sh
  git push origin feature/your-feature-name
  ```
- Create a Pull Request (PR) on GitHub:
  - Click "Compare & pull request"
  - Fill in the PR template, describe your changes, and submit

**Code Review & Merge:**

- Wait for code review and approval
- Address any requested changes
- Once approved, the PR will be merged

**Best Practices:**

- Use descriptive branch names (`feature/`, `fix/`, `chore/`, etc.)
- Write clear, concise commit messages with type and scope
- Keep PRs focused and small
- Pull and rebase often to avoid conflicts
- Delete branches after

## Useful Commands

- **Run development server:**  
  `pnpm dev`

- **Format code:**  
  `pnpm format`

- **Lint code:**  
  `pnpm lint`

- **Build for production:**  
  `pnpm build`

- **Start production server:**  
  `pnpm start`

## Run with Docker

Build and run the app using Docker:

```bash
docker build -t unify-frontend .
docker run -p 3000:3000 unify-frontend
```
