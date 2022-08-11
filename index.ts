import { InlineProgramArgs, LocalWorkspace } from "@pulumi/pulumi/automation";
import { ECRRepo } from "./ecr";

const process = require('process');

const args = process.argv.slice(2);
let destroy = false;
if (args.length > 0 && args[0]) {
    destroy = args[0] === "destroy";
}

const run = async () => {
    // This is our pulumi program in "inline function" form
    const pulumiProgram = async () => {
        // Create a bucket and expose a website index document
        let repo = new ECRRepo("my-repo", {
            numberOfDaysPublished: 14 
        });

        return {
            lifeCyclePolicy: repo.lifeCyclePolicy,
            url: repo.repoUrl
        };
    };

    // Create our stack 
    const args: InlineProgramArgs = {
        stackName: "dev",
        projectName: "inlineNode",
        program: pulumiProgram
    };

    // create (or select if one already exists) a stack that uses our inline program
    const stack = await LocalWorkspace.createOrSelectStack(args);

    console.info("successfully initialized stack");
    console.info("installing plugins...");
    await stack.workspace.installPlugin("aws", "v5.10.0");
    console.info("plugins installed");
    console.info("setting up config");
    await stack.setConfig("aws:region", { value: "eu-west-1" });
    console.info("config set");
    //console.info("refreshing stack...");
    //await stack.refresh({ onOutput: console.info });
    //console.info("refresh complete");

    if (destroy) {
        console.info("destroying stack...");
        await stack.destroy({ onOutput: console.info });
        console.info("stack destroy complete");
        process.exit(0);
    }

    console.info("updating stack...");
    const upRes = await stack.up({onOutput: console.log})
    console.log(`update summary: \n${JSON.stringify(upRes.summary.resourceChanges, null, 4)}`);

    let policy = JSON.parse(JSON.stringify(upRes.outputs.lifeCyclePolicy.value));
    //console.log(`lifecyclepolicy: ${JSON.stringify(policy)}`);

    console.log(`id: ${policy.id}`);
    console.log(`rules: ${JSON.parse(JSON.stringify(JSON.parse(policy.policy))).rules[0].selection.countNumber}`)
};

run().catch(err => console.log(err));