"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserLog = exports.createUserWorkout = exports.getAllWorkoutLogs = exports.getLatestWorkoutLog = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const uuid_1 = require("uuid");
const userWorkout_1 = require("./data_types/userWorkout");
const userWorkoutLog_1 = require("./data_types/userWorkoutLog");
require('dotenv').config();
const client = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const USER_WORKOUT_LOG_TABLE = process.env.USER_WORKOUT_LOG_TABLE;
const USER_WORKOUT_TABLE = process.env.USER_WORKOUT_TABLE;
if (!USER_WORKOUT_LOG_TABLE || !USER_WORKOUT_TABLE) {
    throw new Error('Environment variables for DynamoDB table names are not set');
}
const createErrorResponse = (statusCode, message) => ({
    statusCode,
    body: JSON.stringify({ error: message }),
});
const getUserWorkoutLogs = async (userWorkouts) => {
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
            const command = new client_dynamodb_1.QueryCommand(params);
            return docClient.send(command);
        });
        const results = await Promise.all(queries);
        // Use flatMap to handle multiple query results and safely map over Items
        return results.flatMap(result => {
            const items = result.Items || []; // Default to an empty array if Items is undefined
            return items.map(item => new userWorkoutLog_1.UserWorkoutLog({
                log_id: item.log_id.S,
                user_workout_id: item.user_workout_id.S,
                exercise_id: item.exercise_id.S,
                sets: Number(item.sets.N),
                reps: Number(item.reps.N),
                max_weight: Number(item.max_weight.N),
            }));
        });
    }
    catch (error) {
        console.error('Error fetching user workout logs:', error);
        throw new Error('Failed to fetch user workout logs');
    }
};
const getUserWorkoutsByWorkoutId = async (userId, workoutId) => {
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
        const command = new client_dynamodb_1.QueryCommand(params);
        const { Items } = await docClient.send(command);
        return Items ? Items.map((item) => new userWorkout_1.UserWorkout({
            id: item.id.S,
            user_id: item.user_id.S,
            workout_id: item.workout_id.S,
            date: item.date.S,
        })) : [];
    }
    catch (error) {
        console.error('Error fetching user workouts:', error);
        throw new Error('Failed to fetch user workouts');
    }
};
const getLatestWorkoutLogs = async (userId, workoutId) => {
    const userWorkouts = await getUserWorkoutsByWorkoutId(userId, workoutId);
    if (userWorkouts.length === 0)
        return null;
    userWorkouts.sort((a, b) => {
        const dateA = new Date(a.date); // Convert string to Date object
        const dateB = new Date(b.date); // Convert string to Date object
        return dateB.getTime() - dateA.getTime(); // Sort in descending order
    });
    const latestUserWorkout = userWorkouts[0];
    const userWorkoutLogs = await getUserWorkoutLogs([latestUserWorkout]);
    return userWorkoutLogs.length > 0 ? userWorkoutLogs : null;
};
const getLatestWorkoutLog = async (event) => {
    const userId = event.queryStringParameters?.userId;
    const workoutId = event.queryStringParameters?.workoutId;
    if (!userId)
        return createErrorResponse(400, 'Missing userId');
    if (!workoutId)
        return createErrorResponse(400, 'Missing workoutId');
    try {
        const userWorkoutLogs = await getLatestWorkoutLogs(userId, workoutId);
        if (!userWorkoutLogs)
            return createErrorResponse(404, 'No logs found');
        return {
            statusCode: 200,
            body: JSON.stringify(userWorkoutLogs),
        };
    }
    catch (error) {
        return createErrorResponse(500, 'Error retrieving latest workout log: ' + error);
    }
};
exports.getLatestWorkoutLog = getLatestWorkoutLog;
const getAllWorkoutLogs = async (event) => {
    const userId = event.queryStringParameters?.userId;
    const workoutId = event.queryStringParameters?.workoutId;
    if (!userId)
        return createErrorResponse(400, 'Missing userId');
    if (!workoutId)
        return createErrorResponse(400, 'Missing workoutId');
    try {
        const userWorkouts = await getUserWorkoutsByWorkoutId(userId, workoutId);
        if (userWorkouts.length === 0)
            return createErrorResponse(404, 'No Workouts Found');
        const userWorkoutLogs = await getUserWorkoutLogs(userWorkouts);
        if (userWorkoutLogs.length === 0)
            return createErrorResponse(404, 'No logs found');
        const sortedLogs = {};
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
    }
    catch (error) {
        return createErrorResponse(500, 'Error retrieving all workout logs: ' + error);
    }
};
exports.getAllWorkoutLogs = getAllWorkoutLogs;
const createUserWorkout = async (event) => {
    const requestBody = JSON.parse(event.body || '{}');
    console.log(requestBody);
    const userId = requestBody.userId;
    const workoutId = requestBody.workoutId;
    console.log(userId);
    if (!userId)
        return createErrorResponse(400, 'Missing userId');
    if (!workoutId)
        return createErrorResponse(400, 'Missing workoutId');
    const userWorkout = new userWorkout_1.UserWorkout({
        user_id: userId,
        workout_id: workoutId,
        date: new Date().toISOString(),
        id: (0, uuid_1.v4)(),
    });
    const params = {
        TableName: USER_WORKOUT_TABLE,
        Item: userWorkout,
    };
    try {
        await docClient.send(new lib_dynamodb_1.PutCommand(params));
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'User workout created successfully',
                userWorkout,
            }),
        };
    }
    catch (error) {
        console.error('Error creating user workout:', error);
        return createErrorResponse(500, 'Could not create user workout');
    }
};
exports.createUserWorkout = createUserWorkout;
const createUserLog = async (event) => {
    const requestBody = JSON.parse(event.body || '{}');
    const userId = requestBody.userId;
    const userWorkoutId = requestBody.userWorkoutId;
    const workoutData = requestBody.workoutData;
    if (!userId)
        return createErrorResponse(400, 'Missing userId');
    if (!userWorkoutId)
        return createErrorResponse(400, 'Missing userWorkoutId');
    if (!workoutData)
        return createErrorResponse(400, 'Missing workoutData');
    const userWorkoutLogs = workoutData.map((data) => new userWorkoutLog_1.UserWorkoutLog({
        log_id: (0, uuid_1.v4)(),
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
        await docClient.send(new lib_dynamodb_1.BatchWriteCommand(params));
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'User workout logs created successfully',
                userWorkoutLogs,
            }),
        };
    }
    catch (error) {
        console.error('Error creating user workout logs:', error);
        return createErrorResponse(500, 'Could not create user workout logs');
    }
};
exports.createUserLog = createUserLog;
