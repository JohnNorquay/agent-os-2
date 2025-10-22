# Vercel Deployment Patterns

## Overview
Best practices and patterns for deploying applications to Vercel, managing environment variables, and leveraging Vercel's platform features.

## Project Setup

### Initialize Vercel Project
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project to Vercel
vercel link

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Vercel Configuration File
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://api.example.com"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/old-path",
      "destination": "/new-path",
      "permanent": true
    }
  ],
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.example.com/:path*"
    }
  ]
}
```

## Environment Variables

### Setting Environment Variables

#### Via Vercel CLI
```bash
# Set variable for production
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Set variable for preview
vercel env add NEXT_PUBLIC_SUPABASE_URL preview

# Set variable for development
vercel env add NEXT_PUBLIC_SUPABASE_URL development

# Pull environment variables to local
vercel env pull .env.local
```

#### Via Vercel Dashboard
1. Go to project settings
2. Navigate to Environment Variables
3. Add variables for each environment:
   - Production
   - Preview
   - Development

### Environment Variable Types

**Public Variables** (exposed to browser):
- Prefix with `NEXT_PUBLIC_`
- Example: `NEXT_PUBLIC_SUPABASE_URL`

**Server-Only Variables** (kept secret):
- No prefix required
- Example: `SUPABASE_SERVICE_ROLE_KEY`
- Never exposed to client

### Environment Variable Best Practices
1. **Never commit secrets** to version control
2. **Use .env.example** to document required variables
3. **Sync across environments** - Use Vercel CLI to manage
4. **Validate on build** - Check required vars exist
5. **Use different values** per environment

### Required Environment Variables Template
```env
# .env.example
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourapp.com

# External Services
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
RESEND_API_KEY=re_...
```

## Deployment Workflows

### Git-Based Deployment (Recommended)
Vercel automatically deploys when you push to Git:

**Production Deployment**:
- Push to `main` or `master` branch
- Creates production deployment
- Updates yourapp.vercel.app

**Preview Deployment**:
- Push to any other branch
- Creates preview deployment
- Unique URL for each commit

### Branch Protection Pattern
```
main (production)
  ├── staging (preview environment)
  └── feature/* (preview deployments)
```

### Deployment Checks
```json
// package.json
{
  "scripts": {
    "build": "next build",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "precommit": "npm run lint && npm run type-check",
    "predeploy": "npm run test"
  }
}
```

## Vercel Features

### Edge Functions
Deploy serverless functions at the edge for ultra-low latency:

```typescript
// app/api/edge-example/route.ts
export const runtime = 'edge'

export async function GET(request: Request) {
  return new Response('Hello from the edge!', {
    headers: { 'content-type': 'text/plain' }
  })
}
```

**Edge Use Cases**:
- Authentication middleware
- A/B testing
- Geolocation-based routing
- API rate limiting
- Simple data transformations

### Serverless Functions
Standard Node.js runtime for complex operations:

```typescript
// app/api/serverless/route.ts
export async function POST(request: Request) {
  // Can use any Node.js packages
  // More compute time and memory
  const body = await request.json()
  
  // Process data
  const result = await processData(body)
  
  return Response.json({ result })
}
```

**Serverless Use Cases**:
- Database operations
- File processing
- External API integrations
- Complex computations
- Image manipulation

### Image Optimization
Vercel automatically optimizes images:

```typescript
import Image from 'next/image'

export function MyImage() {
  return (
    <Image
      src="/photo.jpg"
      alt="My photo"
      width={500}
      height={300}
      quality={80}
      priority // Load immediately
    />
  )
}
```

**Automatic Optimizations**:
- WebP/AVIF conversion
- Responsive images
- Lazy loading
- Blur placeholder

### Caching Strategies

#### Static Generation (Build Time)
```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug)
  return <article>{post.content}</article>
}
```

#### Incremental Static Regeneration (ISR)
```typescript
// Revalidate every 60 seconds
export const revalidate = 60

export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

#### On-Demand Revalidation
```typescript
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
  const { path } = await request.json()
  revalidatePath(path)
  return Response.json({ revalidated: true })
}
```

## Performance Optimization

### Bundle Analysis
```bash
# Analyze bundle size
npm run build
```

View bundle visualization at: `.next/analyze/`

### Code Splitting
```typescript
// Dynamic imports for code splitting
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false // Disable SSR for this component
})
```

### Prefetching
```typescript
// Next.js automatically prefetches links in viewport
import Link from 'next/link'

export function Navigation() {
  return (
    <Link href="/dashboard" prefetch={true}>
      Dashboard
    </Link>
  )
}
```

## Monitoring & Analytics

### Vercel Analytics
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Web Vitals
Vercel automatically tracks:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)
- Time to First Byte (TTFB)

### Custom Logging
```typescript
// Send logs to Vercel
console.log('Info message')
console.error('Error message')

// Logs visible in Vercel dashboard under deployment logs
```

## Domain Configuration

### Custom Domain Setup
1. Go to project settings
2. Add custom domain
3. Configure DNS:
   - **A Record**: `76.76.21.21`
   - **CNAME**: `cname.vercel-dns.com`

### Domain Redirects
```json
// vercel.json
{
  "redirects": [
    {
      "source": "/:path*",
      "destination": "https://www.example.com/:path*",
      "has": [
        {
          "type": "host",
          "value": "example.com"
        }
      ],
      "permanent": true
    }
  ]
}
```

## Security

### Security Headers
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}
```

### Content Security Policy (CSP)
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
  
  const response = NextResponse.next()
  response.headers.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim())
  
  return response
}
```

## CI/CD Integration

### GitHub Actions with Vercel
```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm test
      - run: npm run build
```

### Preview Comments
Vercel automatically comments on PRs with preview URLs:
```
✅ Preview deployment ready!
🔍 Inspect: https://vercel.com/...
🌐 Preview: https://your-app-git-branch.vercel.app
```

## Deployment Best Practices

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] No console errors in browser
- [ ] Lighthouse score acceptable
- [ ] Security headers configured
- [ ] Analytics configured

### Post-Deployment Verification
- [ ] Production URL accessible
- [ ] API endpoints working
- [ ] Authentication flows working
- [ ] Database connections working
- [ ] External integrations working
- [ ] Check error logs in Vercel dashboard

### Rollback Strategy
```bash
# List recent deployments
vercel ls

# Promote a previous deployment to production
vercel promote <deployment-url>

# Or redeploy a specific commit
git checkout <commit-hash>
vercel --prod
```

## Troubleshooting

### Common Issues

**Build Failures**:
```bash
# Check build logs in Vercel dashboard
# Common causes:
# - Missing environment variables
# - TypeScript errors
# - Dependency issues
# - Out of memory

# Increase memory allocation in vercel.json:
{
  "functions": {
    "api/**/*.ts": {
      "memory": 3008
    }
  }
}
```

**Slow Cold Starts**:
```typescript
// Use edge runtime for faster cold starts
export const runtime = 'edge'

// Or optimize serverless function size:
// - Reduce dependencies
// - Use dynamic imports
// - Split into smaller functions
```

**CORS Errors**:
```typescript
// Add CORS headers in API routes
export async function GET(request: Request) {
  return new Response('data', {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}
```

## Cost Optimization

### Free Tier Limits (Hobby)
- 100 GB bandwidth
- 100 GB-hours serverless function execution
- 1000 image optimizations

### Pro Tier Benefits
- Unlimited bandwidth
- More compute time
- Team collaboration
- Advanced analytics
- Priority support

### Cost-Saving Tips
1. Use ISR instead of SSG for large sites
2. Optimize images before upload
3. Implement proper caching
4. Use edge functions for simple operations
5. Monitor usage in dashboard

---

**Remember**: Vercel handles most of the infrastructure complexity. Focus on writing good code, and Vercel will handle the deployment, scaling, and performance optimization.
