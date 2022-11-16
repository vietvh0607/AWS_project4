import 'source-map-support/register'

import { 
  APIGatewayProxyEvent,
  APIGatewayProxyResult, 
  APIGatewayProxyHandler } from 'aws-lambda'

import { deleteTodo, todoExists } from '../../businessLogic/todos'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  createLogger(`Processing the delete todo event at the moment: ${event}`);

  const todoId = event.pathParameters.todoId;
  const userId = getUserId(event);
  const todoExist = await todoExists(todoId, userId);

  if (!todoExist) {
    return {
      statusCode: 404,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'This Todo item does not exist.'
      })
    }
  }

  await deleteTodo(todoId, userId);

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({})
  }
}

