"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkoutAndExercises = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const WorkoutExercise_1 = require("./data_types/WorkoutExercise");
const zod_1 = require("zod");
require('dotenv').config();
const client = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
const WORKOUT_TABLE = process.env.WORKOUT_TABLE;
const EXERCISE_TABLE = process.env.EXERCISE_TABLE;
const WORKOUT_EXERCISE_TABLE = process.env.WORKOUT_EXERCISE_TABLE;
async function fetchItem(tableName, key) {
    const params = {
        TableName: tableName,
        Key: key,
    };
    const command = new lib_dynamodb_1.GetCommand(params);
    const { Item } = await docClient.send(command);
    return Item ? Item : null;
}
// Function to get a workout
const getWorkout = async (workoutId) => {
    try {
        const item = await fetchItem(WORKOUT_TABLE, {
            workout_id: workoutId,
        });
        if (!item) {
            throw new Error('Workout not found');
        }
        return item;
    }
    catch (error) {
        throw Error('Fetching workout failed' + error);
    }
};
// Function to get an exercise
const getExercise = async (exerciseId) => {
    try {
        const item = await fetchItem(EXERCISE_TABLE, {
            exercise_id: exerciseId,
        });
        if (!item) {
            throw new Error('Exercise not found');
        }
        return item;
    }
    catch (error) {
        throw Error('Fetching exercise failed ' + error);
    }
};
const getWorkoutExerciseCombination = async (workoutId) => {
    const params = {
        TableName: WORKOUT_EXERCISE_TABLE,
        KeyConditionExpression: 'workout_id = :workout_id',
        ExpressionAttributeValues: {
            ':workout_id': { S: workoutId }, // Wrap the string in an object with S key
        },
    };
    try {
        const command = new client_dynamodb_1.QueryCommand(params);
        const { Items } = await docClient.send(command);
        if (!Items || Items.length === 0) {
            throw new Error('Workout not found');
        }
        // Map the returned items to the Workout type
        return Items.map((item) => {
            return new WorkoutExercise_1.WorkoutExercise({
                workout_id: item.workout_id.S, // Extract the string
                exercise_id: item.exercise_id.S, // Extract the string
                reps: Number(item.reps.N), // Convert string to number
                sets: Number(item.sets.N), // Convert string to number
            });
        });
    }
    catch (error) {
        console.error(error);
        if (error instanceof zod_1.ZodError) {
            throw new Error(`Validation failed: ${error.errors.map((e) => e.message).join(', ')}`);
        }
        throw new Error('Internal Server Error');
    }
};
const getWorkoutAndExercises = async (event) => {
    const workoutId = event.pathParameters?.workoutId;
    if (!workoutId) {
        throw new Error('Missing workoutId');
    }
    const workout = await getWorkout(workoutId);
    const workoutExercises = await getWorkoutExerciseCombination(workoutId);
    const exercises = await Promise.all(workoutExercises.map(async (workoutExercise) => {
        const ex = await getExercise(workoutExercise.exerciseId);
        return {
            name: ex.name,
            description: ex.description,
            reps: workoutExercise.reps,
            sets: workoutExercise.sets,
        };
    }));
    const completeWorkout = {
        workout: workout,
        exercises: exercises,
    };
    return { statusCode: 200, body: JSON.stringify(completeWorkout) };
};
exports.getWorkoutAndExercises = getWorkoutAndExercises;
