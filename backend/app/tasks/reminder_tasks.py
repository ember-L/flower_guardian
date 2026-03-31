from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.reminder import Reminder
from app.models.user import User
from app.services.reminder_service import get_season_factor, get_weather_factor
from app.services.weather_service import get_current_weather
from app.services.push_service import push_service


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
    """每日定时发送提醒"""
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
            # 获取用户信息
            user = db.query(User).filter(User.id == user_id).first()
            if not user or not user.username:
                continue

            # 收集提醒信息
            type_names = {"water": "浇水", "fertilize": "施肥", "prune": "修剪"}
            reminder_msgs = []
            for reminder in user_reminders_list:
                reminder_type = type_names.get(reminder.type, "养护")
                # 获取植物名称（从关联的 user_plant 或 plant 获取）
                plant_name = "植物"
                if reminder.user_plant and reminder.user_plant.nickname:
                    plant_name = reminder.user_plant.nickname
                elif reminder.plant and reminder.plant.name:
                    plant_name = reminder.plant.name
                reminder_msgs.append(f'"{plant_name}"需要{reminder_type}')

            # 发送推送
            title = "🌱 养护提醒"
            content = "您的植物：" + "，".join(reminder_msgs) + "，快去看看吧！"

            # 优先使用 Expo Push Token，其次用 JPush
            sent = push_service.send_to_user(
                user=user,
                title=title,
                content=content,
                data={"type": "daily_reminder", "user_id": user_id}
            )

            if sent:
                success_count += 1
                print(f"成功推送通知给用户 {user_id}")
            else:
                print(f"用户 {user_id} 推送失败，可能没有绑定 token")

        print(f"发送了 {success_count}/{len(user_reminders)} 条每日提醒推送")
        return success_count
    finally:
        db.close()


async def send_overdue_reminders():
    """发送逾期未处理的提醒"""
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
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                continue

            type_names = {"water": "浇水", "fertilize": "施肥", "prune": "修剪"}
            overdue_msgs = []
            for reminder in user_reminders_list:
                # 获取植物名称
                plant_name = "植物"
                if reminder.user_plant and reminder.user_plant.nickname:
                    plant_name = reminder.user_plant.nickname
                elif reminder.plant and reminder.plant.name:
                    plant_name = reminder.plant.name
                overdue_type = type_names.get(reminder.type, "养护")
                overdue_msgs.append(f'"{plant_name}"需要{overdue_type}')

            title = "⚠️ 提醒逾期"
            content = "以下植物还未养护：" + "，".join(overdue_msgs) + "，不要忘记哦！"

            push_service.send_to_user(
                user=user,
                title=title,
                content=content,
                data={"type": "overdue_reminder", "user_id": user_id}
            )

        return len(reminders)
    finally:
        db.close()


async def test_push(user_id: int):
    """测试推送功能"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            print(f"用户 {user_id} 不存在")
            return False

        title = "🧪 测试推送"
        content = "这是一条测试通知，推送功能正常！"

        result = push_service.send_to_user(
            user=user,
            title=title,
            content=content,
            data={"type": "test"}
        )

        print(f"测试推送结果: {'成功' if result else '失败'}")
        return result
    finally:
        db.close()