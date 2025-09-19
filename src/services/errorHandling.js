/**
 * Service Error Handling Utilities
 * Provides consistent error handling patterns for all services
 */

/**
 * Comprehensive error types for better error categorization
 */
export const ERROR_TYPES = {
  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD_ERROR: 'REQUIRED_FIELD_ERROR',
  INVALID_FORMAT_ERROR: 'INVALID_FORMAT_ERROR',
  INVALID_RANGE_ERROR: 'INVALID_RANGE_ERROR',
  INVALID_TYPE_ERROR: 'INVALID_TYPE_ERROR',
  
  // Data Errors
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ERROR: 'DUPLICATE_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  OUT_OF_SYNC_ERROR: 'OUT_OF_SYNC_ERROR',
  
  // Permission & Security Errors
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  
  // Business Logic Errors
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  INSUFFICIENT_STOCK_ERROR: 'INSUFFICIENT_STOCK_ERROR',
  CAPACITY_EXCEEDED_ERROR: 'CAPACITY_EXCEEDED_ERROR',
  INVALID_OPERATION_ERROR: 'INVALID_OPERATION_ERROR',
  WORKFLOW_ERROR: 'WORKFLOW_ERROR',
  
  // System Errors
  SERVER_ERROR: 'SERVER_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  
  // External Service Errors
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  API_ERROR: 'API_ERROR',
  INTEGRATION_ERROR: 'INTEGRATION_ERROR',
  
  // Configuration Errors
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  ENVIRONMENT_ERROR: 'ENVIRONMENT_ERROR',
  
  // Resource Errors
  RESOURCE_EXHAUSTED_ERROR: 'RESOURCE_EXHAUSTED_ERROR',
  QUOTA_EXCEEDED_ERROR: 'QUOTA_EXCEEDED_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  
  // User Experience Errors
  USER_INPUT_ERROR: 'USER_INPUT_ERROR',
  UI_ERROR: 'UI_ERROR',
  NAVIGATION_ERROR: 'NAVIGATION_ERROR',
  
  // Recovery Errors
  RECOVERY_ERROR: 'RECOVERY_ERROR',
  RETRY_ERROR: 'RETRY_ERROR',
  FALLBACK_ERROR: 'FALLBACK_ERROR',
};

/**
 * Enhanced custom error class for service operations
 */
export class ServiceError extends Error {
  constructor(message, type = ERROR_TYPES.SERVER_ERROR, statusCode = 500, originalError = null, context = '', options = {}) {
    super(message);
    this.name = 'ServiceError';
    this.type = type;
    this.statusCode = statusCode;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.id = options.id || this.generateErrorId();
    this.severity = options.severity || this.getDefaultSeverity(type);
    this.retryable = options.retryable !== undefined ? options.retryable : this.isRetryable(type);
    this.userMessage = options.userMessage || this.getDefaultUserMessage(type, message);
    this.details = options.details || {};
    this.stack = this.stack || (originalError && originalError.stack);
    this.metadata = options.metadata || {};
  }

  /**
   * Generate a unique error ID
   */
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get default severity based on error type
   */
  getDefaultSeverity(type) {
    const severityMap = {
      [ERROR_TYPES.VALIDATION_ERROR]: 'low',
      [ERROR_TYPES.REQUIRED_FIELD_ERROR]: 'low',
      [ERROR_TYPES.INVALID_FORMAT_ERROR]: 'low',
      [ERROR_TYPES.INVALID_RANGE_ERROR]: 'low',
      [ERROR_TYPES.INVALID_TYPE_ERROR]: 'low',
      [ERROR_TYPES.USER_INPUT_ERROR]: 'low',
      [ERROR_TYPES.UI_ERROR]: 'low',
      [ERROR_TYPES.NAVIGATION_ERROR]: 'low',
      
      [ERROR_TYPES.NOT_FOUND]: 'medium',
      [ERROR_TYPES.DUPLICATE_ERROR]: 'medium',
      [ERROR_TYPES.CONFLICT_ERROR]: 'medium',
      [ERROR_TYPES.BUSINESS_LOGIC_ERROR]: 'medium',
      [ERROR_TYPES.INSUFFICIENT_STOCK_ERROR]: 'medium',
      [ERROR_TYPES.CAPACITY_EXCEEDED_ERROR]: 'medium',
      [ERROR_TYPES.INVALID_OPERATION_ERROR]: 'medium',
      [ERROR_TYPES.WORKFLOW_ERROR]: 'medium',
      
      [ERROR_TYPES.PERMISSION_ERROR]: 'high',
      [ERROR_TYPES.AUTHENTICATION_ERROR]: 'high',
      [ERROR_TYPES.AUTHORIZATION_ERROR]: 'high',
      [ERROR_TYPES.RATE_LIMIT_ERROR]: 'high',
      [ERROR_TYPES.CONFIGURATION_ERROR]: 'high',
      [ERROR_TYPES.ENVIRONMENT_ERROR]: 'high',
      
      [ERROR_TYPES.SERVER_ERROR]: 'critical',
      [ERROR_TYPES.DATABASE_ERROR]: 'critical',
      [ERROR_TYPES.NETWORK_ERROR]: 'critical',
      [ERROR_TYPES.CONNECTION_ERROR]: 'critical',
      [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: 'critical',
      [ERROR_TYPES.API_ERROR]: 'critical',
      [ERROR_TYPES.INTEGRATION_ERROR]: 'critical',
      [ERROR_TYPES.RESOURCE_EXHAUSTED_ERROR]: 'critical',
      [ERROR_TYPES.QUOTA_EXCEEDED_ERROR]: 'critical',
      [ERROR_TYPES.STORAGE_ERROR]: 'critical',
    };
    
    return severityMap[type] || 'medium';
  }

  /**
   * Determine if error is retryable
   */
  isRetryable(type) {
    const retryableTypes = [
      ERROR_TYPES.NETWORK_ERROR,
      ERROR_TYPES.CONNECTION_ERROR,
      ERROR_TYPES.TIMEOUT_ERROR,
      ERROR_TYPES.SERVER_ERROR,
      ERROR_TYPES.EXTERNAL_SERVICE_ERROR,
      ERROR_TYPES.API_ERROR,
      ERROR_TYPES.RATE_LIMIT_ERROR,
    ];
    
    return retryableTypes.includes(type);
  }

  /**
   * Get user-friendly error message
   */
  getDefaultUserMessage(type, message) {
    const userMessageMap = {
      [ERROR_TYPES.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ERROR_TYPES.REQUIRED_FIELD_ERROR]: 'Please fill in all required fields.',
      [ERROR_TYPES.INVALID_FORMAT_ERROR]: 'Please check the format of your input.',
      [ERROR_TYPES.INVALID_RANGE_ERROR]: 'Please enter a value within the allowed range.',
      [ERROR_TYPES.INVALID_TYPE_ERROR]: 'Please enter the correct type of data.',
      [ERROR_TYPES.NOT_FOUND]: 'The requested item was not found.',
      [ERROR_TYPES.DUPLICATE_ERROR]: 'This item already exists.',
      [ERROR_TYPES.CONFLICT_ERROR]: 'There was a conflict with your request.',
      [ERROR_TYPES.PERMISSION_ERROR]: 'You do not have permission to perform this action.',
      [ERROR_TYPES.AUTHENTICATION_ERROR]: 'Please log in to continue.',
      [ERROR_TYPES.AUTHORIZATION_ERROR]: 'You are not authorized to perform this action.',
      [ERROR_TYPES.BUSINESS_LOGIC_ERROR]: 'This operation cannot be completed due to business rules.',
      [ERROR_TYPES.INSUFFICIENT_STOCK_ERROR]: 'Insufficient stock available.',
      [ERROR_TYPES.CAPACITY_EXCEEDED_ERROR]: 'Capacity limit exceeded.',
      [ERROR_TYPES.INVALID_OPERATION_ERROR]: 'This operation is not allowed.',
      [ERROR_TYPES.SERVER_ERROR]: 'A server error occurred. Please try again later.',
      [ERROR_TYPES.DATABASE_ERROR]: 'A database error occurred. Please try again later.',
      [ERROR_TYPES.NETWORK_ERROR]: 'Network connection failed. Please check your connection.',
      [ERROR_TYPES.CONNECTION_ERROR]: 'Connection failed. Please try again.',
      [ERROR_TYPES.TIMEOUT_ERROR]: 'The operation timed out. Please try again.',
      [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: 'External service is temporarily unavailable.',
      [ERROR_TYPES.API_ERROR]: 'API request failed. Please try again later.',
      [ERROR_TYPES.CONFIGURATION_ERROR]: 'System configuration error. Please contact support.',
      [ERROR_TYPES.ENVIRONMENT_ERROR]: 'Environment configuration error. Please contact support.',
      [ERROR_TYPES.RESOURCE_EXHAUSTED_ERROR]: 'System resources are exhausted. Please try again later.',
      [ERROR_TYPES.QUOTA_EXCEEDED_ERROR]: 'Quota exceeded. Please try again later.',
      [ERROR_TYPES.STORAGE_ERROR]: 'Storage error occurred. Please try again later.',
      [ERROR_TYPES.USER_INPUT_ERROR]: 'Please check your input and try again.',
      [ERROR_TYPES.UI_ERROR]: 'A user interface error occurred.',
      [ERROR_TYPES.NAVIGATION_ERROR]: 'Navigation error occurred.',
      [ERROR_TYPES.RECOVERY_ERROR]: 'Error recovery failed.',
      [ERROR_TYPES.RETRY_ERROR]: 'Retry operation failed.',
      [ERROR_TYPES.FALLBACK_ERROR]: 'Fallback operation failed.',
    };
    
    return userMessageMap[type] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Check if error is critical
   */
  isCritical() {
    return this.severity === 'critical';
  }

  /**
   * Check if error should be logged
   */
  shouldLog() {
    return ['medium', 'high', 'critical'].includes(this.severity);
  }

  /**
   * Get error summary for logging
   */
  getLogSummary() {
    return {
      id: this.id,
      type: this.type,
      severity: this.severity,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      retryable: this.retryable,
      statusCode: this.statusCode,
      originalError: this.originalError?.message || null,
    };
  }

  /**
   * Convert to JSON with all properties
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      type: this.type,
      statusCode: this.statusCode,
      context: this.context,
      timestamp: this.timestamp,
      severity: this.severity,
      retryable: this.retryable,
      userMessage: this.userMessage,
      details: this.details,
      metadata: this.metadata,
      originalError: this.originalError?.message || null,
      stack: this.stack,
    };
  }

  /**
   * Convert to user-friendly format
   */
  toUserFriendly() {
    return {
      id: this.id,
      message: this.userMessage,
      type: this.type,
      retryable: this.retryable,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Enhanced Supabase error handling with comprehensive error mapping
 * @param {Error} error - Supabase error
 * @returns {Object} Error details with type and message
 */
export const handleSupabaseError = (error) => {
  if (!error) return { type: ERROR_TYPES.SERVER_ERROR, message: 'Unknown error occurred' };

  // Handle specific Supabase error codes
  switch (error.code) {
    // Constraint violations
    case '23505': // Unique constraint violation
      return { 
        type: ERROR_TYPES.DUPLICATE_ERROR, 
        message: 'A record with this information already exists',
        details: { constraint: error.constraint, table: error.table }
      };
    case '23503': // Foreign key constraint violation
      return { 
        type: ERROR_TYPES.CONFLICT_ERROR, 
        message: 'Cannot perform this action due to related records',
        details: { constraint: error.constraint, table: error.table }
      };
    case '23502': // Not null constraint violation
      return { 
        type: ERROR_TYPES.REQUIRED_FIELD_ERROR, 
        message: 'Required fields are missing',
        details: { column: error.column, table: error.table }
      };
    case '23514': // Check constraint violation
      return { 
        type: ERROR_TYPES.VALIDATION_ERROR, 
        message: 'Data validation failed',
        details: { constraint: error.constraint, table: error.table }
      };
    
    // Database structure errors
    case '42P01': // Undefined table
      return { 
        type: ERROR_TYPES.DATABASE_ERROR, 
        message: 'Database table not found',
        details: { table: error.table }
      };
    case '42703': // Undefined column
      return { 
        type: ERROR_TYPES.DATABASE_ERROR, 
        message: 'Database column not found',
        details: { column: error.column, table: error.table }
      };
    case '42P07': // Duplicate table
      return { 
        type: ERROR_TYPES.DATABASE_ERROR, 
        message: 'Table already exists',
        details: { table: error.table }
      };
    
    // PostgREST specific errors
    case 'PGRST116': // No rows returned
      return { 
        type: ERROR_TYPES.NOT_FOUND, 
        message: 'Record not found',
        details: { table: error.table }
      };
    case 'PGRST301': // Multiple rows returned when single expected
      return { 
        type: ERROR_TYPES.CONFLICT_ERROR, 
        message: 'Multiple records found when expecting one',
        details: { table: error.table }
      };
    case 'PGRST301': // Multiple rows returned when single expected
      return { 
        type: ERROR_TYPES.CONFLICT_ERROR, 
        message: 'Multiple records found when expecting one',
        details: { table: error.table }
      };
    
    // Connection and network errors
    case 'ECONNREFUSED':
      return { 
        type: ERROR_TYPES.CONNECTION_ERROR, 
        message: 'Database connection refused',
        details: { host: error.host, port: error.port }
      };
    case 'ETIMEDOUT':
      return { 
        type: ERROR_TYPES.TIMEOUT_ERROR, 
        message: 'Database connection timed out',
        details: { timeout: error.timeout }
      };
    case 'ENOTFOUND':
      return { 
        type: ERROR_TYPES.CONNECTION_ERROR, 
        message: 'Database host not found',
        details: { host: error.host }
      };
    
    // Authentication and authorization errors
    case 'PGRST301': // Invalid JWT
      return { 
        type: ERROR_TYPES.AUTHENTICATION_ERROR, 
        message: 'Invalid authentication token',
        details: { token: 'invalid' }
      };
    case 'PGRST301': // Insufficient privileges
      return { 
        type: ERROR_TYPES.AUTHORIZATION_ERROR, 
        message: 'Insufficient privileges for this operation',
        details: { operation: error.operation }
      };
    
    // Rate limiting
    case 'PGRST301': // Rate limit exceeded
      return { 
        type: ERROR_TYPES.RATE_LIMIT_ERROR, 
        message: 'Rate limit exceeded. Please try again later.',
        details: { limit: error.limit, remaining: error.remaining }
      };
    
    // Default case
    default:
      return { 
        type: ERROR_TYPES.DATABASE_ERROR, 
        message: error.message || 'Database operation failed',
        details: { code: error.code, hint: error.hint }
      };
  }
};

/**
 * Convert Supabase error to ServiceError
 * @param {Error} error - Supabase error
 * @param {string} context - Error context
 * @returns {ServiceError} Service error instance
 */
export const convertSupabaseError = (error, context = '') => {
  const errorDetails = handleSupabaseError(error);
  
  return new ServiceError(
    errorDetails.message,
    errorDetails.type,
    getStatusCodeForErrorType(errorDetails.type),
    error,
    context,
    {
      details: errorDetails.details,
      metadata: {
        supabaseCode: error.code,
        supabaseHint: error.hint,
        supabaseDetails: error.details
      }
    }
  );
};

/**
 * Get HTTP status code for error type
 * @param {string} errorType - Error type
 * @returns {number} HTTP status code
 */
export const getStatusCodeForErrorType = (errorType) => {
  const statusCodeMap = {
    [ERROR_TYPES.VALIDATION_ERROR]: 400,
    [ERROR_TYPES.REQUIRED_FIELD_ERROR]: 400,
    [ERROR_TYPES.INVALID_FORMAT_ERROR]: 400,
    [ERROR_TYPES.INVALID_RANGE_ERROR]: 400,
    [ERROR_TYPES.INVALID_TYPE_ERROR]: 400,
    [ERROR_TYPES.USER_INPUT_ERROR]: 400,
    
    [ERROR_TYPES.NOT_FOUND]: 404,
    
    [ERROR_TYPES.DUPLICATE_ERROR]: 409,
    [ERROR_TYPES.CONFLICT_ERROR]: 409,
    [ERROR_TYPES.OUT_OF_SYNC_ERROR]: 409,
    
    [ERROR_TYPES.AUTHENTICATION_ERROR]: 401,
    [ERROR_TYPES.AUTHORIZATION_ERROR]: 403,
    [ERROR_TYPES.PERMISSION_ERROR]: 403,
    
    [ERROR_TYPES.BUSINESS_LOGIC_ERROR]: 422,
    [ERROR_TYPES.INSUFFICIENT_STOCK_ERROR]: 422,
    [ERROR_TYPES.CAPACITY_EXCEEDED_ERROR]: 422,
    [ERROR_TYPES.INVALID_OPERATION_ERROR]: 422,
    [ERROR_TYPES.WORKFLOW_ERROR]: 422,
    
    [ERROR_TYPES.RATE_LIMIT_ERROR]: 429,
    
    [ERROR_TYPES.SERVER_ERROR]: 500,
    [ERROR_TYPES.DATABASE_ERROR]: 500,
    [ERROR_TYPES.NETWORK_ERROR]: 500,
    [ERROR_TYPES.CONNECTION_ERROR]: 500,
    [ERROR_TYPES.TIMEOUT_ERROR]: 504,
    [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: 502,
    [ERROR_TYPES.API_ERROR]: 502,
    [ERROR_TYPES.INTEGRATION_ERROR]: 502,
    [ERROR_TYPES.CONFIGURATION_ERROR]: 500,
    [ERROR_TYPES.ENVIRONMENT_ERROR]: 500,
    [ERROR_TYPES.RESOURCE_EXHAUSTED_ERROR]: 507,
    [ERROR_TYPES.QUOTA_EXCEEDED_ERROR]: 507,
    [ERROR_TYPES.STORAGE_ERROR]: 507,
    [ERROR_TYPES.UI_ERROR]: 500,
    [ERROR_TYPES.NAVIGATION_ERROR]: 500,
    [ERROR_TYPES.RECOVERY_ERROR]: 500,
    [ERROR_TYPES.RETRY_ERROR]: 500,
    [ERROR_TYPES.FALLBACK_ERROR]: 500,
  };
  
  return statusCodeMap[errorType] || 500;
};

/**
 * Create a service error with proper categorization
 * @param {string} message - Error message
 * @param {string} type - Error type
 * @param {number} statusCode - HTTP status code
 * @param {Error} originalError - Original error
 * @param {string} context - Error context
 * @returns {ServiceError} Service error instance
 */
export const createServiceError = (message, type = ERROR_TYPES.SERVER_ERROR, statusCode = 500, originalError = null, context = '') => {
  return new ServiceError(message, type, statusCode, originalError, context);
};

/**
 * Wrap async operations with error handling
 * @param {Function} asyncFn - Async function to wrap
 * @param {string} context - Context for error messages
 * @returns {Promise} Wrapped async function
 */
export const safeAsync = async (asyncFn, context = '') => {
  try {
    return await asyncFn();
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error;
    }
    
    // Convert to ServiceError
    const serviceError = createServiceError(
      `${context ? `${context}: ` : ''}${error.message}`,
      ERROR_TYPES.SERVER_ERROR,
      500,
      error,
      context
    );
    
    throw serviceError;
  }
};

/**
 * Validate required fields
 * @param {Object} data - Data to validate
 * @param {Array} requiredFields - Array of required field names
 * @throws {ServiceError} If validation fails
 */
export const validateRequiredFields = (data, requiredFields) => {
  const missingFields = requiredFields.filter(field => {
    const value = data[field];
    return value === null || value === undefined || value === '';
  });

  if (missingFields.length > 0) {
    throw createServiceError(
      `Missing required fields: ${missingFields.join(', ')}`,
      ERROR_TYPES.VALIDATION_ERROR,
      400,
      null,
      'validateRequiredFields'
    );
  }
};

/**
 * Validate data types
 * @param {Object} data - Data to validate
 * @param {Object} fieldTypes - Object mapping field names to expected types
 * @throws {ServiceError} If validation fails
 */
export const validateFieldTypes = (data, fieldTypes) => {
  const invalidFields = [];

  Object.entries(fieldTypes).forEach(([field, expectedType]) => {
    const value = data[field];
    if (value !== null && value !== undefined) {
      const actualType = typeof value;
      if (actualType !== expectedType) {
        invalidFields.push(`${field} (expected ${expectedType}, got ${actualType})`);
      }
    }
  });

  if (invalidFields.length > 0) {
    throw createServiceError(
      `Invalid field types: ${invalidFields.join(', ')}`,
      ERROR_TYPES.VALIDATION_ERROR,
      400,
      null,
      'validateFieldTypes'
    );
  }
};

/**
 * Validate numeric ranges
 * @param {Object} data - Data to validate
 * @param {Object} ranges - Object mapping field names to range constraints
 * @throws {ServiceError} If validation fails
 */
export const validateNumericRanges = (data, ranges) => {
  const invalidFields = [];

  Object.entries(ranges).forEach(([field, constraints]) => {
    const value = data[field];
    if (value !== null && value !== undefined) {
      const numValue = Number(value);
      if (isNaN(numValue)) {
        invalidFields.push(`${field} is not a valid number`);
      } else {
        if (constraints.min !== undefined && numValue < constraints.min) {
          invalidFields.push(`${field} must be at least ${constraints.min}`);
        }
        if (constraints.max !== undefined && numValue > constraints.max) {
          invalidFields.push(`${field} must be no more than ${constraints.max}`);
        }
      }
    }
  });

  if (invalidFields.length > 0) {
    throw createServiceError(
      `Invalid numeric ranges: ${invalidFields.join(', ')}`,
      ERROR_TYPES.VALIDATION_ERROR,
      400,
      null,
      'validateNumericRanges'
    );
  }
};

/**
 * Handle business logic errors
 * @param {string} message - Error message
 * @param {Object} details - Additional error details
 * @throws {ServiceError} Business logic error
 */
export const throwBusinessError = (message, details = {}) => {
  throw createServiceError(
    message,
    ERROR_TYPES.BUSINESS_LOGIC_ERROR,
    422,
    null,
    'businessLogic'
  );
};

/**
 * Handle not found errors
 * @param {string} entity - Entity name
 * @param {string|number} id - Entity ID
 * @throws {ServiceError} Not found error
 */
export const throwNotFoundError = (entity, id) => {
  throw createServiceError(
    `${entity} with id ${id} not found`,
    ERROR_TYPES.NOT_FOUND,
    404,
    null,
    'notFound'
  );
};

/**
 * Handle duplicate errors
 * @param {string} entity - Entity name
 * @param {string} field - Field that caused the duplicate
 * @param {any} value - Value that caused the duplicate
 * @throws {ServiceError} Duplicate error
 */
export const throwDuplicateError = (entity, field, value) => {
  throw createServiceError(
    `${entity} with ${field} '${value}' already exists`,
    ERROR_TYPES.DUPLICATE_ERROR,
    409,
    null,
    'duplicate'
  );
};

/**
 * Enhanced retry mechanism with exponential backoff
 * @param {Function} operation - Operation to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of the operation
 */
export const retryOperation = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => error.retryable,
    onRetry = null
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      if (attempt === maxRetries || !retryCondition(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Error recovery strategies
 */
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  IGNORE: 'ignore',
  ABORT: 'abort',
  USER_INTERVENTION: 'user_intervention'
};

/**
 * Determine recovery strategy based on error type
 * @param {ServiceError} error - Service error
 * @returns {string} Recovery strategy
 */
export const getRecoveryStrategy = (error) => {
  if (!(error instanceof ServiceError)) {
    return RECOVERY_STRATEGIES.ABORT;
  }

  const strategyMap = {
    [ERROR_TYPES.NETWORK_ERROR]: RECOVERY_STRATEGIES.RETRY,
    [ERROR_TYPES.CONNECTION_ERROR]: RECOVERY_STRATEGIES.RETRY,
    [ERROR_TYPES.TIMEOUT_ERROR]: RECOVERY_STRATEGIES.RETRY,
    [ERROR_TYPES.SERVER_ERROR]: RECOVERY_STRATEGIES.RETRY,
    [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: RECOVERY_STRATEGIES.RETRY,
    [ERROR_TYPES.API_ERROR]: RECOVERY_STRATEGIES.RETRY,
    [ERROR_TYPES.RATE_LIMIT_ERROR]: RECOVERY_STRATEGIES.RETRY,
    
    [ERROR_TYPES.VALIDATION_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.REQUIRED_FIELD_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.INVALID_FORMAT_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.INVALID_RANGE_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.INVALID_TYPE_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.USER_INPUT_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    
    [ERROR_TYPES.NOT_FOUND]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.DUPLICATE_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.CONFLICT_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    
    [ERROR_TYPES.AUTHENTICATION_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.AUTHORIZATION_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.PERMISSION_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    
    [ERROR_TYPES.BUSINESS_LOGIC_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.INSUFFICIENT_STOCK_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.CAPACITY_EXCEEDED_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.INVALID_OPERATION_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    [ERROR_TYPES.WORKFLOW_ERROR]: RECOVERY_STRATEGIES.USER_INTERVENTION,
    
    [ERROR_TYPES.DATABASE_ERROR]: RECOVERY_STRATEGIES.ABORT,
    [ERROR_TYPES.CONFIGURATION_ERROR]: RECOVERY_STRATEGIES.ABORT,
    [ERROR_TYPES.ENVIRONMENT_ERROR]: RECOVERY_STRATEGIES.ABORT,
    [ERROR_TYPES.RESOURCE_EXHAUSTED_ERROR]: RECOVERY_STRATEGIES.ABORT,
    [ERROR_TYPES.QUOTA_EXCEEDED_ERROR]: RECOVERY_STRATEGIES.ABORT,
    [ERROR_TYPES.STORAGE_ERROR]: RECOVERY_STRATEGIES.ABORT,
    
    [ERROR_TYPES.UI_ERROR]: RECOVERY_STRATEGIES.IGNORE,
    [ERROR_TYPES.NAVIGATION_ERROR]: RECOVERY_STRATEGIES.IGNORE,
  };
  
  return strategyMap[error.type] || RECOVERY_STRATEGIES.ABORT;
};

/**
 * Error logging utility
 * @param {ServiceError} error - Service error to log
 * @param {Object} additionalContext - Additional context for logging
 */
export const logError = (error, additionalContext = {}) => {
  if (!(error instanceof ServiceError)) {
    console.error('Non-ServiceError encountered:', error);
    return;
  }

  if (!error.shouldLog()) {
    return;
  }

  const logData = {
    ...error.getLogSummary(),
    ...additionalContext,
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: new Date().toISOString()
  };

  // Log to console with appropriate level
  switch (error.severity) {
    case 'low':
      console.warn('Service Error (Low):', logData);
      break;
    case 'medium':
      console.error('Service Error (Medium):', logData);
      break;
    case 'high':
      console.error('Service Error (High):', logData);
      break;
    case 'critical':
      console.error('Service Error (Critical):', logData);
      // In production, you might want to send to external logging service
      break;
  }

  // Store in localStorage for debugging (development only)
  if (process.env.NODE_ENV === 'development') {
    try {
      const errorLog = JSON.parse(localStorage.getItem('errorLog') || '[]');
      errorLog.push(logData);
      // Keep only last 50 errors
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }
      localStorage.setItem('errorLog', JSON.stringify(errorLog));
    } catch (e) {
      console.warn('Failed to store error in localStorage:', e);
    }
  }
};

/**
 * Error boundary for React components
 * @param {Error} error - Error that occurred
 * @param {Object} errorInfo - Error info from React
 * @returns {Object} Error details for display
 */
export const handleReactError = (error, errorInfo) => {
  const serviceError = new ServiceError(
    error.message || 'A React component error occurred',
    ERROR_TYPES.UI_ERROR,
    500,
    error,
    'ReactErrorBoundary',
    {
      details: {
        componentStack: errorInfo.componentStack,
        errorBoundary: errorInfo.errorBoundary
      },
      metadata: {
        reactError: true,
        errorBoundary: true
      }
    }
  );

  logError(serviceError, {
    componentStack: errorInfo.componentStack,
    errorBoundary: errorInfo.errorBoundary
  });

  return serviceError.toUserFriendly();
};

/**
 * Create error handler for async operations
 * @param {Object} options - Error handler options
 * @returns {Function} Error handler function
 */
export const createErrorHandler = (options = {}) => {
  const {
    onError = null,
    onRetry = null,
    onFallback = null,
    logErrors = true,
    showUserMessage = true
  } = options;

  return async (error, context = '') => {
    // Convert to ServiceError if not already
    let serviceError = error;
    if (!(error instanceof ServiceError)) {
      serviceError = new ServiceError(
        error.message || 'An unexpected error occurred',
        ERROR_TYPES.SERVER_ERROR,
        500,
        error,
        context
      );
    }

    // Log error if enabled
    if (logErrors) {
      logError(serviceError, { context });
    }

    // Determine recovery strategy
    const strategy = getRecoveryStrategy(serviceError);

    // Handle based on strategy
    switch (strategy) {
      case RECOVERY_STRATEGIES.RETRY:
        if (onRetry) {
          return await onRetry(serviceError);
        }
        break;
        
      case RECOVERY_STRATEGIES.FALLBACK:
        if (onFallback) {
          return await onFallback(serviceError);
        }
        break;
        
      case RECOVERY_STRATEGIES.USER_INTERVENTION:
        if (showUserMessage) {
          // Show user-friendly message
          console.warn('User intervention required:', serviceError.userMessage);
        }
        break;
        
      case RECOVERY_STRATEGIES.ABORT:
        // Critical error, abort operation
        break;
        
      case RECOVERY_STRATEGIES.IGNORE:
        // Ignore error, continue operation
        return;
    }

    // Call custom error handler if provided
    if (onError) {
      return await onError(serviceError);
    }

    // Re-throw error if no custom handling
    throw serviceError;
  };
};
