# 🧪 本地开发环境搭建（数据库 + 后端）

> 适用场景：FastAPI 跑在宿主机上，Docker 里只跑 PostgreSQL。
> 整套服务都用 Docker 启动的方式见根目录 [README](../README.md)。

## 0. 准备

- Docker Desktop（带 compose；`docker compose` 和旧的 `docker-compose` 都可以）
- Python 3.11+
- 预留 3 GB 以上磁盘：`torch`、`ultralytics` 这些依赖首次安装体积不小

## 1. 只启动数据库

```bash
docker compose up -d postgres

# STATUS 列出现 (healthy) 才算真的就绪
docker compose ps postgres
```

compose 里的健康检查是 `pg_isready -U flower_user -d flower_guardian`，容器刚起来时还要初始化一阵，别急着连。

| 配置项 | 值 |
| --- | --- |
| 容器名 | `flower_guardian_db` |
| 镜像 | `postgres:15-alpine`（compose 里用的是华为云镜像源） |
| 数据库 | `flower_guardian` |
| 用户 / 密码 | `flower_user` / `flower_password` |
| 端口 | `5432:5432` |

## 2. 配置 `backend/.env`

```bash
cd backend
cp .env.example .env
```

`.env.example` 里的账号是占位符 `user` / `password`，要换成 compose 里真正的账号，端口保持 `5432`：

```dotenv
DATABASE_URL=postgresql://flower_user:flower_password@localhost:5432/flower_guardian
```

> ⚠️ 不建 `.env` 时，`app/core/config.py` 的默认连接串是 `localhost:5555`，和 compose 暴露的 5432 对不上，接口会直接报数据库连接失败。

`.env` 要放在 `backend/` 目录下，`config.py` 按 `backend/.env` 读取。

## 3. 建表 + 写入种子数据

```bash
python -m app.db.seed
```

输出 `Added 5 plants to database` 表示成功。这个脚本是幂等的：库里已经有植物时会打印 `Database already has N plants` 直接返回，重复执行不会写入重复数据。

进容器确认表建出来了：

```bash
docker compose exec postgres psql -U flower_user -d flower_guardian -c '\dt'
```

## 4. 启动后端

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

打开 http://localhost:8000/docs 能看到接口文档，说明服务和数据库都正常。

## 5. 一键完成第 1、3 步

仓库里带了脚本：

```bash
./scripts/dev-db.sh
```

它会启动 postgres、轮询健康状态（最多 90 秒）、就绪后在 `backend/` 里执行 seed。前提是本机已经装好后端依赖。

## 6. 常见问题

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| seed 报 `connection refused` | 容器还在初始化 | 等 `docker compose ps postgres` 显示 healthy 再执行 |
| 报 `localhost:5555` 连不上 | 没建 `.env`，或 `.env` 里端口写错 | 按第 2 步补 `.env` |
| 报 `password authentication failed` | `.env` 还是模板里的 `user` / `password` | 改成 `flower_user` / `flower_password` |
| 5432 端口被占用 | 本机已经有 PostgreSQL 在跑 | `brew services stop postgresql@15`，或改 compose 里的端口映射 |
| 拉镜像很慢 | 访问 Docker Hub 网络不稳定 | compose 已配华为云镜像源，必要时换回 `postgres:15-alpine` |
| 想把数据全部重来 | 卷里留着旧数据 | `docker compose down -v`（会删除数据），再 `up -d postgres` |

## 7. 整套服务一起启动

```bash
docker compose up -d
```

`backend` 服务通过 `depends_on: condition: service_healthy` 等数据库就绪，启动命令里已经包含 `python -m app.db.seed`，不用手动执行第 3 步。
