package com.botleague.backend.common.security;

import jakarta.servlet.http.HttpServletRequest;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.List;

/**
 * Single source of truth for "what is the client's real IP" — shared by
 * RateLimitingFilter and the certificate verification log, both of which
 * need the same trusted-hop reasoning and must never disagree on it.
 */
public final class ClientIpResolver {

    private ClientIpResolver() {}

    // Set once at startup by TrustedProxyConfig from security.trusted-proxy-cidrs.
    // X-Real-IP / X-Forwarded-For are only honored when the TCP peer itself
    // (request.getRemoteAddr()) falls inside one of these ranges — otherwise
    // both headers are fully attacker-controlled and are ignored. Defaults
    // cover loopback plus the common private ranges Docker bridge networks
    // use; tighten to the real observed nginx peer address for this
    // deployment via the security.trusted-proxy-cidrs property.
    private static volatile List<String> trustedProxyCidrs =
            List.of("127.0.0.1/32", "::1/128", "172.16.0.0/12", "10.0.0.0/8", "192.168.0.0/16");

    static void setTrustedProxyCidrs(List<String> cidrs) {
        trustedProxyCidrs = cidrs;
    }

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
     *
     * Both headers are only trusted at all when the request's actual TCP
     * peer is itself a known/trusted proxy (see trustedProxyCidrs) — a
     * request arriving directly from the internet, bypassing nginx, gets
     * neither header honored, closing the spoofing gap that existed when
     * these were trusted unconditionally.
     */
    public static String resolve(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (!isFromTrustedProxy(remoteAddr)) {
            return remoteAddr;
        }

        String realIp = request.getHeader("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String[] hops = xff.split(",");
            return hops[hops.length - 1].trim();
        }

        return remoteAddr;
    }

    private static boolean isFromTrustedProxy(String remoteAddr) {
        if (remoteAddr == null || remoteAddr.isBlank()) return false;
        for (String cidr : trustedProxyCidrs) {
            if (matches(remoteAddr, cidr)) return true;
        }
        return false;
    }

    private static boolean matches(String ip, String cidr) {
        try {
            String[] parts = cidr.split("/");
            byte[] targetBytes = InetAddress.getByName(ip).getAddress();
            byte[] networkBytes = InetAddress.getByName(parts[0]).getAddress();
            if (targetBytes.length != networkBytes.length) return false; // v4 vs v6 mismatch

            int prefixLength = parts.length > 1 ? Integer.parseInt(parts[1]) : targetBytes.length * 8;
            int fullBytes = prefixLength / 8;
            int remainingBits = prefixLength % 8;

            for (int i = 0; i < fullBytes; i++) {
                if (targetBytes[i] != networkBytes[i]) return false;
            }
            if (remainingBits > 0) {
                int mask = 0xFF << (8 - remainingBits);
                if ((targetBytes[fullBytes] & mask) != (networkBytes[fullBytes] & mask)) return false;
            }
            return true;
        } catch (UnknownHostException | NumberFormatException | ArrayIndexOutOfBoundsException e) {
            return false;
        }
    }
}
