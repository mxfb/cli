import path from 'node:path'
import { fileURLToPath } from 'node:url'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import logger from 'morgan'
import * as Api from './api'
import { makeRouter } from './api/utils'
import * as Jwt from './jwt'
import * as Database from'./database'
import * as Init from './init'
import { serve } from './www'

// Prepare to gracefully shutdon the server if needed
Init.captureTerminationSignals()

// App setup
const app = express()
app.use(cors()) // [WIP] configure cors and allowed origins
app.use(logger('dev')) // [WIP] configure logger for prod an all
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

// Static files
const ROOT = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC = path.join(ROOT, 'public')
app.use(express.static(PUBLIC))

// Authentication
app.use(Jwt.authenticate)

// API endpoints
app.use('/', makeRouter(Api.Endpoints))

// Database connection
await Database.connect()
await Init.ensureRootUser()
await Init.scheduleCronTasks()

// Start server
serve(app)
