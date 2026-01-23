import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createApp } from '../app'

describe('Health Check API', () => {
  const app = createApp()

  it('GET /api/health returns status ok', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('status', 'ok')
    expect(response.body).toHaveProperty('timestamp')
  })

  it('GET /api/health returns valid ISO timestamp', async () => {
    const response = await request(app).get('/api/health')

    const timestamp = new Date(response.body.timestamp)
    expect(timestamp.toISOString()).toBe(response.body.timestamp)
  })
})
