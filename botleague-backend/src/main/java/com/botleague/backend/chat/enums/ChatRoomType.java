package com.botleague.backend.chat.enums;

public enum ChatRoomType {
    TEAM,
    DIRECT,
    /**
     * @deprecated legacy per-SportRegistration room (one per robot entry). No
     * longer created — superseded by {@link #EVENT_TEAM} (one room per
     * team per event). Kept so existing rows still deserialize.
     */
    @Deprecated
    REGISTRATION,
    EVENT_ANNOUNCEMENT,
    SPORT_ANNOUNCEMENT,
    MATCH,
    /** One chat room per team per event, covering every sport that team registers for within it. */
    EVENT_TEAM
}
