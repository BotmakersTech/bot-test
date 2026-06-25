package com.botleague.backend.profile.repository;

import java.util.UUID;

import com.botleague.backend.profile.dto.PublicProfileResponseDTO;

public interface UserProfileRepository {

    PublicProfileResponseDTO getPublicProfile(UUID userId);

}