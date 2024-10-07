import { z } from 'zod';

// Define the schema for validation
const exerciseSchema = z.object({
  exercise_id: z.string(),
  name: z.string(),
  description: z.string(),
});

// Exercise class
export class Exercise {
  public exerciseId: string;
  public name: string;
  public description: string;

  constructor(data: any) {
    const parsedData = exerciseSchema.parse(data); // Validate and parse data
    this.exerciseId = parsedData.exercise_id;
    this.name = parsedData.name;
    this.description = parsedData.description;
  }
}
