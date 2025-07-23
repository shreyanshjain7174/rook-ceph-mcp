#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema, 
  ListToolsRequestSchema, 
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema
} from '@modelcontextprotocol/sdk/types.js';
import { RookCephClient } from './rook-ceph-client.js';
import { manifestTemplates } from './templates.js';

const server = new Server(
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

const rookCephClient = new RookCephClient();

server.setRequestHandler(ListToolsRequestSchema, async () => {
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

server.setRequestHandler(CallToolRequestSchema, async (request: any) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_clusters':
        return await rookCephClient.listClusters(args?.namespace);
      
      case 'get_cluster_status':
        return await rookCephClient.getClusterStatus(args.name, args?.namespace);
      
      case 'list_block_pools':
        return await rookCephClient.listBlockPools(args?.namespace);
      
      case 'list_filesystems':
        return await rookCephClient.listFilesystems(args?.namespace);
      
      case 'list_object_stores':
        return await rookCephClient.listObjectStores(args?.namespace);
      
      case 'create_block_pool':
        return await rookCephClient.createBlockPool(args);
      
      case 'delete_resource':
        return await rookCephClient.deleteResource(args.type, args.name, args?.namespace);
      
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

server.setRequestHandler(ListResourcesRequestSchema, async () => {
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

server.setRequestHandler(ReadResourceRequestSchema, async (request: any) => {
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

server.setRequestHandler(ListPromptsRequestSchema, async () => {
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

server.setRequestHandler(GetPromptRequestSchema, async (request: any) => {
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Rook Ceph MCP server running on stdio');
}

main().catch(console.error);