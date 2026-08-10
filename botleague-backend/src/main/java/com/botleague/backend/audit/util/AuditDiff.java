package com.botleague.backend.audit.util;

import java.util.Objects;

/**
 * Builds matching "before"/"after" strings for AuditLogService.log(...) on partial
 * (PATCH-style) updates where any subset of several independent fields may change in
 * one call. Only fields that actually differ are included, so an update touching one
 * field out of thirteen doesn't drag the other twelve into the audit trail.
 */
public class AuditDiff {

    private final StringBuilder before = new StringBuilder();
    private final StringBuilder after = new StringBuilder();
    private boolean any = false;

    public AuditDiff field(String name, Object oldVal, Object newVal) {
        if (Objects.equals(oldVal, newVal)) {
            return this;
        }
        if (any) {
            before.append("; ");
            after.append("; ");
        }
        before.append(name).append('=').append(oldVal);
        after.append(name).append('=').append(newVal);
        any = true;
        return this;
    }

    public boolean hasChanges() {
        return any;
    }

    public String oldValue() {
        return any ? before.toString() : null;
    }

    public String newValue() {
        return any ? after.toString() : null;
    }
}
