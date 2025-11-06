const request = require('supertest')
const app = require('../index')

describe('GET /', () => {
    it('should return Order Service is running', async () => {
        const res = await request(app).get('/')
        expect(res.statusCode).toBe(200)
        expect(res.text).toBe('Order Service is running')
    })
})
