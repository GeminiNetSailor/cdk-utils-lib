import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

// Nested Stacks
import DeployStack from "./DeployStack";
import ApiCrudRouteStack from './ApiRouteStack';

interface RestAPIRootStackProps extends cdk.StackProps {
  readonly apiGatewaParameter: string;
  readonly branch: string;
}

// TODO: SEPARATE LAYERS INTO HIS HOWN STACK

class ApiGatewayHadlingCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RestAPIRootStackProps) {
    super(scope, `${id}-api-gateway-handing-cdk-stack`, props);

    const existingApiGatewayConfig = cdk.aws_ssm.StringParameter.valueFromLookup(this, props.apiGatewaParameter);
    if (existingApiGatewayConfig.includes('dummy-value-for-') || existingApiGatewayConfig === '') return;

    var layersConfig: { name: string, path: string }[] = scope.node.tryGetContext('layers');
    var apiConfig: { urlPath: string, handlerName: string, module: { name: string, path: string } }[] = scope.node.tryGetContext('api');

    console.log(layersConfig);
    console.log(apiConfig);

    var parsedGatewayConfig:
      { apiGatewayRestApiId: string; apiGatewayRootResourceId: string; }
      = JSON.parse(existingApiGatewayConfig);

    new cdk.CfnOutput(this, 'Using existing Api Gateway', { value: JSON.stringify(parsedGatewayConfig) });

    var apiGatewayIds: { restApiId: string, rootResourceId: string } = {
      restApiId: parsedGatewayConfig.apiGatewayRestApiId,
      rootResourceId: parsedGatewayConfig.apiGatewayRootResourceId
    };

    // ===================================
    // API Gateway
    // ===================================
    const restApi = cdk.aws_apigateway.RestApi.fromRestApiAttributes(this, `${id}-restapi`, {
      ...apiGatewayIds
    });

    // ===================================
    // LAMBDA LAYERS
    // ===================================
    var layers: cdk.aws_lambda.LayerVersion[] = [];

    layersConfig.forEach(layer => {
      layers.push(new cdk.aws_lambda.LayerVersion(this, `${layer.name}-layer`, {
        compatibleRuntimes: [
          cdk.aws_lambda.Runtime.NODEJS_16_X,
          cdk.aws_lambda.Runtime.NODEJS_18_X
        ],
        code: cdk.aws_lambda.Code.fromAsset(path.join(process.cwd(), 'dist/layers', layer.path)),
      }));
    });

    // ===================================
    // API REST ROUTES + Lambda Functions
    // ===================================
    var methods: cdk.aws_apigateway.Method[] = [];

    apiConfig.forEach(a => {
      methods.push(...new ApiCrudRouteStack(this, `restapi-${a.module.name}`, {
        restApiId: restApi.restApiId,
        rootResourceId: restApi.restApiRootResourceId,
        lambdaName: a.module.name,
        handler: a.handlerName,
        lambdaCodeDir: path.join(process.cwd(), 'dist', a.module.path),
        layers
      }).methods);
    });

    // ===================================
    // Deployments
    // ===================================
    new DeployStack(this, id, {
      branch: props.branch,
      restApiId: restApi.restApiId,
      methods,
    });

    // ===================================
    // Outputs
    // ===================================
    new cdk.CfnOutput(this, "Stack Region", {
      value: this.region
    });

    new cdk.CfnOutput(this, 'URL', {
      value: `https://${restApi.restApiId}.execute-api.${this.region}.amazonaws.com/prod/`,
    });

  }
};
export default ApiGatewayHadlingCdkStack;