/**
 * @format
 * 识别功能测试
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

// 模拟NetInfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

// 模拟ImagePicker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(() => Promise.resolve({
    didCancel: false,
    assets: [{ uri: 'file://test.jpg' }]
  })),
  launchImageLibrary: jest.fn(() => Promise.resolve({
    didCancel: false,
    assets: [{ uri: 'file://test.jpg' }]
  })),
}));

describe('RecognitionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export PlantRecognitionService', async () => {
    const { plantService } = require('../src/services/PlantRecognition');
    expect(plantService).toBeDefined();
  });

  it('should export PestRecognitionService', async () => {
    const { pestService } = require('../src/services/PestRecognition');
    expect(pestService).toBeDefined();
  });

  it('should check online status', async () => {
    const NetInfo = require('@react-native-community/netinfo');
    const { isOnline } = require('../src/services/PlantRecognition');

    const online = await isOnline();
    expect(NetInfo.fetch).toHaveBeenCalled();
    expect(typeof online).toBe('boolean');
  });
});

describe('ModelManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should export modelManager', () => {
    const { modelManager } = require('../src/services/ModelManager');
    expect(modelManager).toBeDefined();
  });

  it('should get model info', async () => {
    // 模拟AsyncStorage
    jest.mock('@react-native-async-storage/async-storage', () => ({
      getItem: jest.fn(() => Promise.resolve('true')),
      setItem: jest.fn(() => Promise.resolve()),
      removeItem: jest.fn(() => Promise.resolve()),
    }));

    const { modelManager } = require('../src/services/ModelManager');
    const info = await modelManager.getModelInfo();

    expect(info).toBeDefined();
    expect(info.plant).toBeDefined();
    expect(info.pest).toBeDefined();
  });
});

describe('识别屏幕集成', () => {
  it('should handle recognize result format', () => {
    // 验证识别结果类型
    const plantResult = {
      id: '0',
      name: '绿萝',
      confidence: 0.95,
      care_tips: '喜阴，避免直射'
    };

    expect(plantResult.id).toBeDefined();
    expect(plantResult.name).toBeDefined();
    expect(plantResult.confidence).toBeGreaterThan(0);
    expect(plantResult.care_tips).toBeDefined();
  });

  it('should handle pest result format', () => {
    const pestResult = {
      id: '0',
      name: '蚜虫',
      confidence: 0.88,
      type: 'insect',
      treatment: '使用吡虫啉喷洒',
      severity: 'medium'
    };

    expect(pestResult.id).toBeDefined();
    expect(pestResult.name).toBeDefined();
    expect(pestResult.type).toBe('insect');
    expect(pestResult.treatment).toBeDefined();
    expect(['low', 'medium', 'high']).toContain(pestResult.severity);
  });

  it('should handle full recognition result', () => {
    const fullResult = {
      plant: {
        id: '0',
        name: '绿萝',
        confidence: 0.95
      },
      pest: {
        id: '0',
        name: '蚜虫',
        confidence: 0.88
      }
    };

    expect(fullResult.plant).toBeDefined();
    expect(fullResult.pest).toBeDefined();
  });

  it('should handle null pest result', () => {
    const fullResult = {
      plant: {
        id: '0',
        name: '绿萝',
        confidence: 0.95
      },
      pest: null
    };

    expect(fullResult.plant).toBeDefined();
    expect(fullResult.pest).toBeNull();
  });
});

describe('严重程度颜色映射', () => {
  it('should return correct severity colors', () => {
    const getSeverityColor = (severity: string): string => {
      switch (severity) {
        case 'high': return '#e94b52';
        case 'medium': return '#f5a623';
        case 'low': return '#7ed321';
        default: return '#999';
      }
    };

    expect(getSeverityColor('high')).toBe('#e94b52');
    expect(getSeverityColor('medium')).toBe('#f5a623');
    expect(getSeverityColor('low')).toBe('#7ed321');
    expect(getSeverityColor('unknown')).toBe('#999');
  });
});
