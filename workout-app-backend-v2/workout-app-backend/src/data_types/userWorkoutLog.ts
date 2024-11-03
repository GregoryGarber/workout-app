import { z } from 'zod';

// Define the schema for validation
const userWorkoutLogSchema = z.object({
  log_id: z.string(),
  user_workout_id: z.string(),
  exercise_id: z.string(),
  sets: z.number(),
  reps: z.number(),
  max_weight: z.number(),
});

// Exercise class
export class UserWorkoutLog {
  public log_id: string;
  public user_workout_id: string;
  public exercise_id: string;
  public sets: number;
  public reps: number;
  public max_weight: number;

  constructor(data: any) {
    const parsedData = userWorkoutLogSchema.parse(data); // Validate and parse data
    this.log_id = parsedData.log_id;
    this.user_workout_id = parsedData.user_workout_id;
    this.exercise_id = parsedData.exercise_id;
    this.sets = parsedData.sets;
    this.reps = parsedData.reps;
    this.max_weight = parsedData.max_weight;
  }
}
