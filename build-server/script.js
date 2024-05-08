import { exec } from "child_process"
import path from "path"
import * as fs from 'fs';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

import mime from "mime-types";

const project_id = "1"

const s3Client = new S3Client({

    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        sessionToken: process.env.AWS_SESSION_TOKEN
    }

});



async function init() {
    console.log("Executing script.js");
    const outDirPath = path.join(__dirname, "output");
    console.log("Build Started ...");
    const p = exec(`cd ${outDirPath} && npm install && npm run build`);


    p.stdout.on('data', (data) => {
        console.log(data.toString());
    })

    p.stdout.on('error', (data) => {
        console.log('Error', data.toString());
    })

    p.on('close', async () => {
        console.log("Build Complete");
        const distFolderPath = path.join(__dirname, "output", "dist");
        const distFolderContents = fs.readdirsync(distFolderPath, { recursive: true });

        console.log("Uploading filepath");
        console.log("distFolderContents", distFolderContents);
        for (const filepath of distFolderContents) {
            if (fs.lstatSync(filepath).isDirectory()) continue;

            const command = new PutObjectCommand({
                Bucket: process.env.S3_BUCKET_NAME,
                Key: `__output/${project_id}/${filepath}`,
                Body: fs.createReadStream(filepath),
                ContentType: mime.lookup(filepath)
            })

            await s3Client.send(command);
            console.log("Uploaded filepath");

        }
    })
}

// function call 
init();
