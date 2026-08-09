export type SystemHealthStatus =
  | "operational"
  | "degraded"
  | "partial_outage"
  | "major_outage";

export type ServiceHealthStatus = "operational" | "degraded" | "down";

export type SystemHealthGroup = "core" | "auth" | "comms" | "media";

export interface SystemHealthService {
  id: string;
  name: string;
  group: SystemHealthGroup;
  status: ServiceHealthStatus;
  latencyMs: number | null;
  detail: string;
  informational?: boolean;
}

export interface SystemHealthMaintenance {
  enabled: boolean;
  message: string;
  updatedAt: string | null;
  updatedByEmail: string | null;
}

export interface SystemHealthInfo {
  appName: string;
  appVersion: string;
  nodeVersion: string;
  platform: string;
  arch: string;
  pid: number;
  processUptimeSec: number;
  processUptimeLabel: string;
  processStartedAt: string;
  memory: {
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    externalMb: number;
  };
}

export interface SystemHealthOperations {
  canToggleMaintenance: boolean;
  canRecycleDatabasePool: boolean;
  canRestartApiProcess: boolean;
  restartNote: string;
  canClearBrowserCache: boolean;
  browserCacheNote: string;
}

export interface SystemHealthReport {
  overall: SystemHealthStatus;
  checkedAt: string;
  environment: {
    nodeEnv: string;
    hosting: string;
    isProduction: boolean;
  };
  counts: {
    operational: number;
    degraded: number;
    down: number;
  };
  services: SystemHealthService[];
  authSignals: {
    activeAdmins: number;
    superAdmins: number;
    securityAccessCount: number;
  };
  secrets: {
    productionReady: boolean;
    missingInProduction: string[];
  };
  maintenance: SystemHealthMaintenance;
  systemInfo: SystemHealthInfo;
  operations: SystemHealthOperations;
  outOfScope: Array<{
    id: string;
    label: string;
    reason: string;
  }>;
}
