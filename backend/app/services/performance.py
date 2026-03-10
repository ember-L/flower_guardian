"""
性能优化工具
包含模型缓存、批处理等性能优化功能
"""
import os
import time
from functools import lru_cache
from typing import List, Optional
from threading import Lock


class ModelCache:
    """模型缓存管理器"""

    _instance = None
    _lock = Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        self._models = {}
        self._cache_times = {}

    def get_model(self, model_name: str):
        """获取缓存的模型"""
        return self._models.get(model_name)

    def set_model(self, model_name: str, model):
        """缓存模型"""
        self._models[model_name] = model
        self._cache_times[model_name] = time.time()

    def clear_cache(self, model_name: Optional[str] = None):
        """清除模型缓存"""
        if model_name:
            self._models.pop(model_name, None)
            self._cache_times.pop(model_name, None)
        else:
            self._models.clear()
            self._cache_times.clear()

    def get_cache_info(self):
        """获取缓存信息"""
        return {
            "cached_models": list(self._models.keys()),
            "cache_times": self._cache_times
        }


class BatchProcessor:
    """批处理器 - 优化多个图像的处理"""

    def __init__(self, batch_size: int = 8):
        self.batch_size = batch_size

    def create_batches(self, items: list) -> list:
        """将列表分批"""
        batches = []
        for i in range(0, len(items), self.batch_size):
            batches.append(items[i:i + self.batch_size])
        return batches

    def process_batch(self, items: list, process_fn):
        """批量处理"""
        results = []
        batches = self.create_batches(items)

        for batch in batches:
            batch_results = process_fn(batch)
            results.extend(batch_results)

        return results


class RecognitionOptimizer:
    """识别优化器"""

    def __init__(self):
        self.cache = ModelCache()
        self.batch_processor = BatchProcessor(batch_size=8)

    @staticmethod
    @lru_cache(maxsize=128)
    def get_cached_result(image_hash: str):
        """缓存识别结果"""
        return None

    @staticmethod
    def hash_image(image_path: str) -> str:
        """生成图像哈希"""
        import hashlib
        with open(image_path, 'rb') as f:
            return hashlib.md5(f.read()).hexdigest()

    def optimize_recognition(
        self,
        image_paths: List[str],
        recognize_fn,
        use_cache: bool = True,
        use_batch: bool = True
    ):
        """优化识别流程"""
        results = []

        if use_batch:
            # 批量处理
            batches = self.batch_processor.create_batches(image_paths)
            for batch in batches:
                batch_results = []
                for img_path in batch:
                    # 检查缓存
                    if use_cache:
                        img_hash = self.hash_image(img_path)
                        cached = self.get_cached_result(img_hash)
                        if cached:
                            batch_results.append(cached)
                            continue

                    # 执行识别
                    result = recognize_fn(img_path)
                    batch_results.append(result)

                results.extend(batch_results)
        else:
            # 逐个处理
            for img_path in image_paths:
                result = recognize_fn(img_path)
                results.append(result)

        return results


# 性能配置
class PerformanceConfig:
    """性能配置"""

    # 模型配置
    MODEL_CACHE_ENABLED = True
    MODEL_WARM_UP = True

    # 批处理配置
    DEFAULT_BATCH_SIZE = 8
    MAX_BATCH_SIZE = 32

    # 图像配置
    DEFAULT_IMAGE_SIZE = 640
    MAX_IMAGE_SIZE = 1280

    # 缓存配置
    RESULT_CACHE_SIZE = 128
    CACHE_TTL = 3600  # 秒

    # 并发配置
    MAX_WORKERS = 4
    USE_MULTIPROCESSING = False


# 性能监控
class PerformanceMonitor:
    """性能监控"""

    def __init__(self):
        self.metrics = {
            "total_requests": 0,
            "cache_hits": 0,
            "total_processing_time": 0,
            "average_latency": 0
        }
        self._lock = Lock()

    def record_request(self, processing_time: float, cache_hit: bool = False):
        """记录请求"""
        with self._lock:
            self.metrics["total_requests"] += 1
            if cache_hit:
                self.metrics["cache_hits"] += 1
            self.metrics["total_processing_time"] += processing_time

            # 计算平均延迟
            total = self.metrics["total_requests"]
            if total > 0:
                self.metrics["average_latency"] = (
                    self.metrics["total_processing_time"] / total
                )

    def get_metrics(self) -> dict:
        """获取指标"""
        with self._lock:
            metrics = self.metrics.copy()
            if metrics["total_requests"] > 0:
                metrics["cache_hit_rate"] = (
                    metrics["cache_hits"] / metrics["total_requests"]
                )
            else:
                metrics["cache_hit_rate"] = 0
            return metrics

    def reset(self):
        """重置指标"""
        with self._lock:
            self.metrics = {
                "total_requests": 0,
                "cache_hits": 0,
                "total_processing_time": 0,
                "average_latency": 0
            }


# 全局性能监控实例
performance_monitor = PerformanceMonitor()


if __name__ == "__main__":
    # 示例: 使用性能优化
    optimizer = RecognitionOptimizer()

    # 测试批处理
    batch_processor = BatchProcessor(batch_size=4)
    items = list(range(10))
    batches = batch_processor.create_batches(items)
    print(f"Items: {items}")
    print(f"Batches: {batches}")

    # 测试性能监控
    monitor = PerformanceMonitor()
    monitor.record_request(0.5, cache_hit=False)
    monitor.record_request(0.3, cache_hit=True)
    print(f"Metrics: {monitor.get_metrics()}")
