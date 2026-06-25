import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Client, type StompSubscription } from '@stomp/stompjs'
import api from '../api/Base'

// ─────────────────────────────────────────────────────────────────────────────
// Build the WebSocket URL from the REST base URL set in the environment
// ─────────────────────────────────────────────────────────────────────────────

const WS_URL = (() => {
  const base =
    (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8081/api'
  return base
    .replace(/^https/, 'wss')
    .replace(/^http/, 'ws')
    .replace(/\/api\/?$/, '/ws')
})()

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type FrameHandler = (frame: { body: string }) => void

interface ActiveSubscription {
  destination: string
  handler: FrameHandler
  stomp: StompSubscription | null
}

interface RealtimeContextValue {
  /** True once the STOMP CONNECTED frame has been received. */
  connected: boolean
  /**
   * Subscribe to a STOMP destination.
   * Returns a cleanup function that unsubscribes.
   * Safe to call before the connection is established — the subscription is
   * queued and replayed once the socket connects (and re-subscribed on reconnect).
   */
  subscribe: (destination: string, handler: FrameHandler) => () => void
}

const RealtimeContext = createContext<RealtimeContextValue>({
  connected: false,
  subscribe: () => () => {},
})

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const clientRef = useRef<Client | null>(null)
  const [connected, setConnected] = useState(false)

  // Map from an internal id → ActiveSubscription so we can reconnect them.
  const subsRef = useRef<Map<number, ActiveSubscription>>(new Map())
  const nextId = useRef(0)

  const subscribe = useCallback(
    (destination: string, handler: FrameHandler): (() => void) => {
      const id = nextId.current++
      const entry: ActiveSubscription = { destination, handler, stomp: null }
      subsRef.current.set(id, entry)

      const client = clientRef.current
      if (client?.connected) {
        entry.stomp = client.subscribe(destination, handler)
      }
      // If not connected yet, will be picked up in onConnect

      return () => {
        entry.stomp?.unsubscribe()
        subsRef.current.delete(id)
      }
    },
    []
  )

  useEffect(() => {
    const getToken = () => {
      const auth =
        (api.defaults.headers.common['Authorization'] as string | undefined) ?? ''
      return auth.replace(/^Bearer\s+/i, '')
    }

    // Connect with or without a token — the backend allows unauthenticated
    // WebSocket connections and gracefully falls back to anonymous access.
    const token = getToken()
    const connectHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

    const client = new Client({
      brokerURL: WS_URL,
      connectHeaders,
      reconnectDelay: 5000,

      onConnect: () => {
        setConnected(true)
        // (Re-)subscribe every active subscription after connect / reconnect
        subsRef.current.forEach((entry) => {
          entry.stomp = client.subscribe(entry.destination, entry.handler)
        })
      },

      onDisconnect: () => {
        setConnected(false)
        // Clear stomp handles — they are dead after disconnect
        subsRef.current.forEach((entry) => {
          entry.stomp = null
        })
      },

      onStompError: (frame) => {
        console.warn('[Realtime] STOMP error:', frame.headers['message'])
      },
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
      setConnected(false)
      // Clear stomp handles so reconnect does not try to call unsubscribe on a dead socket
      subsRef.current.forEach((entry) => {
        entry.stomp = null
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <RealtimeContext.Provider value={{ connected, subscribe }}>
      {children}
    </RealtimeContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook — components call this to get subscribe / connected
// ─────────────────────────────────────────────────────────────────────────────

export function useRealtime(): RealtimeContextValue {
  return useContext(RealtimeContext)
}
