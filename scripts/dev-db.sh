#!/usr/bin/env bash
# 一键启动本地开发数据库：起 postgres -> 等健康检查通过 -> 在 backend/ 里执行 seed
# 用法：./scripts/dev-db.sh
set -euo pipefail

cd "$(dirname "$0")/.."

CONTAINER_NAME="flower_guardian_db"
WAIT_SECONDS="${WAIT_SECONDS:-90}"

if docker compose version >/dev/null 2>&1; then
  dc() { docker compose "$@"; }
elif command -v docker-compose >/dev/null 2>&1; then
  dc() { docker-compose "$@"; }
else
  echo "找不到 docker compose，请先安装并启动 Docker Desktop" >&2
  exit 1
fi

health_status() {
  docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}unknown{{end}}' "${CONTAINER_NAME}" 2>/dev/null || echo "missing"
}

dc up -d postgres
echo "等待 PostgreSQL 就绪（最多 ${WAIT_SECONDS} 秒）..."

elapsed=0
while [ "${elapsed}" -lt "${WAIT_SECONDS}" ]; do
  if [ "$(health_status)" = "healthy" ]; then
    break
  fi
  sleep 2
  elapsed=$((elapsed + 2))
done

if [ "$(health_status)" != "healthy" ]; then
  echo "数据库在 ${WAIT_SECONDS} 秒内没有就绪。" >&2
  echo "查看日志：docker logs ${CONTAINER_NAME}" >&2
  exit 1
fi

echo "数据库已就绪，开始建表并写入种子数据..."
cd backend
python -m app.db.seed
echo "完成。启动后端：uvicorn app.main:app --reload --port 8000"
