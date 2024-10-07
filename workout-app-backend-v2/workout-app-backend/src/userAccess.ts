import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { User } from './data_types/User';

require('dotenv').config();

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const USER_TABLE = process.env.USER_TABLE!;

const userExists = async (
  firstName: string,
  lastName: string,
): Promise<boolean> => {
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
    const result = await docClient.send(new QueryCommand(params));
    return result.Items !== undefined && result.Items.length > 0;
  } catch (error) {
    console.error('Error checking if user exists:', error);
    throw new Error('Error checking if user exists');
  }
};

const addUser = async (firstName: string, lastName: string) => {
  if (await userExists(firstName, lastName)) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'User already exists',
      }),
    };
  }

  const userId = uuidv4();
  const user = new User({
    user_id: userId,
    firstName,
    lastName,
  });

  const params = {
    TableName: USER_TABLE,
    Item: user,
  };

  try {
    await docClient.send(new PutCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'User added successfully',
        userId: userId,
      }),
    };
  } catch (error) {
    const errorMessage = (error as Error).message || 'Unknown error';
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Could not add user',
        details: errorMessage,
      }),
    };
  }
};

export const signUp: APIGatewayProxyHandler = async (event) => {
  const requestBody = JSON.parse(event.body || '{}');
  const firstName = requestBody.firstName;
  const lastName = requestBody.lastName;
  if (!firstName || !lastName) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        error: 'Missing required parameters. firstname = ' + firstName + ' lastname = ' + lastName,
      }),
    };
  }
  return addUser(firstName, lastName);
};
