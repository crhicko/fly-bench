const S3 = require('aws-sdk/clients/s3')

const s3 = new S3({
    apiVersion: '2006-03-01',
    region: 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET
    }
});

module.exports = s3