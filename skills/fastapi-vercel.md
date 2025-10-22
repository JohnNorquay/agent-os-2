# FastAPI on Vercel Serverless

## Overview
Patterns and best practices for deploying FastAPI Python backends on Vercel serverless functions, specifically optimized for integration with Next.js frontends and Supabase databases.

## Project Structure

### Recommended Structure
```
project-root/
├── api/                          # Python backend (Vercel serverless functions)
│   ├── __init__.py
│   ├── main.py                   # FastAPI app entry point
│   ├── index.py                  # Vercel handler (REQUIRED)
│   ├── models/                   # Pydantic models
│   │   ├── __init__.py
│   │   ├── requests.py           # Request models
│   │   └── responses.py          # Response models
│   ├── routes/                   # API route modules
│   │   ├── __init__.py
│   │   ├── companies.py
│   │   ├── drivers.py
│   │   └── tasks.py
│   ├── services/                 # Business logic
│   │   ├── __init__.py
│   │   ├── supabase.py           # Supabase client
│   │   └── integrations.py       # External API clients
│   ├── middleware/               # Custom middleware
│   │   ├── __init__.py
│   │   ├── auth.py               # JWT authentication
│   │   └── cors.py               # CORS configuration
│   └── utils/                    # Utilities
│       ├── __init__.py
│       └── config.py             # Configuration management
├── src/                          # Next.js frontend
├── requirements.txt              # Python dependencies
├── vercel.json                   # Vercel configuration
└── .env.local                    # Local environment variables
```

## Vercel Configuration

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.py"
    }
  ],
  "env": {
    "SUPABASE_URL": "@supabase-url",
    "SUPABASE_ANON_KEY": "@supabase-anon-key"
  },
  "functions": {
    "api/*.py": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
```

### Key Configuration Points:
- **`builds`**: Tells Vercel to build the Python function
- **`routes`**: Routes all `/api/*` requests to your Python handler
- **`env`**: Environment variables (use Vercel secrets for sensitive data)
- **`functions`**: Memory and timeout configuration for serverless functions

## FastAPI Application Setup

### api/main.py - FastAPI App
```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from api.routes import companies, drivers, tasks
from api.middleware.auth import AuthMiddleware
import os

# Create FastAPI app
app = FastAPI(
    title="IntegrationDirector API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Configuration
# IMPORTANT: Configure for your Next.js frontend domain
origins = [
    "http://localhost:3000",  # Local development
    "https://your-app.vercel.app",  # Production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom authentication middleware
app.add_middleware(AuthMiddleware)

# Include routers
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["drivers"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "integration-director"}

# Root endpoint
@app.get("/api")
async def root():
    return {
        "message": "IntegrationDirector API",
        "docs": "/api/docs"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if os.getenv("DEBUG") else "An error occurred"
        }
    )
```

### api/index.py - Vercel Handler (REQUIRED)
```python
"""
Vercel serverless function handler for FastAPI.
This file is the entry point for Vercel's Python runtime.
"""
from api.main import app
from mangum import Mangum

# Mangum is an adapter for running ASGI applications in AWS Lambda/Vercel
handler = Mangum(app, lifespan="off")

# Optional: Add this if you need custom handler logic
def handler_wrapper(event, context):
    """
    Wrapper for additional pre/post processing if needed.
    """
    # Pre-processing here if needed
    response = handler(event, context)
    # Post-processing here if needed
    return response
```

### requirements.txt
```txt
# FastAPI and ASGI server
fastapi==0.109.0
mangum==0.17.0  # ASGI adapter for Vercel (REQUIRED)

# Supabase
supabase==2.3.0
postgrest==0.13.2

# Data validation
pydantic>=2.0.0
pydantic-settings>=2.0.0
email-validator>=2.0.0

# Authentication
PyJWT==2.8.0
python-jose[cryptography]>=3.3.0  # For JWT handling

# HTTP client for external APIs
httpx>=0.24.0,<0.25.0

# Utilities
python-dotenv==1.0.0
tenacity==8.2.3  # Retry logic

# Testing (dev only, not installed on Vercel)
pytest==7.4.4
pytest-asyncio==0.23.3
httpx>=0.24.0  # For testing FastAPI
```

## Supabase Integration

### api/services/supabase.py
```python
"""
Supabase client for FastAPI backend.
Handles database operations and authentication.
"""
from supabase import create_client, Client
from functools import lru_cache
import os

@lru_cache()
def get_supabase_client() -> Client:
    """
    Create and cache Supabase client.
    Uses @lru_cache to reuse client across requests (warm starts).
    """
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")  # Use service role for backend
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase credentials not configured")
    
    return create_client(supabase_url, supabase_key)

def get_supabase_client_with_auth(access_token: str) -> Client:
    """
    Create Supabase client with user's auth token.
    Use this when you need to respect RLS policies.
    """
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_anon_key = os.environ.get("SUPABASE_ANON_KEY")
    
    client = create_client(supabase_url, supabase_anon_key)
    client.auth.set_session(access_token, None)  # Set user session
    
    return client

# Example usage in a route:
async def get_user_data(user_id: str, access_token: str):
    """
    Fetch data respecting RLS policies.
    """
    supabase = get_supabase_client_with_auth(access_token)
    
    result = supabase.table("users").select("*").eq("id", user_id).execute()
    return result.data
```

## Authentication Middleware

### api/middleware/auth.py
```python
"""
JWT authentication middleware for FastAPI.
Validates Supabase JWT tokens from Next.js frontend.
"""
from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import jwt
import os

class AuthMiddleware(BaseHTTPMiddleware):
    """
    Middleware to validate JWT tokens from Supabase Auth.
    """
    
    # Public routes that don't require authentication
    PUBLIC_ROUTES = ["/api/health", "/api/docs", "/api/redoc", "/api/openapi.json"]
    
    async def dispatch(self, request: Request, call_next):
        # Skip auth for public routes
        if request.url.path in self.PUBLIC_ROUTES:
            return await call_next(request)
        
        # Get authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401,
                content={"error": "Missing or invalid authorization header"}
            )
        
        token = auth_header.split(" ")[1]
        
        try:
            # Verify JWT token
            # Supabase uses HS256 algorithm with JWT_SECRET
            jwt_secret = os.environ.get("SUPABASE_JWT_SECRET")
            
            payload = jwt.decode(
                token,
                jwt_secret,
                algorithms=["HS256"],
                audience="authenticated"
            )
            
            # Add user info to request state
            request.state.user = payload
            request.state.user_id = payload.get("sub")
            
        except jwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=401,
                content={"error": "Token has expired"}
            )
        except jwt.InvalidTokenError as e:
            return JSONResponse(
                status_code=401,
                content={"error": f"Invalid token: {str(e)}"}
            )
        
        response = await call_next(request)
        return response
```

## API Route Patterns

### api/routes/companies.py
```python
"""
Company management API routes.
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Optional
from api.models.requests import CompanyCreate, CompanyUpdate
from api.models.responses import CompanyResponse
from api.services.supabase import get_supabase_client

router = APIRouter()

@router.get("/", response_model=List[CompanyResponse])
async def list_companies(
    request: Request,
    skip: int = 0,
    limit: int = 100
):
    """
    List all companies.
    Automatically filtered by RLS if using user's token.
    """
    user_id = request.state.user_id
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("companies") \
            .select("*") \
            .range(skip, skip + limit - 1) \
            .execute()
        
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/", response_model=CompanyResponse)
async def create_company(
    request: Request,
    company: CompanyCreate
):
    """
    Create a new company.
    """
    user_id = request.state.user_id
    supabase = get_supabase_client()
    
    try:
        # Add user_id to the company data
        company_data = company.dict()
        company_data["user_id"] = user_id
        
        result = supabase.table("companies") \
            .insert(company_data) \
            .execute()
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(
    request: Request,
    company_id: str
):
    """
    Get a specific company by ID.
    """
    supabase = get_supabase_client()
    
    try:
        result = supabase.table("companies") \
            .select("*") \
            .eq("id", company_id) \
            .single() \
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Company not found")
        
        return result.data
    except Exception as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail="Company not found")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{company_id}", response_model=CompanyResponse)
async def update_company(
    request: Request,
    company_id: str,
    company: CompanyUpdate
):
    """
    Update a company.
    """
    supabase = get_supabase_client()
    
    try:
        # Only update fields that are provided
        update_data = company.dict(exclude_unset=True)
        
        result = supabase.table("companies") \
            .update(update_data) \
            .eq("id", company_id) \
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Company not found")
        
        return result.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{company_id}")
async def delete_company(
    request: Request,
    company_id: str
):
    """
    Delete a company (or mark as deleted if using soft deletes).
    """
    supabase = get_supabase_client()
    
    try:
        # Soft delete - mark as deleted
        result = supabase.table("companies") \
            .update({"deleted_at": "now()"}) \
            .eq("id", company_id) \
            .execute()
        
        # Or hard delete:
        # result = supabase.table("companies").delete().eq("id", company_id).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Company not found")
        
        return {"message": "Company deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Pydantic Models

### api/models/requests.py
```python
"""
Request models for API endpoints.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class CompanyCreate(BaseModel):
    """Model for creating a new company."""
    name: str = Field(..., min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "Acme Dairy Farm",
                "email": "contact@acmedairy.com",
                "phone": "+1-555-0123",
                "address": "123 Farm Road, Rural Town"
            }
        }

class CompanyUpdate(BaseModel):
    """Model for updating a company. All fields optional."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
```

### api/models/responses.py
```python
"""
Response models for API endpoints.
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class CompanyResponse(BaseModel):
    """Model for company API responses."""
    id: UUID
    name: str
    email: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True  # Pydantic v2
        # orm_mode = True  # Pydantic v1
```

## External API Integration Patterns

### api/services/integrations.py
```python
"""
External API clients with retry logic and error handling.
"""
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from typing import Dict, Any
import os

class VesseyAPIClient:
    """
    Client for Vessey API integration.
    """
    
    def __init__(self):
        self.base_url = os.environ.get("VESSEY_API_URL")
        self.api_key = os.environ.get("VESSEY_API_KEY")
        
        if not self.base_url or not self.api_key:
            raise ValueError("Vessey API credentials not configured")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def get_driver_data(self, driver_id: str) -> Dict[str, Any]:
        """
        Fetch driver data from Vessey API with automatic retry.
        """
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{self.base_url}/drivers/{driver_id}",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            return response.json()
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def get_collection_data(self, date: str) -> Dict[str, Any]:
        """
        Fetch collection data for a specific date.
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.base_url}/collections",
                params={"date": date},
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                }
            )
            response.raise_for_status()
            return response.json()

class SlackClient:
    """
    Client for Slack webhook integration.
    """
    
    def __init__(self):
        self.webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
        
        if not self.webhook_url:
            raise ValueError("Slack webhook URL not configured")
    
    async def send_message(self, text: str, channel: str = None):
        """
        Send message to Slack channel.
        """
        payload = {"text": text}
        if channel:
            payload["channel"] = channel
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.webhook_url,
                json=payload
            )
            response.raise_for_status()
            return response.json()

class TwilioClient:
    """
    Client for Twilio SMS integration.
    """
    
    def __init__(self):
        self.account_sid = os.environ.get("TWILIO_ACCOUNT_SID")
        self.auth_token = os.environ.get("TWILIO_AUTH_TOKEN")
        self.from_number = os.environ.get("TWILIO_FROM_NUMBER")
        
        if not all([self.account_sid, self.auth_token, self.from_number]):
            raise ValueError("Twilio credentials not configured")
    
    async def send_sms(self, to_number: str, message: str):
        """
        Send SMS via Twilio.
        """
        url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                auth=(self.account_sid, self.auth_token),
                data={
                    "From": self.from_number,
                    "To": to_number,
                    "Body": message
                }
            )
            response.raise_for_status()
            return response.json()
```

## Cold Start Optimization

### Best Practices to Minimize Cold Starts:

1. **Keep imports lightweight**:
```python
# Bad - imports everything upfront
from api.services.integrations import VesseyAPIClient, SlackClient, TwilioClient

# Good - import only what you need, lazily
def get_vessey_client():
    from api.services.integrations import VesseyAPIClient
    return VesseyAPIClient()
```

2. **Use @lru_cache for expensive operations**:
```python
from functools import lru_cache

@lru_cache()
def get_config():
    # This runs once per cold start, then cached
    return load_expensive_config()
```

3. **Minimize dependency size**:
- Avoid heavy libraries (pandas, numpy) if possible
- Use lightweight alternatives (polars instead of pandas)
- Only include necessary dependencies

4. **Leverage Vercel Edge Functions for critical paths**:
For ultra-low latency endpoints, consider Vercel Edge Functions (JavaScript/TypeScript only).

## Environment Variables

### Required Environment Variables:

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# External APIs
VESSEY_API_URL=https://api.vessey.com
VESSEY_API_KEY=your-vessey-key

# Communication Services
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_FROM_NUMBER=+1234567890

# Optional
DEBUG=false
```

### Setting in Vercel:
```bash
# Using Vercel CLI
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Or via Vercel Dashboard:
# Project Settings → Environment Variables
```

## Testing

### api/tests/test_companies.py
```python
"""
Tests for company API endpoints.
"""
import pytest
from fastapi.testclient import TestClient
from api.main import app

client = TestClient(app)

def test_list_companies():
    """Test listing companies."""
    response = client.get("/api/companies")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_company():
    """Test creating a company."""
    company_data = {
        "name": "Test Dairy Farm",
        "email": "test@example.com"
    }
    response = client.post("/api/companies", json=company_data)
    assert response.status_code == 200
    assert response.json()["name"] == company_data["name"]

@pytest.mark.asyncio
async def test_external_api_integration():
    """Test external API client."""
    from api.services.integrations import VesseyAPIClient
    
    client = VesseyAPIClient()
    # Mock the API call
    data = await client.get_driver_data("test-driver-id")
    assert data is not None
```

### Running Tests:
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest api/tests/

# With coverage
pytest --cov=api api/tests/
```

## Deployment Workflow

### Local Development:
```bash
# Install dependencies
pip install -r requirements.txt

# Run locally with uvicorn
uvicorn api.main:app --reload --port 8000

# Or use Vercel CLI for exact production environment
vercel dev
```

### Deploy to Vercel:
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Or via GitHub integration (automatic on push to main)
```

## Common Patterns

### Async Database Queries:
```python
@router.get("/async-example")
async def async_example():
    """
    FastAPI supports async, but Supabase Python client is sync.
    Use asyncio.to_thread for CPU-bound operations.
    """
    import asyncio
    
    def fetch_data():
        supabase = get_supabase_client()
        return supabase.table("data").select("*").execute()
    
    # Run sync code in thread pool
    result = await asyncio.to_thread(fetch_data)
    return result.data
```

### Error Handling:
```python
from fastapi import HTTPException

@router.get("/error-example")
async def error_example():
    try:
        # Your logic here
        result = risky_operation()
        return result
    except ValueError as e:
        # Client error (4xx)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Server error (5xx)
        raise HTTPException(status_code=500, detail="Internal server error")
```

### Dependency Injection:
```python
from fastapi import Depends

def get_current_user(request: Request):
    """Dependency to get current user from request."""
    return request.state.user

@router.get("/me")
async def get_me(user = Depends(get_current_user)):
    """Get current user info."""
    return user
```

## Monitoring & Debugging

### Logging:
```python
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.get("/example")
async def example():
    logger.info("Processing request")
    # Your logic
    logger.error("Something went wrong")
```

### Vercel Logs:
```bash
# View logs in real-time
vercel logs

# View logs for specific deployment
vercel logs <deployment-url>
```

### Performance Monitoring:
- Use Vercel Analytics for request timing
- Add custom metrics with logging
- Monitor cold start frequency
- Track external API latency

## Best Practices Summary

✅ **Always use `api/index.py`** with Mangum adapter  
✅ **Configure CORS** for your Next.js domain  
✅ **Use service role key** for backend Supabase operations  
✅ **Validate all inputs** with Pydantic models  
✅ **Handle errors gracefully** with try/except and HTTPException  
✅ **Use retry logic** for external APIs (tenacity)  
✅ **Keep functions lightweight** to minimize cold starts  
✅ **Test locally** with `uvicorn` or `vercel dev`  
✅ **Use environment variables** for all secrets  
✅ **Monitor cold starts** and optimize as needed  

---

**Remember**: Vercel serverless functions have limitations:
- **10 second timeout** (Hobby), 60 seconds (Pro)
- **1024 MB memory** (configurable)
- **Cold starts** on first request after idle
- **Stateless** - no persistent connections between requests

Design your API accordingly!
