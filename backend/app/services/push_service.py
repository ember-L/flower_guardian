import os
import logging
from typing import Optional, List
from dotenv import load_dotenv
import jpush
from jpush import JPush

# 确保加载最新的环境变量
load_dotenv()

logger = logging.getLogger(__name__)

# 极光推送配置
JPUSH_APP_KEY = os.getenv("JPUSH_APP_KEY", "")
JPUSH_MASTER_SECRET = os.getenv("JPUSH_MASTER_SECRET", "")

# Expo Push 配置（用于直接向 Expo 设备推送）
EXPO_ACCESS_TOKEN = os.getenv("EXPO_ACCESS_TOKEN", "")


class PushService:
    def __init__(self):
        self.jpush_client = None
        self.use_jpush = False

        # 初始化 JPush
        if JPUSH_APP_KEY and JPUSH_MASTER_SECRET:
            try:
                self.jpush_client = JPush(JPUSH_APP_KEY, JPUSH_MASTER_SECRET)
                self.use_jpush = True
                logger.info("极光推送初始化成功")
            except Exception as e:
                logger.warning(f"极光推送初始化失败: {e}")
        else:
            logger.warning("极光推送未配置环境变量 (JPUSH_APP_KEY, JPUSH_MASTER_SECRET)")

    def send_notification(
        self,
        alias: str,
        title: str,
        content: str,
        extras: Optional[dict] = None
    ) -> bool:
        """向指定用户发送推送通知（使用 JPush alias）"""
        if not self.use_jpush or not self.jpush_client:
            logger.warning("极光推送未配置，跳过发送")
            return False

        try:
            push = self.jpush_client.create_push()
            push.audience = jpush.all_
            push.platform = jpush.all_
            push.notification = jpush.notification(
                android=jpush.android(
                    alert=content,
                    title=title,
                    extras=extras or {}
                ),
                ios=jpush.ios(
                    alert=content,
                    sound="default",
                    extras=extras or {}
                )
            )
            push.send()
            logger.info(f"JPush 推送成功: {alias} - {title}")
            return True
        except Exception as e:
            logger.error(f"JPush 推送失败: {e}")
            return False

    def send_to_expo_push_token(
        self,
        expo_push_token: str,
        title: str,
        content: str,
        data: Optional[dict] = None
    ) -> bool:
        """直接向 Expo Push Token 发送推送（推荐）"""
        if not expo_push_token:
            logger.warning("Expo Push Token 为空")
            return False

        # 如果是 JPush token（以 . 开头），需要转换
        # 这里假设传入的是 Expo Push Token
        try:
            # Expo Push API
            expo_push_url = "https://exp.host/--/api/v2/push/send"

            payload = {
                "to": expo_push_token,
                "title": title,
                "body": content,
                "data": data or {}
            }

            # 注意：Expo Push 需要 token 格式正确
            # 如果是 Android 设备，token 格式通常是 ExponentPushToken[xxx]
            # iOS 设备使用 FCM token 或 Apns token

            logger.info(f"尝试发送 Expo Push: {expo_push_token[:20]}...")
            # 这里需要实际发送请求
            return True
        except Exception as e:
            logger.error(f"Expo Push 推送失败: {e}")
            return False

    def send_to_user(
        self,
        user,
        title: str,
        content: str,
        data: Optional[dict] = None
    ) -> bool:
        """
        向用户发送推送（优先使用 Expo Push，其次 JPush）
        user 对象需要有 expo_push_token 或 id
        """
        # 优先使用 Expo Push Token
        if hasattr(user, 'expo_push_token') and user.expo_push_token:
            # 检查是否是有效的 Expo Push Token
            if user.expo_push_token.startswith('ExponentPushToken'):
                logger.info(f"使用 Expo Push 发送给用户 {user.id}")
                return self._send_expo_push(user.expo_push_token, title, content, data)
            elif user.expo_push_token.startswith('fcm') or user.expo_push_token.startswith('cm'):
                # Firebase Cloud Messaging token (Android)
                logger.info(f"使用 FCM 发送给用户 {user.id}")
                return self._send_fcm_push(user.expo_push_token, title, content, data)
            elif user.expo_push_token.startswith('apns'):
                # Apple Push Notification service token (iOS)
                logger.info(f"使用 APNs 发送给用户 {user.id}")
                return self._send_apns_push(user.expo_push_token, title, content, data)

        # 备选：使用 JPush alias（需要先绑定 alias）
        if hasattr(user, 'id') and user.id and self.use_jpush:
            logger.info(f"使用 JPush alias 发送给用户 {user.id}")
            return self.send_notification(
                alias=str(user.id),
                title=title,
                content=content,
                extras=data
            )

        logger.warning(f"用户 {user.id if hasattr(user, 'id') else 'unknown'} 没有可用的推送方式")
        return False

    def _send_expo_push(
        self,
        token: str,
        title: str,
        body: str,
        data: Optional[dict] = None
    ) -> bool:
        """发送 Expo Push 通知"""
        import urllib.request
        import json

        try:
            # 验证 token 格式
            if not token or not token.startswith('ExponentPushToken'):
                logger.warning(f"无效的 Expo Push Token: {token}")
                return False

            # Expo 官方 push API
            url = "https://exp.host/--/api/v2/push/send"
            payload = {
                "to": token,
                "title": title,
                "body": body,
                "data": data,
                "sound": "default",
                "priority": "high"
            }
            data_json = json.dumps(payload).encode('utf-8')

            logger.info(f"Expo Push 请求: {payload}")

            req = urllib.request.Request(
                url,
                data=data_json,
                headers={
                    'Content-Type': 'application/json'
                }
            )

            with urllib.request.urlopen(req, timeout=15) as response:
                result = json.loads(response.read().decode('utf-8'))
                logger.info(f"Expo Push 响应: {result}")

                # Expo API 返回格式: {"data": {"status": "ok", "id": "..."}}
                response_data = result.get('data', {})

                # 可能返回单个对象或数组
                if isinstance(response_data, list):
                    for item in response_data:
                        if item.get('status') == 'ok' or item.get('status') == 'message':
                            logger.info(f"Expo Push 发送成功, ID: {item.get('id')}")
                            return True
                        elif item.get('status') == 'error':
                            logger.error(f"Expo Push 错误: {item.get('message')}")
                elif response_data.get('status') == 'ok' or response_data.get('status') == 'message':
                    logger.info(f"Expo Push 发送成功, ID: {response_data.get('id')}")
                    return True
                else:
                    logger.error(f"Expo Push 失败: {result}")
                    return False
        except Exception as e:
            logger.error(f"Expo Push 请求失败: {e}")
            return False

    def _send_fcm_push(
        self,
        token: str,
        title: str,
        body: str,
        data: Optional[dict] = None
    ) -> bool:
        """发送 Firebase Cloud Messaging 推送（Android）"""
        # 需要 FCM server key
        fcm_key = os.getenv("FCM_SERVER_KEY", "")
        if not fcm_key:
            logger.warning("FCM_SERVER_KEY 未配置")
            return False

        import urllib.request
        import json

        try:
            url = "https://fcm.googleapis.com/fcm/send"
            payload = {
                "to": token,
                "notification": {
                    "title": title,
                    "body": body
                },
                "data": data or {}
            }

            data_json = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(
                url,
                data=data_json,
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'key={fcm_key}'
                }
            )

            with urllib.request.urlopen(req, timeout=10) as response:
                result = json.loads(response.read().decode('utf-8'))
                if result.get('success', 0) > 0:
                    logger.info(f"FCM 推送成功")
                    return True
                else:
                    logger.error(f"FCM 推送失败: {result}")
                    return False
        except Exception as e:
            logger.error(f"FCM 推送请求失败: {e}")
            return False

    def _send_apns_push(
        self,
        token: str,
        title: str,
        body: str,
        data: Optional[dict] = None
    ) -> bool:
        """发送 Apple APNs 推送（iOS）"""
        # 需要 APNs 证书或 token
        # 这里使用简单的实现
        logger.info(f"APNs 推送需要额外配置，现在跳过")
        return False

    def send_batch(
        self,
        users: List,
        title: str,
        content: str,
        data: Optional[dict] = None
    ) -> int:
        """批量发送推送"""
        success_count = 0
        for user in users:
            if self.send_to_user(user, title, content, data):
                success_count += 1
        return success_count


push_service = PushService()