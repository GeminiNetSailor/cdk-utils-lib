import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  CodeBuildStep,
  CodePipeline,
  CodePipelineSource,
} from 'aws-cdk-lib/pipelines';

import { AppPipeline } from './pipelines-stages/AppPipeline';

export const REPOSITORIES_PROVIDERS = [
  'GITHUB',
  'CODECOMMIT'
] as const;

export type TRepositoryProvider = typeof REPOSITORIES_PROVIDERS[number];

interface CoreAwsServicesStackProps extends cdk.StackProps {
  branch: string;
  repository_provider: TRepositoryProvider;
  repository_name: string;
}

export class CoreAwsServicesStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CoreAwsServicesStackProps) {
    super(scope, `${id}-${props.branch}-core-services-cdk-stack`, props);

    // Output logging
    console.log(process.env.CODEBUILD_SOURCE_VERSION);

    var pipelineNameId = `${id}-${props.branch}-pipeline`;
    const pipeline = new CodePipeline(this, pipelineNameId, {
      pipelineName: pipelineNameId,
      synth: new CodeBuildStep('SynthStep', {
        env: {
          ID: id,
          BRANCH: props.branch,
          CDKAPP_REPOSITORY_PROVIDER: props.repository_provider,
          CDKAPP_REPOSITORY_NAME: props.repository_name,
        },
        input: this.getInput(props.repository_provider, props.repository_name, props.branch),
        installCommands: [
          'git submodule update --init',
          'npm install -g aws-cdk'
        ],
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ]
      })
    });

    // const parameterName = `/${id}`;
    // var stringValue = cdk.aws_ssm.StringParameter.valueFromLookup(this, parameterName);
    // if (!stringValue.includes('dummy-value-for-') && stringValue !== '') {
    //   var value = JSON.parse(stringValue);

    //   if (value['branches'][props.branch] === undefined)
    //     value = {
    //       branches: { ...value['branches'], [props.branch]:  }
    //     }

    //   new cdk.aws_ssm.StringParameter(this, `configurationParams`, {
    //     parameterName,
    //     description: `${id} configuration`,
    //     stringValue: JSON.stringify(value),
    //   });
    // }

    pipeline.addStage(new AppPipeline(this, `${id}-${props.branch}`, { branch: props.branch }));
    // const pipelineAppProd = pipeline.addStage(new PipelineAppProd(this, 'prod'));
    // pipelineAppProd.addPre(new ManualApprovalStep('approval'));
  }

  private getInput(provider: TRepositoryProvider, repoName: string, branch: string): cdk.pipelines.CodePipelineSource {
    switch (provider) {
      case 'GITHUB':
        throw new Error("Unhandle Repo Provider " + provider)
        const githubAccessToken = cdk.SecretValue.secretsManager("GITHUB_ACCESS_TOKEN");
        return CodePipelineSource.gitHub('', 'main', {
          authentication: githubAccessToken,
        });
      case 'CODECOMMIT':
        const codecommitRepo = cdk.aws_codecommit.Repository.fromRepositoryName(
          this,
          'AppRepository',
          repoName,
        );
        return CodePipelineSource.codeCommit(codecommitRepo, branch, {
          codeBuildCloneOutput: true
        });
      default:
        throw new Error("Missing CDKAPP_REPOSITORY env Variable!");
    };
  }
}
