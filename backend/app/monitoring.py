from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from fastapi import APIRouter, Response, Request
import time

REQUEST_COUNT = Counter(
    'http_requests_total', 'Total HTTP Requests', ['method', 'endpoint', 'http_status']
)
REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds', 'HTTP Request latency', ['endpoint']
)

router = APIRouter()

@router.get('/metrics')
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

# Middleware for Prometheus metrics
class PrometheusMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'http':
            method = scope['method']
            path = scope['path']
            start_time = time.time()
            status_code = 500
            async def send_wrapper(message):
                nonlocal status_code
                if message['type'] == 'http.response.start':
                    status_code = message['status']
                await send(message)
            await self.app(scope, receive, send_wrapper)
            resp_time = time.time() - start_time
            REQUEST_COUNT.labels(method, path, status_code).inc()
            REQUEST_LATENCY.labels(path).observe(resp_time)
        else:
            await self.app(scope, receive, send)
