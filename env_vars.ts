import { CLUSTER_ENV_VARS, ClusterEnvVars } from "@phading/cluster/env_vars";

export interface EnvVars extends ClusterEnvVars {
  sslCertFile?: string;
  sslKeyFile?: string;
  localCertFile?: string;
  localKeyFile?: string;
  releaseServiceName?: string;
  port?: number;
  builderAccount?: string;
  serviceAccount?: string;
}

export let ENV_VARS: EnvVars = CLUSTER_ENV_VARS;
