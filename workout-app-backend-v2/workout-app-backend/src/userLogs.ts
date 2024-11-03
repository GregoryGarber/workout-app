import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { CommonResponse } from './data_types/common';
import { UserWorkout } from './data_types/userWorkout';
import { UserWorkoutLog } from './data_types/userWorkoutLog';
import { userWorkoutData } from './data_types/userWorkoutData';

require('dotenv').config();

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const USER_WORKOUT_LOG_TABLE = process.env.USER_WORKOUT_LOG_TABLE;
const USER_WORKOUT_TABLE = process.env.USER_WORKOUT_TABLE;

if (!USER_WORKOUT_LOG_TABLE || !USER_WORKOUT_TABLE) {
  throw new Error('Environment variables for DynamoDB table names are not set');
}

const createErrorResponse = (statusCode: number, message: string): CommonResponse => ({
  statusCode,
  body: JSON.stringify({ error: message }),
});

const getUserWorkoutLogs = async (userWorkouts: UserWorkout[]): Promise<UserWorkoutLog[]> => {
  try {
    const userWorkoutIds = userWorkouts.map((userWorkout) => userWorkout.id);
    const queries = userWorkoutIds.map(id => {
      const params = {
        TableName: USER_WORKOUT_LOG_TABLE,
        KeyConditionExpression: 'user_workout_id = :userWorkoutId',
        ExpressionAttributeValues: {
          ':userWorkoutId': { S: id },
        },
      };

      const command = new QueryCommand(params);
      return docClient.send(command);
    });

    const results = await Promise.all(queries);

    // Use flatMap to handle multiple query results and safely map over Items
    return results.flatMap(result => {
      const items = result.Items || []; // Default to an empty array if Items is undefined
      return items.map(item => new UserWorkoutLog({
        log_id: item.log_id.S,
        user_workout_id: item.user_workout_id.S,
        exercise_id: item.exercise_id.S,
        sets: Number(item.sets.N),
        reps: Number(item.reps.N),
        max_weight: Number(item.max_weight.N),
      }));
    });
  } catch (error) {
    console.error('Error fetching user workout logs:', error);
    throw new Error('Failed to fetch user workout logs');
  }
};

const getUserWorkoutsByWorkoutId = async (userId: string, workoutId: string): Promise<UserWorkout[]> => {
  try {
    const params = {
      TableName: USER_WORKOUT_TABLE,
      IndexName: 'workout_id-user_id-index',
      KeyConditionExpression: 'workout_id = :workout_id and user_id = :user_id',
      ExpressionAttributeValues: {
        ':workout_id': { S: workoutId },
        ':user_id': { S: userId },
      },
    };

    const command = new QueryCommand(params);
    const { Items } = await docClient.send(command);

    return Items ? Items.map((item) => new UserWorkout({
      id: item.id.S,
      user_id: item.user_id.S,
      workout_id: item.workout_id.S,
      date: item.date.S,
    })) : [];
  } catch (error) {
    console.error('Error fetching user workouts:', error);
    throw new Error('Failed to fetch user workouts');
  }
};

const getLatestWorkoutLogs = async (userId: string, workoutId: string): Promise<UserWorkoutLog[] | null> => {
  const userWorkouts = await getUserWorkoutsByWorkoutId(userId, workoutId);
  if (userWorkouts.length === 0) return null;

  userWorkouts.sort((a, b) => {
    const dateA = new Date(a.date); // Convert string to Date object
    const dateB = new Date(b.date); // Convert string to Date object
    return dateB.getTime() - dateA.getTime(); // Sort in descending order
  });
  const latestUserWorkout = userWorkouts[0];
  const userWorkoutLogs = await getUserWorkoutLogs([latestUserWorkout]);

  return userWorkoutLogs.length > 0 ? userWorkoutLogs : null;
};

export const getLatestWorkoutLog: APIGatewayProxyHandler = async (event): Promise<CommonResponse> => {
  const userId = event.queryStringParameters?.userId;
  const workoutId = event.queryStringParameters?.workoutId;

  if (!userId) return createErrorResponse(400, 'Missing userId');
  if (!workoutId) return createErrorResponse(400, 'Missing workoutId');

  try {
    const userWorkoutLogs = await getLatestWorkoutLogs(userId, workoutId);
    if (!userWorkoutLogs) return createErrorResponse(404, 'No logs found');

    return {
      statusCode: 200,
      body: JSON.stringify(userWorkoutLogs),
    };
  } catch (error) {
    return createErrorResponse(500, 'Error retrieving latest workout log: ' + error);
  }
};

export const getAllWorkoutLogs: APIGatewayProxyHandler = async (event): Promise<CommonResponse> => {
  const userId = event.queryStringParameters?.userId;
  const workoutId = event.queryStringParameters?.workoutId;

  if (!userId) return createErrorResponse(400, 'Missing userId');
  if (!workoutId) return createErrorResponse(400, 'Missing workoutId');

  try {
    const userWorkouts = await getUserWorkoutsByWorkoutId(userId, workoutId);
    if (userWorkouts.length === 0) return createErrorResponse(404, 'No Workouts Found');

    const userWorkoutLogs = await getUserWorkoutLogs(userWorkouts);
    if (userWorkoutLogs.length === 0) return createErrorResponse(404, 'No logs found');

    const sortedLogs: { [key: string]: UserWorkoutLog[] } = {};
    userWorkoutLogs.forEach((log) => {
      if (!sortedLogs[log.user_workout_id]) {
        sortedLogs[log.user_workout_id] = [];
      }
      sortedLogs[log.user_workout_id].push(log);
    });

    return {
      statusCode: 200,
      body: JSON.stringify(sortedLogs),
    };
  } catch (error) {
    return createErrorResponse(500, 'Error retrieving all workout logs: ' + error);
  }
};

export const createUserWorkout: APIGatewayProxyHandler = async (event): Promise<CommonResponse> => {
  const requestBody = JSON.parse(event.body || '{}');
  console.log(requestBody);
  const userId = requestBody.userId;
  const workoutId = requestBody.workoutId;
  console.log(userId);
  if (!userId) return createErrorResponse(400, 'Missing userId');
  if (!workoutId) return createErrorResponse(400, 'Missing workoutId');

  const userWorkout = new UserWorkout({
    user_id: userId,
    workout_id: workoutId,
    date: new Date().toISOString(),
    id: uuidv4(),
  });

  const params = {
    TableName: USER_WORKOUT_TABLE,
    Item: userWorkout,
  };

  try {
    await docClient.send(new PutCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'User workout created successfully',
        userWorkout,
      }),
    };
  } catch (error) {
    console.error('Error creating user workout:', error);
    return createErrorResponse(500, 'Could not create user workout');
  }
};

export const createUserLog: APIGatewayProxyHandler = async (event): Promise<CommonResponse> => {
  const requestBody = JSON.parse(event.body || '{}');
  const userId = requestBody.userId;
  const userWorkoutId = requestBody.userWorkoutId;
  const workoutData = requestBody.workoutData;

  if (!userId) return createErrorResponse(400, 'Missing userId');
  if (!userWorkoutId) return createErrorResponse(400, 'Missing userWorkoutId');
  if (!workoutData) return createErrorResponse(400, 'Missing workoutData');

  const userWorkoutLogs: UserWorkoutLog[] = workoutData.map((data: userWorkoutData) => new UserWorkoutLog({
    log_id: uuidv4(),
    user_workout_id: userWorkoutId,
    exercise_id: data.exercise_id,
    sets: data.sets,
    reps: data.reps,
    max_weight: data.max_weight,
  }));

  const putRequests = userWorkoutLogs.map(log => ({
    PutRequest: {
      Item: log,
    },
  }));

  const params = {
    RequestItems: {
      [USER_WORKOUT_LOG_TABLE]: putRequests,
    },
  };

  try {
    await docClient.send(new BatchWriteCommand(params));
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'User workout logs created successfully',
        userWorkoutLogs,
      }),
    };
  } catch (error) {
    console.error('Error creating user workout logs:', error);
    return createErrorResponse(500, 'Could not create user workout logs');
  }
};