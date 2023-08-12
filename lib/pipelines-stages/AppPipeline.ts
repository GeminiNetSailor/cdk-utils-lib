import * as cdk from 'aws-cdk-lib';

import { Construct } from "constructs";
import { ApiGatewayHandlersStack } from '../stacks/ApiGatewayHandlersStack';
import { ApiGatewayStack } from '../stacks/ApiGatewayStack';

interface AppPipelineProps extends cdk.StageProps {
  branch: string;
}

export class AppPipeline extends cdk.Stage {
  constructor(scope: Construct, id: string, props: AppPipelineProps) {
    super(scope, `${id}-STAGE`, props);

    // VPN
    // Databse Stack - Persists
    const apiGatewayStack = new ApiGatewayStack(this, id, { branch: props.branch });
  }
}