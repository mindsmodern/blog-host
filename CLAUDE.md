# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Blog Host is a SvelteKit 5 application built for hosting user-generated blog content. The architecture centers around domains, posts, and documents with a multi-tenant structure where users can own domains and create blog posts within them.

## Key Architecture Concepts

### URL Structure

Posts are accessible at `[domain].example.com/[slug]` where:

- `[domain]` is the third-level domain name from the domains table
- `[slug]` is the post's slug field (when not null)

### Database Structure (Supabase)

The database has a hierarchical structure with **deferred constraints** on the posts table:

- **Domains**: Third-level domain names (e.g., "myblog") owned by users
- **Posts**: Blog posts within domains. The `slug` field determines publication state:
  - `slug IS NULL`: Post is unpublished/draft
  - `slug IS NOT NULL`: Post is published and accessible at `[domain].example.com/[slug]`
- **Documents**: Content blocks associated with posts. Posts themselves contain no content - all content lives in documents
- **Post Redirects**: SEO-friendly redirects from old slugs to current posts
- **Themes**: Configurable themes with JSONB config

**Critical**: The `unique_domain_slug` constraint on posts table is `DEFERRABLE INITIALLY DEFERRED`, allowing temporary constraint violations within transactions. This enables atomic slug updates and swaps.

### Document Tagging System

Documents support a flexible tagging system for responsive/conditional content:

- Tags like 'mobile', 'desktop', 'amp' allow serving different content to different clients
- Optional `width` field for pixel-perfect targeting
- Multiple documents per post enable rich, context-aware content delivery

### Row Level Security

All tables use Supabase RLS with owner-based permissions:

- Users can only access domains they own
- Posts/documents are accessible through domain ownership chain
- Public read access for published content (posts with non-null slugs)

## Development Commands

### Building and Development

```bash
npm run dev              # Start development server
npm run build            # Full build: migrate DB → generate types → build app
npm run build:production # Same as build (explicit production)
npm run preview          # Preview built application
```

### Database Operations

```bash
npm run db:migrate       # Run Supabase migrations (supabase migrations up)
npm run db:generate-types # Generate TypeScript types to src/lib/util/database.types.ts
```

### Testing and Quality

```bash
npm run test            # Run both unit and e2e tests
npm run test:unit       # Run Vitest unit tests
npm run test:e2e        # Run Playwright e2e tests
npm run check           # TypeScript and Svelte check
npm run check:watch     # Watch mode for checks
npm run lint            # Run ESLint and Prettier checks
npm run format          # Format code with Prettier
```

## Technical Stack

- **Framework**: SvelteKit 5 with TypeScript
- **Database**: Supabase (PostgreSQL with RLS)
- **Testing**: Vitest (unit) + Playwright (e2e) with browser testing support
- **Build**: Vite
- **Deployment**: adapter-auto (supports multiple platforms)
- **Package manager**: Pnpm

## Code Organization

- `src/lib/util/database.types.ts`: Auto-generated Supabase TypeScript types
- `src/lib/util/index.ts`: Exports database types for use across the app
- `supabase/migrations/`: Database schema migrations
- `supabase/config.toml`: Supabase local development configuration

## Database Development Notes

When working with the posts table slug field:

- Use transactions when updating slugs to avoid constraint violations
- Remember that `slug IS NULL` means unpublished, `slug IS NOT NULL` means published
- The deferred constraint allows slug swaps within a single transaction
- Always validate slug format: `^[A-Za-z0-9-]+(?:/[A-Za-z0-9-]+)*$`

Document queries should consider tagging strategy:

- Query by `post_id` and optional `tag` for conditional content
- Use `width` field for responsive breakpoint targeting
- JSONB content field supports GIN indexing for fast content searches

## Build Process Integration

The build process automatically:

1. Runs database migrations (`supabase migrations up`)
2. Regenerates TypeScript types from current schema to `src/lib/util/database.types.ts`
3. Builds the SvelteKit application

This ensures type safety and database consistency across deployments.
