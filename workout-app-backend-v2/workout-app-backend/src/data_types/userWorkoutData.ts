import { z } from 'zod';

// Define the schema for validation
const userWorkoutDataSchema = z.object({
  user_workout_id: z.string(),
  exercise_id: z.string(),
  sets: z.number(),
  reps: z.number(),
  max_weight: z.number(),
});

// Exercise class
export class userWorkoutData {
  public user_workout_id: string;
  public exercise_id: string;
  public sets: number;
  public reps: number;
  public max_weight: number;

  constructor(data: any) {
    const parsedData = userWorkoutDataSchema.parse(data); // Validate and parse data
    this.user_workout_id = parsedData.user_workout_id;
    this.exercise_id = parsedData.exercise_id;
    this.sets = parsedData.sets;
    this.reps = parsedData.reps;
    this.max_weight = parsedData.max_weight;
  }
}
