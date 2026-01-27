import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private registry = new Registry();

  // Metrics counters
  private httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status'],
    registers: [this.registry],
  });

  private dbQueriesTotal = new Counter({
    name: 'db_queries_total',
    help: 'Total database queries',
    labelNames: ['operation', 'table'],
    registers: [this.registry],
  });

  private httpRequestDuration = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route'],
    registers: [this.registry],
  });

  private activeConnections = new Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
    registers: [this.registry],
  });

  constructor() {
    collectDefaultMetrics({ register: this.registry });
  }

  recordHttpRequest(method: string, route: string, status: number, duration: number) {
    this.httpRequestsTotal.labels(method, route, String(status)).inc();
    this.httpRequestDuration.labels(method, route).observe(duration / 1000);
  }

  recordDbQuery(operation: string, table: string) {
    this.dbQueriesTotal.labels(operation, table).inc();
  }

  setActiveConnections(count: number) {
    this.activeConnections.set(count);
  }

  collectMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
