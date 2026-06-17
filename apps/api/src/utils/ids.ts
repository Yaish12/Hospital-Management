export const patientId = () => `PAT-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
export const queueToken = (count: number) => `Q-${String(count + 1).padStart(3, '0')}`
