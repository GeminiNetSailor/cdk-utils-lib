import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { RestApiStage } from './pipelines-stages/RestApiStage';
import { CdkCICDStack, CdkCICDStackProps } from './stacks/CdkCICDStack';

interface CoreCdkStackProps extends CdkCICDStackProps { }

export class CoreCdkStack extends CdkCICDStack {
  constructor(scope: Construct, id: string, props: CoreCdkStackProps) {
    super(scope, `${id}-web-api`, props);
    this.pipeline.addStage(new RestApiStage(this, id, { branch: props.branch }));
  }
}