# Global Error Handling Standards

## Overview
Proper error handling is critical for building reliable applications. These standards apply across all Agent-OS 2.0 projects. Check your stack skill for framework-specific error handling patterns.

## Core Principles

### 1. Fail Loudly in Development
- Let errors bubble up during development
- Don't swallow errors silently
- Log errors with full context

### 2. Fail Gracefully in Production
- Show user-friendly error messages
- Log technical details for debugging
- Maintain application stability

### 3. Provide Context
- Include what operation failed
- Include relevant data (sanitized)
- Include timestamp and request ID

### 4. Handle Errors at the Right Level
- Handle errors where you have context to deal with them
- Don't catch errors just to re-throw them
- Let errors propagate to boundaries (API layer, component boundary)

## Error Types

### User Errors (4xx)
**What**: User provided invalid input or requested something they don't have access to

**Examples:**
- Validation errors (empty required field, invalid email)
- Authentication errors (invalid credentials)
- Authorization errors (no permission to access resource)
- Not found errors (resource doesn't exist)

**How to Handle:**
- Show clear, actionable error message to user
- Don't reveal sensitive system information
- Log for analytics (frequency of errors)

### System Errors (5xx)
**What**: Something went wrong on the server/application side

**Examples:**
- Database connection failures
- External API failures
- Unexpected exceptions
- Out of memory errors

**How to Handle:**
- Show generic error to user ("Something went wrong, try again")
- Log full error details (stack trace, context)
- Alert dev team if critical
- Implement retry logic if appropriate

### Network Errors
**What**: Request failed due to network issues

**Examples:**
- Timeout
- Connection refused
- DNS failure

**How to Handle:**
- Show user-friendly message ("Connection issue, check your internet")
- Implement retry with backoff
- Cache data for offline functionality (if applicable)

## Error Handling Patterns

### Backend/API Layer

**Pattern: Centralized Error Handler**
```javascript
// Express.js example
app.use((err, req, res, next) => {
  // Log error with context
  logger.error({
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determine error type
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.details
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Authentication required'
    });
  }

  // Default: 500 error
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

**Pattern: Try-Catch in Controllers**
```javascript
// Wrap async functions
async function getUser(req, res, next) {
  try {
    const user = await db.users.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    // Pass to centralized error handler
    next(error);
  }
}
```

**Pattern: Custom Error Classes**
```javascript
class ValidationError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
    this.statusCode = 400;
  }
}

class NotFoundError extends Error {
  constructor(resource) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

// Usage
if (!user) {
  throw new NotFoundError('User');
}
```

### Frontend/UI Layer

**Pattern: Error Boundaries (React)**
```javascript
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log to error tracking service
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.props.children;
  }
}
```

**Pattern: API Error Handling**
```javascript
async function fetchUser(id) {
  try {
    const response = await api.get(`/users/${id}`);
    return { data: response.data, error: null };
  } catch (error) {
    // Network error
    if (!error.response) {
      return {
        data: null,
        error: {
          type: 'network',
          message: 'Connection failed. Check your internet.'
        }
      };
    }

    // API error
    const status = error.response.status;
    if (status === 404) {
      return {
        data: null,
        error: {
          type: 'not_found',
          message: 'User not found'
        }
      };
    }

    if (status >= 500) {
      return {
        data: null,
        error: {
          type: 'server',
          message: 'Server error. Please try again.'
        }
      };
    }

    // Generic error
    return {
      data: null,
      error: {
        type: 'unknown',
        message: error.response.data.error || 'Something went wrong'
      }
    };
  }
}
```

**Pattern: Component Error States**
```javascript
function UserProfile({ userId }) {
  const { data, error, isLoading } = useQuery(['user', userId], () => fetchUser(userId));

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    if (error.type === 'network') {
      return <NetworkError onRetry={() => refetch()} />;
    }
    if (error.type === 'not_found') {
      return <NotFound message="User not found" />;
    }
    return <GenericError message={error.message} />;
  }

  return <UserDisplay user={data} />;
}
```

### Database Layer

**Pattern: Transaction Error Handling**
```javascript
async function createUserWithProfile(userData, profileData) {
  const transaction = await db.transaction();

  try {
    const user = await transaction.users.create(userData);
    const profile = await transaction.profiles.create({
      ...profileData,
      userId: user.id
    });

    await transaction.commit();
    return { user, profile };
  } catch (error) {
    await transaction.rollback();
    throw error; // Let caller handle
  }
}
```

**Pattern: Query Error Handling**
```javascript
async function findUserByEmail(email) {
  try {
    return await db.users.findOne({ where: { email } });
  } catch (error) {
    if (error.name === 'SequelizeConnectionError') {
      throw new Error('Database connection failed');
    }
    throw error;
  }
}
```

## Validation Errors

See `validation.md` for detailed validation patterns, but in summary:

### Backend Validation
- Validate all inputs
- Return structured error responses
- Include field-level error details

```javascript
// Good: Structured validation errors
{
  "error": "Validation failed",
  "fields": {
    "email": "Invalid email format",
    "password": "Must be at least 8 characters"
  }
}
```

### Frontend Validation
- Validate on submit (always)
- Optional: Validate on blur for better UX
- Show field-level errors
- Disable submit while invalid

## Logging

### What to Log
- All errors with stack traces
- Request context (path, method, user ID)
- Timestamp
- Error type and severity

### What NOT to Log
- Passwords or secrets
- Credit card numbers
- Personal identification numbers
- Full request/response bodies (may contain sensitive data)

### Log Levels
```
ERROR: Something broke, needs attention
WARN: Something unexpected, but handled
INFO: Significant events (user login, order placed)
DEBUG: Detailed info for debugging (dev only)
```

### Stack-Specific Logging
Check your stack skill for:
- Logging libraries (winston, pino, structlog)
- Log aggregation services (Vercel logs, CloudWatch)
- Error tracking services (Sentry, Rollbar)

## Retry Logic

### When to Retry
- Network timeouts
- Rate limit errors (with backoff)
- Temporary service unavailability

### When NOT to Retry
- Validation errors (4xx except 429)
- Authentication errors (401, 403)
- Not found errors (404)

### Exponential Backoff Pattern
```javascript
async function fetchWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // Exponential backoff: 1s, 2s, 4s, 8s, etc.
      const delay = Math.pow(2, i) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## Security Considerations

### Don't Leak Information
```javascript
// Bad: Reveals database structure
"Error: Column 'admin_password' does not exist"

// Good: Generic message for users
"An error occurred. Please try again."
// Log technical details internally
```

### Sanitize Error Messages
- Don't reveal file paths
- Don't reveal database schemas
- Don't reveal internal IPs or services

### Rate Limit Error Responses
- Prevent error-based enumeration attacks
- Return same error for "user not found" and "wrong password"

## User-Facing Error Messages

### Guidelines
- Be clear and specific
- Provide actionable next steps
- Be friendly, not technical
- Don't blame the user

### Examples
```
❌ Bad: "Error 500: Unhandled exception in UserService.getUserById"
✅ Good: "We couldn't load your profile. Please try again in a moment."

❌ Bad: "Invalid input"
✅ Good: "Email address must be in format: name@example.com"

❌ Bad: "403 Forbidden"
✅ Good: "You don't have permission to access this page."

❌ Bad: "Network error"
✅ Good: "Connection failed. Check your internet and try again."
```

## Error Recovery

### Graceful Degradation
- Show cached data if available
- Disable features that depend on failed service
- Provide offline functionality when possible

### User Actions
- Provide "Try Again" button
- Suggest alternatives ("Try searching instead")
- Offer contact support option for persistent issues

## Testing Error Handling

### Test Cases
- ✅ Invalid input validation
- ✅ Network timeouts
- ✅ Database connection failures
- ✅ Third-party API failures
- ✅ Unauthorized access attempts
- ✅ Not found scenarios

### Tools
- Mock APIs to return errors
- Simulate network failures
- Test error boundaries and fallbacks

## Quick Reference

✅ **DO:**
- Handle errors at appropriate levels
- Log errors with context
- Show user-friendly messages
- Provide actionable feedback
- Implement retry for transient failures
- Test error scenarios

❌ **DON'T:**
- Swallow errors silently
- Leak technical details to users
- Log sensitive information
- Retry validation errors
- Show stack traces to users
- Ignore error handling in tests

---

**Remember**: Good error handling is invisible when things work, but crucial when things break. Plan for failure.
