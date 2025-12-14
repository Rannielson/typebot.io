#!/bin/bash

# Script para construir e fazer push das imagens Docker para linux/amd64
# Necessário para VPS Linux quando construído no macOS (ARM64)

set -e

echo "🔧 Configurando Docker Buildx para multiplataforma..."
docker buildx create --name multiplatform --use 2>/dev/null || docker buildx use multiplatform || true

echo "🏗️  Construindo imagem builder para linux/amd64..."
docker buildx build \
  --platform linux/amd64 \
  -t rannielson/typebotatomos-builder:latest \
  --build-arg SCOPE=builder \
  --push \
  .

echo "🏗️  Construindo imagem viewer para linux/amd64..."
docker buildx build \
  --platform linux/amd64 \
  -t rannielson/typebotatomos-viewer:latest \
  --build-arg SCOPE=viewer \
  --push \
  .

echo "✅ Imagens construídas e enviadas para Docker Hub (linux/amd64)!"
