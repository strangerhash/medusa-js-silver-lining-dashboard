import { OpenAPIV3 } from 'openapi-types';

export const schemas: Record<string, any> = {
  // Auth DTOs
  LoginDto: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      password: {
        type: 'string',
        minLength: 6,
        description: 'User password'
      }
    }
  },
  RegisterDto: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        description: 'User full name'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      phone: {
        type: 'string',
        description: 'User phone number'
      },
      password: {
        type: 'string',
        minLength: 6,
        description: 'User password'
      }
    }
  },
  RefreshTokenDto: {
    type: 'object',
    required: ['refreshToken'],
    properties: {
      refreshToken: {
        type: 'string',
        description: 'Refresh token'
      }
    }
  },

  // Common Query DTOs
  QueryDto: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Page number'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 10,
        description: 'Number of items per page'
      },
      search: {
        type: 'string',
        description: 'Search term'
      },
      sortBy: {
        type: 'string',
        description: 'Field to sort by'
      },
      sortOrder: {
        type: 'string',
        enum: ['asc', 'desc'],
        default: 'desc',
        description: 'Sort order'
      }
    }
  },
  PaginationDto: {
    type: 'object',
    properties: {
      page: {
        type: 'integer',
        minimum: 1,
        default: 1,
        description: 'Page number'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 10,
        description: 'Number of items per page'
      }
    }
  },

  // User DTOs
  CreateUserDto: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        description: 'User full name'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      phone: {
        type: 'string',
        description: 'User phone number'
      },
      password: {
        type: 'string',
        minLength: 6,
        description: 'User password'
      },
      role: {
        type: 'string',
        enum: ['USER', 'ADMIN'],
        default: 'USER',
        description: 'User role'
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
        default: 'ACTIVE',
        description: 'User status'
      }
    }
  },
  UpdateUserDto: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        description: 'User full name'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      phone: {
        type: 'string',
        description: 'User phone number'
      },
      role: {
        type: 'string',
        enum: ['USER', 'ADMIN'],
        description: 'User role'
      },
      status: {
        type: 'string',
        enum: ['ACTIVE', 'INACTIVE', 'PENDING'],
        description: 'User status'
      }
    }
  },

  // KYC DTOs
  CreateKYCDto: {
    type: 'object',
    required: ['userId', 'panNumber', 'aadhaarNumber'],
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      },
      panNumber: {
        type: 'string',
        description: 'PAN number'
      },
      aadhaarNumber: {
        type: 'string',
        description: 'Aadhaar number'
      },
      notes: {
        type: 'string',
        description: 'Additional notes'
      }
    }
  },
  UpdateKYCDto: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        description: 'KYC status'
      },
      notes: {
        type: 'string',
        description: 'Additional notes'
      }
    }
  },
  BulkKYCUpdateDto: {
    type: 'object',
    required: ['kycIds', 'status'],
    properties: {
      kycIds: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of KYC application IDs'
      },
      status: {
        type: 'string',
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        description: 'KYC status to set'
      },
      notes: {
        type: 'string',
        description: 'Optional notes for the status update'
      }
    }
  },

  // Transaction DTOs
  CreateTransactionDto: {
    type: 'object',
    required: ['userId', 'type', 'amount', 'silverQuantity', 'silverPrice', 'paymentMethod'],
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      },
      type: {
        type: 'string',
        enum: ['BUY', 'SELL'],
        description: 'Transaction type'
      },
      amount: {
        type: 'number',
        minimum: 0,
        description: 'Transaction amount'
      },
      silverQuantity: {
        type: 'number',
        minimum: 0,
        description: 'Silver quantity'
      },
      silverPrice: {
        type: 'number',
        minimum: 0,
        description: 'Silver price per unit'
      },
      paymentMethod: {
        type: 'string',
        description: 'Payment method'
      },
      referenceId: {
        type: 'string',
        description: 'Reference ID'
      },
      fees: {
        type: 'number',
        minimum: 0,
        description: 'Transaction fees'
      },
      totalAmount: {
        type: 'number',
        minimum: 0,
        description: 'Total amount'
      },
      details: {
        type: 'string',
        description: 'Transaction details'
      },
      remarks: {
        type: 'string',
        description: 'Additional remarks'
      }
    }
  },
  UpdateTransactionStatusDto: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'],
        description: 'Transaction status'
      }
    }
  },

  // Portfolio DTOs
  CreatePortfolioDto: {
    type: 'object',
    required: ['userId', 'totalSilverHolding', 'totalInvested', 'currentValue', 'currentSilverPrice'],
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      },
      totalSilverHolding: {
        type: 'number',
        minimum: 0,
        description: 'Total silver holding'
      },
      totalInvested: {
        type: 'number',
        minimum: 0,
        description: 'Total amount invested'
      },
      currentValue: {
        type: 'number',
        minimum: 0,
        description: 'Current portfolio value'
      },
      currentSilverPrice: {
        type: 'number',
        minimum: 0,
        description: 'Current silver price'
      }
    }
  },
  UpdatePortfolioDto: {
    type: 'object',
    properties: {
      totalSilverHolding: {
        type: 'number',
        minimum: 0,
        description: 'Total silver holding'
      },
      totalInvested: {
        type: 'number',
        minimum: 0,
        description: 'Total amount invested'
      },
      currentValue: {
        type: 'number',
        minimum: 0,
        description: 'Current portfolio value'
      },
      currentSilverPrice: {
        type: 'number',
        minimum: 0,
        description: 'Current silver price'
      }
    }
  },

  // Notification DTOs
  CreateNotificationDto: {
    type: 'object',
    required: ['userId', 'title', 'message', 'type'],
    properties: {
      userId: {
        type: 'string',
        description: 'User ID'
      },
      title: {
        type: 'string',
        description: 'Notification title'
      },
      message: {
        type: 'string',
        description: 'Notification message'
      },
      type: {
        type: 'string',
        enum: ['INFO', 'SUCCESS', 'WARNING', 'ERROR'],
        description: 'Notification type'
      }
    }
  },
  UpdateNotificationDto: {
    type: 'object',
    properties: {
      isRead: {
        type: 'boolean',
        description: 'Whether notification is read'
      }
    }
  },

  // Report DTOs
  GenerateReportDto: {
    type: 'object',
    required: ['type'],
    properties: {
      type: {
        type: 'string',
        enum: ['user_activity', 'transaction_summary', 'financial_report', 'kyc_report', 'portfolio_report'],
        description: 'Report type'
      },
      startDate: {
        type: 'string',
        format: 'date',
        description: 'Start date for report period'
      },
      endDate: {
        type: 'string',
        format: 'date',
        description: 'End date for report period'
      },
      format: {
        type: 'string',
        enum: ['json', 'csv', 'pdf'],
        default: 'json',
        description: 'Report format'
      }
    }
  },

  // Settings DTOs
  CreateSettingDto: {
    type: 'object',
    required: ['key', 'value'],
    properties: {
      key: {
        type: 'string',
        description: 'Setting key'
      },
      value: {
        type: 'string',
        description: 'Setting value'
      },
      description: {
        type: 'string',
        description: 'Setting description'
      },
      category: {
        type: 'string',
        description: 'Setting category'
      }
    }
  },
  UpdateSettingDto: {
    type: 'object',
    properties: {
      value: {
        type: 'string',
        description: 'Setting value'
      },
      description: {
        type: 'string',
        description: 'Setting description'
      },
      category: {
        type: 'string',
        description: 'Setting category'
      }
    }
  },

  // Common Response Schemas
  SuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'object',
        description: 'Response data'
      },
      message: {
        type: 'string',
        description: 'Response message'
      }
    }
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      error: {
        type: 'string',
        description: 'Error message'
      },
      code: {
        type: 'integer',
        description: 'Error code'
      }
    }
  },
  PaginatedResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            description: 'Array of items'
          },
          pagination: {
            type: 'object',
            properties: {
              page: {
                type: 'integer',
                description: 'Current page number'
              },
              limit: {
                type: 'integer',
                description: 'Items per page'
              },
              total: {
                type: 'integer',
                description: 'Total number of items'
              },
              totalPages: {
                type: 'integer',
                description: 'Total number of pages'
              }
            }
          }
        }
      }
    }
  }
}; 