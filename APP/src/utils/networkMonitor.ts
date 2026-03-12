// 网络状态监测工具
// 使用 React Native 内置的 NetInfo API

import { NetInfo, NetInfoState } from 'react-native';

export type NetworkStatus = 'connected' | 'disconnected' | 'unknown';

class NetworkMonitor {
  private listeners: ((isConnected: boolean) => void)[] = [];
  private currentStatus: boolean = true;
  private isInitialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 获取初始网络状态
    const state = await NetInfo.fetch();
    this.currentStatus = state.isConnected ?? false;

    // 监听网络变化
    NetInfo.addEventListener(this.handleNetworkChange);

    this.isInitialized = true;
    console.log('[NetworkMonitor] Initialized, connected:', this.currentStatus);
  }

  private handleNetworkChange = (state: NetInfoState) => {
    const wasConnected = this.currentStatus;
    this.currentStatus = state.isConnected ?? false;

    if (wasConnected !== this.currentStatus) {
      console.log('[NetworkMonitor] Network changed:', this.currentStatus ? 'connected' : 'disconnected');
      this.notifyListeners();
    }
  };

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }

  // 同步获取当前网络状态
  getCurrentStatus(): boolean {
    return this.currentStatus;
  }

  // 异步检查网络状态
  async isConnected(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      return state.isConnected ?? false;
    } catch {
      return false;
    }
  }

  // 获取连接类型
  async getConnectionType(): Promise<string> {
    try {
      const state = await NetInfo.fetch();
      return state.type || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // 订阅网络状态变化
  subscribe(listener: (isConnected: boolean) => void): () => void {
    this.listeners.push(listener);

    // 返回取消订阅函数
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 清理
  cleanup(): void {
    NetInfo.removeEventListener(this.handleNetworkChange);
    this.listeners = [];
    this.isInitialized = false;
  }
}

export const networkMonitor = new NetworkMonitor();

// 便捷函数
export const isNetworkConnected = (): boolean => {
  return networkMonitor.getCurrentStatus();
};

export const checkNetworkConnection = async (): Promise<boolean> => {
  return networkMonitor.isConnected();
};
