"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const zod_1 = require("zod");
// Define the schema for validation
const userSchema = zod_1.z.object({
    user_id: zod_1.z.string(),
    firstName: zod_1.z.string(),
    lastName: zod_1.z.string(),
});
// Exercise class
class User {
    constructor(data) {
        const parsedData = userSchema.parse(data); // Validate and parse data
        this.user_id = parsedData.user_id;
        this.firstName = parsedData.firstName;
        this.lastName = parsedData.lastName;
    }
}
exports.User = User;
