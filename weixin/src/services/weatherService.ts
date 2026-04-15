import request from './request'

export interface WeatherData {
  temp: number
  tempMax: number
  tempMin: number
  humidity: number
  condition: string
  conditionIcon: string
  airQuality: string
  uvIndex: number
  windSpeed: string
  location: string
}

export interface WeatherTipResponse {
  weather: WeatherData
  tip: string
}

// 获取天气和AI小贴士
export const getWeatherTips = async (latitude: number, longitude: number): Promise<WeatherTipResponse> => {
  return request<WeatherTipResponse>({
    url: '/api/weather/tips',
    method: 'POST',
    data: { latitude, longitude },
  })
}
