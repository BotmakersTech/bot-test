package com.botleague.backend.common.security;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Wires the configurable trusted-proxy CIDR list into ClientIpResolver at
 * startup. Kept as a tiny bean rather than a static @Value field so the
 * list stays configurable per-deployment via security.trusted-proxy-cidrs
 * without touching ClientIpResolver's two call sites.
 */
@Component
public class TrustedProxyConfig {

    public TrustedProxyConfig(
            @Value("${security.trusted-proxy-cidrs:127.0.0.1/32,::1/128,172.16.0.0/12,10.0.0.0/8,192.168.0.0/16}")
            String trustedProxyCidrs) {
        List<String> cidrs = Arrays.stream(trustedProxyCidrs.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        ClientIpResolver.setTrustedProxyCidrs(cidrs);
    }
}
