from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.reminder import Reminder
from app.models.user import User
from app.services.reminder_service import get_season_factor, get_weather_factor
from app.services.weather_service import get_current_weather
from app.services.connection_manager import connection_manager


async def check_upcoming_reminders():
    """检查即将到期的提醒"""
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        tomorrow = now + timedelta(days=1)

        # 查找明天需要提醒的记录
        reminders = db.query(Reminder).filter(
            Reminder.enabled == True,
            Reminder.next_due <= tomorrow,
            Reminder.next_due >= now
        ).all()

        for reminder in reminders:
            print(f"Reminder due: {reminder.id}, type: {reminder.type}")

        return len(reminders)
    finally:
        db.close()


async def refresh_weather_factors():
    """刷新所有活跃提醒的天气系数"""
    db = SessionLocal()
    try:
        reminders = db.query(Reminder).filter(
            Reminder.enabled == True,
            Reminder.location.isnot(None)
        ).all()

        season_factor = get_season_factor()

        for reminder in reminders:
            if reminder.location:
                try:
                    weather = await get_current_weather(reminder.location)
                    if weather:
                        reminder.weather_factor = get_weather_factor(
                            weather.get("temperature"),
                            weather.get("humidity"),
                            weather.get("precipitation")
                        )
                except Exception as e:
                    print(f"Failed to get weather for {reminder.location}: {e}")

        db.commit()
        return len(reminders)
    finally:
        db.close()


async def send_daily_reminders():
    """每日定时发送提醒 - 通过 WebSocket 推送"""
    db = SessionLocal()
    try:
        now = datetime.utcnow()

        # 查找当天需要提醒的记录（已过期或即将到期）
        due_threshold = now + timedelta(hours=2)  # 未来2小时内也算
        reminders = db.query(Reminder).filter(
            Reminder.enabled == True,
            Reminder.next_due <= due_threshold
        ).all()

        # 按用户分组
        user_reminders = {}
        for reminder in reminders:
            if reminder.user_id not in user_reminders:
                user_reminders[reminder.user_id] = []
            user_reminders[reminder.user_id].append(reminder)

        # 为每个用户发送推送通知
        success_count = 0
        for user_id, user_reminders_list in user_reminders.items():
            type_names = {"water": "浇水", "fertilize": "施肥", "prune": "修剪"}

            for reminder in user_reminders_list:
                reminder_type = type_names.get(reminder.type, "养护")
                # 获取植物名称（从关联的 user_plant 或 plant 获取）
                plant_name = "植物"
                if reminder.user_plant and reminder.user_plant.nickname:
                    plant_name = reminder.user_plant.nickname
                elif reminder.plant and reminder.plant.name:
                    plant_name = reminder.plant.name

                # 通过 WebSocket 推送
                pushed = await connection_manager.push_notification(
                    user_id,
                    {
                        "action": "reminder",
                        "data": {
                            "id": reminder.id,
                            "title": "🌱 养护提醒",
                            "body": f'您的"{plant_name}"需要{reminder_type}啦！',
                            "reminder_type": reminder.type,
                            "plant_name": plant_name,
                        }
                    }
                )

                if pushed:
                    success_count += 1
                    print(f"[Push] 推送提醒给用户 {user_id}: {plant_name} 需要 {reminder_type}")

        print(f"发送了 {success_count} 条 WebSocket 推送")
        return success_count
    finally:
        db.close()


async def send_overdue_reminders():
    """发送逾期未处理的提醒 - 通过 WebSocket 推送"""
    db = SessionLocal()
    try:
        now = datetime.utcnow()

        # 查找已逾期超过1小时的提醒
        overdue_threshold = now - timedelta(hours=1)
        reminders = db.query(Reminder).filter(
            Reminder.enabled == True,
            Reminder.next_due < overdue_threshold
        ).all()

        # 按用户分组
        user_reminders = {}
        for reminder in reminders:
            if reminder.user_id not in user_reminders:
                user_reminders[reminder.user_id] = []
            user_reminders[reminder.user_id].append(reminder)

        # 为每个用户发送推送
        for user_id, user_reminders_list in user_reminders.items():
            type_names = {"water": "浇水", "fertilize": "施肥", "prune": "修剪"}

            for reminder in user_reminders_list:
                # 获取植物名称
                plant_name = "植物"
                if reminder.user_plant and reminder.user_plant.nickname:
                    plant_name = reminder.user_plant.nickname
                elif reminder.plant and reminder.plant.name:
                    plant_name = reminder.plant.name
                overdue_type = type_names.get(reminder.type, "养护")

                # 通过 WebSocket 推送
                await connection_manager.push_notification(
                    user_id,
                    {
                        "action": "reminder",
                        "data": {
                            "id": reminder.id,
                            "title": "⚠️ 提醒逾期",
                            "body": f'您的"{plant_name}"需要{overdue_type}，不要忘记哦！',
                            "reminder_type": reminder.type,
                            "plant_name": plant_name,
                        }
                    }
                )

        return len(reminders)
    finally:
        db.close()


async def test_ws_push(user_id: int):
    """通过 WebSocket 发送测试推送"""

    print(f"[Push] 发送测试推送给用户 {user_id}")

    result = await connection_manager.push_notification(
        user_id,
        {
            "action": "reminder",
            "data": {
                "id": 0,
                "title": "🧪 WebSocket 测试",
                "body": "这是一条 WebSocket 测试推送，收到此消息说明连接正常！",
                "reminder_type": "test",
                "plant_name": "测试植物",
            }
        }
    )

    if result:
        print(f"[Push] 测试推送成功 - 用户 {user_id} 的连接在线")
    else:
        print(f"[Push] 测试推送失败 - 用户 {user_id} 可能没有连接")

    return result


async def test_all_connections():
    """测试所有连接"""

    ws_count = len(connection_manager.ws_connections)

    print(f"[连接状态] WebSocket: {ws_count}")
    print(f"[连接状态] WebSocket 用户: {list(connection_manager.ws_connections.keys())}")

    return {
        "websocket_connections": ws_count,
        "websocket_users": list(connection_manager.ws_connections.keys())
    }
