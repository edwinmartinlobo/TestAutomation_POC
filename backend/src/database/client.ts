import { Pool, PoolClient } from 'pg';
import { appConfig } from '../config/app.config';
import { logger } from '../utils/logger';

class DatabaseClient {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: appConfig.database.url,
      min: appConfig.database.poolMin,
      max: appConfig.database.poolMax,
    });

    this.pool.on('error', (err) => {
      logger.error('Unexpected database error', { error: err.message });
    });

    this.pool.on('connect', () => {
      logger.debug('Database connection established');
    });
  }

  /**
   * Execute a query
   */
  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const result = await this.pool.query(text, params);
      const duration = Date.now() - start;

      logger.debug('Query executed', {
        duration,
        rows: result.rowCount,
      });

      return result;
    } catch (error: any) {
      logger.error('Query failed', {
        error: error.message,
        query: text.substring(0, 100),
      });
      throw error;
    }
  }

  /**
   * Get a client for transactions
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Execute within a transaction
   */
  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Database connections closed');
  }

  /**
   * Test database connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      logger.info('Database connection test successful');
      return true;
    } catch (error: any) {
      logger.error('Database connection test failed', {
        error: error.message,
      });
      return false;
    }
  }
}

// Export singleton instance
export const db = new DatabaseClient();
