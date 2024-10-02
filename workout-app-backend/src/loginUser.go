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

	"workout-app-backend/pkg/common"
)

type Credentials struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

func loginUser(request events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var credentials Credentials
	err := json.Unmarshal([]byte(request.Body), &credentials)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 400, Body: "Invalid request body"}, nil
	}

	// Build the expression to filter items
	filter := expression.Name("first_name").Equal(expression.Value(credentials.FirstName)).And(expression.Name("last_name").Equal(expression.Value(credentials.LastName)))
	proj := expression.NamesList(expression.Name("user_id"), expression.Name("first_name"), expression.Name("last_name"))

	expr, err := expression.NewBuilder().WithFilter(filter).WithProjection(proj).Build()
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	// Build the scan input parameters
	params := &dynamodb.ScanInput{
		TableName:                 aws.String(os.Getenv("DYNAMODB_WORKOUT_USERS_TABLE")),
		ExpressionAttributeNames:  expr.Names(),
		ExpressionAttributeValues: expr.Values(),
		FilterExpression:          expr.Filter(),
		ProjectionExpression:      expr.Projection(),
	}

	// Make the DynamoDB Query API call
	result, err := common.DB.Scan(params)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	if *result.Count == 0 {
		return events.APIGatewayProxyResponse{StatusCode: 401, Body: "Invalid first name or last name"}, nil
	}

	var users []common.User
	err = dynamodbattribute.UnmarshalListOfMaps(result.Items, &users)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	// Return the UserID in the response
	response := map[string]string{
		"message": "Login successful",
		"user_id": users[0].UserID,
	}
	responseBody, err := json.Marshal(response)
	if err != nil {
		return events.APIGatewayProxyResponse{StatusCode: 500, Body: err.Error()}, nil
	}

	return events.APIGatewayProxyResponse{StatusCode: 200, Body: string(responseBody)}, nil
}

func main() {
	lambda.Start(loginUser)
}
