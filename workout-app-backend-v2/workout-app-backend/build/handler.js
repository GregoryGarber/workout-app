"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.getUser = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const client = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const USERS_TABLE = process.env.USERS_TABLE;
const getUser = async (event) => {
    const userId = event.pathParameters?.userId;
    if (!userId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing userId' }),
        };
    }
    const params = {
        TableName: USERS_TABLE,
        Key: { userId },
    };
    try {
        const command = new lib_dynamodb_1.GetCommand(params);
        const { Item } = await docClient.send(command);
        if (Item) {
            return { statusCode: 200, body: JSON.stringify(Item) };
        }
        else {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'User not found' }),
            };
        }
    }
    catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
exports.getUser = getUser;
const createUser = async (event) => {
    const { userId, name } = JSON.parse(event.body || '{}');
    if (typeof userId !== 'string' || typeof name !== 'string') {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: '"userId" and "name" must be strings' }),
        };
    }
    const params = {
        TableName: USERS_TABLE,
        Item: { userId, name },
    };
    try {
        const command = new lib_dynamodb_1.PutCommand(params);
        await docClient.send(command);
        return { statusCode: 201, body: JSON.stringify({ userId, name }) };
    }
    catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Could not create user' }),
        };
    }
};
exports.createUser = createUser;
