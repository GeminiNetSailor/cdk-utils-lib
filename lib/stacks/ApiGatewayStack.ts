import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { RestApi } from 'aws-cdk-lib/aws-apigateway';

interface ApiGatewayStackProps extends cdk.StackProps {
  branch: string;
}

export class ApiGatewayStack extends cdk.Stack {
  restApi: cdk.aws_apigateway.RestApi;
  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, `${id}-api-gateway-cdk-stack`, props);

    // ===================================
    // API Gateway
    // ===================================
    this.restApi = new RestApi(this, `${id}-rest-api`, {
      cloudWatchRole: true,
      deploy: false,
      // 👇 enable CORS
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: ['*'],
      },
    });

    this.restApi.root.addMethod('GET');

    new cdk.CfnOutput(this, 'Rest API Id', { value: this.restApi.restApiId });
    new cdk.CfnOutput(this, 'Rest API root resource Id', { value: this.restApi.restApiRootResourceId });

    new cdk.aws_ssm.StringParameter(this, "ParameterApigateway", {
      parameterName: `/${id}/ApiGateway`,
      description: `${id} ${props.branch} ApiGateway configuration`,
      stringValue: JSON.stringify({
        apiGatewayRestApiId: this.restApi.restApiId,
        apiGatewayRootResourceId: this.restApi.restApiRootResourceId
      }),
    });

  }
}