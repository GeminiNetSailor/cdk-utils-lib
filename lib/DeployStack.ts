import { NestedStack, NestedStackProps } from "aws-cdk-lib";
import { Deployment, Method, RestApi, Stage } from "aws-cdk-lib/aws-apigateway";
import { Construct } from "constructs";

interface DeployStackProps extends NestedStackProps {
  readonly restApiId: string;
  readonly stage: string;
  readonly methods?: Method[];
}

class DeployStack extends NestedStack {
  constructor(scope: Construct, id: string, props: DeployStackProps) {
    super(scope, `deploy-stack-${props.stage}`, props);

    const deployment = new Deployment(this, 'deployment' + new Date().toISOString(), {
      api: RestApi.fromRestApiId(this, 'rest-api', props.restApiId),
    });

    if (props.methods) {
      for (const method of props.methods) {
        deployment.node.addDependency(method);
      }
    };

    new Stage(this, props.stage, { deployment, stageName: props.stage });
  }
}

export default DeployStack;