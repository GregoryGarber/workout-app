import { z } from 'zod';

// Define the schema for validation
const userSchema = z.object({
  user_id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

// Exercise class
export class User {
  public user_id: string;
  public firstName: string;
  public lastName: string;

  constructor(data: any) {
    const parsedData = userSchema.parse(data); // Validate and parse data
    this.user_id = parsedData.user_id;
    this.firstName = parsedData.firstName;
    this.lastName = parsedData.lastName;
  }
}
