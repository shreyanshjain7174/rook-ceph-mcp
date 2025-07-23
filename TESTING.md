# Testing the Rook Ceph MCP Server with Docker

## Overview

This document provides comprehensive testing instructions for the Rook Ceph MCP Server in Docker environments, including both HTTP and stdio modes.

## Prerequisites

- Docker and docker-compose installed
- Node.js 18+ (for local testing)
- Access to a Kubernetes cluster with Rook Ceph (for full integration testing)

## Testing Methods

### 1. Local Docker Testing

#### HTTP Mode
```bash
# Build and run HTTP server
docker build -t rook-ceph-mcp:http .
docker run -d -p 3000:3000 --name mcp-http rook-ceph-mcp:http

# Test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/mcp/tools
curl http://localhost:3000/mcp/resources

# Test tool call (requires Kubernetes access)
curl -X POST http://localhost:3000/mcp/call-tool \
  -H "Content-Type: application/json" \
  -d '{"name": "list_clusters", "arguments": {}}'

# Cleanup
docker stop mcp-http && docker rm mcp-http
```

#### Stdio Mode
```bash
# Build and test stdio server
docker build -f Dockerfile.stdio -t rook-ceph-mcp:stdio .

# Test JSON-RPC communication
echo '{"jsonrpc": "2.0", "method": "tools/list", "params": {}, "id": 1}' | \
  docker run -i --rm rook-ceph-mcp:stdio

# Test resource listing
echo '{"jsonrpc": "2.0", "method": "resources/list", "params": {}, "id": 2}' | \
  docker run -i --rm rook-ceph-mcp:stdio
```

### 2. Docker Compose Testing

#### Start Services
```bash
# Start both HTTP and stdio services
docker-compose up -d

# Check service health
docker-compose ps
docker-compose logs rook-ceph-mcp-http
docker-compose logs rook-ceph-mcp-stdio
```

#### Test HTTP Service
```bash
# Health check
curl http://localhost:3000/health

# List available tools
curl http://localhost:3000/mcp/tools | jq '.tools[].name'

# List available resources
curl http://localhost:3000/mcp/resources | jq '.resources[].uri'
```

#### Test Stdio Service
```bash
# Interactive testing
docker-compose exec rook-ceph-mcp-stdio sh

# Send JSON-RPC requests
echo '{"jsonrpc": "2.0", "method": "tools/list", "params": {}, "id": 1}' | \
  docker-compose exec -T rook-ceph-mcp-stdio npm run start:stdio
```

#### Cleanup
```bash
docker-compose down
```

### 3. Registry Deployment Testing

#### Build and Tag for Registry
```bash
# Build images
docker build -t your-registry.com/rook-ceph-mcp:latest .
docker build -f Dockerfile.stdio -t your-registry.com/rook-ceph-mcp:stdio .

# Push to registry
docker push your-registry.com/rook-ceph-mcp:latest
docker push your-registry.com/rook-ceph-mcp:stdio
```

#### Deploy from Registry
```bash
# Pull and run from registry
docker pull your-registry.com/rook-ceph-mcp:latest
docker run -d -p 3000:3000 your-registry.com/rook-ceph-mcp:latest

# Test deployment
curl http://localhost:3000/health
```

### 4. Kubernetes Integration Testing

#### Deploy to Kubernetes
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: rook-ceph-mcp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: rook-ceph-mcp
  template:
    metadata:
      labels:
        app: rook-ceph-mcp
    spec:
      containers:
      - name: mcp-server
        image: rook-ceph-mcp:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: rook-ceph-mcp-service
spec:
  selector:
    app: rook-ceph-mcp
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

```bash
# Deploy
kubectl apply -f deployment.yaml

# Test
kubectl get pods -l app=rook-ceph-mcp
kubectl logs -l app=rook-ceph-mcp

# Port forward for testing
kubectl port-forward service/rook-ceph-mcp-service 3000:80
curl http://localhost:3000/health
```

### 5. MCP Client Integration Testing

#### Claude Desktop Integration
```json
// Add to Claude Desktop config
{
  "mcpServers": {
    "rook-ceph": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "rook-ceph-mcp:stdio"]
    }
  }
}
```

#### HTTP Client Testing
```bash
# Test with a simple MCP HTTP client
curl -X POST http://localhost:3000/mcp/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "list_clusters",
    "arguments": {
      "namespace": "rook-ceph"
    }
  }'
```

## Expected Test Results

### Successful Health Check
```json
{
  "status": "healthy",
  "service": "rook-ceph-mcp-server"
}
```

### Tools List Response
```json
{
  "tools": [
    {
      "name": "list_clusters",
      "description": "List all Ceph clusters in the Kubernetes environment"
    },
    {
      "name": "get_cluster_status",
      "description": "Get the status of a specific Ceph cluster"
    }
    // ... more tools
  ]
}
```

### Resources List Response
```json
{
  "resources": [
    {
      "uri": "rook-ceph://manifests/cluster",
      "name": "Ceph Cluster Manifest Template"
    },
    {
      "uri": "rook-ceph://manifests/blockpool",
      "name": "Ceph Block Pool Manifest Template"
    }
    // ... more resources
  ]
}
```

## Troubleshooting

### Common Issues

1. **Container fails to start**: Check Docker logs for build errors
2. **"Not connected" errors**: Ensure proper MCP protocol initialization
3. **Kubernetes access denied**: Verify kubeconfig mounting and RBAC permissions
4. **Port conflicts**: Use different ports or stop conflicting services

### Debug Commands
```bash
# Check container logs
docker logs [container-id]

# Interactive debugging
docker run -it --rm rook-ceph-mcp:latest sh

# Test without Docker
npm run dev  # HTTP mode
npm run dev:stdio  # stdio mode
```

## Performance Testing

### Load Testing HTTP Mode
```bash
# Using Apache Bench
ab -n 100 -c 10 http://localhost:3000/health

# Using curl loop
for i in {1..10}; do
  curl -s http://localhost:3000/health > /dev/null
  echo "Request $i completed"
done
```

### Memory and CPU Monitoring
```bash
# Monitor resource usage
docker stats [container-id]

# Kubernetes monitoring
kubectl top pods -l app=rook-ceph-mcp
```

This comprehensive testing approach ensures the MCP server works correctly in both Docker environments and registry deployments.