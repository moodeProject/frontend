import { api } from './client'

/* ── 관리자 계정 ── */
export async function getAdmins()           { return api.get('/admins') }
export async function createAdmin(data)     { return api.post('/admins', data) }
export async function updateAdmin(id, data) { return api.put(`/admins/${id}`, data) }
export async function deleteAdmin(id)       { return api.delete(`/admins/${id}`) }

/* ── 기기(헬멧) ── */
export async function getDevices()           { return api.get('/devices') }
export async function createDevice(data)     { return api.post('/devices', data) }
export async function updateDevice(id, data) { return api.put(`/devices/${id}`, data) }

/* ── 기기 할당 ── */
export async function getAssignments()     { return api.get('/device-assignments') }
export async function assignDevice(data)   { return api.post('/device-assignments', data) }
export async function returnDevice(id)     { return api.patch(`/device-assignments/${id}/return`) }

/* ── 팀 관리 ── */
export async function getTeams()           { return api.get('/teams') }
export async function updateTeam(id, data) { return api.put(`/teams/${id}`, data) }
export async function deleteTeam(id)       { return api.delete(`/teams/${id}`) }
