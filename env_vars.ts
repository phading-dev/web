import { CLUSTER_ENV_VARS, ClusterEnvVars } from "@phading/cluster/env_vars";

export interface EnvVars extends ClusterEnvVars {}

export let ENV_VARS = CLUSTER_ENV_VARS;
