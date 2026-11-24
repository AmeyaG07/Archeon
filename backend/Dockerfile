# ==========================================
# ArcheOn Design Studio — Backend Dockerfile
# Multi-stage production container
# ==========================================

# Stage 1: Build Spring Boot JAR with Maven
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Cache dependency layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Compile and package application
COPY src ./src
RUN mvn clean package -DskipTests -B

# Stage 2: Minimal hardened runtime image
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -S archeon && adduser -S archeon -G archeon

COPY --from=builder /app/target/*.jar app.jar
RUN mkdir -p /app/uploads && chown -R archeon:archeon /app

USER archeon
EXPOSE 8080

ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
