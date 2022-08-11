import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface ECRRepoArgs {
    numberOfDaysPublished: number
}

export class ECRRepo extends pulumi.ComponentResource {
    public readonly repoUrl: pulumi.Output<string>;
    public readonly lifeCyclePolicy: aws.ecr.LifecyclePolicy;
    constructor(name: string, args: ECRRepoArgs, opts?: pulumi.ComponentResourceOptions) {
        super("myecr", name, opts);

        const repo = new aws.ecr.Repository(`${name}-repo`);

        const lifecyclePolicy = new aws.ecr.LifecyclePolicy(`${name}-lifecyclepolicy`, {
            repository: repo.name,
            policy: {
                "rules": [
                    {
                        "rulePriority": 1,
                        "description": "Expire images older than 14 days",
                        "selection": {
                            "tagStatus": "untagged",
                            "countType": "sinceImagePushed",
                            "countUnit": "days",
                            "countNumber": args.numberOfDaysPublished
                        },
                        "action": {
                            "type": "expire"
                        }
                    }
                ]
            },
        })

        this.lifeCyclePolicy = lifecyclePolicy;
        this.repoUrl = repo.repositoryUrl;

        this.registerOutputs({
            repoUrl: this.repoUrl,
            lifeCyclePolicy: this.lifeCyclePolicy
        });
    }
}