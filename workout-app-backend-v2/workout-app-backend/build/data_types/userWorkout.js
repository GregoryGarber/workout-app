"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserWorkout = void 0;
const zod_1 = require("zod");
// Define the schema for validation
const userWorkoutSchema = zod_1.z.object({
    id: zod_1.z.string(),
    user_id: zod_1.z.string(),
    workout_id: zod_1.z.string(),
    date: zod_1.z.string(),
});
// Exercise class
class UserWorkout {
    constructor(data) {
        const parsedData = userWorkoutSchema.parse(data); // Validate and parse data
        this.id = parsedData.id;
        this.user_id = parsedData.user_id;
        this.workout_id = parsedData.workout_id;
        this.date = parsedData.date;
    }
}
exports.UserWorkout = UserWorkout;
