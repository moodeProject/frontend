import { createContext, useContext, useState } from 'react'
import { MOCK_WORKERS } from '../data/mockWorkers'

const WorkerContext = createContext(null)

export function WorkerProvider({ children }) {
  const [workers, setWorkers] = useState(MOCK_WORKERS)

  function addWorker(formData) {
    const newWorker = {
      id: Date.now(),
      employeeId: formData.employeeId,
      name: formData.name,
      team: formData.team,
      phone: formData.phone,
      helmetId: formData.helmetId,
      status: '작업대기',
      lastWork: '-',
      avatar: formData.avatarUrl ?? null,
      position: formData.position,
      email: formData.email,
      joinDate: formData.joinDate,
      birthDate: formData.birthDate,
      gender: formData.gender,
      emergencyContact: formData.emergencyContact,
      bloodType: formData.bloodType,
      address: formData.address,
    }
    setWorkers((prev) => [newWorker, ...prev])
    return newWorker
  }

  // TODO: 실제 API 호출로 교체 → PUT /users/:id
  function updateWorker(id, updatedData) {
    setWorkers((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updatedData } : w))
    )
  }

  return (
    <WorkerContext.Provider value={{ workers, addWorker, updateWorker }}>
      {children}
    </WorkerContext.Provider>
  )
}

export function useWorkers() {
  return useContext(WorkerContext)
}
