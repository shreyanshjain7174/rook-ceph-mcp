import { manifestTemplates } from '../src/templates';

describe('Rook Ceph MCP Server', () => {
  test('should have all manifest templates', () => {
    expect(manifestTemplates.cluster).toBeDefined();
    expect(manifestTemplates.blockPool).toBeDefined();
    expect(manifestTemplates.filesystem).toBeDefined();
    expect(manifestTemplates.objectStore).toBeDefined();
    
    expect(manifestTemplates.cluster).toContain('apiVersion: ceph.rook.io/v1');
    expect(manifestTemplates.cluster).toContain('kind: CephCluster');
    
    expect(manifestTemplates.blockPool).toContain('apiVersion: ceph.rook.io/v1');
    expect(manifestTemplates.blockPool).toContain('kind: CephBlockPool');
    
    expect(manifestTemplates.filesystem).toContain('apiVersion: ceph.rook.io/v1');
    expect(manifestTemplates.filesystem).toContain('kind: CephFilesystem');
    
    expect(manifestTemplates.objectStore).toContain('apiVersion: ceph.rook.io/v1');
    expect(manifestTemplates.objectStore).toContain('kind: CephObjectStore');
  });
  
  test('should have valid YAML structure in templates', () => {
    const yaml = require('js-yaml');
    
    expect(() => yaml.load(manifestTemplates.cluster)).not.toThrow();
    expect(() => yaml.load(manifestTemplates.blockPool)).not.toThrow();
    expect(() => yaml.load(manifestTemplates.filesystem)).not.toThrow();
    expect(() => yaml.load(manifestTemplates.objectStore)).not.toThrow();
  });
});