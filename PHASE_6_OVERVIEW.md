# Phase 6: Deployment - Implementation Guide

**Status:** 🚀 STARTING  
**Date:** December 10, 2024  
**Phase:** 6 of 8 (Deployment)  
**Scope:** Deploy to Kubernetes or Docker Swarm with rolling/blue-green updates

---

## 📋 Phase 6 Overview

Phase 6 focuses on deploying the Ticket Booking System to a production-like environment with:
- Kubernetes deployment configuration
- Rolling updates strategy
- Blue-green deployment option
- Resource requirement calculations
- Health checks and readiness probes
- Service discovery
- Load balancing

---

## 🎯 Phase 6 Objectives

| Objective | Description | Status |
|-----------|-------------|--------|
| Configure CD pipeline | Deploy to Kubernetes cluster | ⏳ TODO |
| Implement rolling updates | Gradual deployment with zero downtime | ⏳ TODO |
| Blue-green deployment | Alternative deployment strategy | ⏳ TODO |
| Resource calculation | CPU, memory for pods/services | ⏳ TODO |
| Health checks | Liveness and readiness probes | ⏳ TODO |
| Service discovery | Kubernetes networking | ⏳ TODO |
| Monitoring integration | Connect to Phase 7 systems | ⏳ TODO |

---

## 🏗️ Deployment Architecture

### **Option 1: Kubernetes (Recommended)**

```
┌────────────────────────────────────────────────────────┐
│             Kubernetes Cluster                          │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Ingress / Load Balancer                         │  │
│  │  (Nginx / AWS ELB / GCP Load Balancer)           │  │
│  └────────────┬─────────────────────────────────────┘  │
│               │                                         │
│  ┌────────────┴────────────────────────────────────┐  │
│  │  Kubernetes Services                             │  │
│  │  ├─ frontend-service (ClusterIP)                │  │
│  │  ├─ backend-service (ClusterIP)                 │  │
│  │  └─ database-service (StatefulSet)              │  │
│  └────────────┬────────────────────────────────────┘  │
│               │                                         │
│  ┌────────────┴────────────────────────────────────┐  │
│  │  Deployments (ReplicaSets)                       │  │
│  │  ├─ Frontend Deployment (3 replicas)            │  │
│  │  ├─ Backend Deployment (3 replicas)             │  │
│  │  └─ MySQL StatefulSet (1 replica)               │  │
│  │                                                  │  │
│  │  ┌─────────────────────────────────────────┐   │  │
│  │  │  Frontend Pod (Nginx)  │  Replica 1-3   │   │  │
│  │  │  - Port: 80 → container 80              │   │  │
│  │  │  - Memory: 128Mi / CPU: 100m            │   │  │
│  │  │  - Readiness: HTTP GET /                │   │  │
│  │  │  - Liveness: HTTP GET /health           │   │  │
│  │  └─────────────────────────────────────────┘   │  │
│  │                                                  │  │
│  │  ┌─────────────────────────────────────────┐   │  │
│  │  │  Backend Pod (Node.js) │ Replica 1-3    │   │  │
│  │  │  - Port: 3000 → container 3000          │   │  │
│  │  │  - Memory: 256Mi / CPU: 250m            │   │  │
│  │  │  - Readiness: HTTP GET /api/health      │   │  │
│  │  │  - Liveness: HTTP GET /api/health       │   │  │
│  │  └─────────────────────────────────────────┘   │  │
│  │                                                  │  │
│  │  ┌─────────────────────────────────────────┐   │  │
│  │  │  Database Pod (MySQL)  │ StatefulSet     │   │  │
│  │  │  - Port: 3306 → container 3306          │   │  │
│  │  │  - Memory: 512Mi / CPU: 500m            │   │  │
│  │  │  - Readiness: TCP probe 3306            │   │  │
│  │  │  - Liveness: TCP probe 3306             │   │  │
│  │  │  - PersistentVolume: 10Gi               │   │  │
│  │  └─────────────────────────────────────────┘   │  │
│  │                                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  ConfigMaps & Secrets                            │  │
│  │  ├─ Database credentials (Secret)               │  │
│  │  ├─ API configuration (ConfigMap)               │  │
│  │  └─ Environment variables                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### **Option 2: Docker Swarm (Alternative)**

```
┌────────────────────────────────────────────────────────┐
│          Docker Swarm Cluster                           │
│                                                         │
│  Manager Nodes (3)                                     │
│  ├─ Orchestrate services                              │
│  ├─ Manage state                                       │
│  └─ Handle failover                                    │
│                                                         │
│  Worker Nodes (3+)                                     │
│  ├─ frontend service (3 replicas)                     │
│  ├─ backend service (3 replicas)                      │
│  ├─ database service (1 replica)                      │
│  └─ Load balancer (built-in)                          │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 📊 Resource Calculations

### **Frontend Pod Resources**

```yaml
Container: Nginx
Memory Request:  100Mi
Memory Limit:    256Mi
CPU Request:     50m      (0.05 CPU cores)
CPU Limit:       200m     (0.2 CPU cores)

Calculation:
- Nginx footprint: ~50-100MB RAM
- Buffer for requests: 50-100MB
- Per replica: 256MB max
- Replicas needed: 3 (for HA, load distribution)
- Total frontend: 768MB max
```

### **Backend Pod Resources**

```yaml
Container: Node.js + Express
Memory Request:  200Mi
Memory Limit:    512Mi
CPU Request:     200m     (0.2 CPU cores)
CPU Limit:       500m     (0.5 CPU cores)

Calculation:
- Node.js base: ~100-150MB RAM
- Express.js + dependencies: ~50MB
- Buffer for operations: ~100MB
- Per replica: 512MB max
- Replicas needed: 3 (for HA, load distribution)
- Total backend: 1.5GB max
```

### **Database Pod Resources**

```yaml
Container: MySQL 8.0
Memory Request:  256Mi
Memory Limit:    1Gi
CPU Request:     250m     (0.25 CPU cores)
CPU Limit:       1000m    (1 CPU core)
Storage:         10Gi     (PersistentVolume)

Calculation:
- MySQL base: ~200-300MB RAM
- Buffer for query operations: ~200MB
- Per replica: 1GB max
- Replicas needed: 1 (stateful, persistent data)
- Total database: 1GB + 10GB storage
```

### **Total Cluster Resources**

```
Minimum Node Configuration:
  - 3 nodes for HA (high availability)
  - Each node: 2 CPU cores, 4GB RAM

Cluster Total:
  - CPU: 6 cores (3 nodes × 2 cores)
  - RAM: 12GB (3 nodes × 4GB)
  
Allocation:
  - Frontend: 768MB max
  - Backend: 1.5GB max
  - Database: 1GB + 10GB storage
  - Kubernetes overhead: ~1-2GB
  - Total used: ~4.3GB (36% of 12GB cluster)
  - Buffer: 7.7GB (64% for growth/overhead)
```

---

## 🚀 Deployment Strategies

### **1. Rolling Deployment (Default)**

```
Initial State:
  [Pod1:v1] [Pod2:v1] [Pod3:v1]

Step 1: Deploy new version
  [Pod1:v1] [Pod2:v1] [Pod3:v1] → [Pod4:v2]

Step 2: Remove old version gradually
  [Pod1:v1] [Pod2:v1] → [Pod4:v2]

Step 3: Complete rollout
  [Pod4:v2] [Pod5:v2] [Pod6:v2]

Benefits:
  ✓ Zero downtime
  ✓ Gradual testing in production
  ✓ Easy rollback
  ✓ Resource efficient

Risks:
  ⚠ Two versions running simultaneously
  ⚠ Database migration complexity
```

### **2. Blue-Green Deployment (Alternative)**

```
Blue Environment (Current):
  [Pod1:v1] [Pod2:v1] [Pod3:v1]
  ↓ (routes all traffic)
  Load Balancer

Green Environment (New):
  [Pod4:v2] [Pod5:v2] [Pod6:v2]
  ↓ (staged, no traffic)
  Isolated

Deployment Steps:
  1. Deploy v2 to Green environment
  2. Run smoke tests on Green
  3. Switch traffic from Blue to Green
  4. Keep Blue running for quick rollback

Benefits:
  ✓ Zero downtime
  ✓ Full validation before switch
  ✓ Instant rollback
  ✓ Single version in production

Risks:
  ⚠ Requires 2x resources
  ⚠ More complex setup
  ⚠ Database migration still required
```

---

## 📁 Kubernetes Manifests Structure

```
kubernetes/
├─ namespace/
│  └─ ticket-booking-namespace.yaml    # Namespace definition
│
├─ configmap/
│  └─ app-config.yaml                  # App configuration
│
├─ secrets/
│  └─ database-credentials.yaml        # DB secrets
│
├─ frontend/
│  ├─ frontend-deployment.yaml         # Frontend Deployment
│  ├─ frontend-service.yaml            # Frontend Service
│  └─ frontend-ingress.yaml            # Frontend Ingress
│
├─ backend/
│  ├─ backend-deployment.yaml          # Backend Deployment
│  ├─ backend-service.yaml             # Backend Service
│  └─ backend-hpa.yaml                 # HPA (for Phase 8)
│
├─ database/
│  ├─ mysql-configmap.yaml             # MySQL config
│  ├─ mysql-secret.yaml                # MySQL credentials
│  ├─ mysql-statefulset.yaml           # MySQL StatefulSet
│  ├─ mysql-service.yaml               # MySQL Service
│  └─ mysql-pvc.yaml                   # PersistentVolumeClaim
│
└─ deployments/
   ├─ rolling-update.yaml              # Rolling update strategy
   └─ blue-green-deployment.yaml       # Blue-green strategy
```

---

## 🔄 CD Pipeline Integration

### **GitHub Actions Deployment Workflow**

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches:
      - main
  release:
    types: [published]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Set up kubectl
        uses: azure/setup-kubectl@v3
      
      - name: Configure kubectl
        run: |
          echo ${{ secrets.KUBE_CONFIG }} | base64 -d > kubeconfig
          export KUBECONFIG=kubeconfig
      
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f kubernetes/
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/backend -n ticket-booking
          kubectl rollout status deployment/frontend -n ticket-booking
      
      - name: Run smoke tests
        run: |
          kubectl run smoke-test --image=curl:latest \
            -- curl http://backend-service:3000/api/health
      
      - name: Notify deployment
        run: |
          # Send notification to Slack/email
          echo "Deployment complete"
```

---

## ⚙️ Key Kubernetes Features

### **1. Health Checks**

```yaml
Readiness Probe:
  - Checks if pod is ready to receive traffic
  - HTTP GET /api/health
  - Initial delay: 10 seconds
  - Period: 10 seconds
  - Failure threshold: 3

Liveness Probe:
  - Checks if pod is healthy
  - HTTP GET /api/health
  - Initial delay: 30 seconds
  - Period: 10 seconds
  - Failure threshold: 3

Startup Probe:
  - Checks if app has started
  - HTTP GET /
  - Failure threshold: 30
```

### **2. Service Discovery**

```yaml
Backend Service:
  - Name: backend-service
  - Namespace: ticket-booking
  - DNS: backend-service.ticket-booking.svc.cluster.local
  - Port: 3000
  - Type: ClusterIP

Frontend Service:
  - Name: frontend-service
  - Namespace: ticket-booking
  - DNS: frontend-service.ticket-booking.svc.cluster.local
  - Port: 80
  - Type: ClusterIP or LoadBalancer
```

### **3. ConfigMaps & Secrets**

```yaml
ConfigMap (app-config):
  - NODE_ENV: production
  - LOG_LEVEL: info
  - API_TIMEOUT: 30000

Secret (database-credentials):
  - DB_USER: ticketuser
  - DB_PASSWORD: (base64 encoded)
  - DB_HOST: mysql-service
  - DB_PORT: 3306
```

---

## 📋 Next Steps for Phase 6

### **Immediate Tasks**
1. [ ] Create Kubernetes namespace definition
2. [ ] Write deployment manifests (frontend, backend, database)
3. [ ] Configure service definitions
4. [ ] Create ConfigMaps and Secrets
5. [ ] Implement health checks
6. [ ] Write deployment documentation

### **Advanced Tasks**
1. [ ] Configure Ingress for external access
2. [ ] Implement rolling update strategy
3. [ ] Create blue-green deployment manifest
4. [ ] Set up automated rollback
5. [ ] Integrate with CI/CD pipeline
6. [ ] Document resource calculations
7. [ ] Create troubleshooting guides

---

## 🔗 Related Files

**Existing Files to Use:**
- `docker-compose.yml` - Inspiration for pod configuration
- `Dockerfile` - Backend image specification
- `frontend/Dockerfile` - Frontend image specification
- `init.sql` - Database initialization
- `.github/workflows/release.yml` - Release process

**Files to Create:**
- `kubernetes/` - Directory for manifests
- `.github/workflows/deploy.yml` - Deployment workflow
- `PHASE_6_DEPLOYMENT_GUIDE.md` - Documentation
- `kubernetes-setup.sh` - Setup helper script

---

## 🎯 Phase 6 Deliverables

**Documentation:**
- [ ] PHASE_6_DEPLOYMENT_GUIDE.md (20+ pages)
- [ ] KUBERNETES_SETUP_GUIDE.md (15+ pages)
- [ ] ROLLING_UPDATES_GUIDE.md (10+ pages)
- [ ] BLUE_GREEN_DEPLOYMENT.md (10+ pages)
- [ ] RESOURCE_REQUIREMENTS.md (8+ pages)

**Code/Configuration:**
- [ ] kubernetes/namespace/
- [ ] kubernetes/configmap/
- [ ] kubernetes/secrets/
- [ ] kubernetes/frontend/
- [ ] kubernetes/backend/
- [ ] kubernetes/database/
- [ ] .github/workflows/deploy.yml
- [ ] kubernetes-setup.sh

**Total Scope:** 15+ Kubernetes manifest files, 60+ pages documentation

---

## 📊 Timeline Estimate

| Component | Effort | Time |
|-----------|--------|------|
| Kubernetes manifests | High | 4-6 hours |
| Documentation | High | 3-4 hours |
| Testing/validation | Medium | 2-3 hours |
| Examples & guides | Medium | 2-3 hours |
| **Total Phase 6** | **High** | **11-16 hours** |

---

## ✅ Success Criteria

- ✓ All Kubernetes manifests created and tested
- ✓ Deployment workflow integrated with CI/CD
- ✓ Health checks properly configured
- ✓ Rolling updates working without downtime
- ✓ Blue-green deployment documented and tested
- ✓ Resource calculations accurate and documented
- ✓ Comprehensive documentation (60+ pages)
- ✓ Ready for production deployment

---

**Phase 6 Status:** 🚀 READY TO START

**Next:** Implement Kubernetes manifests and deployment workflow

---
