import { Construct } from 'constructs';

import { AppPipeline } from './pipelines-stages/AppPipeline';
import { CdkCICDStack, CdkCICDStackProps } from './stacks/CdkCICDStack';


interface CoreAwsServicesStackProps extends CdkCICDStackProps { }

// ID -> [access-checkout]-core-services

export class CoreAwsServicesStack extends CdkCICDStack {
  constructor(scope: Construct, id: string, props: CoreAwsServicesStackProps) {
    super(scope, `${id}-core-services`, props);

    this.pipeline.addStage(new AppPipeline(this, `${id}-${props.branch}`, { branch: props.branch }));
  };

}
