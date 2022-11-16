import * as uuid from 'uuid'
import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'

import { TodoItem } from '../models/TodoItem'
import { Todo } from '../dataAccessLogic/todos';
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS)

const bucketName = process.env.S3_BUCKET
const urlExpiration: number = 300

const s3Bucket = new XAWS.S3({
  signatureVersion: 'v4'
})

const todo = new Todo()

const getAllTodos = async (userId: string): Promise<TodoItem[]> => {
  return await todo.getAllTodos(userId);
}

const createTodo = async (
  userId: string,
  payload: CreateTodoRequest
): Promise<TodoItem> => {
  const todoId = uuid.v4()
  const data = {
    todoId,
    userId,
    ...payload
  }

  return await todo.createTodo(data)
}

const updateTodo = async (todoId: string, userId: string, payload: UpdateTodoRequest): Promise<void> => {
  return await todo.updateTodo(todoId, userId, payload)
}
const todoExists = async (todoId: string, userId: string) => {
  const item = await todo.getTodo(todoId, userId)  
  return !!item
}

const deleteTodo = async (todoId: string, userId: string): Promise<void> => {
  await todo.deleteTodo(todoId, userId)
}


const getUploadUrl = async (todoId: string, userId: string) => {
  const s3SignedUrl = s3Bucket.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: urlExpiration
  })

  if (s3SignedUrl) {
    await addAttachmentUrl(bucketName, todoId, userId)
    return s3SignedUrl
  }
}

const addAttachmentUrl = async (bucketName, todoId, userId) => {
  const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${todoId}`

  await todo.updateTodoAttachment(todoId, userId, attachmentUrl)
}

export {
  getAllTodos,
  createTodo,
  updateTodo,
  todoExists,
  deleteTodo,
  getUploadUrl
}