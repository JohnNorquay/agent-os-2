# Supabase + Vercel Stack

## Stack Overview
Full-stack JavaScript/TypeScript development using:
- **Frontend**: Next.js (App Router) on Vercel
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **Database**: PostgreSQL via Supabase
- **Deployment**: Vercel for frontend, Supabase for backend

## Tech Stack Details

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (optional but recommended)
- **State Management**: React Context + hooks, or Zustand for complex state
- **Forms**: React Hook Form + Zod validation

### Backend
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth (email/password, OAuth, magic links)
- **Storage**: Supabase Storage for files
- **Real-time**: Supabase Realtime subscriptions
- **Edge Functions**: Supabase Edge Functions (Deno)
- **APIs**: Next.js API routes + Supabase client

### Developer Tools
- **Package Manager**: pnpm (preferred) or npm
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier
- **Type Safety**: TypeScript strict mode
- **Testing**: Vitest for unit tests, Playwright for E2E

## Project Structure

```
project-root/
├── .agent-os/                    # Agent-OS 2.0 project files
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Route group for auth pages
│   ├── (dashboard)/              # Route group for authenticated pages
│   ├── api/                      # API routes
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── auth/                     # Auth-related components
│   └── dashboard/                # Dashboard components
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Supabase client (browser)
│   │   ├── server.ts             # Supabase client (server)
│   │   └── middleware.ts         # Auth middleware
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utility functions
├── supabase/
│   ├── migrations/               # Database migrations
│   ├── functions/                # Edge functions
│   └── seed.sql                  # Seed data
├── public/                       # Static assets
├── .env.local                    # Local environment variables
└── .env.example                  # Example environment variables

```

## Database Patterns

### Schema Design
- Use snake_case for table and column names
- Every table should have:
  - `id` (uuid, primary key, default gen_random_uuid())
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, updated via trigger)
- Foreign keys should have `_id` suffix (e.g., `user_id`, `project_id`)
- Use meaningful table names (plural, e.g., `users`, `projects`, `tasks`)

### Row Level Security (RLS)
**Always enable RLS on all tables**:
```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

Common RLS patterns:
```sql
-- Users can only read their own data
CREATE POLICY "Users can read own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);

-- Users can only update their own data
CREATE POLICY "Users can update own data"
ON table_name FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only insert their own data
CREATE POLICY "Users can insert own data"
ON table_name FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Public read access
CREATE POLICY "Public read access"
ON table_name FOR SELECT
USING (true);
```

### Migrations
- Create migrations using Supabase CLI: `supabase migration new migration_name`
- Always include both up and down logic
- Test migrations locally before pushing to production
- Use descriptive migration names with timestamps

### Type Generation
After schema changes, regenerate TypeScript types:
```bash
supabase gen types typescript --local > lib/types/database.ts
```

## Authentication Patterns

### Server-Side Auth (Recommended for protected routes)
```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = () => {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
}
```

### Client-Side Auth (For interactive components)
```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### Middleware (Auth Guard)
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

## API Patterns

### Server Actions (Preferred for mutations)
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTask(formData: FormData) {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const title = formData.get('title') as string
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({ title, user_id: user.id })
    .select()
    .single()

  if (error) throw error

  revalidatePath('/dashboard/tasks')
  return data
}
```

### API Routes (For webhooks, external APIs)
```typescript
// app/api/webhook/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    // Process webhook
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

## Real-time Patterns

### Subscribing to Changes
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function RealtimeComponent() {
  const [data, setData] = useState([])
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('table_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          // Handle change
          console.log('Change received!', payload)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <div>{/* Component JSX */}</div>
}
```

## Storage Patterns

### File Upload
```typescript
const uploadFile = async (file: File) => {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const fileExt = file.name.split('.').pop()
  const fileName = `${user.id}/${Math.random()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file)

  if (error) throw error
  return data
}
```

### Storage Buckets
- Create buckets via Supabase dashboard or migration
- Set appropriate RLS policies on storage
- Use signed URLs for temporary access

## Deployment

### Environment Variables
Required environment variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key # Server-side only

# Vercel (auto-configured)
VERCEL_URL=auto
VERCEL_ENV=auto
```

### Deployment Workflow
1. **Development**: 
   - Run Supabase locally: `supabase start`
   - Run Next.js locally: `pnpm dev`

2. **Staging**:
   - Push migrations: `supabase db push --db-url <staging-url>`
   - Deploy to Vercel preview branch

3. **Production**:
   - Push migrations: `supabase db push --db-url <production-url>`
   - Deploy to Vercel production
   - Verify environment variables in Vercel dashboard

### Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

## Testing Patterns

### Unit Tests (Vitest)
```typescript
// lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatDate } from './utils'

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2024-01-01')
    expect(formatDate(date)).toBe('January 1, 2024')
  })
})
```

### Integration Tests (Supabase)
```typescript
// tests/integration/auth.test.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

describe('Authentication', () => {
  it('should sign up new user', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'password123'
    })
    expect(error).toBeNull()
    expect(data.user).toBeDefined()
  })
})
```

## Common Patterns & Best Practices

### Error Handling
- Always handle Supabase errors gracefully
- Use try/catch in server actions
- Return user-friendly error messages
- Log errors for debugging

### Loading States
- Show loading indicators for async operations
- Use Suspense boundaries for async components
- Implement optimistic updates where appropriate

### Data Fetching
- Use Server Components for initial data fetch
- Use Client Components for interactive data
- Implement proper caching strategies
- Use React Query for complex client-side data management

### Security
- Never expose service role key in client code
- Always use RLS policies
- Validate all user input
- Sanitize data before displaying
- Use Zod for runtime validation

### Performance
- Implement proper database indexes
- Use Next.js Image component for images
- Lazy load components where appropriate
- Optimize bundle size
- Use Edge Runtime where applicable

## MCP Integration Points

When MCP servers are available:

### Supabase MCP
- Query current database schema
- Check existing RLS policies
- Get table definitions
- Verify environment setup

### Vercel MCP
- Check deployment status
- Manage environment variables
- Trigger deployments
- View deployment logs

## Task Execution Guidelines

When executing tasks on this stack:
1. **Read current state** via MCP if available
2. **Follow patterns** defined in this skill
3. **Write tests first** when appropriate
4. **Use TypeScript strictly** - no `any` types
5. **Implement RLS** on all new tables
6. **Generate types** after schema changes
7. **Test locally** before committing
8. **Create descriptive commits** using conventional commits

## Common Task Types

### Adding a New Feature
1. Design database schema (if needed)
2. Create migration
3. Add RLS policies
4. Generate TypeScript types
5. Create Server Actions
6. Build UI components
7. Add tests
8. Update documentation

### Adding Authentication
1. Set up Supabase Auth
2. Create auth middleware
3. Add login/signup pages
4. Implement auth flow
5. Test auth edge cases
6. Add password reset flow

### Adding a New Page
1. Create route in app directory
2. Implement server component for data fetch
3. Create client components as needed
4. Add proper auth guards
5. Style with Tailwind
6. Test responsive design

---

**Remember**: This stack prioritizes type safety, developer experience, and rapid iteration. Always use TypeScript types, implement RLS, and test thoroughly before deploying.
