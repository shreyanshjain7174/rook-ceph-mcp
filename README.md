# Rook Ceph MCP Server

A Model Context Protocol (MCP) server for managing Rook Ceph storage clusters in Kubernetes environments.

## Features

- **Cluster Management**: List and monitor Ceph clusters
- **Storage Resources**: Manage block pools, filesystems, and object stores
- **Manifest Templates**: Access pre-configured YAML templates for common resources
- **Kubernetes Integration**: Native Kubernetes API integration
- **Troubleshooting**: Built-in prompts for cluster setup and troubleshooting

## Installation

### Local Development (stdio transport)

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the server:
```bash
npm run start:stdio
```

### Cloud Hosting (HTTP transport)

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Start the HTTP server:
```bash
npm start
```

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t rook-ceph-mcp .
```

2. Run the container:
```bash
docker run -p 3000:3000 rook-ceph-mcp
```

## Configuration

The server requires access to a Kubernetes cluster with Rook Ceph installed. It uses the default kubeconfig for authentication.

### Prerequisites

- Kubernetes cluster with Rook Ceph operator installed
- kubectl configured with cluster access
- Node.js 18+ and npm

## Available Tools

### Cluster Operations
- `list_clusters` - List all Ceph clusters
- `get_cluster_status` - Get detailed status of a specific cluster

### Storage Resources
- `list_block_pools` - List all Ceph block pools
- `list_filesystems` - List all Ceph filesystems
- `list_object_stores` - List all Ceph object stores

### Resource Management
- `create_block_pool` - Create a new Ceph block pool
- `delete_resource` - Delete Rook Ceph resources

## Available Resources

The server provides YAML manifest templates for:
- `rook-ceph://manifests/cluster` - Ceph cluster configuration
- `rook-ceph://manifests/block-pool` - Block pool configuration
- `rook-ceph://manifests/filesystem` - Filesystem configuration
- `rook-ceph://manifests/object-store` - Object store configuration

## Available Prompts

- `setup_cluster` - Step-by-step cluster setup guide
- `troubleshoot_cluster` - Cluster troubleshooting assistance

## Example Usage

### List all clusters
```json
{
  "tool": "list_clusters",
  "arguments": {
    "namespace": "rook-ceph"
  }
}
```

### Create a block pool
```json
{
  "tool": "create_block_pool",
  "arguments": {
    "name": "my-pool",
    "namespace": "rook-ceph",
    "replicated": {
      "size": 3
    }
  }
}
```

### Get cluster status
```json
{
  "tool": "get_cluster_status",
  "arguments": {
    "name": "rook-ceph",
    "namespace": "rook-ceph"
  }
}
```

## Repository Structure

Based on the original git repository specification, the project maintains MCP contexts as YAML manifests across different branches:

- `main` - Production Context
- `staging` - Staging Context  
- `dev` - Development Context

Each branch contains:
```
├── cluster-manifests/
│   ├── ceph-cluster.yaml
│   ├── object-store.yaml
│   └── block-pool.yaml
├── apps/
│   ├── rook-operator.yaml
│   ├── monitoring-stack.yaml
│   └── security.yaml
├── kustomization.yaml
└── README.md
```

## API Endpoints (HTTP Mode)

When running in HTTP mode, the server exposes these endpoints:

- `GET /health` - Health check
- `GET /mcp/tools` - List available tools
- `POST /mcp/call-tool` - Execute a tool
- `GET /mcp/resources` - List available resources
- `POST /mcp/read-resource` - Read a resource
- `GET /mcp/prompts` - List available prompts
- `POST /mcp/get-prompt` - Get a prompt

## Development

### Building
```bash
npm run build
```

### Development mode (stdio)
```bash
npm run dev:stdio
```

### Development mode (HTTP)
```bash
npm run dev
```

### Testing
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting prompts built into the server
- Review Rook Ceph documentation
- Submit issues to the project repository

## Security

This server requires Kubernetes cluster access and should be used with appropriate RBAC permissions. Always follow security best practices when deploying in production environments.