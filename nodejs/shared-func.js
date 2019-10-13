const Util = require('./util');
const clauseTable = Util.getTableName('clause');
const documentTable = Util.getTableName('document');
const userTable = Util.getTableName('user');
const pageTable = Util.getTableName('page');
const componentsTable = Util.getTableName('components');
const uuidv4 = require('uuid/v4');
const jwt = require('jsonwebtoken');

module.exports = {
    getClauseById(aUserId, id) {
        return Util.DocumentClient.query(
            {
                TableName: clauseTable,
                IndexName: 'userIdIndex',
                KeyConditionExpression: 'userId = :userId and disabled = :disabled',
                FilterExpression: '#id = :id',
                ExpressionAttributeValues: {
                    ':userId': aUserId,
                    ':id': id,
                    ':disabled': false
                },
                ExpressionAttributeNames: {
                    "#id": "id",
                    "#disabled": "disabled"
                }
            }
        ).promise();
    },
    getClausesByUser(aUserId) {
        return Util.DocumentClient.query(
            {
                TableName: clauseTable,
                IndexName: 'userIdIndex',
                KeyConditionExpression: '#userId = :userId',
                FilterExpression: '#disabled = :disabled',
                ExpressionAttributeValues: {
                    ':userId': aUserId,
                    ':disabled': false
                },
                ExpressionAttributeNames: {
                    "#userId": "userId",
                    "#disabled": "disabled"
                },
                Select: 'ALL_ATTRIBUTES',
            }
        ).promise();
    },
    getDocumentById(aUserId, id) {
        return Util.DocumentClient.query(
            {
                TableName: documentTable,
                IndexName: 'userIdIndex',
                KeyConditionExpression: 'userId = :userId and disabled = :disabled',
                FilterExpression: '#id = :id',
                ExpressionAttributeValues: {
                    ':userId': aUserId,
                    ':id': id,
                    ':disabled': false
                },
                ExpressionAttributeNames: {
                    "#id": "id",
                    "#disabled": "disabled"
                }
            }
        ).promise();
    },
    getDocumentsByUser(aUserId) {
        return Util.DocumentClient.query(
            {
                TableName: documentTable,
                IndexName: 'userIdIndex',
                KeyConditionExpression: '#userId = :userId',
                FilterExpression: '#disabled = :disabled',
                ExpressionAttributeValues: {
                    ':userId': aUserId,
                    ':disabled': false
                },
                ExpressionAttributeNames: {
                    "#userId": "userId",
                    "#disabled": "disabled"
                },
                Select: 'ALL_ATTRIBUTES',
            }
        ).promise();
    },
    getUserByUsername(aUsername) {
        return Util.DocumentClient.query({
            TableName: userTable,
            IndexName: 'usernameIndex',
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: {
                ':username': aUsername,
            },
            Select: 'ALL_ATTRIBUTES',
        }).promise();
    },
    async authenticateAndGetUser(event) {
        try {
            const token = this.getTokenFromEvent(event);
            console.log('token is', token)
            const decoded = jwt.decode(token);
            console.log('decoded', decoded)
            // const username = decoded.username;
            const username = decoded.email;
            console.log('username', username)

            const authenticatedUser = await this.getUserByUsername(username);
            console.log('find a user', authenticatedUser)
            return authenticatedUser.Items[0];
        } catch (err) {
            return null;
        }
    },
    generateId(){
        return uuidv4()
    },
    getTokenFromEvent(event) {
        return event.headers.Authorization;
    }
};
