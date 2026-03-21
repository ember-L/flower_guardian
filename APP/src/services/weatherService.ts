// 天气服务 - 获取天气和AI小贴士
import { API_BASE_URL } from './config';

export interface WeatherData {
  temp: number;
  tempMax: number;
  tempMin: number;
  humidity: number;
  condition: string;
  conditionIcon: string;
  airQuality: string;
  uvIndex: number;
  windSpeed: string;
  location: string;
}

export interface WeatherTipResponse {
  weather: WeatherData;
  tip: string;
}

// 获取天气和AI小贴士
export const getWeatherTips = async (latitude: number, longitude: number): Promise<WeatherTipResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/weather/tips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      latitude,
      longitude,
    }),
  });

  if (!response.ok) {
    throw new Error('获取天气失败');
  }

  return response.json();
};
