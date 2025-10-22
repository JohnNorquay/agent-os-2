# Supabase Authentication Patterns

## Overview
Comprehensive patterns for implementing authentication with Supabase Auth across different frameworks and use cases.

## Authentication Methods

### Email/Password Authentication

#### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    emailRedirectTo: 'https://yourapp.com/auth/callback',
    data: {
      first_name: 'John',
      last_name: 'Doe',
    }
  }
})
```

#### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})
```

#### Sign Out
```typescript
const { error } = await supabase.auth.signOut()
```

### OAuth Authentication

#### Sign in with OAuth Provider
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google', // google, github, gitlab, etc.
  options: {
    redirectTo: 'https://yourapp.com/auth/callback',
    scopes: 'email profile',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  }
})
```

Supported providers:
- Google
- GitHub
- GitLab
- Bitbucket
- Azure
- Facebook
- Discord
- Twitter
- Slack
- Spotify
- And more...

### Magic Link Authentication

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://yourapp.com/auth/callback'
  }
})
```

### Phone Authentication

```typescript
// Send OTP
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+1234567890'
})

// Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+1234567890',
  token: '123456',
  type: 'sms'
})
```

## Session Management

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### Get Current Session
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

### Listen to Auth State Changes
```typescript
const { data: { subscription } } = supabase.auth.onAuthStateChange(
  (event, session) => {
    console.log(event, session)
    // Events: SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, etc.
  }
)

// Cleanup
subscription.unsubscribe()
```

## Password Management

### Update Password
```typescript
const { data, error } = await supabase.auth.updateUser({
  password: 'new-secure-password'
})
```

### Reset Password Request
```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://yourapp.com/auth/reset-password'
  }
)
```

### Reset Password (after receiving token)
```typescript
// User clicks link in email, receives token
const { data, error } = await supabase.auth.updateUser({
  password: 'new-secure-password'
})
```

## User Metadata

### Update User Metadata
```typescript
const { data, error } = await supabase.auth.updateUser({
  data: {
    username: 'johndoe',
    avatar_url: 'https://example.com/avatar.jpg',
    preferences: { theme: 'dark' }
  }
})
```

### Access User Metadata
```typescript
const { data: { user } } = await supabase.auth.getUser()
const metadata = user?.user_metadata
const username = metadata?.username
```

## Database Integration

### User Profile Pattern
Create a profiles table that syncs with auth.users:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Row Level Security Patterns

### User-Specific Data Access
```sql
-- Read own data
CREATE POLICY "Users can read own data"
ON table_name FOR SELECT
USING (auth.uid() = user_id);

-- Write own data
CREATE POLICY "Users can insert own data"
ON table_name FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update own data
CREATE POLICY "Users can update own data"
ON table_name FOR UPDATE
USING (auth.uid() = user_id);

-- Delete own data
CREATE POLICY "Users can delete own data"
ON table_name FOR DELETE
USING (auth.uid() = user_id);
```

### Role-Based Access
```sql
-- Admin access
CREATE POLICY "Admins have full access"
ON table_name
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Check custom claims
CREATE POLICY "Check custom claim"
ON table_name
USING (
  (auth.jwt() -> 'app_metadata' ->> 'plan')::text = 'pro'
);
```

### Team/Organization Access
```sql
-- Team member access
CREATE POLICY "Team members can access team data"
ON projects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_members.team_id = projects.team_id
    AND team_members.user_id = auth.uid()
  )
);
```

## Email Verification

### Send Email Verification
```typescript
// Auto-sent on signup, but can resend:
const { data, error } = await supabase.auth.resend({
  type: 'signup',
  email: 'user@example.com'
})
```

### Verify Email
User clicks link in email, gets redirected to:
```
https://yourapp.com/auth/callback?token_hash=...&type=email
```

Handle in your callback route:
```typescript
const { data, error } = await supabase.auth.verifyOtp({
  token_hash,
  type: 'email'
})
```

## Multi-Factor Authentication (MFA)

### Enroll MFA
```typescript
const { data, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp'
})

// Returns QR code and secret for user to scan with authenticator app
const { qr_code, secret } = data
```

### Verify MFA Enrollment
```typescript
const { data, error } = await supabase.auth.mfa.challengeAndVerify({
  factorId: 'factor-id',
  code: '123456'
})
```

### Challenge MFA on Sign In
```typescript
// After successful password login, if MFA is enabled:
const { data, error } = await supabase.auth.mfa.challenge({
  factorId: 'factor-id'
})

// Then verify:
const { data, error } = await supabase.auth.mfa.verify({
  factorId: 'factor-id',
  challengeId: 'challenge-id',
  code: '123456'
})
```

## Rate Limiting & Security

### Email Rate Limits (Supabase defaults)
- 4 emails per hour per user
- Configurable in Supabase dashboard

### Best Practices
1. **Never store passwords** - Supabase handles this
2. **Use HTTPS** - Required for secure auth
3. **Implement CAPTCHA** - For signup/signin forms
4. **Add email verification** - Prevent spam accounts
5. **Use strong password policies** - Minimum length, complexity
6. **Implement account lockout** - After failed attempts
7. **Enable MFA** - For sensitive accounts
8. **Rotate secrets** - Regularly update JWT secrets

## Error Handling

### Common Auth Errors
```typescript
if (error) {
  switch (error.message) {
    case 'Invalid login credentials':
      // Wrong email or password
      break
    case 'Email not confirmed':
      // User hasn't verified email
      break
    case 'User already registered':
      // Email already in use
      break
    case 'Email rate limit exceeded':
      // Too many emails sent
      break
    default:
      // Generic error
      break
  }
}
```

### User-Friendly Error Messages
```typescript
const getAuthErrorMessage = (error: any) => {
  const message = error?.message || ''
  
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.'
  }
  if (message.includes('Email not confirmed')) {
    return 'Please verify your email address before signing in.'
  }
  if (message.includes('User already registered')) {
    return 'An account with this email already exists.'
  }
  if (message.includes('Email rate limit exceeded')) {
    return 'Too many requests. Please try again later.'
  }
  
  return 'An error occurred. Please try again.'
}
```

## Testing Authentication

### Test User Creation
```typescript
// Create test user for development
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'test-password',
  options: {
    emailRedirectTo: 'http://localhost:3000/auth/callback',
    data: { role: 'test' }
  }
})
```

### Mock Authentication in Tests
```typescript
import { createClient } from '@supabase/supabase-js'

// Use test credentials
const supabase = createClient(
  process.env.SUPABASE_TEST_URL!,
  process.env.SUPABASE_TEST_ANON_KEY!
)

// Sign in as test user
beforeAll(async () => {
  await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test-password'
  })
})

// Clean up
afterAll(async () => {
  await supabase.auth.signOut()
})
```

## Integration Patterns

### Next.js Server Components
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return <div>Welcome {user.email}</div>
}
```

### Next.js Middleware (Auth Guard)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
```

### React Context Provider
```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext<{
  user: User | null
  loading: boolean
}>({ user: null, loading: true })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )
    
    return () => subscription.unsubscribe()
  }, [])
  
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
```

---

**Remember**: Always enable RLS, verify emails, use secure passwords, and test auth flows thoroughly before deploying to production.
