"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workout = void 0;
const zod_1 = require("zod");
// Define the schema for validation
const workoutSchema = zod_1.z.object({
    workout_id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
});
// Workout class
class Workout {
    constructor(data) {
        const parsedData = workoutSchema.parse(data); // Validate and parse data
        this.workoutId = parsedData.workout_id;
        this.name = parsedData.name;
        this.description = parsedData.description;
    }
}
exports.Workout = Workout;
