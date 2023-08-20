import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { Deployment, Method, RestApi, Stage } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

interface DeployStackProps extends NestedStackProps {
  readonly restApiId: string;
  readonly branch: string;
  readonly methods?: Method[];
}

class DeployStack extends NestedStack {
  constructor(scope: Construct, id: string, props: DeployStackProps) {
    super(scope, `deploy-stack`, props);

    const deployment = new Deployment(this, 'deploymentID', {
      api: RestApi.fromRestApiId(this, 'rest-api', props.restApiId),
    });

    if (props.methods) {
      for (const method of props.methods) {
        deployment.node.addDependency(method);
      }
    };

    new Stage(this, props.branch, { deployment, stageName: props.branch });
  }
}

export default DeployStack;