import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { SystemService } from './system.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
    private readonly logger = new Logger(LoggingInterceptor.name);

    constructor(private systemService: SystemService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest();
        const method = req.method;
        const url = req.url;
        const body = req.body;

        return next
            .handle()
            .pipe(
                // Log successful "write" operations or specific important actions
                tap(() => {
                    if (['POST', 'PUT', 'DELETE'].includes(method)) {
                        this.systemService.createLog(
                            'info',
                            `${method} ${url}`,
                            { body: this.sanitize(body), user: req.user?.email }
                        ).catch(e => this.logger.error('Failed to log info', e));
                    }
                }),
                // Log all errors
                catchError((err) => {
                    this.systemService.createLog(
                        'error',
                        `Failed ${method} ${url}`,
                        { error: err.message, body: this.sanitize(body), user: req.user?.email }
                    ).catch(e => this.logger.error('Failed to log error', e));
                    throw err;
                }),
            );
    }

    private sanitize(body: any) {
        if (!body) return body;
        const sanitized = { ...body };
        if (sanitized.password) sanitized.password = '***';
        return sanitized;
    }
}
