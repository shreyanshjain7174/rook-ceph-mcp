#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema, 
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { RookCephClient } from './rook-ceph-client';
import { manifestTemplates } from './templates';

class RookCephMCPServer {
  private server: Server;
  private rookCephClient: RookCephClient;
  private app: express.Application;

  constructor() {
    this.server = new Server(
      {
        name: 'rook-ceph-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.rookCephClient = new RookCephClient();
    this.app = express();
    this.setupMiddleware();
    this.setupRequestHandlers();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRequestHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'list_clusters',
            description: 'List all Ceph clusters in the Kubernetes environment',
            inputSchema: {
              type: 'object',
              properties: {
                namespace: {
                  type: 'string',
                  description: 'Kubernetes namespace (optional)',
                },
              },
            },
          },
          {
            name: 'get_cluster_status',
            description: 'Get the status of a specific Ceph cluster',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the Ceph cluster',
                },
                namespace: {
                  type: 'string',
                  description: 'Kubernetes namespace',
                  default: 'rook-ceph',
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'list_block_pools',
            description: 'List all Ceph block pools',
            inputSchema: {
              type: 'object',
              properties: {
                namespace: {
                  type: 'string',
                  description: 'Kubernetes namespace',
                  default: 'rook-ceph',
                },
              },
            },
          },
          {
            name: 'list_filesystems',
            description: 'List all Ceph filesystems',
            inputSchema: {
              type: 'object',
              properties: {
                namespace: {
                  type: 'string',
                  description: 'Kubernetes namespace',
                  default: 'rook-ceph',
                },
              },
            },
          },
          {
            name: 'list_object_stores',
            description: 'List all Ceph object stores',
            inputSchema: {
              type: 'object',
              properties: {
                namespace: {
                  type: 'string',
                  description: 'Kubernetes namespace',
                  default: 'rook-ceph',
                },
              },
            },
          },
          {
            name: 'create_block_pool',
            description: 'Create a new Ceph block pool',
            inputSchema: {
              type: 'object',
              properties: {
                name: {
                  type: 'string',
                  description: 'Name of the block pool',
                },
                namespace: {
                  type: 'string',
                  description: 'Kubernetes namespace',
                  default: 'rook-ceph',
                },
                replicated: {
                  type: 'object',
                  properties: {
                    size: {
                      type: 'number',
                      description: 'Number of replicas',
                      default: 3,
                    },
                  },
                },
                erasureCoded: {
                  type: 'object',
                  properties: {
                    dataChunks: {
                      type: 'number',
                      description: 'Number of data chunks',
                    },
                    codingChunks: {
                      type: 'number',
                      description: 'Number of coding chunks',
                    },
                  },
                },
              },
              required: ['name'],
            },
          },
          {
            name: 'delete_resource',
            description: 'Delete a Rook Ceph resource',
            inputSchema: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['cluster', 'blockpool', 'filesystem', 'objectstore'],
                  description: 'Type of resource to delete',
                },
                name: {
                  type: 'string',
                  description: 'Name of the resource',
                },
                namespace: {
                  type: 'string',
                  description: 'Kubernetes namespace',
                  default: 'rook-ceph',
                },
              },
              required: ['type', 'name'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_clusters':
            return await this.rookCephClient.listClusters(args?.namespace);
          
          case 'get_cluster_status':
            return await this.rookCephClient.getClusterStatus(args.name, args?.namespace);
          
          case 'list_block_pools':
            return await this.rookCephClient.listBlockPools(args?.namespace);
          
          case 'list_filesystems':
            return await this.rookCephClient.listFilesystems(args?.namespace);
          
          case 'list_object_stores':
            return await this.rookCephClient.listObjectStores(args?.namespace);
          
          case 'create_block_pool':
            return await this.rookCephClient.createBlockPool(args);
          
          case 'delete_resource':
            return await this.rookCephClient.deleteResource(args.type, args.name, args?.namespace);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });

    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'rook-ceph://manifests/cluster',
            name: 'Ceph Cluster Manifest Template',
            description: 'Template for creating a Ceph cluster',
            mimeType: 'application/yaml',
          },
          {
            uri: 'rook-ceph://manifests/block-pool',
            name: 'Block Pool Manifest Template',
            description: 'Template for creating a Ceph block pool',
            mimeType: 'application/yaml',
          },
          {
            uri: 'rook-ceph://manifests/filesystem',
            name: 'Filesystem Manifest Template',
            description: 'Template for creating a Ceph filesystem',
            mimeType: 'application/yaml',
          },
          {
            uri: 'rook-ceph://manifests/object-store',
            name: 'Object Store Manifest Template',
            description: 'Template for creating a Ceph object store',
            mimeType: 'application/yaml',
          },
        ],
      };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request: any) => {
      const { uri } = request.params;
      
      const resourceMap: Record<string, string> = {
        'rook-ceph://manifests/cluster': manifestTemplates.cluster,
        'rook-ceph://manifests/block-pool': manifestTemplates.blockPool,
        'rook-ceph://manifests/filesystem': manifestTemplates.filesystem,
        'rook-ceph://manifests/object-store': manifestTemplates.objectStore,
      };
      
      const content = resourceMap[uri];
      if (!content) {
        throw new Error(`Resource not found: ${uri}`);
      }
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/yaml',
            text: content,
          },
        ],
      };
    });

    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'setup_cluster',
            description: 'Guide for setting up a new Rook Ceph cluster',
            arguments: [
              {
                name: 'cluster_name',
                description: 'Name of the cluster',
                required: true,
              },
              {
                name: 'namespace',
                description: 'Kubernetes namespace',
                required: false,
              },
            ],
          },
          {
            name: 'troubleshoot_cluster',
            description: 'Troubleshooting guide for Ceph cluster issues',
            arguments: [
              {
                name: 'cluster_name',
                description: 'Name of the cluster',
                required: true,
              },
            ],
          },
        ],
      };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request: any) => {
      const { name, arguments: args } = request.params;
      
      switch (name) {
        case 'setup_cluster':
          return {
            description: 'Guide for setting up a new Rook Ceph cluster',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Help me set up a new Rook Ceph cluster named "${args?.cluster_name || 'my-cluster'}" in namespace "${args?.namespace || 'rook-ceph'}". Provide step-by-step instructions including prerequisites, manifest creation, and verification steps.`,
                },
              },
            ],
          };
        
        case 'troubleshoot_cluster':
          return {
            description: 'Troubleshooting guide for Ceph cluster issues',
            messages: [
              {
                role: 'user',
                content: {
                  type: 'text',
                  text: `Help me troubleshoot issues with my Ceph cluster "${args?.cluster_name || 'my-cluster'}". Check the cluster status, common issues, and provide diagnostic steps.`,
                },
              },
            ],
          };
        
        default:
          throw new Error(`Unknown prompt: ${name}`);
      }
    });
  }

  private setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', service: 'rook-ceph-mcp-server' });
    });

    // MCP endpoint for tool calls
    this.app.post('/mcp/call-tool', async (req, res) => {
      try {
        const result = await this.server.request(
          { method: 'tools/call', params: req.body },
          CallToolRequestSchema
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // MCP endpoint for listing tools
    this.app.get('/mcp/tools', async (req, res) => {
      try {
        const result = await this.server.request(
          { method: 'tools/list', params: {} },
          ListToolsRequestSchema
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // MCP endpoint for listing resources
    this.app.get('/mcp/resources', async (req, res) => {
      try {
        const result = await this.server.request(
          { method: 'resources/list', params: {} },
          ListResourcesRequestSchema
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // MCP endpoint for reading resources
    this.app.post('/mcp/read-resource', async (req, res) => {
      try {
        const result = await this.server.request(
          { method: 'resources/read', params: req.body },
          ReadResourceRequestSchema
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // MCP endpoint for listing prompts
    this.app.get('/mcp/prompts', async (req, res) => {
      try {
        const result = await this.server.request(
          { method: 'prompts/list', params: {} },
          ListPromptsRequestSchema
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // MCP endpoint for getting prompts
    this.app.post('/mcp/get-prompt', async (req, res) => {
      try {
        const result = await this.server.request(
          { method: 'prompts/get', params: req.body },
          GetPromptRequestSchema
        );
        res.json(result);
      } catch (error) {
        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });
  }

  public start(port: number = 3000) {
    this.app.listen(port, () => {
      console.log(`Rook Ceph MCP server running on port ${port}`);
    });
  }
}

// Start the server
if (require.main === module) {
  const server = new RookCephMCPServer();
  const port = parseInt(process.env.PORT || '3000');
  server.start(port);
}

export { RookCephMCPServer };