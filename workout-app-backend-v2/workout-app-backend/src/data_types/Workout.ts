import { z } from 'zod';

// Define the schema for validation
const workoutSchema = z.object({
  workout_id: z.string(),
  name: z.string(),
  description: z.string(),
});

// Workout class
export class Workout {
  public workoutId: string;
  public name: string;
  public description: string;

  constructor(data: any) {
    const parsedData = workoutSchema.parse(data); // Validate and parse data
    this.workoutId = parsedData.workout_id;
    this.name = parsedData.name;
    this.description = parsedData.description;
  }
}
