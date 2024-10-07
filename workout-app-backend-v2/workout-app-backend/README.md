# Workout App Backend

This is the backend for the Workout App, built using AWS Lambda, API Gateway, and DynamoDB. It leverages the Serverless Framework, TypeScript, and Jest for testing.

## Table of Contents

- [Workout App Backend](#workout-app-backend)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation](#installation)
    - [Project Structure](#project-structure)
    - [Scripts](#scripts)
    - [Environment Variables](#environment-variables)
    - [Deploying](#deploying)
    - [Testing](#testing)
    - [Linting and Formatting](#linting-and-formatting)

## Features

- Serverless architecture with AWS Lambda and API Gateway
- DynamoDB for data storage
- TypeScript for type safety
- Jest for testing
- ESLint and Prettier for code quality
- Local development with `serverless-offline`

## Getting Started

### Prerequisites

- Node.js (version 18.x)
- npm
- AWS CLI configured with appropriate credentials

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/workout-app-backend.git
   cd workout-app-backend
   ```

2. Install dependencies:
  
   ```bash
   npm install
   ```

3. Set up environment variables:

   Create a .env file in the root of the project and add your configuration. Refer to the [Environment Variables](#environment-variables) section for details.

### Project Structure

workout-app-backend/
├── src/
│   ├── handler.ts       # Lambda handlers
│   └── __tests__/       # Test files
├── build/               # Compiled JavaScript (ignored in .gitignore)
├── .eslintrc.js         # ESLint configuration
├── .prettierrc          # Prettier configuration
├── jest.config.js       # Jest configuration
├── serverless.yml       # Serverless configuration
├── package.json         # Project metadata and scripts
└── tsconfig.json        # TypeScript configuration

### Scripts

npm run build: Compile TypeScript to JavaScript.
npm run deploy: Deploy the service to AWS.
npm run offline: Run the service locally.
npm run lint: Lint the codebase using ESLint.
npm run lint:fix: Fix linting issues automatically.
npm run format: Format code using Prettier.
npm run test: Run all tests with Jest.
npm run test:watch : Run tests in watch mode.

### Environment Variables

The project uses environment variables to manage configurations. Ensure the following variables are set:

`USERS_TABLE=your-dynamodb-table-name`

### Deploying

Deploy the application using the Serverless Framework:

   ```bash
   npm run deploy
   ```

This will run tests, build the project, and deploy it to your AWS account.

### Testing

Run the test suite with:

   ```bash
   npm run test
   ```

For a coverage report, use:

   ```bash
   npm run coverage
   ```

### Linting and Formatting

Lint your code with:

   ```bash
   npm run lint
   ```

Automatically fix lint issues:

   ```bash
   npm run lint:fix
   ```

Format your code with Prettier:

   ```bash
   npm run format
   ```

Contributing
Contributions are welcome! Please fork the repository and submit a pull request for any improvements or bug fixes.