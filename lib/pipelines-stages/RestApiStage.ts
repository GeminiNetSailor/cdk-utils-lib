import * as cdk from 'aws-cdk-lib';

import { Construct } from "constructs";
import ApiGatewayHadlingCdkStack from '../ApiGatewayHadlingCdkStack';

const API_GATEWAY_KEY = 'ApiGateway';

const APP_BRANCHES = {
  PRODUCTION: 'main',
  DEVELOPMENT: 'dev'
};

interface PipelineAppDevProps extends cdk.StageProps {
  id: string;
  branch: string;
}

export class RestApiStage extends cdk.Stage {

  constructor(scope: Construct, id: string, props: PipelineAppDevProps) {
    super(scope, id, props);

    // const apiGatewayStack = new ApiGatewayStack(this, id, {
    //   branch: props.branch,
    //   env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
    // });

    // Using only prod with the prod app, everything else is going to be using dev enviroment
    var app_id = (props.branch === 'main')
      ? props.id + '-' + APP_BRANCHES.PRODUCTION
      : props.id + '-' + APP_BRANCHES.DEVELOPMENT;

    const apiGatewayLambdaProviderStack = new ApiGatewayHadlingCdkStack(this,
      `${props.id}-${props.branch}-api-gateway-handing-cdk-stack`,
      {
        env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
        apiGatewaParameter: `/${app_id}/${API_GATEWAY_KEY}`,
        branch: props.branch
      });
  }
}