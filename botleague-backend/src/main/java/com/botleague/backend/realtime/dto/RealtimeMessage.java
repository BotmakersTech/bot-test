package com.botleague.backend.realtime.dto;

import com.botleague.backend.realtime.enums.RealtimeEventType;

/**
 * Generic envelope pushed over WebSocket to all clients.
 * The {@code payload} field carries the event-specific data object;
 * {@code type} tells the client which reducer/handler to invoke.
 */
public class RealtimeMessage {

    private String type;
    private Object payload;
    private long   timestamp;

    public RealtimeMessage() {}

    private RealtimeMessage(String type, Object payload, long timestamp) {
        this.type      = type;
        this.payload   = payload;
        this.timestamp = timestamp;
    }

    public static RealtimeMessage of(RealtimeEventType type, Object payload) {
        return new RealtimeMessage(type.name(), payload, System.currentTimeMillis());
    }

    // ── getters / setters ────────────────────────────────────────────────────

    public String getType()              { return type; }
    public void   setType(String type)   { this.type = type; }

    public Object getPayload()                 { return payload; }
    public void   setPayload(Object payload)   { this.payload = payload; }

    public long getTimestamp()               { return timestamp; }
    public void setTimestamp(long timestamp) { this.timestamp = timestamp; }
}
