package com.botleague.backend.team.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.botleague.backend.team.entity.RobotMedia;
import com.botleague.backend.team.enums.MediaType;
import com.botleague.backend.team.repository.RobotMediaRepository;

@Service
public class RobotMediaService {

    private final RobotMediaRepository repository;

    public RobotMediaService(RobotMediaRepository repository) {
        this.repository = repository;
    }

    public void saveMedia(UUID robotId, String fileUrl, MediaType mediaType) {

        RobotMedia media = new RobotMedia();

        media.setRobotId(robotId);
        media.setFileUrl(fileUrl);
        media.setMediaType(mediaType);
        media.setCreatedAt(LocalDateTime.now());

        repository.save(media); // ✅ works now
    }
}