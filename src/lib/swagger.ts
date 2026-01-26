import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CentricFit Gym Management API',
      version: '1.0.0',
      description: 'API documentation for CentricFit Gym Management SaaS platform',
      contact: {
        name: 'CentricFit Support',
        email: 'support@centric.fit'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-domain.com' 
          : 'http://localhost:3000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            gym_name: { type: 'string' },
            role: { type: 'string', enum: ['owner', 'admin', 'trainer', 'member'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Gym: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            owner_id: { type: 'string', format: 'uuid' },
            subscription_tier: { type: 'string', enum: ['trial', 'basic', 'premium'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            gym_id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            membership_status: { type: 'string', enum: ['active', 'expired', 'cancelled'] },
            join_date: { type: 'string', format: 'date' }
          }
        },
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            member_id: { type: 'string', format: 'uuid' },
            gym_id: { type: 'string', format: 'uuid' },
            check_in_time: { type: 'string', format: 'date-time' },
            check_out_time: { type: 'string', format: 'date-time', nullable: true },
            date: { type: 'string', format: 'date' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object', nullable: true }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object', nullable: true }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', nullable: true },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string' },
                message: { type: 'string' },
                details: { type: 'object', nullable: true }
              },
              nullable: true
            },
            meta: {
              type: 'object',
              properties: {
                pagination: {
                  type: 'object',
                  properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' }
                  }
                },
                timestamp: { type: 'string', format: 'date-time' },
                requestId: { type: 'string', format: 'uuid' }
              }
            }
          }
        },
        SubscriptionPlan: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            description: { type: 'string' },
            amount: { type: 'integer' },
            currency: { type: 'string', enum: ['USD', 'INR'] },
            billing_cycle: { type: 'string', enum: ['monthly', 'annual'] },
            features: {
              type: 'array',
              items: { type: 'string' }
            },
            active: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            user_id: { type: 'string', format: 'uuid' },
            gym_id: { type: 'string', format: 'uuid' },
            plan_id: { type: 'string', format: 'uuid' },
            status: { 
              type: 'string', 
              enum: ['trial', 'active', 'past_due', 'cancelled', 'unpaid'] 
            },
            current_period_start: { type: 'string', format: 'date-time' },
            current_period_end: { type: 'string', format: 'date-time' },
            cancel_at_period_end: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        ServiceStatus: {
          type: 'object',
          properties: {
            status: { 
              type: 'string', 
              enum: ['ok', 'error'] 
            },
            latency: { 
              type: 'integer', 
              description: 'Response latency in milliseconds',
              nullable: true 
            },
            error: { 
              type: 'string', 
              description: 'Error message if status is error',
              nullable: true 
            }
          }
        }
      }
    }
  },
  apis: [
    './src/app/api/**/*.ts',  // All API endpoints
    './src/app/api/docs/**/*.ts' // Documentation routes
  ], // Path to the API docs
}

export const swaggerSpec = swaggerJsdoc(options)
