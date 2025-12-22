const API_URL = 'http://localhost:8000'

export const generateText = async (prompt: string): Promise<string> => {
  const response = await fetch(`${API_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: prompt }),
  })
  if (!response.ok) throw new Error('Generation failed')
  const data = await response.json()
  return data.text
}

