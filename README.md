# Vocab Herald - French Vocabulary Learning App

## Current Implementation Status (as of 2025-06-10)

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
- **Article Service**: Database operations for article CRUD (add, fetch by source, delete)
- **Local Development Environment**: Supabase local stack + Docker
- **Anonymous Authentication**: Auto-sign in with Google OAuth integration for account linking
- **Movie Script Learning**: ScriptSlug PDF parsing with OpenAI-powered French translation for cinematic vocabulary learning
- **Security Architecture**: Server action authorization wrappers, admin role system, protected test pages
- **Production Security**: Security headers, API authentication, tiered rate limiting with Redis
- **Production Database**: Herald Supabase project deployed with complete schema
- **Row Level Security**: Comprehensive RLS policies ensuring users only access their own data
- **MCP Integration**: Tested Supabase MCP server for database operations and schema management
- **Vocabulary Exercise System**: Intelligent practice exercises with spaced repetition, frequency-based word selection, and multiple exercise types (multiple choice, translation, fill-in-blank, matching)

### ✅ HOSTING READY
- Production environment variables configured for local/production separation
- Database schema deployed to production Supabase instance
- RLS policies implemented for data security
- Ready for Vercel deployment with external API integrations (OpenAI, Upstash, HuggingFace, DeepL)

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

### Translation Services
- **Movie Localization**: Professional French screenplay translation using specialized OpenAI prompts (`src/lib/prompts/movieLocalization.ts`)
- **General Translation**: DeepL integration for word/sentence translation (`src/lib/translate.ts`)

## Architecture Overview

### Core Data Flow
ArticleLoader → TokenizationAPI → VocabCanvas → VocabToken → KeyboardNavigation → Database

### State Management Pattern
**Reducer-based architecture** with clear action types:
- `ArticleLoaderReducer`: Article caching, tokenization, user config, loading states (supports Reddit, Le Monde, ScriptSlug)
- `VocabCanvasReducer`: Current word position, learning state, API responses
- Database Services: Persistent vocabulary and progress tracking (anonymous + authenticated users)

### Security Architecture
**Multi-layer protection system:**
- **Database Security**: Row Level Security (RLS) policies ensuring users can only access their own profiles, vocabulary, mistakes, and sessions
- **Authentication**: Supabase auth with Google OAuth, profile-based access control and admin roles
- **Middleware**: API authentication + tiered rate limiting (very-expensive: 3/min, expensive: 15/min, resource-intensive: 10/min, external-api: 30/min, general: 60/min, admin: 20/min)
- **Headers**: Security headers via next.config.ts (frame options, content type, referrer policy, HSTS)
- **Authorization**: Server action wrappers with admin role enforcement
- **Rate Limiting**: Upstash Redis-backed with user/IP identification

### Article Source System
**Three Learning Sources:**
- **Reddit**: French community posts from r/france (social/informal French)
- **Le Monde**: Professional journalism articles (formal/news French)  
- **ScriptSlug**: Movie script scenes with professional French translation (cinematic/dialogue French)

All sources integrate seamlessly with the same vocabulary tracking and learning interface.

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
src/lib/actions/
├── vocabularyActions.ts (vocabulary CRUD operations)
├── articleActions.ts (article CRUD operations)
├── userActions.ts (user profile operations)
└── userConfigActions.ts (user configuration operations)

src/lib/
├── validateAuth.ts (server action authorization utility functions)
└── rateLimit.ts (API rate limiting with Upstash Redis)
```

### External Integrations
- **Hugging Face**: SpaCy tokenization API
- **DeepL**: Translation services
- **Wiktionary**: Dictionary lookups
- **Reddit API**: French subreddit scraping
- **Le Monde**: Article scraping
- **Supabase**: Authentication and database hosting
- **Upstash Redis**: Rate limiting cache

## Database Schema (Supabase + Prisma)

**Core Tables:**
- `profiles`: User profiles (references Supabase auth.users via UUID, nullable email for anonymous, isAdmin for role-based access, lastAccessed for activity tracking)
- `lexicon`: User's vocabulary words with proficiency tracking (now includes lastPracticed for spaced repetition)
- `mistakes`: Error tracking for spaced repetition
- `sessions`: Learning session analytics
- `user_config`: Personalization settings
- `articles`: Cached articles with tokenization
- `lemmas`: French word forms and base lemmas
- `user_metadata`: Practice tracking (practiceIndex for spaced repetition algorithm)
- `word_frequency`: Lexique dataset with frequency rankings and linguistic metadata

**Relationships:** Profile → (UserConfig, Lexicon, Mistakes, Sessions)

## Current Learning Flow

1. **Anonymous Start**: Users are automatically signed in anonymously
2. **Article Selection**: User chooses Reddit/Le Monde source
3. **Content Fetching**: API retrieves and caches articles
4. **Tokenization**: SpaCy analyzes text (POS, dependencies, entities)
5. **Navigation Mode**: User moves through words with E (know) / W (help)
6. **Learning Mode**: Triggered by 'help', provides translations/definitions
7. **Progress Tracking**: Database updates word stats (anonymous or authenticated)
8. **Account Linking**: Anonymous users can easily link with Google accounts for persistence

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

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL (Supabase), Prisma ORM
- **Authentication**: Supabase Auth with Anonymous Users
- **Cache**: Upstash Redis (rate limiting)
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
- 2025-06-13: **VOCABULARY EXERCISE SYSTEM**: Implemented comprehensive practice system with intelligent word selection algorithm prioritizing frequency and user performance, spaced repetition based on practice intervals, multiple exercise types (multiple choice, word translation, fill-in-blank, matching), and detailed progress tracking
- 2025-06-13: **DATABASE SCHEMA EXPANSION**: Added UserMetadata table for practice tracking, WordFrequency table for Lexique dataset integration, and lastPracticed field to Lexicon for spaced repetition
- 2025-06-13: **EXERCISE COMPONENTS**: Created modular React components for different exercise types with real-time feedback, progress tracking, and session completion analytics
- 2025-06-12: **PERFORMANCE OPTIMIZATION**: Implemented optimistic UI updates for E/W key presses - immediate visual feedback with background database sync
- 2025-06-11: **DATABASE OPTIMIZATION**: Removed redundant profile existence checks in vocabulary actions, reducing database operations per keystroke
- 2025-06-11: **GOOGLE OAUTH INTEGRATION**: Replaced email/password authentication with Google OAuth for streamlined user experience
- 2025-06-10: Removed complex email authentication forms and simplified auth UI to single Google sign-in button
- 2025-06-10: Updated anonymous user workflow to seamlessly link with Google accounts via OAuth
- 2025-06-10: **HOSTING MILESTONE**: Deployed complete database schema to production Supabase instance (Herald project)
- 2025-06-10: Implemented comprehensive Row Level Security policies ensuring user data isolation
- 2025-06-10: Tested MCP Supabase integration for database operations and schema management
- 2025-06-10: Configured production-ready environment variable structure for Vercel deployment
- 2025-06-10: Disabled react/no-unescaped-entities ESLint rule for better French text content support
- 2025-06-10: Fixed infinite loop in VocabStats component by replacing useEffect with useMemo for sorting
- 2025-06-10: Implemented production security suite with comprehensive middleware (API auth + rate limiting), security headers, and Upstash Redis integration
