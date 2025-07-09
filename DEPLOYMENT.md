# Deployment Guide

This document provides deployment instructions for the Rook Ceph MCP Server across different environments.

## Prerequisites

- Kubernetes cluster (v1.24+)
- kubectl configured with cluster access
- kustomize (v4.0+)
- Node.js 18+ (for MCP server)
- Storage devices/volumes for Ceph OSDs

## Environment-Specific Deployment

### Development Environment

Deploy to development environment with relaxed settings:

```bash
# Apply development configuration
kubectl apply -k dev-kustomization.yaml

# Verify deployment
kubectl get pods -n rook-ceph-dev
kubectl get cephclusters -n rook-ceph-dev
```

**Development Features:**
- Single-node deployment
- Relaxed resource limits
- Debug mode enabled
- Unsafe operations allowed
- Dashboard on port 8080 (HTTP)

### Staging Environment

Deploy to staging environment with production-like settings:

```bash
# Apply staging configuration
kubectl apply -k staging-kustomization.yaml

# Verify deployment
kubectl get pods -n rook-ceph-staging
kubectl get cephclusters -n rook-ceph-staging
```

**Staging Features:**
- Multi-node deployment
- Production-like resource limits
- HTTPS dashboard on port 8443
- Security features enabled
- Performance monitoring

### Production Environment

Deploy to production environment with full enterprise features:

```bash
# Apply production configuration
kubectl apply -k production-kustomization.yaml

# Verify deployment
kubectl get pods -n rook-ceph
kubectl get cephclusters -n rook-ceph
```

**Production Features:**
- High availability setup
- Full security hardening
- Resource quotas and limits
- Audit logging enabled
- Backup and disaster recovery
- Multi-zone deployment

## Branch Strategy

Each environment corresponds to a Git branch:

- `main` - Production Context
- `staging` - Staging Context
- `dev` - Development Context

## Cluster Verification

After deployment, verify cluster health:

```bash
# Check cluster status
kubectl get cephclusters -A

# Check OSD status
kubectl get pods -l app=rook-ceph-osd -A

# Check monitor status
kubectl get pods -l app=rook-ceph-mon -A

# Access dashboard
kubectl port-forward svc/rook-ceph-mgr-dashboard 8443:8443 -n <namespace>
```

## Storage Classes

Each environment provides storage classes:

- Development: `rook-ceph-block-dev`
- Staging: `rook-ceph-block-staging`
- Production: `rook-ceph-block`

## MCP Server Deployment

Run the MCP server for each environment:

```bash
# Development
NODE_ENV=development npm run dev

# Staging
NODE_ENV=staging npm start

# Production
NODE_ENV=production npm start
```

## Monitoring

Each environment includes monitoring stack:

- Prometheus metrics
- Grafana dashboards
- Alert manager
- Service monitors

## Security

Production and staging environments include:

- RBAC policies
- Network policies
- Pod security policies
- Admission controllers

## Troubleshooting

Common issues and solutions:

1. **OSD not starting**: Check device availability
2. **MON not forming quorum**: Verify network connectivity
3. **Dashboard not accessible**: Check service and ingress

## Cleanup

To remove deployments:

```bash
# Development
kubectl delete -k dev-kustomization.yaml

# Staging
kubectl delete -k staging-kustomization.yaml

# Production
kubectl delete -k production-kustomization.yaml
```

## Support

For issues, check:
- Kubernetes cluster logs
- Rook operator logs
- MCP server logs
- Ceph cluster health status