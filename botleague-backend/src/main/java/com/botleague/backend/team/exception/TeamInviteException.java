package com.botleague.backend.team.exception;

import org.springframework.http.HttpStatus;

public class TeamInviteException
        extends RuntimeException {

    private final HttpStatus status;

    /*
     * default BAD_REQUEST
     */
    public TeamInviteException(
            String message
    ) {
        super(message);
        this.status =
                HttpStatus.BAD_REQUEST;
    }

    /*
     * custom status
     */
    public TeamInviteException(
            String message,
            HttpStatus status
    ) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}