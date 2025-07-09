import * as k8s from '@kubernetes/client-node';
import * as yaml from 'js-yaml';

export interface CephCluster {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    cephVersion: {
      image: string;
    };
    dataDirHostPath: string;
    mon: {
      count: number;
      allowMultiplePerNode: boolean;
    };
    mgr: {
      count: number;
    };
    dashboard: {
      enabled: boolean;
    };
    monitoring: {
      enabled: boolean;
    };
    network: {
      provider: string;
    };
    rbdMirroring: {
      workers: number;
    };
    storage: {
      useAllNodes: boolean;
      useAllDevices: boolean;
    };
  };
  status?: {
    phase: string;
    message: string;
    ceph: {
      health: string;
      lastChecked: string;
    };
  };
}

export interface CephBlockPool {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    failureDomain: string;
    replicated?: {
      size: number;
    };
    erasureCoded?: {
      dataChunks: number;
      codingChunks: number;
    };
  };
  status?: {
    phase: string;
  };
}

export interface CephFilesystem {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    metadataPool: {
      replicated: {
        size: number;
      };
    };
    dataPools: Array<{
      replicated: {
        size: number;
      };
    }>;
    metadataServer: {
      activeCount: number;
      activeStandby: boolean;
    };
  };
  status?: {
    phase: string;
  };
}

export interface CephObjectStore {
  metadata: {
    name: string;
    namespace: string;
  };
  spec: {
    metadataPool: {
      replicated: {
        size: number;
      };
    };
    dataPool: {
      replicated: {
        size: number;
      };
    };
    gateway: {
      type: string;
      port: number;
      instances: number;
    };
  };
  status?: {
    phase: string;
  };
}

export class RookCephClient {
  private k8sApi: k8s.CustomObjectsApi;
  private coreV1Api: k8s.CoreV1Api;
  private appsV1Api: k8s.AppsV1Api;

  constructor() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    
    this.k8sApi = kc.makeApiClient(k8s.CustomObjectsApi);
    this.coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
    this.appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
  }

  async listClusters(namespace?: string): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const response = await this.k8sApi.listNamespacedCustomObject(
        'ceph.rook.io',
        'v1',
        namespace || 'rook-ceph',
        'cephclusters'
      );

      const clusters = (response.body as any).items as CephCluster[];
      
      if (clusters.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No Ceph clusters found.',
            },
          ],
        };
      }

      const clusterInfo = clusters.map(cluster => {
        const status = cluster.status ? `(${cluster.status.phase})` : '(Unknown)';
        const health = cluster.status?.ceph?.health || 'Unknown';
        return `- ${cluster.metadata.name} in ${cluster.metadata.namespace} ${status} - Health: ${health}`;
      }).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${clusters.length} Ceph cluster(s):\n${clusterInfo}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list clusters: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getClusterStatus(name: string, namespace: string = 'rook-ceph'): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const response = await this.k8sApi.getNamespacedCustomObject(
        'ceph.rook.io',
        'v1',
        namespace,
        'cephclusters',
        name
      );

      const cluster = response.body as CephCluster;
      
      const statusInfo = [
        `Cluster: ${cluster.metadata.name}`,
        `Namespace: ${cluster.metadata.namespace}`,
        `Phase: ${cluster.status?.phase || 'Unknown'}`,
        `Health: ${cluster.status?.ceph?.health || 'Unknown'}`,
        `Message: ${cluster.status?.message || 'No message'}`,
        `Ceph Version: ${cluster.spec.cephVersion.image}`,
        `Monitor Count: ${cluster.spec.mon.count}`,
        `Manager Count: ${cluster.spec.mgr.count}`,
        `Dashboard Enabled: ${cluster.spec.dashboard.enabled}`,
        `Monitoring Enabled: ${cluster.spec.monitoring.enabled}`,
      ].join('\n');

      return {
        content: [
          {
            type: 'text',
            text: statusInfo,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get cluster status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listBlockPools(namespace: string = 'rook-ceph'): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const response = await this.k8sApi.listNamespacedCustomObject(
        'ceph.rook.io',
        'v1',
        namespace,
        'cephblockpools'
      );

      const blockPools = (response.body as any).items as CephBlockPool[];
      
      if (blockPools.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No Ceph block pools found.',
            },
          ],
        };
      }

      const poolInfo = blockPools.map(pool => {
        const status = pool.status ? `(${pool.status.phase})` : '(Unknown)';
        const replicationInfo = pool.spec.replicated 
          ? `Replicated: ${pool.spec.replicated.size}x`
          : pool.spec.erasureCoded
          ? `Erasure Coded: ${pool.spec.erasureCoded.dataChunks}+${pool.spec.erasureCoded.codingChunks}`
          : 'Unknown';
        return `- ${pool.metadata.name} ${status} - ${replicationInfo}`;
      }).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${blockPools.length} block pool(s):\n${poolInfo}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list block pools: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listFilesystems(namespace: string = 'rook-ceph'): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const response = await this.k8sApi.listNamespacedCustomObject(
        'ceph.rook.io',
        'v1',
        namespace,
        'cephfilesystems'
      );

      const filesystems = (response.body as any).items as CephFilesystem[];
      
      if (filesystems.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No Ceph filesystems found.',
            },
          ],
        };
      }

      const fsInfo = filesystems.map(fs => {
        const status = fs.status ? `(${fs.status.phase})` : '(Unknown)';
        const mdsCount = fs.spec.metadataServer.activeCount;
        return `- ${fs.metadata.name} ${status} - MDS: ${mdsCount}`;
      }).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${filesystems.length} filesystem(s):\n${fsInfo}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list filesystems: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listObjectStores(namespace: string = 'rook-ceph'): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const response = await this.k8sApi.listNamespacedCustomObject(
        'ceph.rook.io',
        'v1',
        namespace,
        'cephobjectstores'
      );

      const objectStores = (response.body as any).items as CephObjectStore[];
      
      if (objectStores.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: 'No Ceph object stores found.',
            },
          ],
        };
      }

      const storeInfo = objectStores.map(store => {
        const status = store.status ? `(${store.status.phase})` : '(Unknown)';
        const gatewayCount = store.spec.gateway.instances;
        return `- ${store.metadata.name} ${status} - Gateway instances: ${gatewayCount}`;
      }).join('\n');

      return {
        content: [
          {
            type: 'text',
            text: `Found ${objectStores.length} object store(s):\n${storeInfo}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list object stores: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createBlockPool(args: any): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const blockPool: CephBlockPool = {
        metadata: {
          name: args.name,
          namespace: args.namespace || 'rook-ceph',
        },
        spec: {
          failureDomain: 'host',
          replicated: args.replicated || { size: 3 },
        },
      };

      if (args.erasureCoded) {
        delete blockPool.spec.replicated;
        blockPool.spec.erasureCoded = args.erasureCoded;
      }

      await this.k8sApi.createNamespacedCustomObject(
        'ceph.rook.io',
        'v1',
        blockPool.metadata.namespace,
        'cephblockpools',
        blockPool
      );

      return {
        content: [
          {
            type: 'text',
            text: `Successfully created block pool: ${args.name}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create block pool: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteResource(type: string, name: string, namespace: string = 'rook-ceph'): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      const resourceMap = {
        cluster: 'cephclusters',
        blockpool: 'cephblockpools',
        filesystem: 'cephfilesystems',
        objectstore: 'cephobjectstores',
      };

      const resourceType = resourceMap[type as keyof typeof resourceMap];
      if (!resourceType) {
        throw new Error(`Unknown resource type: ${type}`);
      }

      await this.k8sApi.deleteNamespacedCustomObject(
        'ceph.rook.io',
        'v1',
        namespace,
        resourceType,
        name
      );

      return {
        content: [
          {
            type: 'text',
            text: `Successfully deleted ${type}: ${name}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to delete resource: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}