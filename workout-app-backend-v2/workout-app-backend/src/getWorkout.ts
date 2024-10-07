import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { Workout } from './data_types/Workout';
import { Exercise } from './data_types/Exercise';
import { WorkoutExercise } from './data_types/WorkoutExercise';
import { ZodError } from 'zod';
require('dotenv').config();

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const WORKOUT_TABLE = process.env.WORKOUT_TABLE!;
const EXERCISE_TABLE = process.env.EXERCISE_TABLE!;
const WORKOUT_EXERCISE_TABLE = process.env.WORKOUT_EXERCISE_TABLE!;

async function fetchItem<T>(
  tableName: string,
  key: Record<string, unknown>,
): Promise<T | null> {
  const params = {
    TableName: tableName,
    Key: key,
  };

  const command = new GetCommand(params);
  const { Item } = await docClient.send(command);
  return Item ? (Item as T) : null;
}

// Function to get a workout
const getWorkout = async (workoutId: string): Promise<Workout> => {
  try {
    const item = await fetchItem<Workout>(WORKOUT_TABLE, {
      workout_id: workoutId,
    });
    if (!item) {
      throw new Error('Workout not found');
    }
    return item;
  } catch (error) {
    throw Error('Fetching workout failed' + error);
  }
};

// Function to get an exercise
const getExercise = async (exerciseId: string): Promise<Exercise> => {
  try {
    const item = await fetchItem<Exercise>(EXERCISE_TABLE, {
      exercise_id: exerciseId,
    });
    if (!item) {
      throw new Error('Exercise not found');
    }
    return item;
  } catch (error) {
    throw Error('Fetching exercise failed ' + error);
  }
};

const getWorkoutExerciseCombination = async (
  workoutId: string,
): Promise<WorkoutExercise[]> => {
  const params = {
    TableName: WORKOUT_EXERCISE_TABLE,
    KeyConditionExpression: 'workout_id = :workout_id',
    ExpressionAttributeValues: {
      ':workout_id': { S: workoutId }, // Wrap the string in an object with S key
    },
  };

  try {
    const command = new QueryCommand(params);
    const { Items } = await docClient.send(command);

    if (!Items || Items.length === 0) {
      throw new Error('Workout not found');
    }

    // Map the returned items to the Workout type
    return Items.map((item) => {
        return new WorkoutExercise({
          workout_id: item.workout_id.S, // Extract the string
          exercise_id: item.exercise_id.S, // Extract the string
          reps: Number(item.reps.N), // Convert string to number
          sets: Number(item.sets.N), // Convert string to number
        });
      });
  } catch (error) {
    console.error(error);
    if (error instanceof ZodError) {
      throw new Error(
        `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`,
      );
    }
    throw new Error('Internal Server Error');
  }
};

export const getWorkoutAndExercises: APIGatewayProxyHandler = async (event) => {
  const workoutId = event.pathParameters?.workoutId;
  if (!workoutId) {
    throw new Error('Missing workoutId');
  }
  const workout = await getWorkout(workoutId);
  const workoutExercises = await getWorkoutExerciseCombination(workoutId);
  const exercises = await Promise.all(
    workoutExercises.map(async (workoutExercise) => {
      const ex =  await getExercise(workoutExercise.exerciseId);
      return { name: ex.name, description: ex.description, reps: workoutExercise.reps, sets: workoutExercise.sets };
    }),
  );
  const completeWorkout = {
    workout: workout,
    exercises: exercises,
  };
  return { statusCode: 200, body: JSON.stringify(completeWorkout) };
};
