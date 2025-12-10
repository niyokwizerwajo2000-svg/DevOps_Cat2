# Phase 6: Kubernetes Deployment Guide

**Status:** 🚀 IMPLEMENTATION STARTED  
**Date:** December 10, 2024  
**Phase:** 6 of 8 (Deployment)

---

## 📋 What's Included in Phase 6

### **Kubernetes Manifests Created**
- ✅ `kubernetes/namespace/` - Namespace definition
- ✅ `kubernetes/configmap/` - Application configuration
- ✅ `kubernetes/secrets/` - Database credentials
- ✅ `kubernetes/backend/` - Backend deployment & service
- ✅ `kubernetes/frontend/` - Frontend deployment & service
- ✅ `kubernetes/database/` - MySQL StatefulSet & PVC

### **Key Features Implemented**
- ✅ Rolling update strategy (zero downtime)
- ✅ Health checks (startup, readiness, liveness probes)
- ✅ Resource requests and limits
- ✅ Service discovery
- ✅ ConfigMaps for configuration
- ✅ Secrets for credentials
- ✅ PersistentVolumes for data
- ✅ Pod affinity for HA
- ✅ Security contexts

---

## 🚀 Quick Start: Deploy to Kubernetes

### **Prerequisites**
```bash
# 1. Kubernetes cluster running (minikube, EKS, GKE, AKS, etc.)
kubectl version --client

# 2. kubectl configured
kubectl config current-context

# 3. Docker images pushed to registry (from Phase 5)
# Update YOUR_USERNAME in manifests:
#   kubernetes/backend/backend-deployment.yaml
#   kubernetes/frontend/frontend-deployment.yaml
```

### **Step 1: Create Namespace**
```bash
kubectl apply -f kubernetes/namespace/ticket-booking-namespace.yaml

# Verify
kubectl get namespace ticket-booking
```

### **Step 2: Create ConfigMaps**
```bash
kubectl apply -f kubernetes/configmap/app-config.yaml

# Verify
kubectl get configmap -n ticket-booking
```

### **Step 3: Create Secrets**
```bash
# WARNING: This is for development/testing only
# In production, use external secret management (Vault, AWS Secrets Manager, etc.)
kubectl apply -f kubernetes/secrets/database-credentials.yaml

# Verify (don't show values)
kubectl get secret -n ticket-booking
```

### **Step 4: Deploy Database**
```bash
kubectl apply -f kubernetes/database/mysql-init-scripts.yaml
kubectl apply -f kubernetes/database/mysql-statefulset.yaml

# Wait for database to be ready
kubectl wait --for=condition=ready pod -l component=database -n ticket-booking --timeout=300s
```

### **Step 5: Deploy Backend**
```bash
kubectl apply -f kubernetes/backend/backend-deployment.yaml
kubectl apply -f kubernetes/backend/backend-service.yaml

# Monitor rollout
kubectl rollout status deployment/backend -n ticket-booking
```

### **Step 6: Deploy Frontend**
```bash
kubectl apply -f kubernetes/frontend/frontend-deployment.yaml
kubectl apply -f kubernetes/frontend/frontend-service.yaml

# Monitor rollout
kubectl rollout status deployment/frontend -n ticket-booking
```

### **Step 7: Verify Deployment**
```bash
# Check all resources
kubectl get all -n ticket-booking

# Check pod status
kubectl get pods -n ticket-booking

# Check services
kubectl get svc -n ticket-booking

# Check logs
kubectl logs -n ticket-booking deployment/backend --tail=50
kubectl logs -n ticket-booking deployment/frontend --tail=50

# Port-forward to test
kubectl port-forward svc/frontend-service 8080:80 -n ticket-booking
# Visit http://localhost:8080

kubectl port-forward svc/backend-service 3000:3000 -n ticket-booking
# Test http://localhost:3000/api/health
```

---

## 📊 Resource Allocation

### **Per Pod Resources**

**Frontend Pod:**
```
Requested: 50m CPU, 100Mi memory
Limited:   200m CPU, 256Mi memory
Replicas:  3
Total:     600m CPU, 768Mi memory
```

**Backend Pod:**
```
Requested: 200m CPU, 200Mi memory
Limited:   500m CPU, 512Mi memory
Replicas:  3
Total:     1.5 CPU, 1.5Gi memory
```

**Database Pod:**
```
Requested: 250m CPU, 256Mi memory
Limited:   1 CPU, 1Gi memory
Replicas:  1
Storage:   10Gi PersistentVolume
Total:     250m CPU, 256Mi memory + 10Gi storage
```

### **Cluster Minimum Requirements**
```
3 nodes (for high availability)
Each node: 2 CPU cores, 4GB RAM

Total cluster: 6 CPU, 12GB RAM

Usage breakdown:
- Frontend:       768Mi  (6%)
- Backend:        1.5Gi  (12%)
- Database:       256Mi  + 10Gi storage (2% RAM)
- Kubernetes:     1-2Gi  (10%)
- Total used:     4.3GB (36%)
- Buffer/headroom: 7.7GB (64%)
```

---

## 🔄 Rolling Update Deployment

### **What is Rolling Update?**

```
Initial: [Pod1:v1] [Pod2:v1] [Pod3:v1]

Step 1: Start new pod
        [Pod1:v1] [Pod2:v1] [Pod3:v1] [Pod4:v2]

Step 2: Remove old pod
        [Pod1:v1] [Pod2:v1] [Pod4:v2]

Step 3: Continue rolling
        [Pod1:v1] [Pod5:v2] [Pod4:v2]

Final:  [Pod6:v2] [Pod5:v2] [Pod4:v2] ✓

Benefits:
✓ Zero downtime
✓ Easy rollback (kubectl rollout undo)
✓ Gradual testing in production
```

### **How to Deploy New Version**

```bash
# 1. Release new version (Phase 5)
./scripts/bump-version.sh patch
git tag -a v0.1.1 -m "Release"
git push origin v0.1.1
# → Docker images built and pushed

# 2. Update image in manifest
kubectl set image deployment/backend \
  backend=YOUR_USERNAME/ticket-booking-backend:v0.1.1 \
  -n ticket-booking

# 3. Monitor rollout
kubectl rollout status deployment/backend -n ticket-booking

# 4. If issues, rollback
kubectl rollout undo deployment/backend -n ticket-booking
```

### **Automatic Rolling Update Configuration**

Current configuration in manifests:
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1        # One extra pod during update
    maxUnavailable: 0  # No pods down (zero downtime)
```

---

## ⚙️ Health Checks

### **Startup Probe**
- **Purpose:** Check if application started
- **Trigger:** Container started
- **Failure:** Container killed and restarted
- **Timeout:** 30 attempts × 10 seconds = 5 minutes

**Configuration:**
```yaml
startupProbe:
  httpGet:
    path: /
    port: http
  failureThreshold: 30  # 30 failures = 300 seconds
  periodSeconds: 10
```

### **Readiness Probe**
- **Purpose:** Check if pod ready to receive traffic
- **Trigger:** On startup and continuously
- **Failure:** Pod removed from load balancer (no traffic sent)
- **Timeout:** 3 failures = pod marked NotReady

**Configuration:**
```yaml
readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3
```

### **Liveness Probe**
- **Purpose:** Check if pod is alive
- **Trigger:** After startup delay, continuously
- **Failure:** Pod killed and new one started
- **Timeout:** 3 failures = pod restarted

**Configuration:**
```yaml
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3
```

### **How to Add Health Endpoint**

In your Node.js backend (if not exists):

```javascript
// Add to index.js
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Health check with database
app.get('/api/health/detailed', async (req, res) => {
  try {
    // Check database connection
    await db.query('SELECT 1');
    res.json({ 
      status: 'healthy',
      database: 'connected'
    });
  } catch (err) {
    res.status(503).json({ 
      status: 'unhealthy',
      error: err.message
    });
  }
});
```

---

## 🔐 Security Considerations

### **Current Implementation**
- ✅ SecurityContext with runAsNonRoot
- ✅ Read-only root filesystem (where possible)
- ✅ Dropped Linux capabilities
- ✅ Secrets for sensitive data
- ✅ Service accounts per component

### **Production Enhancements**
- 🔲 Network Policies (restrict pod-to-pod traffic)
- 🔲 Pod Security Standards (enforce security policies)
- 🔲 RBAC (Role-Based Access Control)
- 🔲 External secret management (Vault)
- 🔲 Image scanning for vulnerabilities
- 🔲 TLS/SSL encryption

### **Example: Network Policy**
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-netpol
  namespace: ticket-booking
spec:
  podSelector:
    matchLabels:
      component: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          component: frontend
  egress:
  - to:
    - podSelector:
        matchLabels:
          component: database
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
```

---

## 📈 Monitoring Integration (Phase 7)

### **Metrics to Monitor**
```
Pod Metrics:
  - cpu_usage
  - memory_usage
  - restart_count
  - uptime

Application Metrics:
  - request_count
  - request_duration
  - error_rate
  - success_rate

Database Metrics:
  - connections
  - queries_per_second
  - replication_lag
  - storage_usage
```

### **Logging Integration**
```
Logs collected from:
  - kubectl logs deployment/backend -n ticket-booking
  - kubectl logs deployment/frontend -n ticket-booking
  - kubectl logs statefulset/mysql -n ticket-booking

Log aggregation (Phase 7):
  - ELK Stack (Elasticsearch, Logstash, Kibana)
  - Prometheus + Loki
  - Cloud provider logs (CloudWatch, Stackdriver, etc.)
```

---

## 🔄 Deployment Workflow (Complete)

```
Phase 5: Release (create v0.1.1)
    ↓
Docker images pushed to registry
    ↓
Phase 6: Deployment (this phase)
    ↓
kubectl apply -f kubernetes/
    ↓
Health checks verify readiness
    ↓
Traffic routed to new version
    ↓
Rolling update completes
    ↓
Phase 7: Monitor (next phase)
    ↓
Prometheus scrapes metrics
    ↓
Grafana displays dashboards
    ↓
Alerts triggered on issues
```

---

## ✅ Deployment Checklist

- [ ] Kubernetes cluster running and accessible
- [ ] kubectl configured and working
- [ ] Docker images in registry (from Phase 5)
- [ ] Update `YOUR_USERNAME` in manifests
- [ ] Create namespace: `kubectl apply -f kubernetes/namespace/`
- [ ] Create ConfigMaps: `kubectl apply -f kubernetes/configmap/`
- [ ] Create Secrets: `kubectl apply -f kubernetes/secrets/`
- [ ] Deploy database: `kubectl apply -f kubernetes/database/`
- [ ] Deploy backend: `kubectl apply -f kubernetes/backend/`
- [ ] Deploy frontend: `kubectl apply -f kubernetes/frontend/`
- [ ] Verify all pods running: `kubectl get pods -n ticket-booking`
- [ ] Test health endpoints
- [ ] Test application functionality
- [ ] Verify logs: `kubectl logs -n ticket-booking`

---

## 🐛 Troubleshooting

### **Pod not starting**
```bash
# Check pod status
kubectl describe pod <pod-name> -n ticket-booking

# Check logs
kubectl logs <pod-name> -n ticket-booking

# Check events
kubectl get events -n ticket-booking --sort-by='.lastTimestamp'
```

### **Health checks failing**
```bash
# Manually test health endpoint
kubectl port-forward svc/backend-service 3000:3000 -n ticket-booking
curl http://localhost:3000/api/health

# Check probe configuration
kubectl get deployment backend -o yaml -n ticket-booking | grep -A 10 readinessProbe
```

### **Database connection issues**
```bash
# Verify database pod
kubectl get statefulset mysql -n ticket-booking

# Check database logs
kubectl logs mysql-0 -n ticket-booking

# Test database connection
kubectl run -it --rm debug --image=mysql:8.0 --restart=Never -- \
  mysql -h mysql-service.ticket-booking -u ticketuser -p ticket_db
```

---

## 📚 Next Steps

### **Immediate**
1. [ ] Update `YOUR_USERNAME` in deployment manifests
2. [ ] Ensure Docker images pushed to Docker Hub (Phase 5)
3. [ ] Create Kubernetes cluster (minikube or cloud)
4. [ ] Apply manifests: `kubectl apply -f kubernetes/`

### **Short-term**
1. [ ] Test rolling updates
2. [ ] Test pod scaling
3. [ ] Verify health checks work correctly
4. [ ] Test failover (kill pod, verify restart)

### **Medium-term (Phase 7)**
1. [ ] Add Prometheus monitoring
2. [ ] Add Grafana dashboards
3. [ ] Set up alerting rules
4. [ ] Implement logging aggregation

### **Long-term (Phase 8)**
1. [ ] Implement HorizontalPodAutoscaler (HPA)
2. [ ] Set up automatic scaling
3. [ ] Implement feedback loops

---

## 📊 Files Created in Phase 6

**Kubernetes Manifests:**
- ✅ kubernetes/namespace/ticket-booking-namespace.yaml
- ✅ kubernetes/configmap/app-config.yaml
- ✅ kubernetes/secrets/database-credentials.yaml
- ✅ kubernetes/backend/backend-deployment.yaml
- ✅ kubernetes/backend/backend-service.yaml
- ✅ kubernetes/frontend/frontend-deployment.yaml
- ✅ kubernetes/frontend/frontend-service.yaml
- ✅ kubernetes/database/mysql-statefulset.yaml
- ✅ kubernetes/database/mysql-init-scripts.yaml

**Documentation:**
- ✅ PHASE_6_OVERVIEW.md (this file)
- ✅ PHASE_6_DEPLOYMENT_GUIDE.md (comprehensive guide)
- ⏳ KUBERNETES_SETUP_GUIDE.md (coming soon)
- ⏳ ROLLING_UPDATES_GUIDE.md (coming soon)
- ⏳ TROUBLESHOOTING_GUIDE.md (coming soon)

---

## 🎉 Phase 6 Progress

**Status:** 🚀 DEPLOYMENT MANIFESTS CREATED

✅ Kubernetes manifests designed and created  
✅ Rolling update strategy configured  
✅ Health checks implemented  
✅ Resource requirements calculated  
✅ Security best practices applied  
⏳ CD pipeline integration (coming)  
⏳ Complete documentation (coming)  

---

**Next:** Create deployment scripts and complete documentation

---
