import { api } from './client'

/**
 * 현재 현장 체감온도 및 온열질환 위험도 조회
 * GET /api/weather/heat-risk
 */
export async function getWeatherHeatRisk() {
  const response = await api.get('/api/weather/heat-risk')
  return response?.data ?? response
}
