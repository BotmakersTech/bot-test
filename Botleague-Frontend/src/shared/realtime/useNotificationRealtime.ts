import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import type { RootState } from '../../app/store'
import { useRealtime } from './RealtimeProvider'
import { pushNotification } from '../../feature/Notifications/store/notificationSlice'
import type { NotificationResponse } from '../../feature/Notifications/api/notification.api'
import type { RealtimeMessage } from './realtimeTypes'

/**
 * Always-on hook: subscribes to the user's private queue and dispatches
 * incoming notifications to the Redux store.
 *
 * Mount this once at the app level (inside RealtimeProvider) so the bell
 * and notification panel update instantly without polling.
 */
export function useNotificationRealtime() {
  const dispatch = useDispatch()
  const { subscribe, connected } = useRealtime()
  const userId = useSelector((s: RootState) => s.auth.user?.id)

  useEffect(() => {
    if (!userId) return

    // /user/queue/updates receives every RealtimeMessage routed to this user
    const unsubscribe = subscribe('/user/queue/updates', (frame) => {
      try {
        const msg: RealtimeMessage = JSON.parse(frame.body)
        if (msg.type === 'NOTIFICATION_NEW') {
          dispatch(pushNotification(msg.payload as NotificationResponse))
        }
      } catch {
        // malformed frame — ignore
      }
    })

    return unsubscribe
  }, [userId, subscribe, dispatch, connected])
}
