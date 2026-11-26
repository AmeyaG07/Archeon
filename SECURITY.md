# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ArcheOn Design Studio, please report it privately to the maintainers rather than opening a public GitHub issue.

Include:
- Affected route, endpoint, or component
- Steps to reproduce or proof-of-concept request
- Potential impact

## Security Controls & Production Checklist

- **Authentication & RBAC**: Stateless JWT authentication with role-based access control (`ADMIN`, `STAFF`, `CLIENT`, `VENDOR`) enforced in Spring Security (`SecurityConfig.java`).
- **Production Secrets**: Always replace default values in `.env.production.example` (`POSTGRES_PASSWORD`, `APP_JWT_SECRET`, `APP_ENCRYPTION_SECRET`) before deploying.
- **Database Console**: H2 web console is disabled by default (`SPRING_H2_CONSOLE_ENABLED=false`) and should never be enabled in production.
- **CORS**: Configure `APP_CORS_ALLOWED_ORIGINS` strictly to your deployed frontend origin(s).
