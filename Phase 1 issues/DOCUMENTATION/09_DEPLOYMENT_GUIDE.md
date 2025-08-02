# 🚀 **DEPLOYMENT GUIDE**

## 🎯 **OVERVIEW**

This comprehensive deployment guide provides step-by-step instructions for deploying the FabriiQ Activities System to production. The guide covers everything from initial setup to post-deployment monitoring and maintenance.

---

## 📋 **PRE-DEPLOYMENT CHECKLIST**

### **✅ Prerequisites**

#### **Infrastructure Requirements**
- [ ] **Cloud Provider Account** (AWS, Azure, or GCP)
- [ ] **Domain Name** registered and DNS configured
- [ ] **SSL Certificate** obtained (Let's Encrypt or commercial)
- [ ] **Database Instance** (PostgreSQL 15+)
- [ ] **Redis Instance** for caching and sessions
- [ ] **CDN Setup** for static asset delivery
- [ ] **Monitoring Tools** (Datadog, New Relic, or similar)

#### **Development Environment**
- [ ] **Node.js 18+** installed
- [ ] **Docker** and Docker Compose
- [ ] **Git** with repository access
- [ ] **Environment Variables** configured
- [ ] **API Keys** for third-party services
- [ ] **Database Migrations** ready
- [ ] **Build Process** tested locally

#### **Security Requirements**
- [ ] **Environment Variables** secured
- [ ] **API Keys** rotated and secured
- [ ] **Database Credentials** encrypted
- [ ] **SSL/TLS Certificates** valid
- [ ] **Firewall Rules** configured
- [ ] **Access Controls** implemented
- [ ] **Backup Strategy** in place

---

## 🔧 **ENVIRONMENT SETUP**

### **🌍 Environment Variables**

Create a comprehensive `.env.production` file:

```bash
# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://activities.fabriiq.com
NEXT_PUBLIC_API_URL=https://api.fabriiq.com

# Database Configuration
DATABASE_URL=postgresql://username:password@host:5432/fabriiq_activities
DATABASE_POOL_SIZE=20
DATABASE_SSL=true

# Redis Configuration
REDIS_URL=redis://username:password@host:6379
REDIS_TLS=true

# Authentication
NEXTAUTH_SECRET=your-super-secure-secret-key-here
NEXTAUTH_URL=https://activities.fabriiq.com
JWT_SECRET=another-super-secure-jwt-secret

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_ORG_ID=org-your-organization-id
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=production

# Email Services
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
FROM_EMAIL=noreply@fabriiq.com

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=fabriiq-activities-production

# Monitoring & Analytics
SENTRY_DSN=https://your-sentry-dsn
DATADOG_API_KEY=your-datadog-api-key
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=1000

# Feature Flags
ENABLE_AI_GRADING=true
ENABLE_PREDICTIVE_ANALYTICS=true
ENABLE_REAL_TIME_ANALYTICS=true
```

### **🐳 Docker Configuration**

#### **Production Dockerfile**
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

#### **Docker Compose for Production**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: fabriiq_activities
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

## 🌐 **CLOUD DEPLOYMENT**

### **☁️ AWS Deployment**

#### **Infrastructure as Code (Terraform)**
```hcl
# main.tf
provider "aws" {
  region = var.aws_region
}

# ECS Cluster
resource "aws_ecs_cluster" "fabriiq_cluster" {
  name = "fabriiq-activities"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Application Load Balancer
resource "aws_lb" "app_lb" {
  name               = "fabriiq-activities-lb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.lb_sg.id]
  subnets           = aws_subnet.public[*].id

  enable_deletion_protection = true
}

# RDS Instance
resource "aws_db_instance" "postgres" {
  identifier     = "fabriiq-activities-db"
  engine         = "postgres"
  engine_version = "15.3"
  instance_class = "db.r6g.xlarge"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_encrypted     = true
  
  db_name  = "fabriiq_activities"
  username = var.db_username
  password = var.db_password
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  deletion_protection = true
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "redis_subnet_group" {
  name       = "fabriiq-redis-subnet-group"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "fabriiq-redis"
  description                = "Redis cluster for FabriiQ Activities"
  
  node_type                  = "cache.r6g.large"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = 2
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  subnet_group_name = aws_elasticache_subnet_group.redis_subnet_group.name
  security_group_ids = [aws_security_group.redis_sg.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
}
```

#### **ECS Task Definition**
```json
{
  "family": "fabriiq-activities",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "2048",
  "memory": "4096",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "fabriiq-activities",
      "image": "your-account.dkr.ecr.region.amazonaws.com/fabriiq-activities:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:fabriiq/database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/fabriiq-activities",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### **🔄 CI/CD Pipeline**

#### **GitHub Actions Workflow**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run type check
        run: npm run type-check
      
      - name: Run tests
        run: npm run test:ci
      
      - name: Run E2E tests
        run: npm run test:e2e

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: fabriiq-activities
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster fabriiq-activities \
            --service fabriiq-activities-service \
            --force-new-deployment
```

---

## 🗄️ **DATABASE DEPLOYMENT**

### **📊 Database Migration**

#### **Migration Script**
```bash
#!/bin/bash
# deploy-database.sh

echo "🗄️ Starting database deployment..."

# Backup existing database
echo "📦 Creating database backup..."
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run Prisma migrations
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed initial data if needed
echo "🌱 Seeding initial data..."
npx prisma db seed

# Verify migration
echo "✅ Verifying migration..."
npx prisma db pull

echo "🎉 Database deployment completed successfully!"
```

#### **Prisma Migration Commands**
```bash
# Generate migration
npx prisma migrate dev --name production_deployment

# Deploy to production
npx prisma migrate deploy

# Reset database (DANGER - only for development)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

---

## 🔍 **MONITORING SETUP**

### **📊 Application Monitoring**

#### **Health Check Endpoint**
```typescript
// pages/api/health.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    // Check external services
    const openaiStatus = await checkOpenAIStatus();
    
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        openai: openaiStatus ? 'healthy' : 'degraded'
      },
      version: process.env.npm_package_version
    };
    
    res.status(200).json(healthStatus);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
}
```

#### **Monitoring Configuration**
```yaml
# monitoring/datadog.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: datadog-config
data:
  datadog.yaml: |
    api_key: ${DATADOG_API_KEY}
    site: datadoghq.com
    
    logs_enabled: true
    log_level: INFO
    
    apm_config:
      enabled: true
      env: production
    
    process_config:
      enabled: true
    
    checks:
      http_check:
        instances:
          - name: fabriiq_activities_health
            url: https://activities.fabriiq.com/api/health
            timeout: 10
            interval: 30
```

---

## 🔒 **SECURITY CONFIGURATION**

### **🛡️ Security Headers**

#### **Nginx Security Configuration**
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name activities.fabriiq.com;
    
    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req zone=api burst=20 nodelay;
    
    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 📈 **POST-DEPLOYMENT VERIFICATION**

### **✅ Deployment Checklist**

#### **Functional Testing**
- [ ] **Health Check**: `/api/health` returns 200
- [ ] **Authentication**: Login/logout functionality works
- [ ] **Database**: Data persistence and retrieval
- [ ] **AI Services**: Essay grading functionality
- [ ] **File Upload**: File storage and retrieval
- [ ] **Email**: Notification system working
- [ ] **Analytics**: Event tracking operational

#### **Performance Testing**
- [ ] **Load Testing**: System handles expected load
- [ ] **Response Times**: All endpoints under target times
- [ ] **Memory Usage**: Within acceptable limits
- [ ] **Database Performance**: Query times optimized
- [ ] **CDN**: Static assets served correctly

#### **Security Testing**
- [ ] **SSL Certificate**: Valid and properly configured
- [ ] **Security Headers**: All headers present
- [ ] **Authentication**: Secure login process
- [ ] **Authorization**: Proper access controls
- [ ] **Data Encryption**: Sensitive data encrypted

### **🔍 Monitoring Verification**
```bash
# Verify monitoring setup
curl -f https://activities.fabriiq.com/api/health
curl -f https://activities.fabriiq.com/api/metrics

# Check logs
docker logs fabriiq-activities-app
kubectl logs -f deployment/fabriiq-activities

# Verify database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Check Redis
redis-cli -u $REDIS_URL ping
```

---

## 🚨 **ROLLBACK PROCEDURES**

### **⏪ Emergency Rollback**

#### **Quick Rollback Script**
```bash
#!/bin/bash
# rollback.sh

echo "🚨 Starting emergency rollback..."

# Get previous deployment
PREVIOUS_IMAGE=$(aws ecs describe-services \
  --cluster fabriiq-activities \
  --services fabriiq-activities-service \
  --query 'services[0].deployments[1].taskDefinition' \
  --output text)

# Update service to previous version
aws ecs update-service \
  --cluster fabriiq-activities \
  --service fabriiq-activities-service \
  --task-definition $PREVIOUS_IMAGE

echo "✅ Rollback completed. Monitoring deployment..."

# Wait for deployment to complete
aws ecs wait services-stable \
  --cluster fabriiq-activities \
  --services fabriiq-activities-service

echo "🎉 Rollback successful!"
```

**🎯 This deployment guide ensures a smooth, secure, and reliable production deployment of the FabriiQ Activities System with comprehensive monitoring and rollback capabilities! 🎯**
