package com.botleague.backend.admin.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Resource-scoped role assignment — replaces the old flat, near-duplicate
 * UserEventAssignment/UserSportAssignment tables. One row = "this user holds
 * this role on this specific event or sport", with an approval workflow and
 * an ownership-chain tag (which ladder the underlying event belongs to).
 */
@Entity
@Table(
    name = "resource_role_assignments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "scope_type", "scope_id", "role_type"})
)
public class ResourceRoleAssignment {

    public static final String SCOPE_EVENT = "EVENT";
    public static final String SCOPE_SPORT = "SPORT";

    public static final String STATUS_PENDING_APPROVAL = "PENDING_APPROVAL";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** EVENT | SPORT */
    @Column(name = "scope_type", nullable = false, length = 10)
    private String scopeType;

    /** event_id when scopeType=EVENT, event_sport_id when scopeType=SPORT */
    @Column(name = "scope_id", nullable = false)
    private UUID scopeId;

    /** Parent event id — always populated, even for SPORT-scoped rows. */
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    /** EVENT_HEAD | SPORT_HEAD */
    @Column(name = "role_type", nullable = false, length = 20)
    private String roleType;

    /** BOTLEAGUE | ORGANISER — denormalized from events.owner_type at assignment time */
    @Column(name = "owner_chain", nullable = false, length = 10)
    private String ownerChain;

    /** PENDING_APPROVAL | APPROVED | REJECTED */
    @Column(name = "status", nullable = false, length = 20)
    private String status = STATUS_APPROVED;

    @Column(name = "assigned_by", nullable = false)
    private UUID assignedBy;

    @Column(name = "assigned_at")
    private LocalDateTime assignedAt;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public String getScopeType() { return scopeType; }
    public void setScopeType(String scopeType) { this.scopeType = scopeType; }

    public UUID getScopeId() { return scopeId; }
    public void setScopeId(UUID scopeId) { this.scopeId = scopeId; }

    public UUID getEventId() { return eventId; }
    public void setEventId(UUID eventId) { this.eventId = eventId; }

    public String getRoleType() { return roleType; }
    public void setRoleType(String roleType) { this.roleType = roleType; }

    public String getOwnerChain() { return ownerChain; }
    public void setOwnerChain(String ownerChain) { this.ownerChain = ownerChain; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getAssignedBy() { return assignedBy; }
    public void setAssignedBy(UUID assignedBy) { this.assignedBy = assignedBy; }

    public LocalDateTime getAssignedAt() { return assignedAt; }
    public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }

    public UUID getApprovedBy() { return approvedBy; }
    public void setApprovedBy(UUID approvedBy) { this.approvedBy = approvedBy; }

    public LocalDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(LocalDateTime approvedAt) { this.approvedAt = approvedAt; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
