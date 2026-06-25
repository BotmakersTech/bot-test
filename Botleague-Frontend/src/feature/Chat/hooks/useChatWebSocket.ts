import { useEffect, useRef } from "react"
import { useSelector } from "react-redux"
import { Client } from "@stomp/stompjs"
import { useAppDispatch } from "../../../app/hooks"
import { addIncomingMessage } from "../store/chatSlice"
import type { ChatMessage } from "../api/chat.api"
import type { RootState } from "../../../app/store"

/**
 * Derives the WebSocket broker URL from the REST API base URL.
 *   https://api.botleague.in/api  →  wss://api.botleague.in/ws/chat
 *   https://api.botleague.in/api  →  wss://api.botleague.in/ws/chat
 */
function buildWsUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL ?? "https://api.botleague.in/api"
  const base = apiUrl.replace(/\/api\/?$/, "")
  const wsBase = base.replace(/^https:\/\//, "wss://").replace(/^http:\/\//, "ws://")
  return `${wsBase}/ws/chat`
}

export function useChatWebSocket(
  roomIds: string[],
  token: string | null
): React.MutableRefObject<Client | null> {
  const dispatch = useAppDispatch()
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id)
  const clientRef = useRef<Client | null>(null)

  const roomIdsKey = roomIds.join(",")

  useEffect(() => {
    if (!token || roomIds.length === 0) return

    const client = new Client({
      brokerURL: buildWsUrl(),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        roomIds.forEach((roomId) => {
          client.subscribe(`/topic/chat/${roomId}`, (frame) => {
            try {
              const msg: ChatMessage = JSON.parse(frame.body)
              // Server broadcasts the same payload to every subscriber so the
              // `mine` field from the server is unreliable for real-time events.
              // Patch it client-side using the authenticated user's ID.
              if (currentUserId && msg.senderId) {
                msg.mine = msg.senderId === currentUserId
              }
              dispatch(addIncomingMessage(msg))
            } catch {
              // Malformed frame — ignore
            }
          })
        })
      },
      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers["message"])
      },
      reconnectDelay: 5000,
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
      clientRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomIdsKey, token, currentUserId])

  return clientRef
}
