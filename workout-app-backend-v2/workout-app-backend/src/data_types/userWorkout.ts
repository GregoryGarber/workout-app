import { z } from 'zod';

// Define the schema for validation
const userWorkoutSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  workout_id: z.string(),
  date: z.string(),
});

// Exercise class
export class UserWorkout {
  public id: string;
  public user_id: string;
  public workout_id: string;
  public date: string;

  constructor(data: any) {
    const parsedData = userWorkoutSchema.parse(data); // Validate and parse data
    this.id = parsedData.id;
    this.user_id = parsedData.user_id;
    this.workout_id = parsedData.workout_id;
    this.date = parsedData.date;
  }
}
