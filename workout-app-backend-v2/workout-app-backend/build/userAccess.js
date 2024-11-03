"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signIn = exports.signUp = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
const User_1 = require("./data_types/User");
require('dotenv').config();
const client = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const USER_TABLE = process.env.USER_TABLE;
const userExists = async (firstName, lastName) => {
    const params = {
        TableName: USER_TABLE,
        IndexName: 'firstName-lastName-index', // Name of your GSI
        KeyConditionExpression: 'firstName = :firstName and lastName = :lastName',
        ExpressionAttributeValues: {
            ':firstName': { S: firstName }, // Use AttributeValue format
            ':lastName': { S: lastName }, // Use AttributeValue format
        },
    };
    try {
        const result = await docClient.send(new client_dynamodb_1.QueryCommand(params));
        if (result.Items && result.Items.length > 0) {
            const item = result.Items[0];
            const userData = {
                user_id: item.user_id.S,
                firstName: item.firstName.S,
                lastName: item.lastName.S,
            };
            // Validate and create a User instance
            const user = new User_1.User(userData);
            return user;
        }
        return null;
    }
    catch (error) {
        console.error('Error checking if user exists:', error);
        throw new Error('Error checking if user exists');
    }
};
const addUser = async (firstName, lastName) => {
    const existingUser = await userExists(firstName, lastName);
    if (existingUser) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'User already exists',
            }),
        };
    }
    const userId = (0, uuid_1.v4)();
    const user = new User_1.User({
        user_id: userId,
        firstName,
        lastName,
    });
    const params = {
        TableName: USER_TABLE,
        Item: user,
    };
    try {
        await docClient.send(new lib_dynamodb_1.PutCommand(params));
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'User added successfully',
                userId: userId,
            }),
        };
    }
    catch (error) {
        const errorMessage = error.message || 'Unknown error';
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Could not add user',
                details: errorMessage,
            }),
        };
    }
};
const signUp = async (event) => {
    const requestBody = JSON.parse(event.body || '{}');
    const firstName = requestBody.firstName;
    const lastName = requestBody.lastName;
    if (!firstName || !lastName) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'Missing required parameters. firstname = ' +
                    firstName +
                    ' lastname = ' +
                    lastName,
            }),
        };
    }
    return addUser(firstName, lastName);
};
exports.signUp = signUp;
const signIn = async (event) => {
    const requestBody = JSON.parse(event.body || '{}');
    const firstName = requestBody.firstName;
    const lastName = requestBody.lastName;
    if (!firstName || !lastName) {
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: 'Missing required parameters. firstname = ' +
                    firstName +
                    ' lastname = ' +
                    lastName,
            }),
        };
    }
    const user = await userExists(firstName, lastName);
    if (user) {
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'User found',
                userId: user.user_id,
            }),
        };
    }
    else {
        return {
            statusCode: 404,
            body: JSON.stringify({
                error: 'User not found',
            }),
        };
    }
};
exports.signIn = signIn;
