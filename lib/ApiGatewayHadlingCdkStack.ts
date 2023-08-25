import * as path from "path";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Deployment, Method, RestApi, Stage } from "aws-cdk-lib/aws-apigateway";
// Nested Stacks
import DeployStack from "./DeployStack";
import ApiCrudRouteStack from './ApiRouteStack';

interface RestAPIRootStackProps extends cdk.StackProps {
  readonly apiGatewaParameter: string;
  readonly branch: string;
}

// TODO: SEPARATE LAYERS INTO HIS HOWN STACK
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

class ApiGatewayHadlingCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: RestAPIRootStackProps) {
    super(scope, `${id}-api-gateway-handing-cdk-stack`, props);

    const existingApiGatewayConfig = cdk.aws_ssm.StringParameter.valueFromLookup(this, props.apiGatewaParameter);
    if (existingApiGatewayConfig.includes('dummy-value-for-') || existingApiGatewayConfig === '') return;

    var layersConfig: { name: string, path: string }[] = scope.node.tryGetContext('layers');
    var apiConfig: { urlPath: string, handlerName: string, module: { name: string, path: string } }[] = scope.node.tryGetContext('api');

    var parsedGatewayConfig:
      { apiGatewayRestApiId: string; apiGatewayRootResourceId: string; stages?: string[] }
      = JSON.parse(existingApiGatewayConfig);

    if (parsedGatewayConfig.stages === undefined) parsedGatewayConfig.stages = [props.branch]
    // if (!parsedGatewayConfig.stages.includes(props.branch)) 


    new cdk.CfnOutput(this, 'Using existing Api Gateway', { value: JSON.stringify(parsedGatewayConfig) });

    var apiGatewayIds: { restApiId: string, rootResourceId: string } = {
      restApiId: parsedGatewayConfig.apiGatewayRestApiId,
      rootResourceId: parsedGatewayConfig.apiGatewayRootResourceId
    };

    // ===================================
    // API Gateway
    // ===================================
    const api = cdk.aws_apigateway.RestApi.fromRestApiAttributes(this, `${id}-restapi`, {
      ...apiGatewayIds
    });

    // ===================================
    // LAMBDA LAYERS
    // ===================================
    var layers: cdk.aws_lambda.LayerVersion[] = [];

    // layersConfig.forEach(layer => {
    //   layers.push(new cdk.aws_lambda.LayerVersion(this, `${layer.name}-layer`, {
    //     compatibleRuntimes: [
    //       cdk.aws_lambda.Runtime.NODEJS_16_X,
    //       cdk.aws_lambda.Runtime.NODEJS_18_X
    //     ],
    //     code: cdk.aws_lambda.Code.fromAsset(path.join(process.cwd(), 'dist/layers', layer.path)),
    //   }));
    // });

    // ===================================
    // API REST ROUTES + Lambda Functions
    // ===================================
    var methods: cdk.aws_apigateway.Method[] = [];

    apiConfig.forEach(a => {
      var route = api.root.addResource(a.module.name);
      var code = cdk.aws_lambda.Code.fromAsset(path.join(process.cwd(), 'dist', a.module.path));

      const lambda_fn_handler = new cdk.aws_lambda.Function(this, `${a.module.name}-fn-handler`, {
        functionName: a.module.name + "-fnHandler",
        runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
        handler: a.handlerName,
        code,
        layers
      });

      METHODS.forEach(method_type => {
        const api_gateway_method = route.addMethod(method_type,
          new cdk.aws_apigateway.LambdaIntegration(lambda_fn_handler, { proxy: true })
        );

        methods.push(api_gateway_method);
      });
    });

    // ===================================
    // Deployments
    // ===================================
    const deployment = new Deployment(this, 'deployment' + new Date().toISOString(), {
      api,
    });

    if (methods) {
      for (const method of methods) {
        deployment.node.addDependency(method);
      }
    };

    new Stage(this, id + props.branch, { deployment, stageName: props.branch });

    // ===================================
    // Outputs
    // ===================================
    new cdk.CfnOutput(this, "Stack Region", {
      value: this.region
    });

    new cdk.CfnOutput(this, 'URL', {
      value: `https://${api.restApiId}.execute-api.${this.region}.amazonaws.com/prod/`,
    });

  }
};
export default ApiGatewayHadlingCdkStack;