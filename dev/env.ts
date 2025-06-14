import "@phading/cluster/dev/env";
import "../env_const";
import { ENV_VARS } from "../env_vars";

ENV_VARS.replicas = 1;
ENV_VARS.cpu = "200m";
ENV_VARS.memory = "256Mi";
