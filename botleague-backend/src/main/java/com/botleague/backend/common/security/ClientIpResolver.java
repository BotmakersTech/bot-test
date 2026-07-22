package com.botleague.backend.common.security;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Single source of truth for "what is the client's real IP" — shared by
 * RateLimitingFilter and the certificate verification log, both of which
 * need the same trusted-hop reasoning and must never disagree on it.
 */
public final class ClientIpResolver {

    private ClientIpResolver() {}

    /**
     * nginx.conf sets `X-Real-IP: $remote_addr` unconditionally — it always
     * OVERWRITES this header with what it actually saw on the socket, so a
     * client-supplied X-Real-IP can never survive the hop. That makes it
     * the only header here a client can't spoof; prefer it.
     *
     * X-Forwarded-For is set via $proxy_add_x_forwarded_for, which APPENDS
     * to whatever the client already sent rather than replacing it. Taking
     * the FIRST entry reads back the attacker's own injected value; the
     * LAST entry is the one nginx itself appended, i.e. the real peer — but
     * only because there is exactly one trusted hop in front of this app
     * (see nginx/botleague.conf). If a second proxy/CDN is ever added in
     * front of nginx, this must change to trust the last-but-one entry.
     */
    public static String resolve(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] hops = xff.split(",");
            return hops[hops.length - 1].trim();
        }

        return request.getRemoteAddr();
    }
}
