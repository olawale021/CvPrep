import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

// For Vercel production, we'll use a hybrid approach:
// 1. In-memory for development
// 2. Vercel KV for production (when available)
// 3. Fallback to in-memory with shorter windows

const isDevelopment = process.env.NODE_ENV === 'development';
const isVercel = process.env.VERCEL === '1';

// In-memory store as fallback
const memoryStore = new Map<string, RequestRecord>();

// Vercel KV store (if available)
let kvStore: any = null;

// Initialize KV store for Vercel production
if (isVercel && !isDevelopment) {
  try {
    // Dynamically import Vercel KV only in production
    import('@vercel/kv').then(({ kv }) => {
      kvStore = kv;
    }).catch(() => {
      console.warn('Vercel KV not available, falling back to memory store');
    });
  } catch {
    console.warn('Vercel KV not available, falling back to memory store');
  }
}

export class VercelRateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getKey(req: NextRequest): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    const ip = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const path = new URL(req.url).pathname;
    
    return `ratelimit:${ip}:${userAgent.slice(0, 50)}:${path}`;
  }

  private getClientIP(req: NextRequest): string {
    // Vercel-specific headers
    const vercelIP = req.headers.get('x-vercel-forwarded-for');
    const forwarded = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    
    if (vercelIP) {
      return vercelIP.split(',')[0].trim();
    }
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return 'unknown';
  }

  private async getRecord(key: string): Promise<RequestRecord | null> {
    if (kvStore) {
      try {
        return await kvStore.get(key);
      } catch (error) {
        console.warn('KV store error, falling back to memory:', error);
        return memoryStore.get(key) || null;
      }
    }
    
    return memoryStore.get(key) || null;
  }

  private async setRecord(key: string, record: RequestRecord): Promise<void> {
    if (kvStore) {
      try {
        // Set with TTL in seconds
        const ttlSeconds = Math.ceil(this.config.windowMs / 1000);
        await kvStore.set(key, record, { ex: ttlSeconds });
        return;
      } catch (error) {
        console.warn('KV store error, falling back to memory:', error);
      }
    }
    
    // Fallback to memory store
    memoryStore.set(key, record);
  }

  async checkLimit(req: NextRequest): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalHits: number;
  }> {
    const key = this.getKey(req);
    const now = Date.now();

    let record = await this.getRecord(key);

    // If no record exists or the window has expired, create a new one
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
    }

    // Increment the count
    record.count++;
    await this.setRecord(key, record);

    const allowed = record.count <= this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - record.count);

    return {
      allowed,
      remaining,
      resetTime: record.resetTime,
      totalHits: record.count
    };
  }

  createMiddleware() {
    return async (req: NextRequest) => {
      const result = await this.checkLimit(req);
      
      if (!result.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': this.config.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
              'X-RateLimit-Store': kvStore ? 'vercel-kv' : 'memory'
            }
          }
        );
      }

      return null;
    };
  }
}

// Vercel-optimized rate limiters with shorter windows for memory fallback
export const vercelRateLimiters = {
  // AI endpoints - most restrictive
  ai: new VercelRateLimiter({
    windowMs: isVercel && !kvStore ? 5 * 60 * 1000 : 15 * 60 * 1000, // 5 min fallback, 15 min with KV
    maxRequests: isVercel && !kvStore ? 3 : 10, // Reduced for memory fallback
  }),

  // Auth endpoints
  auth: new VercelRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),

  // Upload endpoints
  upload: new VercelRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // More restrictive on Vercel
  }),

  // User endpoints
  user: new VercelRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 15, // Slightly reduced
  }),

  // General API
  api: new VercelRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20, // Reduced for Vercel
  })
};

// Cleanup function for memory store (only needed without KV)
if (!kvStore) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      if (now > record.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 2 * 60 * 1000); // Clean every 2 minutes on Vercel
} 