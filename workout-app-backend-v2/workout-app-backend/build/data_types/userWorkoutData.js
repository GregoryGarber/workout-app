"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userWorkoutData = void 0;
const zod_1 = require("zod");
// Define the schema for validation
const userWorkoutDataSchema = zod_1.z.object({
    user_workout_id: zod_1.z.string(),
    exercise_id: zod_1.z.string(),
    sets: zod_1.z.number(),
    reps: zod_1.z.number(),
    max_weight: zod_1.z.number(),
});
// Exercise class
class userWorkoutData {
    constructor(data) {
        const parsedData = userWorkoutDataSchema.parse(data); // Validate and parse data
        this.user_workout_id = parsedData.user_workout_id;
        this.exercise_id = parsedData.exercise_id;
        this.sets = parsedData.sets;
        this.reps = parsedData.reps;
        this.max_weight = parsedData.max_weight;
    }
}
exports.userWorkoutData = userWorkoutData;
