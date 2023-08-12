import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';


export interface LambdasAPIStackProps extends cdk.StackProps {
  projectRootPath: string
  vpcId: string
}

const BASE_PREFIX = 'graphqlapi';

export class RestApiCdkStack extends cdk.Stack {
  public readonly vpc: cdk.aws_ec2.IVpc;
  public readonly api: cdk.aws_apigateway.RestApi;

  constructor(scope: Construct, id: string, props: LambdasAPIStackProps) {
    super(scope, id, props);

    console.log('StackName 👉', cdk.Stack.of(this).stackName);
    console.log('StackName Param 👉', cdk.Aws.STACK_NAME);
    console.log('Project Root 👉', props.projectRootPath);

    // TEMP
    const hostedZoneId = '';
    const domain = '';
    const certificateArn = '';

    // Get existing VPC
    this.vpc = cdk.aws_ec2.Vpc.fromLookup(this, 'existing-vpc', {
      vpcId: props.vpcId
    });

    console.log('vpcId 👉 ', this.vpc.vpcId);
    console.log('vpcCidrBlock 👉 ', this.vpc.vpcCidrBlock);

    //Domain Configuration
    if (process.env.DEPLOYMENT_ENV != null) {
      // var domainOptions: appsync.DomainOptions | undefined;
      // const myHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      //   hostedZoneId: hostedZoneId,
      //   zoneName: domain
      // });

      // var subDomain = (process.env.DEPLOYMENT_ENV === 'prod')
      //   ? BASE_PREFIX
      //   : BASE_PREFIX + process.env.DEPLOYMENT_ENV;

      // const domainName = subDomain + "." + myHostedZone.zoneName;

      // console.log('Domain Name 👉 ', domainName);

      // const certificate = acm.Certificate.fromCertificateArn(this, 'cert', certificateArn);

      // console.log('Certificate 👉', certificate);

      // domainOptions = {
      //   certificate,
      //   domainName,
      // }
    }

    this.api = new apigateway.RestApi(this, 'api', {
      description: 'example api gateway',
    
    });
    new cdk.CfnOutput(this, 'apiUrl', { value: this.api.url });
  }
}
