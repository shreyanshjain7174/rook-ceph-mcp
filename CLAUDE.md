# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Rook Ceph MCP Server** - a Model Context Protocol server that enables AI assistants to manage Rook Ceph storage clusters in Kubernetes environments. The server supports both stdio and HTTP transports and provides tools, resources, and prompts for Ceph storage management.

## Essential Commands

```bash
# Development (with hot reload)
npm run dev              # HTTP server on port 3000
npm run dev:stdio        # stdio MCP server

# Production
npm run build           # Compile TypeScript to dist/
npm start              # HTTP server (production)
npm run start:stdio    # stdio MCP server (production)

# Testing
npm test               # Run Jest test suite

# Build for containers
docker build -t rook-ceph-mcp .
```

## Code Architecture

### Core Components

- **`src/index.ts`**: Main MCP server with stdio transport - implements full MCP protocol with tools, resources, and prompts
- **`src/server.ts`**: HTTP server wrapper around MCP functionality using Express.js
- **`src/rook-ceph-client.ts`**: Kubernetes API client that abstracts all Ceph resource operations  
- **`src/templates.ts`**: Production-ready YAML manifest templates for Ceph resources

### Transport Duality
The server runs in two modes:
- **stdio mode**: Direct MCP client integration (Claude Desktop, etc.)
- **HTTP mode**: REST API wrapper for web-based clients

### MCP Implementation
- **7 Tools**: `list_clusters`, `get_cluster_status`, `list_block_pools`, `list_filesystems`, `list_object_stores`, `create_block_pool`, `delete_resource`
- **4 Resources**: YAML templates accessible via `rook-ceph://manifests/*` URIs
- **2 Prompts**: `setup_cluster` and `troubleshoot_cluster` guides

### Key Technologies
- TypeScript with Node.js 18+
- `@modelcontextprotocol/sdk` v0.5.0 for MCP protocol
- `@kubernetes/client-node` for Kubernetes API access
- Zod for schema validation
- Jest for testing

## Development Guidelines

### Adding New Functionality
- **New Tools**: Add to the tools array in request handlers and implement in `RookCephClient` class
- **New Templates**: Add YAML manifests to `src/templates.ts` 
- **Kubernetes Operations**: Centralize all K8s logic in `src/rook-ceph-client.ts`

### Prerequisites
- Kubernetes cluster with Rook Ceph operator installed
- Valid kubeconfig file for cluster access
- Node.js 18+ and npm

### Testing
- Template validation tests in `test/basic.test.ts`
- Run tests before making changes to templates
- Test both stdio and HTTP modes when adding new tools

### Build Process
- Always run `npm run build` before production deployment
- Compiled JavaScript outputs to `dist/` directory
- TypeScript compilation settings in `tsconfig.json`

## Architecture Notes

### Error Handling
All Kubernetes API errors are wrapped in user-friendly messages via the `RookCephClient`. The client handles missing resources gracefully and provides context-aware error responses.

### Security Model
- Uses standard kubeconfig authentication for Kubernetes access
- No embedded secrets or API keys
- Runs as non-root user (UID 1001) in containers
- Respects Kubernetes RBAC permissions

### Resource Management
Templates in `src/templates.ts` provide production-ready defaults for:
- Ceph clusters with high availability configuration
- Block pools with appropriate replication
- Filesystems with metadata and data pools
- Object stores with gateway configuration

The server exposes these as MCP resources, eliminating the need for users to write complex YAML manifests from scratch.