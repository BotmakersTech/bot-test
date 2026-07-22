package com.botleague.backend.certificate.engine;

import java.util.EnumMap;
import java.util.Map;

/** Resolved text values for one recipient's one certificate, keyed by PlaceholderKey. */
public class PlaceholderContext {

    private final Map<PlaceholderKey, String> values = new EnumMap<>(PlaceholderKey.class);
    private String qrPayloadUrl;

    public void put(PlaceholderKey key, String value) {
        values.put(key, value == null ? "" : value);
    }

    public String get(PlaceholderKey key) {
        return values.getOrDefault(key, "");
    }

    public String getQrPayloadUrl() {
        return qrPayloadUrl;
    }

    public void setQrPayloadUrl(String qrPayloadUrl) {
        this.qrPayloadUrl = qrPayloadUrl;
    }
}
