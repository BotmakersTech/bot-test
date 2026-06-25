package com.botleague.backend.events.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


import com.botleague.backend.common.service.UploadService;
import com.botleague.backend.events.dto.CreateEventRequestDTO;
import com.botleague.backend.events.dto.CreateEventResponseDTO;
import com.botleague.backend.events.service.EventService;
import com.botleague.backend.profile.dto.UploadResponse;
import com.botleague.backend.profile.service.FileKeyService;
import com.botleague.backend.team.dto.MediaRequest;
import com.botleague.backend.team.enums.MediaType;

@RestController
@RequestMapping("/api/Events")
public class EventController {
	
	
	
	private final EventService eventService;
	private final FileKeyService fileKeyService;
	private final UploadService uploadService;
	
	public EventController(EventService eventService,FileKeyService fileKeyService,UploadService uploadService) {
	
		this.eventService=eventService;
		this.fileKeyService=fileKeyService;
		this.uploadService=uploadService;
	}
	
	@PostMapping("/create-event")
	@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR')")
	public ResponseEntity<CreateEventResponseDTO> createEvents(@RequestBody CreateEventRequestDTO request, Authentication authentication) {
		return ResponseEntity.ok(eventService.createEvent(request, authentication));
	}

	@PatchMapping("/{eventId}/PublishEvent")
	@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMINISTRATOR','MANAGER')")
	public ResponseEntity<CreateEventResponseDTO> publishEvent(@PathVariable UUID eventId) {
		return ResponseEntity.ok(eventService.makeEventLive(eventId));
	}
	
	@GetMapping("/live")
	public ResponseEntity<List<CreateEventResponseDTO>>
	getLiveEvent() {

	    List<CreateEventResponseDTO> response =
	            eventService.getLiveEvents();

	    return ResponseEntity.ok(response);
	}
	
	@PostMapping("/{eventId}/upload-url")
	public ResponseEntity<UploadResponse> getEventUploadUrl(

	        Authentication authentication,

	        @PathVariable UUID eventId,

	        @RequestParam String fileType,

	        @RequestParam long fileSize
	) {

	    // =====================================================
	    // AUTH USER
	    // =====================================================

		UUID userId =
		        UUID.fromString(
		                (String) authentication.getPrincipal()
		        );

	    // =====================================================
	    // GENERATE EVENT IMAGE KEY
	    // =====================================================

	    String key =
	            fileKeyService.generateEventImageKey(
	                    userId,
	                    fileType
	            );

	    // =====================================================
	    // GENERATE PRESIGNED URL
	    // =====================================================

	    UploadResponse response =
	            uploadService.generateUploadUrl(
	                    key,
	                    fileType,
	                    fileSize
	            );

	    return ResponseEntity.ok(response);
	}

	// =====================================================
	// SAVE EVENT MEDIA
	// =====================================================

	@PostMapping("/{eventId}/media")
	public ResponseEntity<String> confirmEventUpload(

	        @PathVariable UUID eventId,

	        @RequestBody MediaRequest request
	) {

	    // =====================================================
	    // DETERMINE MEDIA TYPE
	    // =====================================================

	    MediaType type =
	            request.getFileType().startsWith("image")
	                    ? MediaType.IMAGE
	                    : MediaType.VIDEO;

	    // =====================================================
	    // SAVE MEDIA
	    // =====================================================

	    eventService.saveMedia(
	            eventId,
	            request.getKey(),
	            type
	    );

	    return ResponseEntity.ok(
	            "Event media saved"
	    );
	}

}
