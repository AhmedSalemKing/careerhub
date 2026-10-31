'use client'
import { useCallback } from 'react'
import type { CareerResult } from './useAIChat'

const MEMORY_KEY_PREFIX = 'deveway_career_memory_'
const MAX_SESSION_SUMMARIES = 5
const SERVER_MEMORY_URL = '/api/ai/memory'

export interface SessionSummary {
  date: string
  primaryPath: string
  matchScore: number
  summary: string
}

export interface CareerMemory {
  userId: string
  careerProfile: {
    interests: string[]
    skills: string[]
    experience: string
    preferredPath: string | null
  }
  lastResult: CareerResult | null
  sessionSummaries: SessionSummary[]
  lastUpdated: string
}

function storageKey(userId: string) {
  return `${MEMORY_KEY_PREFIX}${userId}`
}

function readMemory(userId: string): CareerMemory | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    return JSON.parse(raw) as CareerMemory
  } catch {
    return null
  }
}

function writeMemory(memory: CareerMemory): void {
  try {
    localStorage.setItem(storageKey(memory.userId), JSON.stringify(memory))
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

function emptyMemory(userId: string): CareerMemory {
  return {
    userId,
    careerProfile: { interests: [], skills: [], experience: '', preferredPath: null },
    lastResult: null,
    sessionSummaries: [],
    lastUpdated: new Date().toISOString(),
  }
}

// ── Server sync helpers (module-level, no React dependency) ──────────────────

async function fetchMemoryFromServer(): Promise<CareerMemory | null> {
  try {
    const res = await fetch(SERVER_MEMORY_URL, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json() as { memory?: CareerMemory | null }
    return data.memory ?? null
  } catch {
    return null
  }
}

async function pushMemoryToServer(memory: CareerMemory): Promise<void> {
  try {
    await fetch(SERVER_MEMORY_URL, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(memory),
    })
  } catch {
    // Server unavailable — localStorage copy is still valid
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCareerMemory(userId: string | undefined) {
  const load = useCallback((): CareerMemory | null => {
    if (!userId) return null
    return readMemory(userId)
  }, [userId])

  // Fetch from server and update localStorage if server has newer data.
  // Non-blocking: resolves null on any failure.
  const loadFromServer = useCallback(async (): Promise<CareerMemory | null> => {
    if (!userId) return null
    const serverMemory = await fetchMemoryFromServer()
    if (!serverMemory || serverMemory.userId !== userId) return null
    // Update localStorage with the authoritative server copy
    writeMemory(serverMemory)
    return serverMemory
  }, [userId])

  const saveResult = useCallback((result: CareerResult) => {
    if (!userId) return
    const existing = readMemory(userId) ?? emptyMemory(userId)
    const summary: SessionSummary = {
      date: new Date().toISOString(),
      primaryPath: result.primaryPath,
      matchScore: result.matchScore,
      summary: result.summary ?? '',
    }
    const updated: CareerMemory = {
      ...existing,
      lastResult: result,
      sessionSummaries: [summary, ...existing.sessionSummaries].slice(0, MAX_SESSION_SUMMARIES),
      lastUpdated: new Date().toISOString(),
    }
    writeMemory(updated)
    // Non-blocking server sync — failure leaves localStorage intact
    void pushMemoryToServer(updated)
  }, [userId])

  const clear = useCallback(() => {
    if (!userId) return
    try { localStorage.removeItem(storageKey(userId)) } catch { /* ignore */ }
  }, [userId])

  return { load, loadFromServer, saveResult, clear }
}

// Builds a compact context string to inject into the system prompt
export function buildMemoryContext(memory: CareerMemory | null): string {
  if (!memory) return ''
  const parts: string[] = []
  if (memory.lastResult) {
    parts.push(`آخر توصية: ${memory.lastResult.primaryPath} (${memory.lastResult.matchScore}%)`)
  }
  if (memory.sessionSummaries.length > 0) {
    const prev = memory.sessionSummaries
      .slice(0, 3)
      .map(s => `• ${s.primaryPath} (${new Date(s.date).toLocaleDateString('ar-EG')})`)
      .join('\n')
    parts.push(`جلسات سابقة:\n${prev}`)
  }
  if (!parts.length) return ''
  return `\n\n[ذاكرة المستخدم من جلسات سابقة]\n${parts.join('\n')}`
}
