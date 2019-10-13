/* istanbul ignore next */
if (!process.env.AWS_REGION) {
    process.env.AWS_REGION = 'eu-west-1';
}

/* istanbul ignore next */
if (!process.env.DYNAMODB_ENV) {
    process.env.DYNAMODB_ENV = 'develop';
}
// import * as AWS from "aws-sdk";
const AWS = require('aws-sdk');

// In offline mode, use DynamoDB local server
let DocumentClient = null;
/* istanbul ignore next */
// if (process.env.IS_OFFLINE) {
//     AWS.config.update({
//         region: 'localhost',
//         endpoint: "http://localhost:8000"
//     });
// }
// TODO: AWS SDK is not currently supporting transactions in
// TODO: dynamodb document client i have raised the issue on
// TODO: github a current workaround is just not to use document client
AWS.config.update(
    {
        region:  process.env.AWS_REGION,
        endpoint: 'dynamodb.' +  process.env.AWS_REGION + '.amazonaws.com'
    }
);
DocumentClient = new AWS.DynamoDB.DocumentClient();

const dynamodb = new AWS.DynamoDB();



module.exports = {

    async ping() {
        return envelop({
            pong: new Date(),
            AWS_REGION: process.env.AWS_REGION,
            DYNAMODB_NAMESPACE: process.env.DYNAMODB_NAMESPACE,
        });
    },

    async purgeData() {
        await purgeTable('users', 'username');
        await purgeTable('articles', 'slug');
        await purgeTable('comments', 'id');
        return envelop('Purged all data!');
    },

    getTableName(aName) {
        return `${process.env.DYNAMODB_ENV}-${process.env.DYNAMODB_NAME}-${aName}`;
    },

    envelop,

    tokenSecret: /* istanbul ignore next */ process.env.SECRET ?
        process.env.SECRET : '3ee058420bc2',
    DocumentClient,

};

function envelop(res, statusCode = 200) {
    let body;
    if (statusCode == 200) {
        body = JSON.stringify(res, null, 2);
    } else {
        body = JSON.stringify({ errors: { body: [res] } }, null, 2);
    }
    return {
        statusCode,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true
        },
        body,
    };
}

async function purgeTable(aTable, aKeyName) /* istanbul ignore next */ {
    const tableName = module.exports.getTableName(aTable);

    if (!tableName.includes('develop') && !tableName.includes('test')) {
        console.log(`WARNING: Table name [${tableName}] ` +
            `contains neither dev nor test, not purging`);
        return;
    }

    const allRecords = await DocumentClient
        .scan({ TableName: tableName }).promise();
    const deletePromises = [];
    for (let i = 0; i < allRecords.Items.length; ++i) {
        const recordToDelete = {
            TableName: tableName,
            Key: {},
        };
        recordToDelete.Key[aKeyName] = allRecords.Items[i][aKeyName];
        deletePromises.push(DocumentClient.delete(recordToDelete).promise());
    }
    await Promise.all(deletePromises);
}
