import { Construct } from "constructs";
import {
  NestedStack,
  NestedStackProps,
  aws_apigateway,
  aws_lambda
} from "aws-cdk-lib";

import { Method, RestApi } from "aws-cdk-lib/aws-apigateway";
import { LayerVersion } from "aws-cdk-lib/aws-lambda";

interface ApiCrudRouteStackProps extends NestedStackProps {
  restApiId: string;
  rootResourceId: string;

  lambdaName: string;
  lambdaCodeDir: string;

  layers: LayerVersion[];
};

const LAMBDA_SUFFIX = "-fnHandler";
const HANDLER_FN = 'main.handler';

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

class ApiCrudRouteStack extends NestedStack {
  public readonly methods: Method[] = [];

  constructor(scope: Construct, id: string, props: ApiCrudRouteStackProps) {
    super(scope, id, props);
    console.log(props)
    const api = RestApi.fromRestApiAttributes(this, 'rest-api', {
      restApiId: props.restApiId,
      rootResourceId: props.rootResourceId,
    });

    var route = api.root.addResource(props.lambdaName);

    var code = aws_lambda.Code.fromAsset(props.lambdaCodeDir);

    const lambda_fn_handler = new aws_lambda.Function(this, `${props.lambdaName}-fn-handler`, {
      functionName: props.lambdaName + LAMBDA_SUFFIX,
      runtime: aws_lambda.Runtime.NODEJS_18_X,
      handler: HANDLER_FN,
      code,
      layers: props.layers
    });

    METHODS.forEach(method_type => {
      const api_gateway_method = route.addMethod(method_type,
        new aws_apigateway.LambdaIntegration(lambda_fn_handler, { proxy: true })
      );

      this.methods.push(api_gateway_method);
    });
  }
}

export default ApiCrudRouteStack;