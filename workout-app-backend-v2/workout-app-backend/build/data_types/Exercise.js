"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exercise = void 0;
const zod_1 = require("zod");
// Define the schema for validation
const exerciseSchema = zod_1.z.object({
    exercise_id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string(),
});
// Exercise class
class Exercise {
    constructor(data) {
        const parsedData = exerciseSchema.parse(data); // Validate and parse data
        this.exerciseId = parsedData.exercise_id;
        this.name = parsedData.name;
        this.description = parsedData.description;
    }
}
exports.Exercise = Exercise;
