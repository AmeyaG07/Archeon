# Contributing to ArcheOn Design Studio

Thank you for contributing to ArcheOn Design Studio.

## Development Workflow

1. Create a feature or fix branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make changes in the active root Next.js app (`src/`, `public/`) or the Spring Boot backend (`backend/`).
   - Do **not** edit legacy files under `frontend/`.
3. Verify your changes locally before opening a pull request:
   ```bash
   npx tsc --noEmit
   npm run build
   mvn -f backend/pom.xml clean package -DskipTests -B
   ```
4. Keep commits focused and descriptive, and never commit `.env` files or secrets.

## Pull Request Checks

All pull requests targeting `main` automatically run [.github/workflows/ci.yml](./.github/workflows/ci.yml):
- **Backend CI**: Java 21 Maven compile & package
- **Frontend CI**: `npm ci`, `npx tsc --noEmit`, and `npm run build`
- **Docker Build Validation**: Multi-stage image builds for `./backend/Dockerfile` and `./Dockerfile`
