# Instruções para Deploy na VPS Linux

## Problema
As imagens Docker foram construídas no macOS (ARM64) mas a VPS precisa de AMD64/x86_64.

## Solução

### Opção 1: Usar imagens do Docker Hub (Recomendado)

O `docker-compose.yml` já foi atualizado para usar as imagens do Docker Hub. Na VPS, execute:

```bash
# Fazer pull das imagens (elas serão baixadas automaticamente quando você rodar docker-compose up)
docker pull rannielson/typebotatomos-builder:latest
docker pull rannielson/typebotatomos-viewer:latest

# Ou simplesmente rodar o docker-compose
docker-compose up -d
```

### Opção 2: Reconstruir as imagens na VPS

Se as imagens no Docker Hub ainda não estiverem disponíveis para AMD64, você pode reconstruir na VPS:

```bash
# Na VPS Linux
git clone <seu-repositorio>
cd TypeAtomos

# Construir as imagens localmente (já será AMD64 por padrão)
docker-compose build

# Ou usar o script
./scripts/build-and-push-amd64.sh
```

### Opção 3: Forçar plataforma no docker-compose

O `docker-compose.yml` já foi atualizado com `platform: linux/amd64`, mas se ainda houver problemas:

```bash
# Na VPS, forçar pull com plataforma específica
docker pull --platform linux/amd64 rannielson/typebotatomos-builder:latest
docker pull --platform linux/amd64 rannielson/typebotatomos-viewer:latest
```

## Verificar arquitetura das imagens

```bash
# Verificar a arquitetura de uma imagem
docker inspect rannielson/typebotatomos-builder:latest | grep Architecture

# Ou usar docker manifest
docker manifest inspect rannielson/typebotatomos-builder:latest
```

## Nota Importante

As imagens no Docker Hub precisam ser construídas para `linux/amd64`. O script `scripts/build-and-push-amd64.sh` está construindo as imagens corretas agora.
