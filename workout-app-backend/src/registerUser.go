package main

import (
	"encoding/json"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/dynamodb"
	"github.com/aws/aws-sdk-go/service/dynamodb/dynamodbattribute"
	"github.com/google/uuid"

	"workout-app-backend/pkg/common"
)

/*
This function/file is responsible for signing my friends up for my workout app.
The function receives a POST request with the user's first name and last name.
It generates a unique user ID and stores the user's information in a DynamoDB table.
It then returns a success message with my friend's user ID.
*/
func registerUser(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var user common.User
	err := json.Unmarshal([]byte(request.Body), &user)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 400, Body: "Invalid request body"}, nil
	}

	user.UserID = uuid.New().String()

	av, err := dynamodbattribute.MarshalMap(user)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	input := &dynamodb.PutItemInput{
		Item:      av,
		TableName: aws.String(os.Getenv("DYNAMODB_TABLE")),
	}

	_, err = common.DB.PutItem(input)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	response := map[string]string{
		"message": "User registered successfully",
		"user_id": user.UserID,
	}
	responseBody, err := json.Marshal(response)

	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	return events.APIGatewayProxyResponse{StatusCode: 201, Body: string(responseBody)}, nil
}

func main() {
	lambda.Start(registerUser)
}
