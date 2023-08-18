import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { RestApiStage } from '../pipelines-stages/RestApiStage';

export const REPOSITORIES_PROVIDERS = [
  'GITHUB',
  'CODECOMMIT'
] as const;

export type TRepositoryProvider = typeof REPOSITORIES_PROVIDERS[number];

export interface CdkCICDStackProps extends cdk.StackProps {
  branch: string;
  repository_provider: TRepositoryProvider;
  repository_name: string;
}

export class CdkCICDStack extends cdk.Stack {
  pipeline: cdk.pipelines.CodePipeline;
  constructor(scope: Construct, id: string, props: CdkCICDStackProps) {
    super(scope, `${id}-${props.branch}-cdk-stack`, props);
    this.pipeline = this.getPipeline(id, props.branch, props);
  }

  getPipeline(id: string, branch: string, props: CdkCICDStackProps): cdk.pipelines.CodePipeline {

    var pipelineNameId = `${id}-${branch}-pipeline`;
    return new cdk.pipelines.CodePipeline(this, pipelineNameId, {
      pipelineName: pipelineNameId,
      synth: new cdk.pipelines.CodeBuildStep('SynthStep', {
        env: {
          ID: id,
          CDKAPP_REPOSITORY_PROVIDER: props.repository_provider,
          CDKAPP_REPOSITORY_NAME: props.repository_name,
          BRANCH: props.branch
        },
        input: this.getInput(props.repository_provider, props.repository_name, props.branch),
        installCommands: [
          "git submodule update --init",
          'npm install -g aws-cdk'
        ],
        commands: [
          'npm ci',
          'npm run build',
          'npx cdk synth'
        ]
      })
    });
  };

  private getInput(provider: TRepositoryProvider, repoName: string, branch: string): cdk.pipelines.CodePipelineSource {
    switch (provider) {
      case 'GITHUB':
        throw new Error("Unhandle Repo Provider " + provider)
        const githubAccessToken = cdk.SecretValue.secretsManager("GITHUB_ACCESS_TOKEN");
        return cdk.pipelines.CodePipelineSource.gitHub('', 'main', {
          authentication: githubAccessToken,
        });
      case 'CODECOMMIT':
        const codecommitRepo = cdk.aws_codecommit.Repository.fromRepositoryName(
          this,
          'AppRepository',
          repoName
        );
        return cdk.pipelines.CodePipelineSource.codeCommit(codecommitRepo, branch, {
          codeBuildCloneOutput: true
        });
      default:
        throw new Error("Unknow or unhandled provider, unabled to get repository");
    };
  }
}