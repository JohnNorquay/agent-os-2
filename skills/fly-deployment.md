# Fly.io Deployment Patterns

## Overview
Fly.io is ideal for deploying backend services, long-running processes, and applications that need more control than serverless allows. Great for Docker-based deployments with global distribution.

## Getting Started

### Install Fly CLI
```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Authentication
```bash
# Login to Fly.io
fly auth login

# Verify authentication
fly auth whoami
```

## Project Setup

### Initialize a New App
```bash
# Launch new app (interactive)
fly launch

# Options during launch:
# - App name
# - Region selection
# - PostgreSQL database
# - Redis instance
```

### fly.toml Configuration
```toml
# fly.toml
app = "your-app-name"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256

[[services]]
  protocol = "tcp"
  internal_port = 8080

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "1s"
```

## Docker Configuration

### Node.js Dockerfile
```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Build the application
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

USER nodejs

EXPOSE 8080

ENV PORT 8080

CMD ["node", "dist/index.js"]
```

### Python Dockerfile
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--workers", "4", "app:app"]
```

### .dockerignore
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.env.local
dist
.next
coverage
.vscode
```

## Deployment

### Deploy Application
```bash
# Deploy to production
fly deploy

# Deploy with build arguments
fly deploy --build-arg NODE_ENV=production

# Deploy specific Dockerfile
fly deploy --dockerfile Dockerfile.prod

# Deploy without cache
fly deploy --no-cache
```

### Deployment Strategies

#### Blue-Green Deployment
```bash
# Deploy new version without routing traffic
fly deploy --strategy bluegreen

# Test new version
# If good, route traffic:
fly deploy --strategy bluegreen --promote

# If bad, rollback:
fly releases rollback
```

#### Canary Deployment
```bash
# Deploy to subset of machines
fly deploy --strategy canary
```

## Environment Variables

### Set Secrets
```bash
# Set individual secret
fly secrets set DATABASE_URL="postgresql://..."

# Set multiple secrets
fly secrets set \
  DATABASE_URL="postgresql://..." \
  API_KEY="secret-key" \
  STRIPE_SECRET="sk_live_..."

# Set from .env file
fly secrets import < .env.production
```

### List Secrets
```bash
# List secret names (not values)
fly secrets list
```

### Remove Secrets
```bash
fly secrets unset API_KEY
```

## Database Management

### PostgreSQL

#### Create PostgreSQL Database
```bash
# Create new Postgres app
fly postgres create

# Options:
# - Cluster name
# - Region
# - VM size
# - Volume size
```

#### Attach Database to App
```bash
# Attach database to your app
fly postgres attach --app your-app-name your-db-name

# This automatically sets DATABASE_URL secret
```

#### Database Operations
```bash
# Connect to database
fly postgres connect --app your-db-name

# View database info
fly postgres db list --app your-db-name

# Create database
fly postgres db create my_database --app your-db-name

# Run migrations
fly ssh console --app your-app-name -C "npm run migrate"
```

### Redis

#### Create Redis Instance
```bash
# Create Upstash Redis
fly redis create

# This creates a managed Redis instance
# Automatically sets REDIS_URL secret
```

#### Redis Operations
```bash
# View Redis info
fly redis status

# Reset Redis
fly redis reset

# Destroy Redis
fly redis destroy
```

## Scaling

### Vertical Scaling (Machine Size)
```bash
# Scale VM resources
fly scale vm shared-cpu-1x --memory 512

# Available sizes:
# - shared-cpu-1x (256MB, 512MB, 1GB)
# - shared-cpu-2x (2GB, 4GB)
# - dedicated-cpu-1x (2GB, 4GB, 8GB)
# - dedicated-cpu-2x (4GB, 8GB, 16GB)
```

### Horizontal Scaling (Machine Count)
```bash
# Scale number of machines
fly scale count 3

# Scale by region
fly scale count 2 --region iad
fly scale count 1 --region sjc
```

### Auto-Scaling
```toml
# fly.toml
[http_service]
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  
  [[http_service.machine]]
    cpu_kind = "shared"
    cpus = 1
    memory_mb = 256
```

## Monitoring & Logs

### View Logs
```bash
# View real-time logs
fly logs

# View logs with filter
fly logs --app your-app-name

# View historical logs
fly logs --since 1h

# Follow logs
fly logs -f
```

### Monitoring
```bash
# View app status
fly status

# View detailed status
fly status --all

# View machine list
fly machine list

# View deployment history
fly releases
```

### Health Checks
```toml
# fly.toml
[[services.tcp_checks]]
  interval = "15s"
  timeout = "2s"
  grace_period = "5s"

[[services.http_checks]]
  interval = "10s"
  timeout = "2s"
  grace_period = "5s"
  method = "get"
  path = "/health"
  protocol = "http"
```

Implement health endpoint:
```typescript
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
})
```

## Volumes & Storage

### Create Volume
```bash
# Create persistent volume
fly volumes create data --size 10 --region iad

# List volumes
fly volumes list

# Extend volume
fly volumes extend <volume-id> --size 20
```

### Mount Volume
```toml
# fly.toml
[mounts]
  source = "data"
  destination = "/data"
```

### Volume Backups
```bash
# Create snapshot
fly volumes snapshots create <volume-id>

# List snapshots
fly volumes snapshots list <volume-id>

# Restore from snapshot
fly volumes create data_restored --snapshot-id <snapshot-id>
```

## Networking

### Custom Domains
```bash
# Add custom domain
fly certs create example.com

# Add wildcard domain
fly certs create "*.example.com"

# View certificates
fly certs list

# Check certificate status
fly certs check example.com
```

DNS Configuration:
```
# Add CNAME record
your-app.example.com CNAME your-app-name.fly.dev
```

### Private Networking
```bash
# Apps in same organization can communicate via private IPv6

# Get private IP
fly ips private

# Access another app
http://app-name.internal:8080
```

### Public IP Addresses
```bash
# Allocate IPv4
fly ips allocate-v4

# Allocate IPv6
fly ips allocate-v6

# List IPs
fly ips list

# Release IP
fly ips release <ip-address>
```

## SSH & Console Access

### SSH into Machine
```bash
# SSH into app
fly ssh console

# SSH into specific machine
fly ssh console --select

# Run command via SSH
fly ssh console -C "ls -la"
```

### SFTP Access
```bash
# Connect via SFTP
fly ssh sftp shell

# Upload file
fly ssh sftp shell "put local-file.txt /remote/path/file.txt"

# Download file
fly ssh sftp shell "get /remote/path/file.txt local-file.txt"
```

## Debugging

### Common Issues

**App Won't Start**:
```bash
# Check logs
fly logs

# Common causes:
# - Port mismatch (must listen on $PORT)
# - Missing environment variables
# - Database connection issues
# - Dockerfile errors
```

**Health Check Failures**:
```bash
# Test health endpoint locally
curl http://localhost:8080/health

# Check health check config in fly.toml
# Ensure endpoint returns 200 status
```

**Memory Issues**:
```bash
# Monitor memory usage
fly vm status

# Scale up memory if needed
fly scale vm shared-cpu-1x --memory 512
```

**Database Connection Errors**:
```bash
# Verify DATABASE_URL is set
fly secrets list

# Test database connection
fly ssh console -C "echo $DATABASE_URL"

# Check if database is running
fly postgres db list --app your-db-name
```

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/deploy.yml
name: Deploy to Fly.io

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - name: Deploy to Fly.io
        run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Get API Token
```bash
# Generate deploy token
fly tokens create deploy -x 999999h

# Add token to GitHub secrets as FLY_API_TOKEN
```

## Cost Optimization

### Free Tier Allowances
- 3 shared-cpu-1x VMs (256MB RAM)
- 160GB outbound data transfer
- 3GB persistent volume storage

### Cost-Saving Tips
1. **Use auto-stop/start**: Machines stop when not in use
2. **Right-size VMs**: Don't over-provision resources
3. **Shared CPUs**: Use for non-critical workloads
4. **Volume sizing**: Only allocate needed storage
5. **Regional deployment**: Deploy close to users

### Monitoring Costs
```bash
# View current usage
fly dashboard

# Check in Fly.io dashboard for detailed billing
```

## Best Practices

### Security
```bash
# Rotate secrets regularly
fly secrets set API_KEY="new-key"

# Use Fly.io's built-in proxy for HTTPS
# Enable force_https in fly.toml

# Implement rate limiting in application
```

### Performance
```toml
# Optimize concurrency settings
[services.concurrency]
  type = "connections"
  hard_limit = 25
  soft_limit = 20

# Use keepalive connections
# Implement connection pooling for databases
```

### Reliability
```toml
# Deploy to multiple regions
[[services]]
  protocol = "tcp"
  internal_port = 8080

# Set up health checks
[[services.http_checks]]
  interval = "10s"
  path = "/health"

# Configure graceful shutdown
```

### Deployment Checklist
- [ ] Health check endpoint implemented
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate verified
- [ ] Logs monitoring configured
- [ ] Backups enabled for volumes
- [ ] Auto-scaling configured
- [ ] Cost alerts set up

---

**Remember**: Fly.io gives you more control than serverless, but requires more configuration. Always test locally with Docker before deploying, and monitor your app's performance and costs closely.
