// JPush 推送服务
// 用于在 App 中注册设备并设置别名

class JPushService {
  private initialized = false;
  private registrationId: string = '';
  private JPush: any = null;

  // 初始化 JPush
  init = async (): Promise<void> => {
    if (this.initialized) return;

    try {
      // 动态导入 JPush
      const JPushModule = require('jpush-react-native');
      this.JPush = JPushModule.default || JPushModule;
      console.log('[JPush] 模块加载:', typeof this.JPush);

      // 检查模块是否有 init 方法
      if (this.JPush && typeof this.JPush.init === 'function') {
        this.JPush.init();
        console.log('[JPush] 初始化成功');
      } else {
        console.log('[JPush] init 方法不可用');
      }

      // 监听注册成功事件
      if (this.JPush && typeof this.JPush.addRegistrationEventListener === 'function') {
        this.JPush.addRegistrationEventListener((result: any) => {
          console.log('[JPush] 注册成功:', result);
          this.registrationId = result.registerID;
        });
      }

      this.initialized = true;
    } catch (error) {
      console.error('[JPush] 初始化失败:', error);
    }
  };

  // 设置别名（用于后端通过别名推送）
  setAlias = (userId: string): void => {
    if (!this.JPush) {
      console.log('[JPush] 未初始化，延迟设置别名');
      setTimeout(() => this.setAlias(userId), 2000);
      return;
    }

    if (!userId) {
      console.log('[JPush] 用户ID为空，不设置别名');
      return;
    }

    try {
      console.log('[JPush] 设置别名:', userId);

      if (typeof this.JPush.setAlias === 'function') {
        // setAlias 需要传入对象 { alias: string, sequence: number }
        this.JPush.setAlias({ alias: userId, sequence: Date.now() }, (success: any) => {
          console.log('[JPush] 设置别名成功:', success);
        }, (error: any) => {
          console.error('[JPush] 设置别名失败:', error);
        });
      } else {
        console.log('[JPush] setAlias 方法不可用');
      }
    } catch (error) {
      console.error('[JPush] 设置别名异常:', error);
    }
  };

  // 删除别名
  deleteAlias = (): void => {
    if (this.JPush && typeof this.JPush.deleteAlias === 'function') {
      this.JPush.deleteAlias((success: any) => {
        console.log('[JPush] 删除别名成功');
      }, (error: any) => {
        console.error('[JPush] 删除别名失败:', error);
      });
    }
  };

  // 获取 Registration ID
  getRegistrationId = (): string => {
    return this.registrationId;
  };
}

export const jpushService = new JPushService();
export default jpushService;
