package main

import (
	"encoding/json"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/aws/aws-sdk-go/service/dynamodb/expression"

	"workout-app-backend/pkg/common" // Import the common package
)

type Workout struct {
	WorkoutID   string     `json:"workout_id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	Exercises   []Exercise `json:"exercises"`
}

type Exercise struct {
	ExerciseID  string `json:"exercise_id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Sets        int    `json:"sets"`
	Reps        int    `json:"reps"`
}

func getWorkout(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	workoutID := request.PathParameters["id"]

	// Get the workout details
	workoutResult, err := common.DB.GetItem(&dynamodb.GetItemInput{
		TableName: aws.String(os.Getenv("DYNAMODB_WORKOUTS_TABLE")),
		Key: map[string]*dynamodb.AttributeValue{
			"workout_id": {
				S: aws.String(workoutID),
			},
		},
	})
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	if workoutResult.Item == nil {
		return events.APIGatewayProxyResponse{StatusCode: 404, Body: "Workout not found"}, nil
	}

	var workout Workout
	err = dynamodbattribute.UnmarshalMap(workoutResult.Item, &workout)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	// Get the workout_exercises details
	filt := expression.Name("workout_id").Equal(expression.Value(workoutID))
	expr, err := expression.NewBuilder().WithFilter(filt).Build()
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	params := &dynamodb.ScanInput{
		TableName:                 aws.String(os.Getenv("DYNAMODB_WORKOUT_EXERCISES_TABLE")),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		FilterExpression:          expr.Filter(),
	}

	workoutExercisesResult, err := common.DB.Scan(params)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	if *workoutExercisesResult.Count == 0 {
		return events.APIGatewayProxyResponse{StatusCode: 404, Body: "No exercises found for this workout"}, nil
	}

	var workoutExercises []struct {
		ExerciseID string `json:"exercise_id"`
		Sets       int    `json:"sets"`
		Reps       int    `json:"reps"`
	}
	err = dynamodbattribute.UnmarshalListOfMaps(workoutExercisesResult.Items, &workoutExercises)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	// Get the exercise details
	for _, we := range workoutExercises {
		exerciseResult, err := common.DB.GetItem(&dynamodb.GetItemInput{
			TableName: aws.String(os.Getenv("DYNAMODB_EXERCISES_TABLE")),
			Key: map[string]*dynamodb.AttributeValue{
				"exercise_id": {
					S: aws.String(we.ExerciseID),
				},
			},
		})
		if err != nil {
			return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
		}

		if exerciseResult.Item == nil {
			continue // Skip if no exercise details found
		}

		var exercise Exercise
		err = dynamodbattribute.UnmarshalMap(exerciseResult.Item, &exercise)
		if err != nil {
			return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
		}

		exercise.Sets = we.Sets
		exercise.Reps = we.Reps
		workout.Exercises = append(workout.Exercises, exercise)
	}

	responseBody, err := json.Marshal(workout)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	return events.APIGatewayProxyResponse{StatusCode: 200, Body: string(responseBody)}, nil
}

func main() {
	lambda.Start(getWorkout)
}
