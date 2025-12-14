# 🔧 Instruções para Resolver Problema de Container Pendente na VPS

## ❌ Problema Identificado
O erro `task has not been scheduled` ocorre porque as imagens Docker foram construídas para **ARM64** (macOS) mas a VPS precisa de **AMD64/x86_64** (Linux).

## ✅ Soluções

### Solução 1: Reconstruir Imagens na VPS (RECOMENDADO)

Na sua VPS Linux, execute:

```bash
# 1. Clone o repositório (se ainda não tiver)
git clone <seu-repositorio>
cd TypeAtomos

# 2. Faça login no Docker Hub
docker login

# 3. Construa as imagens para AMD64 (será automático na VPS Linux)
docker buildx build --platform linux/amd64 \
  -t rannielson/typebotatomos-builder:latest \
  --build-arg SCOPE=builder \
  --push .

docker buildx build --platform linux/amd64 \
  -t rannielson/typebotatomos-viewer:latest \
  --build-arg SCOPE=viewer \
  --push .

# 4. Ou use o script automatizado
chmod +x scripts/build-and-push-amd64.sh
./scripts/build-and-push-amd64.sh
```

### Solução 2: Usar docker-compose.yml Atualizado

O `docker-compose.yml` foi atualizado para:
- Usar imagens do Docker Hub (`image: rannielson/typebotatomos-*`)
- Especificar plataforma `platform: linux/amd64`

Na VPS, execute:

```bash
# Fazer pull forçando a plataforma correta
docker pull --platform linux/amd64 rannielson/typebotatomos-builder:latest
docker pull --platform linux/amd64 rannielson/typebotatomos-viewer:latest

# Subir os containers
docker-compose up -d
```

### Solução 3: Construir Localmente na VPS

Se você não quiser usar o Docker Hub, construa diretamente na VPS:

```bash
# Na VPS Linux
cd TypeAtomos

# O docker-compose.yml já está configurado para construir
# Mas você pode forçar a plataforma
docker-compose build --build-arg BUILDPLATFORM=linux/amd64

# Ou modificar temporariamente o docker-compose.yml para usar build:
# (remover as linhas `image:` e `platform:` e descomentar `build:`)
```

## 🔍 Verificar Arquitetura

```bash
# Verificar arquitetura de uma imagem
docker inspect rannielson/typebotatomos-builder:latest | grep -i arch

# Ou usar manifest
docker manifest inspect rannielson/typebotatomos-builder:latest | grep architecture
```

## 📝 Arquivos Modificados

- ✅ `docker-compose.yml` - Atualizado para usar imagens do Docker Hub com `platform: linux/amd64`
- ✅ `scripts/build-and-push-amd64.sh` - Script para construir imagens AMD64

## ⚠️ Importante

As imagens atuais no Docker Hub (`rannielson/typebotatomos-*:latest`) foram construídas para ARM64. Você precisa:

1. **OU** reconstruir na VPS (Solução 1 - Recomendado)
2. **OU** aguardar o build no macOS completar e fazer push (pode demorar)
3. **OU** usar `docker pull --platform linux/amd64` que tentará baixar a versão correta se disponível

## 🚀 Próximos Passos

1. Na VPS, execute a Solução 1 (reconstruir na VPS)
2. Aguarde o build completar
3. Execute `docker-compose up -d`
4. Verifique os logs: `docker-compose logs -f`
