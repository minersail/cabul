# Vocab Herald - French Vocabulary Learning App

## Current Implementation Status (as of 2025-06-01)

### ✅ COMPLETED
- **Article Loading System**: Reddit + Le Monde article fetching with caching
- **SpaCy Tokenization Pipeline**: Full NLP analysis (POS, lemmas, dependencies, entities)
- **Interactive Learning Canvas**: Word-by-word navigation with keyboard controls
- **Translation Services**: DeepL word/sentence translation with context
- **Wiktionary Integration**: Etymology, pronunciation, definitions lookup
- **Phrase Detection**: Dependency-tree based phrase extraction
- **Progress Tracking**: Database vocabulary storage with anonymous user support
- **Dual Learning Modes**: Navigation mode (fast) vs Learning mode (detailed)
- **Visual Feedback**: Token highlighting, flash states, progress bars
- **Database Schema**: PostgreSQL with Prisma ORM (profiles, lexicon, sessions, etc.)
- **Vocabulary Service**: Database service layer for user vocabulary management
- **Local Development Environment**: Supabase local stack + Docker
- **Anonymous Authentication**: Auto-sign in with seamless conversion to permanent accounts

### 🚧 IN PROGRESS (Higher Priority)
- **Hosting**: Local setup complete, production deployment pending

### 📋 TODO (Lower Priority - Subject to Change)
- **Autoscrolling**: Through stop words/NER entities/high-proficiency words
- **UI Learning Mode Refactor**: Paper tear SVG snippets
- **Enhanced Phrase System**: More POS patterns, Wiktionary phrase lookup, translations
- **Phrase Saving**: User vocabulary collection system

## Documentation

### Architecture Guides
- **[Supabase Migration Guide](docs/SUPABASE_MIGRATION.md)**: Detailed explanation of Profile-based architecture and Supabase auth integration

## Architecture Overview

### Core Data Flow
ArticleLoader → TokenizationAPI → VocabCanvas → VocabToken → KeyboardNavigation → Database

### State Management Pattern
**Reducer-based architecture** with clear action types:
- `ArticleLoaderReducer`: Article caching, tokenization, user config, loading states
- `VocabCanvasReducer`: Current word position, learning state, API responses
- Database Services: Persistent vocabulary and progress tracking (anonymous + authenticated users)

### Key Component Relationships
```
ArticleLoader (main orchestrator)
├── VocabCanvas (learning interface)
│   ├── VocabToken (individual word rendering)
│   └── useKeyboardNavigation (interaction handling)
├── InstructionPane (help display)
├── OptionsPane (article source, settings)
└── VocabStats (progress display)
```

### Service Layer Architecture
```
src/lib/services/
└── vocabularyService.ts (vocabulary CRUD operations)
```

### External Integrations
- **Hugging Face**: SpaCy tokenization API
- **DeepL**: Translation services
- **Wiktionary**: Dictionary lookups
- **Reddit API**: French subreddit scraping
- **Le Monde**: Article scraping
- **Supabase**: Authentication and database hosting

## Database Schema (Supabase + Prisma)

**Core Tables:**
- `profiles`: User profiles (references Supabase auth.users via UUID, nullable email for anonymous)
- `lexicon`: User's vocabulary words with proficiency tracking
- `mistakes`: Error tracking for spaced repetition
- `sessions`: Learning session analytics
- `user_config`: Personalization settings
- `articles`: Cached articles with tokenization
- `lemmas`: French word forms and base lemmas

**Relationships:** Profile → (UserConfig, Lexicon, Mistakes, Sessions)

## Current Learning Flow

1. **Anonymous Start**: Users are automatically signed in anonymously
2. **Article Selection**: User chooses Reddit/Le Monde source
3. **Content Fetching**: API retrieves and caches articles
4. **Tokenization**: SpaCy analyzes text (POS, dependencies, entities)
5. **Navigation Mode**: User moves through words with E (know) / W (help)
6. **Learning Mode**: Triggered by 'help', provides translations/definitions
7. **Progress Tracking**: Database updates word stats (anonymous or authenticated)
8. **Account Conversion**: Anonymous users can easily convert to permanent accounts

## Keyboard Navigation (Current Implementation)

**Navigation Mode (Fast Review):**
- `E`: I know this word (advance, mark correct)
- `W`: Need help (enter learning mode, mark incorrect)
- `Q`: Go back to previous word

**Learning Mode (Detailed Study):**
- `W`: Translate word
- `A`: Translate sentence
- `S`: Wiktionary lookup
- `D`: Phrase detection
- `E`: Next word (exit learning mode)
- `Q`: Previous word (exit learning mode)

## Environment Variables (Local Development)
```bash
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=[local_key]
HUGGINGFACE_API_KEY=[required]
DEEPL_API_KEY=[required]
```

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL (Supabase), Prisma ORM
- **Authentication**: Supabase Auth with Anonymous Users
- **APIs**: Hugging Face (SpaCy), DeepL, Wiktionary
- **Styling**: Newspaper-inspired design with Crimson Text + Playfair Display fonts
- **Dev Tools**: Docker (Supabase local), Prisma Studio

## Development Commands
```bash
npm run dev          # Start Next.js development server
npx supabase start   # Start local Supabase stack
npx prisma studio    # Open database GUI
npx prisma db push   # Push schema changes to database
npx prisma generate  # Regenerate Prisma client
```

## Critical Implementation Notes

### Complex Components
1. **ArticleLoader.tsx**: Main orchestrator with article caching, dual-source handling
2. **VocabCanvas.tsx**: Learning interface with token rendering and progress tracking
3. **canvasInput.ts**: Dual-mode keyboard navigation system
4. **vocabCanvasReducer.ts**: Learning state management with API integration

### Token Classification System
- **Learnable**: Alphabetic tokens, excluding stop words and entities
- **Navigation**: Learnable words only (filters out punctuation, spaces)
- **Visual States**: Current word, learned words, unlearned words, flash feedback

## Recent Changes
- 2025-06-01: Added Supabase + Prisma local development setup
- 2025-06-01: Implemented Profile-based schema compatible with Supabase auth (UUID-based)
- 2025-06-01: Created vocabulary service layer for database operations
- 2025-06-01: Configured authentication middleware and Prisma client
- 2025-06-01: Added .cursorrules for AI assistant context management
- 2025-06-01: Added docs/ folder with architecture documentation
- 2025-06-01: Implemented anonymous authentication with seamless account conversion
- 2025-06-01: Centralized auth logic in useAuth hook
