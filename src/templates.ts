export const manifestTemplates = {
  cluster: `apiVersion: ceph.rook.io/v1
kind: CephCluster
metadata:
  name: rook-ceph
  namespace: rook-ceph
spec:
  cephVersion:
    image: quay.io/ceph/ceph:v18.2.0
  dataDirHostPath: /var/lib/rook
  skipUpgradeChecks: false
  continueUpgradeAfterChecksEvenIfNotHealthy: false
  waitTimeoutForHealthyOSDInMinutes: 10
  mon:
    count: 3
    allowMultiplePerNode: false
  mgr:
    count: 1
    modules:
      - name: pg_autoscaler
        enabled: true
  dashboard:
    enabled: true
    ssl: true
  monitoring:
    enabled: false
  network:
    provider: ""
  rbdMirroring:
    workers: 0
  crashCollector:
    disable: false
  logCollector:
    enabled: true
    periodicity: daily
    maxLogSize: 500M
  cleanupPolicy:
    confirmation: ""
    sanitizeDisks:
      method: quick
      dataSource: zero
      iteration: 1
    allowUninstallWithVolumes: false
  removeOSDsIfOutAndSafeToRemove: false
  storage:
    useAllNodes: true
    useAllDevices: true
    config:
      osdsPerDevice: "1"
  disruptionManagement:
    managePodBudgets: true
    osdMaintenanceTimeout: 30
    pgHealthCheckTimeout: 0
  healthCheck:
    daemonHealth:
      status:
        disabled: false
        interval: 60s
      mon:
        disabled: false
        interval: 45s
      osd:
        disabled: false
        interval: 60s
      mgr:
        disabled: false
        interval: 60s
    livenessProbe:
      mon:
        disabled: false
      mgr:
        disabled: false
      osd:
        disabled: false
  priorityClassNames:
    mon: system-node-critical
    osd: system-node-critical
    mgr: system-cluster-critical
  resources:
    mgr:
      limits:
        cpu: 1000m
        memory: 1Gi
      requests:
        cpu: 500m
        memory: 512Mi
    mon:
      limits:
        cpu: 2000m
        memory: 2Gi
      requests:
        cpu: 1000m
        memory: 1Gi
    osd:
      limits:
        cpu: 2000m
        memory: 4Gi
      requests:
        cpu: 1000m
        memory: 4Gi
    prepareosd:
      limits:
        cpu: 500m
        memory: 400Mi
      requests:
        cpu: 500m
        memory: 50Mi
    mgr-sidecar:
      limits:
        cpu: 500m
        memory: 100Mi
      requests:
        cpu: 100m
        memory: 40Mi
    crashcollector:
      limits:
        cpu: 500m
        memory: 60Mi
      requests:
        cpu: 100m
        memory: 60Mi
    logcollector:
      limits:
        cpu: 500m
        memory: 1Gi
      requests:
        cpu: 100m
        memory: 100Mi
    cleanup:
      limits:
        cpu: 500m
        memory: 1Gi
      requests:
        cpu: 500m
        memory: 100Mi`,

  blockPool: `apiVersion: ceph.rook.io/v1
kind: CephBlockPool
metadata:
  name: replicapool
  namespace: rook-ceph
spec:
  failureDomain: host
  replicated:
    size: 3
    requireSafeReplicaSize: true
  parameters:
    pg_num: "128"
    pgp_num: "128"
  mirroring:
    enabled: false
    mode: image
    snapshotSchedules: []
  statusCheck:
    mirror:
      disabled: false
      interval: 60s
      timeout: 5m
  quotas:
    maxObjects: 1000000
    maxBytes: 1000000000000`,

  filesystem: `apiVersion: ceph.rook.io/v1
kind: CephFilesystem
metadata:
  name: myfs
  namespace: rook-ceph
spec:
  metadataPool:
    replicated:
      size: 3
      requireSafeReplicaSize: true
    parameters:
      pg_num: "32"
      pgp_num: "32"
  dataPools:
    - name: replicated
      replicated:
        size: 3
        requireSafeReplicaSize: true
      parameters:
        pg_num: "128"
        pgp_num: "128"
  preserveFilesystemOnDelete: true
  metadataServer:
    activeCount: 1
    activeStandby: true
    priorityClassName: system-cluster-critical
    placement:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: rook-ceph-mds
    annotations:
      key: value
    labels:
      key: value
    resources:
      limits:
        cpu: 2000m
        memory: 4Gi
      requests:
        cpu: 1000m
        memory: 4Gi
  mirroring:
    enabled: false
    peers:
      secretNames: []
    snapshotSchedules: []
    snapshotRetention: []`,

  objectStore: `apiVersion: ceph.rook.io/v1
kind: CephObjectStore
metadata:
  name: my-store
  namespace: rook-ceph
spec:
  metadataPool:
    failureDomain: host
    replicated:
      size: 3
      requireSafeReplicaSize: true
    parameters:
      pg_num: "32"
      pgp_num: "32"
  dataPool:
    failureDomain: host
    replicated:
      size: 3
      requireSafeReplicaSize: true
    parameters:
      pg_num: "128"
      pgp_num: "128"
  preservePoolsOnDelete: true
  gateway:
    type: s3
    sslCertificateRef: ""
    port: 80
    securePort: 443
    instances: 1
    priorityClassName: system-cluster-critical
    placement:
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: kubernetes.io/hostname
          whenUnsatisfiable: DoNotSchedule
          labelSelector:
            matchLabels:
              app: rook-ceph-rgw
    annotations:
      key: value
    labels:
      key: value
    resources:
      limits:
        cpu: 2000m
        memory: 2Gi
      requests:
        cpu: 1000m
        memory: 1Gi
    caBundleRef: ""
  protocols:
    s3:
      enabled: true
      authUseKeystone: false
    swift:
      enabled: false
      authUseKeystone: false
  healthCheck:
    bucket:
      disabled: false
      interval: 60s
  security:
    kms:
      connectionDetails: {}
      tokenSecretName: ""
    s3:
      connectionDetails: {}
      tokenSecretName: ""
  sharedPools:
    metadataPoolName: ""
    dataPoolName: ""
    preserveRadosNamespaceDataOnDelete: false
  zone:
    name: ""`,
};