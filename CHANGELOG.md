# Changelog

All notable changes to ArcheOn Design Studio are documented in this file.

## [1.0.0] - 2026-11-26

### Added
- Dedicated `/preloader` route with `OpeningPreloader` (`4200ms` duration + studio logo `/brand-assets/logo-transparent.png`) and automatic redirect to `/`.
- Client and Vendor portal routes: `/vendor/notifications`, `/client/notifications`, `/client/documents`, and shared `NotificationsPageView`.
- Project lifecycle controls on `/admin/projects/[id]` (status transitions and phase/milestone creation).
- Production hosting support: root standalone `Dockerfile`, `.dockerignore`, updated `docker-compose.yml`, configurable `APP_CORS_ALLOWED_ORIGINS`, and GitHub Actions CI/CD + Release workflows (`ci.yml`, `release.yml`).
- Repository documentation: `README.md`, `LICENSE` (MIT), `DEPLOYMENT.md`, `CONTRIBUTING.md`, `SECURITY.md`, and `CHANGELOG.md`.

### Changed
- Desktop sidebars in Admin, Vendor, and Client portals remain expanded (`270px`) for immediate navigation.
- Standardized action button sizing and padding in `AdminWebsiteProjectList`.
- Added keyboard accessibility (`role="button"`, `tabIndex`, `Enter`/`Space`) to `ProjectImageCard`.
- Optimized homepage video playback (`ArchitecturalRevealHero`, `ServicesSection`, `ArchitecturalGlobe`) with `IntersectionObserver` pause/resume and GPU-friendly compositing.
