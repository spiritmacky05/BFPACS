# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy go mod and sum files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application (static binary, no CGO)
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/api-server ./cmd/api/main.go

# Final stage — pinned version prevents supply-chain drift
FROM alpine:3.21

WORKDIR /app

# Add required packages
RUN apk --no-cache add ca-certificates tzdata wget

# Copy binary from builder
COPY --from=builder /app/api-server .

# Create a non-root user
RUN adduser -D bfp
USER bfp

# Expose port
EXPOSE 8080

# Command to run the executable
CMD ["./api-server"]
