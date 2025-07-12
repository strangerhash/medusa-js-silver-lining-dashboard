import { apiService } from './api';

export interface LogEntry {
  level: 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';
  category: 'AUTH' | 'USER' | 'TRANSACTION' | 'PORTFOLIO' | 'KYC' | 'SYSTEM';
  message: string;
  action?: string;
  resource?: string;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, any>;
}

class Logger {
  private async log(entry: LogEntry) {
    try {
      await apiService.createLog(entry);
    } catch (error) {
      console.error('Failed to log action:', error);
    }
  }

  info(message: string, options?: Partial<LogEntry>) {
    return this.log({
      level: 'INFO',
      category: 'SYSTEM',
      message,
      ...options
    });
  }

  warn(message: string, options?: Partial<LogEntry>) {
    return this.log({
      level: 'WARN',
      category: 'SYSTEM',
      message,
      ...options
    });
  }

  error(message: string, options?: Partial<LogEntry>) {
    return this.log({
      level: 'ERROR',
      category: 'SYSTEM',
      message,
      ...options
    });
  }

  audit(message: string, options?: Partial<LogEntry>) {
    return this.log({
      level: 'AUDIT',
      category: 'SYSTEM',
      message,
      ...options
    });
  }

  userAction(action: string, resource: string, resourceId: string, message: string, options?: Partial<LogEntry>) {
    return this.log({
      level: 'AUDIT',
      category: 'USER',
      action,
      resource,
      resourceId,
      message,
      ...options
    });
  }

  kycAction(action: string, resourceId: string, message: string, options?: Partial<LogEntry>) {
    return this.log({
      level: 'AUDIT',
      category: 'KYC',
      action,
      resource: 'KYC',
      resourceId,
      message,
      ...options
    });
  }

  transactionAction(action: string, resourceId: string, message: string, options?: Partial<LogEntry>) {
    return this.log({
      level: 'AUDIT',
      category: 'TRANSACTION',
      action,
      resource: 'TRANSACTION',
      resourceId,
      message,
      ...options
    });
  }
}

export const logger = new Logger(); 