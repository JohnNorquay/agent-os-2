

# API Integrations Skill

## Purpose
Patterns for integrating external APIs (Vessey, Slack, Twilio, SendGrid) in the IntegrationDirector FastAPI backend.

## Table of Contents
1. [General API Client Patterns](#general-api-client-patterns)
2. [Vessey API Integration](#vessey-api-integration)
3. [Slack Integration](#slack-integration)
4. [Twilio SMS Integration](#twilio-sms-integration)
5. [Email Integration (SendGrid/Resend)](#email-integration)
6. [Error Handling & Retry Logic](#error-handling-retry-logic)
7. [Rate Limiting](#rate-limiting)
8. [Authentication Patterns](#authentication-patterns)
9. [Testing External APIs](#testing-external-apis)
10. [Monitoring & Alerting](#monitoring-alerting)

---

## General API Client Patterns

### Base HTTP Client Setup

```python
# api/utils/http_client.py
import httpx
from typing import Optional, Dict, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import structlog

logger = structlog.get_logger()

class APIClient:
    """Base HTTP client with retry logic and error handling"""
    
    def __init__(
        self,
        base_url: str,
        api_key: Optional[str] = None,
        timeout: int = 30,
        max_retries: int = 3
    ):
        self.base_url = base_url
        self.api_key = api_key
        self.timeout = timeout
        self.max_retries = max_retries
        
        # Headers
        self.headers = {
            "Content-Type": "application/json",
            "User-Agent": "IntegrationDirector/1.0"
        }
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"
    
    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Make HTTP request with automatic retries"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            try:
                response = await client.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    headers=self.headers,
                    **kwargs
                )
                response.raise_for_status()
                return response.json()
                
            except httpx.HTTPStatusError as e:
                logger.error(
                    "API request failed",
                    status_code=e.response.status_code,
                    url=url,
                    response=e.response.text
                )
                raise APIError(
                    f"API request failed: {e.response.status_code}",
                    status_code=e.response.status_code,
                    response=e.response.text
                )
            except httpx.TimeoutException:
                logger.error("API request timeout", url=url)
                raise APIError("Request timeout", status_code=408)
            except Exception as e:
                logger.error("Unexpected API error", error=str(e), url=url)
                raise APIError(f"Unexpected error: {str(e)}")
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def get(self, endpoint: str, **kwargs) -> Dict[str, Any]:
        """GET request with retry"""
        return await self._request("GET", endpoint, **kwargs)
    
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    async def post(self, endpoint: str, data: Dict, **kwargs) -> Dict[str, Any]:
        """POST request with retry"""
        return await self._request("POST", endpoint, data=data, **kwargs)
    
    async def put(self, endpoint: str, data: Dict, **kwargs) -> Dict[str, Any]:
        """PUT request"""
        return await self._request("PUT", endpoint, data=data, **kwargs)
    
    async def delete(self, endpoint: str, **kwargs) -> Dict[str, Any]:
        """DELETE request"""
        return await self._request("DELETE", endpoint, **kwargs)


class APIError(Exception):
    """Custom exception for API errors"""
    def __init__(self, message: str, status_code: int = 500, response: Any = None):
        self.message = message
        self.status_code = status_code
        self.response = response
        super().__init__(self.message)
```

---

## Vessey API Integration

### Vessey Client

```python
# api/integrations/vessey.py
from api.utils.http_client import APIClient
from typing import List, Dict, Any, Optional
from datetime import datetime
import os
import structlog

logger = structlog.get_logger()

class VesseyAPIClient(APIClient):
    """Client for Vessey API (primary data source)"""
    
    def __init__(self):
        super().__init__(
            base_url=os.getenv("VESSEY_API_URL", "https://api.vessey.com"),
            api_key=os.getenv("VESSEY_API_KEY"),
            timeout=60,  # Longer timeout for data-heavy requests
            max_retries=3
        )
    
    async def get_vessel_data(
        self,
        imo_number: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get vessel tracking and compliance data
        
        Args:
            imo_number: IMO vessel identifier
            start_date: Optional start date for historical data
            end_date: Optional end date for historical data
        
        Returns:
            Vessel data including position, status, compliance
        """
        params = {"imo": imo_number}
        
        if start_date:
            params["start_date"] = start_date.isoformat()
        if end_date:
            params["end_date"] = end_date.isoformat()
        
        logger.info("Fetching vessel data", imo=imo_number)
        
        data = await self.get("vessels/tracking", params=params)
        
        # Transform Vessey data to internal format
        return self._transform_vessel_data(data)
    
    async def get_port_calls(
        self,
        vessel_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get historical port calls for vessel"""
        data = await self.get(
            f"vessels/{vessel_id}/port-calls",
            params={"limit": limit}
        )
        return data.get("port_calls", [])
    
    async def get_compliance_status(
        self,
        vessel_id: str
    ) -> Dict[str, Any]:
        """Get vessel compliance and certification status"""
        data = await self.get(f"vessels/{vessel_id}/compliance")
        return self._transform_compliance_data(data)
    
    async def search_vessels(
        self,
        query: str,
        filters: Optional[Dict] = None
    ) -> List[Dict[str, Any]]:
        """
        Search vessels by name, IMO, or other criteria
        
        Args:
            query: Search query string
            filters: Optional filters (vessel_type, flag, etc.)
        """
        params = {"q": query}
        if filters:
            params.update(filters)
        
        data = await self.get("vessels/search", params=params)
        return data.get("vessels", [])
    
    def _transform_vessel_data(self, raw_data: Dict) -> Dict[str, Any]:
        """Transform Vessey API response to internal format"""
        return {
            "vessel_id": raw_data.get("imo"),
            "name": raw_data.get("vessel_name"),
            "position": {
                "lat": raw_data.get("latitude"),
                "lon": raw_data.get("longitude"),
                "heading": raw_data.get("heading"),
                "speed": raw_data.get("speed_knots"),
                "timestamp": raw_data.get("position_timestamp")
            },
            "status": raw_data.get("status"),
            "destination": raw_data.get("destination_port"),
            "eta": raw_data.get("estimated_arrival")
        }
    
    def _transform_compliance_data(self, raw_data: Dict) -> Dict[str, Any]:
        """Transform compliance data to internal format"""
        return {
            "compliant": raw_data.get("is_compliant", False),
            "certificates": raw_data.get("certificates", []),
            "inspections": raw_data.get("recent_inspections", []),
            "deficiencies": raw_data.get("open_deficiencies", []),
            "last_updated": raw_data.get("last_updated")
        }


# Singleton instance
vessey_client = VesseyAPIClient()
```

### Vessey Integration in Routes

```python
# api/routes/vessels.py
from fastapi import APIRouter, Depends, HTTPException
from api.integrations.vessey import vessey_client
from api.models.vessel import VesselResponse
from api.auth.middleware import get_current_user

router = APIRouter(prefix="/vessels", tags=["vessels"])

@router.get("/{imo_number}", response_model=VesselResponse)
async def get_vessel(
    imo_number: str,
    current_user = Depends(get_current_user)
):
    """Get vessel data from Vessey API"""
    try:
        vessel_data = await vessey_client.get_vessel_data(imo_number)
        
        # Cache in Supabase for faster subsequent access
        # (implementation depends on caching strategy)
        
        return VesselResponse(**vessel_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch vessel data: {str(e)}"
        )
```

---

## Slack Integration

### Slack Webhook Client

```python
# api/integrations/slack.py
from api.utils.http_client import APIClient
from typing import Dict, Any, Optional, List
import os
import structlog

logger = structlog.get_logger()

class SlackClient(APIClient):
    """Client for Slack webhooks and API"""
    
    def __init__(self):
        super().__init__(
            base_url="https://slack.com/api",
            api_key=os.getenv("SLACK_BOT_TOKEN"),
            timeout=10
        )
        self.webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    
    async def send_webhook_message(
        self,
        text: str,
        channel: Optional[str] = None,
        blocks: Optional[List[Dict]] = None,
        attachments: Optional[List[Dict]] = None
    ) -> bool:
        """
        Send message via webhook (simpler, no auth needed)
        
        Args:
            text: Message text (fallback)
            channel: Optional channel override
            blocks: Optional Block Kit blocks
            attachments: Optional legacy attachments
        
        Returns:
            True if successful
        """
        if not self.webhook_url:
            logger.error("Slack webhook URL not configured")
            return False
        
        payload = {"text": text}
        
        if channel:
            payload["channel"] = channel
        if blocks:
            payload["blocks"] = blocks
        if attachments:
            payload["attachments"] = attachments
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.webhook_url,
                    json=payload,
                    timeout=self.timeout
                )
                
                if response.status_code == 200 and response.text == "ok":
                    logger.info("Slack message sent", channel=channel)
                    return True
                else:
                    logger.error(
                        "Slack webhook failed",
                        status=response.status_code,
                        response=response.text
                    )
                    return False
                    
        except Exception as e:
            logger.error("Slack webhook error", error=str(e))
            return False
    
    async def send_alert(
        self,
        title: str,
        message: str,
        severity: str = "info",
        metadata: Optional[Dict] = None
    ) -> bool:
        """
        Send formatted alert to Slack
        
        Args:
            title: Alert title
            message: Alert message
            severity: "info", "warning", "error", "critical"
            metadata: Additional context data
        """
        # Color based on severity
        colors = {
            "info": "#36a64f",      # Green
            "warning": "#ff9900",   # Orange
            "error": "#ff0000",     # Red
            "critical": "#8b0000"   # Dark red
        }
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"🚨 {title}",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": message
                }
            }
        ]
        
        # Add metadata as fields
        if metadata:
            fields = []
            for key, value in metadata.items():
                fields.append({
                    "type": "mrkdwn",
                    "text": f"*{key}:*\n{value}"
                })
            
            if fields:
                blocks.append({
                    "type": "section",
                    "fields": fields
                })
        
        attachments = [{
            "color": colors.get(severity, colors["info"]),
            "fallback": f"{title}: {message}"
        }]
        
        return await self.send_webhook_message(
            text=f"{title}: {message}",
            blocks=blocks,
            attachments=attachments
        )
    
    async def send_notification(
        self,
        event_type: str,
        data: Dict[str, Any]
    ) -> bool:
        """
        Send structured notification for specific events
        
        Event types:
        - vessel_arrival
        - compliance_issue
        - integration_error
        - driver_alert
        """
        handlers = {
            "vessel_arrival": self._format_vessel_arrival,
            "compliance_issue": self._format_compliance_issue,
            "integration_error": self._format_integration_error,
            "driver_alert": self._format_driver_alert
        }
        
        handler = handlers.get(event_type)
        if not handler:
            logger.warning(f"Unknown event type: {event_type}")
            return False
        
        title, message, severity, metadata = handler(data)
        return await self.send_alert(title, message, severity, metadata)
    
    def _format_vessel_arrival(self, data: Dict) -> tuple:
        """Format vessel arrival notification"""
        title = "🚢 Vessel Arrival"
        message = (
            f"*{data['vessel_name']}* (IMO: {data['imo']}) "
            f"has arrived at *{data['port']}*"
        )
        severity = "info"
        metadata = {
            "ETA": data.get('eta', 'N/A'),
            "Actual Arrival": data.get('actual_arrival', 'N/A')
        }
        return title, message, severity, metadata
    
    def _format_compliance_issue(self, data: Dict) -> tuple:
        """Format compliance issue notification"""
        title = "⚠️ Compliance Issue Detected"
        message = (
            f"*{data['vessel_name']}* has compliance issues:\n"
            f"{data['issue_description']}"
        )
        severity = "warning"
        metadata = {
            "Vessel": data['vessel_name'],
            "Issue Type": data.get('issue_type', 'Unknown'),
            "Severity": data.get('severity', 'Medium')
        }
        return title, message, severity, metadata
    
    def _format_integration_error(self, data: Dict) -> tuple:
        """Format integration error notification"""
        title = "❌ Integration Error"
        message = (
            f"Error in *{data['service']}* integration:\n"
            f"```{data['error_message']}```"
        )
        severity = "error"
        metadata = {
            "Service": data['service'],
            "Error Code": data.get('error_code', 'N/A'),
            "Timestamp": data.get('timestamp', 'N/A')
        }
        return title, message, severity, metadata
    
    def _format_driver_alert(self, data: Dict) -> tuple:
        """Format driver alert notification"""
        title = "🚗 Driver Alert"
        message = (
            f"Alert for driver *{data['driver_name']}*:\n"
            f"{data['alert_message']}"
        )
        severity = data.get('severity', 'info')
        metadata = {
            "Driver": data['driver_name'],
            "Vehicle": data.get('vehicle', 'N/A'),
            "Location": data.get('location', 'N/A')
        }
        return title, message, severity, metadata


# Singleton instance
slack_client = SlackClient()
```

### Usage Example

```python
# api/services/notifications.py
from api.integrations.slack import slack_client
import structlog

logger = structlog.get_logger()

async def notify_vessel_arrival(vessel_data: Dict):
    """Send vessel arrival notification"""
    try:
        await slack_client.send_notification(
            event_type="vessel_arrival",
            data={
                "vessel_name": vessel_data["name"],
                "imo": vessel_data["imo"],
                "port": vessel_data["destination"],
                "eta": vessel_data["eta"],
                "actual_arrival": vessel_data["arrival_time"]
            }
        )
    except Exception as e:
        logger.error("Failed to send Slack notification", error=str(e))
```

---

## Twilio SMS Integration

### Twilio Client

```python
# api/integrations/twilio.py
from twilio.rest import Client
from typing import Optional, Dict, Any
import os
import structlog

logger = structlog.get_logger()

class TwilioClient:
    """Client for Twilio SMS"""
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        
        if not all([self.account_sid, self.auth_token, self.from_number]):
            logger.warning("Twilio credentials not fully configured")
            self.client = None
        else:
            self.client = Client(self.account_sid, self.auth_token)
    
    async def send_sms(
        self,
        to_number: str,
        message: str,
        media_url: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Send SMS message
        
        Args:
            to_number: Recipient phone number (E.164 format)
            message: Message text (max 1600 chars)
            media_url: Optional MMS media URL
        
        Returns:
            Message details including SID
        """
        if not self.client:
            raise Exception("Twilio client not initialized")
        
        try:
            # Validate phone number format
            if not to_number.startswith('+'):
                to_number = f"+1{to_number}"  # Assume US if no country code
            
            # Send message
            message_data = {
                "from_": self.from_number,
                "to": to_number,
                "body": message
            }
            
            if media_url:
                message_data["media_url"] = [media_url]
            
            twilio_message = self.client.messages.create(**message_data)
            
            logger.info(
                "SMS sent",
                to=to_number,
                sid=twilio_message.sid,
                status=twilio_message.status
            )
            
            return {
                "sid": twilio_message.sid,
                "status": twilio_message.status,
                "to": to_number,
                "from": self.from_number
            }
            
        except Exception as e:
            logger.error("Failed to send SMS", error=str(e), to=to_number)
            raise Exception(f"SMS send failed: {str(e)}")
    
    async def send_driver_alert(
        self,
        driver_phone: str,
        alert_type: str,
        details: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Send formatted alert to driver
        
        Args:
            driver_phone: Driver's phone number
            alert_type: "shift_reminder", "compliance_alert", "route_update"
            details: Alert-specific details
        """
        message_templates = {
            "shift_reminder": (
                "🚗 Shift Reminder\n"
                "Your shift starts in {time}.\n"
                "Location: {location}\n"
                "Vehicle: {vehicle}"
            ),
            "compliance_alert": (
                "⚠️ Compliance Alert\n"
                "{issue}\n"
                "Action required: {action}"
            ),
            "route_update": (
                "📍 Route Update\n"
                "New destination: {destination}\n"
                "ETA: {eta}"
            )
        }
        
        template = message_templates.get(alert_type, "{message}")
        message = template.format(**details)
        
        return await self.send_sms(driver_phone, message)
    
    async def get_message_status(self, message_sid: str) -> str:
        """Check status of sent message"""
        if not self.client:
            raise Exception("Twilio client not initialized")
        
        try:
            message = self.client.messages(message_sid).fetch()
            return message.status
        except Exception as e:
            logger.error("Failed to fetch message status", sid=message_sid, error=str(e))
            return "unknown"


# Singleton instance
twilio_client = TwilioClient()
```

---

## Email Integration

### SendGrid/Resend Client

```python
# api/integrations/email.py
import os
from typing import List, Optional, Dict, Any
import structlog
from resend import Resend  # or sendgrid

logger = structlog.get_logger()

class EmailClient:
    """Client for transactional emails (Resend or SendGrid)"""
    
    def __init__(self):
        self.api_key = os.getenv("RESEND_API_KEY")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@integrationdirector.com")
        self.from_name = os.getenv("FROM_NAME", "IntegrationDirector")
        
        if self.api_key:
            self.client = Resend(api_key=self.api_key)
        else:
            logger.warning("Email API key not configured")
            self.client = None
    
    async def send_email(
        self,
        to: List[str],
        subject: str,
        html: str,
        text: Optional[str] = None,
        attachments: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Send email
        
        Args:
            to: List of recipient emails
            subject: Email subject
            html: HTML content
            text: Plain text fallback
            attachments: Optional attachments
        
        Returns:
            Email send result
        """
        if not self.client:
            raise Exception("Email client not initialized")
        
        try:
            params = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": to,
                "subject": subject,
                "html": html
            }
            
            if text:
                params["text"] = text
            if attachments:
                params["attachments"] = attachments
            
            result = self.client.emails.send(params)
            
            logger.info("Email sent", to=to, subject=subject, id=result.get("id"))
            
            return {
                "id": result.get("id"),
                "status": "sent",
                "to": to
            }
            
        except Exception as e:
            logger.error("Failed to send email", error=str(e), to=to)
            raise Exception(f"Email send failed: {str(e)}")
    
    async def send_welcome_email(self, user_email: str, user_name: str):
        """Send welcome email to new user"""
        html = f"""
        <h1>Welcome to IntegrationDirector, {user_name}!</h1>
        <p>Your account has been created successfully.</p>
        <p>Get started by logging in at: https://app.integrationdirector.com</p>
        """
        
        await self.send_email(
            to=[user_email],
            subject="Welcome to IntegrationDirector",
            html=html,
            text=f"Welcome to IntegrationDirector, {user_name}!"
        )
    
    async def send_report(
        self,
        to: List[str],
        report_type: str,
        data: Dict[str, Any],
        pdf_url: Optional[str] = None
    ):
        """Send scheduled report email"""
        subject = f"{report_type.title()} Report - {data['period']}"
        
        html = f"""
        <h2>{report_type.title()} Report</h2>
        <p><strong>Period:</strong> {data['period']}</p>
        <h3>Summary</h3>
        <ul>
            {''.join(f"<li>{k}: {v}</li>" for k, v in data['summary'].items())}
        </ul>
        """
        
        if pdf_url:
            html += f'<p><a href="{pdf_url}">Download PDF Report</a></p>'
        
        await self.send_email(
            to=to,
            subject=subject,
            html=html
        )


# Singleton instance
email_client = EmailClient()
```

---

## Error Handling & Retry Logic

### Retry Decorator

```python
# api/utils/retry.py
from functools import wraps
from typing import Callable, Type
import asyncio
import structlog

logger = structlog.get_logger()

def async_retry(
    max_attempts: int = 3,
    delay: float = 1.0,
    backoff: float = 2.0,
    exceptions: tuple = (Exception,)
):
    """
    Retry decorator for async functions
    
    Args:
        max_attempts: Maximum number of retry attempts
        delay: Initial delay between retries (seconds)
        backoff: Multiplier for delay on each retry
        exceptions: Tuple of exceptions to catch and retry
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            current_delay = delay
            
            for attempt in range(max_attempts):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    if attempt == max_attempts - 1:
                        logger.error(
                            "All retry attempts failed",
                            function=func.__name__,
                            attempts=max_attempts,
                            error=str(e)
                        )
                        raise
                    
                    logger.warning(
                        "Retry attempt failed",
                        function=func.__name__,
                        attempt=attempt + 1,
                        max_attempts=max_attempts,
                        error=str(e)
                    )
                    
                    await asyncio.sleep(current_delay)
                    current_delay *= backoff
        
        return wrapper
    return decorator


# Usage example
@async_retry(max_attempts=3, delay=2.0, backoff=2.0)
async def fetch_vessel_data(imo: str):
    return await vessey_client.get_vessel_data(imo)
```

---

## Rate Limiting

### Rate Limiter

```python
# api/utils/rate_limiter.py
import time
from collections import defaultdict
from typing import Dict, Optional
import asyncio
import structlog

logger = structlog.get_logger()

class RateLimiter:
    """Token bucket rate limiter"""
    
    def __init__(self, rate: int, per: float = 1.0):
        """
        Args:
            rate: Number of requests allowed
            per: Time period in seconds
        """
        self.rate = rate
        self.per = per
        self.allowance: Dict[str, float] = defaultdict(lambda: rate)
        self.last_check: Dict[str, float] = defaultdict(time.time)
    
    async def acquire(self, key: str) -> bool:
        """
        Try to acquire a token
        
        Args:
            key: Rate limit key (e.g., API name, user ID)
        
        Returns:
            True if request allowed, False if rate limited
        """
        current = time.time()
        time_passed = current - self.last_check[key]
        self.last_check[key] = current
        
        # Add tokens based on time passed
        self.allowance[key] += time_passed * (self.rate / self.per)
        
        if self.allowance[key] > self.rate:
            self.allowance[key] = self.rate
        
        if self.allowance[key] < 1.0:
            logger.warning("Rate limit exceeded", key=key)
            return False
        
        self.allowance[key] -= 1.0
        return True
    
    async def wait_for_token(self, key: str):
        """Wait until a token is available"""
        while not await self.acquire(key):
            await asyncio.sleep(0.1)


# Create rate limiters for different APIs
vessey_limiter = RateLimiter(rate=100, per=60)  # 100 requests per minute
slack_limiter = RateLimiter(rate=10, per=60)    # 10 messages per minute
twilio_limiter = RateLimiter(rate=50, per=60)   # 50 SMS per minute

# Usage
async def rate_limited_vessey_call(imo: str):
    await vessey_limiter.wait_for_token("vessey")
    return await vessey_client.get_vessel_data(imo)
```

---

## Testing External APIs

### Mock API Responses

```python
# tests/mocks/api_responses.py
MOCK_VESSEY_VESSEL_DATA = {
    "imo": "9123456",
    "vessel_name": "Test Vessel",
    "latitude": 37.7749,
    "longitude": -122.4194,
    "heading": 180,
    "speed_knots": 12.5,
    "status": "underway",
    "destination_port": "San Francisco",
    "estimated_arrival": "2025-10-25T14:00:00Z"
}

MOCK_SLACK_SUCCESS = {"ok": True}

MOCK_TWILIO_MESSAGE = {
    "sid": "SM1234567890",
    "status": "sent",
    "to": "+15551234567",
    "from": "+15559876543"
}
```

### Testing with Pytest

```python
# tests/test_integrations.py
import pytest
from unittest.mock import AsyncMock, patch
from api.integrations.vessey import vessey_client
from tests.mocks.api_responses import MOCK_VESSEY_VESSEL_DATA

@pytest.mark.asyncio
async def test_vessey_get_vessel_data():
    """Test Vessey API vessel data fetch"""
    with patch.object(vessey_client, 'get') as mock_get:
        mock_get.return_value = MOCK_VESSEY_VESSEL_DATA
        
        result = await vessey_client.get_vessel_data("9123456")
        
        assert result["vessel_id"] == "9123456"
        assert result["name"] == "Test Vessel"
        assert result["position"]["lat"] == 37.7749
        mock_get.assert_called_once()

@pytest.mark.asyncio
async def test_slack_send_alert():
    """Test Slack alert sending"""
    from api.integrations.slack import slack_client
    
    with patch.object(slack_client, 'send_webhook_message') as mock_send:
        mock_send.return_value = True
        
        result = await slack_client.send_alert(
            title="Test Alert",
            message="This is a test",
            severity="info"
        )
        
        assert result is True
        mock_send.assert_called_once()

@pytest.mark.asyncio
async def test_rate_limiter():
    """Test rate limiting functionality"""
    from api.utils.rate_limiter import RateLimiter
    
    limiter = RateLimiter(rate=2, per=1.0)  # 2 requests per second
    
    # First two should succeed
    assert await limiter.acquire("test") is True
    assert await limiter.acquire("test") is True
    
    # Third should fail (rate limited)
    assert await limiter.acquire("test") is False
```

---

## Monitoring & Alerting

### API Monitoring Middleware

```python
# api/middleware/monitoring.py
from fastapi import Request, Response
from time import time
import structlog
from api.integrations.slack import slack_client

logger = structlog.get_logger()

async def monitor_api_health(request: Request, call_next):
    """Monitor API performance and errors"""
    start_time = time()
    
    try:
        response: Response = await call_next(request)
        duration = time() - start_time
        
        # Log slow requests
        if duration > 5.0:
            logger.warning(
                "Slow API request",
                path=request.url.path,
                method=request.method,
                duration=duration
            )
            
            # Alert on very slow requests
            if duration > 10.0:
                await slack_client.send_alert(
                    title="Slow API Request",
                    message=f"Request to {request.url.path} took {duration:.2f}s",
                    severity="warning",
                    metadata={
                        "Path": request.url.path,
                        "Method": request.method,
                        "Duration": f"{duration:.2f}s"
                    }
                )
        
        return response
        
    except Exception as e:
        duration = time() - start_time
        
        logger.error(
            "API request failed",
            path=request.url.path,
            method=request.method,
            error=str(e),
            duration=duration
        )
        
        # Alert on critical errors
        await slack_client.send_alert(
            title="API Error",
            message=f"Error in {request.url.path}: {str(e)}",
            severity="error",
            metadata={
                "Path": request.url.path,
                "Method": request.method,
                "Error": str(e)
            }
        )
        
        raise


# Add to FastAPI app
from fastapi import FastAPI

app = FastAPI()
app.middleware("http")(monitor_api_health)
```

---

## Environment Variables

```bash
# .env.example

# Vessey API
VESSEY_API_URL=https://api.vessey.com
VESSEY_API_KEY=your_vessey_api_key

# Slack
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+15551234567

# Email (Resend)
RESEND_API_KEY=re_your_api_key
FROM_EMAIL=noreply@integrationdirector.com
FROM_NAME=IntegrationDirector
```

---

## Best Practices Summary

### 1. **Always Use Retry Logic**
- Wrap external API calls with retry decorators
- Use exponential backoff
- Log retry attempts

### 2. **Implement Rate Limiting**
- Respect API rate limits
- Use token bucket algorithm
- Queue requests if needed

### 3. **Comprehensive Error Handling**
- Catch specific exceptions
- Log detailed error context
- Alert on critical failures

### 4. **Transform Data at Boundaries**
- Convert external formats to internal models
- Validate data with Pydantic
- Handle missing/null values gracefully

### 5. **Monitor Everything**
- Log all API calls
- Track response times
- Alert on anomalies

### 6. **Test with Mocks**
- Mock external APIs in tests
- Test error scenarios
- Verify retry logic

### 7. **Use Environment Variables**
- Never hardcode API keys
- Use different keys for dev/staging/prod
- Rotate keys regularly

### 8. **Document API Contracts**
- Document expected request/response formats
- Note rate limits and quotas
- Keep examples up to date

---

## Integration Checklist

When adding a new API integration:

- [ ] Create client class extending `APIClient`
- [ ] Implement retry logic
- [ ] Add rate limiting
- [ ] Transform data to internal format
- [ ] Add comprehensive error handling
- [ ] Log all requests and responses
- [ ] Write unit tests with mocks
- [ ] Add integration tests
- [ ] Document API endpoints used
- [ ] Set up monitoring/alerting
- [ ] Configure environment variables
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Monitor initial rollout

---

This skill provides everything needed to integrate external APIs consistently in IntegrationDirector!