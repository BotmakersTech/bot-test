package com.botleague.backend.profile.service;

import java.util.UUID;


import org.springframework.stereotype.Service;

import com.botleague.backend.profile.dto.PublicProfileResponseDTO;
import com.botleague.backend.profile.repository.UserProfileRepository;

@Service
public class PublicProfileService {

    
    private UserProfileRepository userProfileRepository;

    public PublicProfileService(UserProfileRepository userProfileRepository) {
    	this.userProfileRepository=userProfileRepository;
    	
    }
    public PublicProfileResponseDTO publicProfileView(UUID userId) {

        return userProfileRepository.getPublicProfile(userId);
    }
}