# Flower Guardian Backend Dockerfile
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/python:3.11-slim
 #python:3.11-slim

WORKDIR /app

RUN rm -f /etc/apt/sources.list.d/debian.sources \
    && echo "deb http://mirrors.aliyun.com/debian/ bookworm main contrib non-free non-free-firmware" \
    > /etc/apt/sources.list \
    && echo "deb http://mirrors.aliyun.com/debian/ bookworm-updates main contrib non-free non-free-firmware" \
    >> /etc/apt/sources.list \
    && echo "deb http://mirrors.aliyun.com/debian-security/ bookworm-security main contrib non-free non-free-firmware" \
    >> /etc/apt/sources.list

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libwebp-dev \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .

RUN pip install --upgrade pip  -i https://pypi.tuna.tsinghua.edu.cn/simple

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple --root-user-action=ignore
# 复制应用代码（排除 .git, __pycache__, venv 等）
COPY . .

# 创建持久化存储目录
RUN mkdir -p /var/www/uploads && chmod 755 /var/www/uploads

# 暴露端口
EXPOSE 8000

# 健康检查

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
