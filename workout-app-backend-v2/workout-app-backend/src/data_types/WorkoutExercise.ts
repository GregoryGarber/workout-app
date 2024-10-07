import { z } from 'zod';

// Define the schema for validation
const workoutExerciseSchema = z.object({
  workout_id: z.string(),
  exercise_id: z.string(),
  reps: z.number(),
  sets: z.number(),
});

// Exercise class
export class WorkoutExercise {
  public workoutId: string;
  public exerciseId: string;
  public reps: number;
  public sets: number;

  constructor(data: any) {
    const parsedData = workoutExerciseSchema.parse(data); // Validate and parse data
    this.workoutId = parsedData.workout_id;
    this.exerciseId = parsedData.exercise_id;
    this.reps = parsedData.reps;
    this.sets = parsedData.sets;
  }
}
