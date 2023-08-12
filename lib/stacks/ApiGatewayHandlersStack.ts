import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as ssm from 'aws-cdk-lib/aws-ssm';
import { CodeBuildStep, CodePipeline, CodePipelineSource } from 'aws-cdk-lib/pipelines';

interface ApiGatewayStackProps extends cdk.StackProps { parameterName: string, restApiId: string, restApiRootResourceId: string }

var DEVELOPMENT = false;
export class ApiGatewayHandlersStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiGatewayStackProps) {
    super(scope, id, props);

    // Get latest version or specified version of plain string attribute
    const repositoryName = ssm.StringParameter.valueForStringParameter(this, props.parameterName);      // latest version

    // Get specified version of secure string attribute
    new cdk.CfnOutput(this, 'RepositoryName', { value: repositoryName });
    // new cdk.CfnOutput(this, 'repo name from props', { value: props?.repo });

    const codecommitRepo = cdk.aws_codecommit.Repository.fromRepositoryName(
      this,
      `${id}-repoName`,
      repositoryName // Make this a variable
    );
    // const repo = cdk.aws_codecommit.Repository.fromRepositoryArn(this, "WorkshopRepo", "arn:aws:codecommit:us-east-1:123456789012:MyDemoRepo" );
    const pipelineName = `repositoryName-CdkStackPipeline`;

    // Lambda Functions for the REST API
    const pipeline = new CodePipeline(this, pipelineName, {
      pipelineName,
      selfMutation: false,
      synth: new CodeBuildStep('SynthStep2', {
        env: {
          APP_NAME: repositoryName,
          APIGATEWAY_RESTAPI_ID: props.restApiId,
          APIGATEWAY_ROOTRESOUCE_ID: props.restApiRootResourceId
        },
        input: CodePipelineSource.codeCommit(codecommitRepo, 'dev'),
        installCommands: [
          'npm install -g aws-cdk'
        ],
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ]
      })
    });
  }

}