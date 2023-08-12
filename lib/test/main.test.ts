import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';

test('SQS Queue and SNS Topic Created', () => {
  const app = new cdk.App();
  // WHEN
  // const stack = new AwsCdk.AwsGraphqlCdkStack(app, 'MyTestStack');
  // THEN

  // const template = Template.fromStack(stack);

  // template.hasResourceProperties('AWS::SQS::Queue', {
  //   VisibilityTimeout: 300
  // });
  // template.resourceCountIs('AWS::SNS::Topic', 1);
});
