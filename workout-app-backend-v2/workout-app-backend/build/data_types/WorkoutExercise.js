"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutExercise = void 0;
const zod_1 = require("zod");
// Define the schema for validation
const workoutExerciseSchema = zod_1.z.object({
    workout_id: zod_1.z.string(),
    exercise_id: zod_1.z.string(),
    reps: zod_1.z.number(),
    sets: zod_1.z.number(),
});
// Exercise class
class WorkoutExercise {
    constructor(data) {
        const parsedData = workoutExerciseSchema.parse(data); // Validate and parse data
        this.workoutId = parsedData.workout_id;
        this.exerciseId = parsedData.exercise_id;
        this.reps = parsedData.reps;
        this.sets = parsedData.sets;
    }
}
exports.WorkoutExercise = WorkoutExercise;
