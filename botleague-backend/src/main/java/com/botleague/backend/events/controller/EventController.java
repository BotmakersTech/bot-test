package com.botleague.backend.events.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
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
import com.botleague.backend.events.enums.EventMediaSlot;
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
	@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
	public ResponseEntity<CreateEventResponseDTO> createEvents(@RequestBody CreateEventRequestDTO request, Authentication authentication) {
		return ResponseEntity.ok(eventService.createEvent(request, authentication));
	}

	@PatchMapping("/{eventId}/PublishEvent")
	@PreAuthorize("hasAnyRole('SUPER_ADMIN','ADMIN')")
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

	@GetMapping("/completed")
	public ResponseEntity<List<CreateEventResponseDTO>>
	getCompletedEvents() {

	    List<CreateEventResponseDTO> response =
	            eventService.getCompletedEvents();

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
	    // AUTH + PERMISSION CHECK
	    // =====================================================

		UUID userId =
		        UUID.fromString(
		                (String) authentication.getPrincipal()
		        );

		eventService.assertCanManageEventMedia(eventId, authentication);

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

	        @RequestBody MediaRequest request,

	        Authentication authentication
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
	            type,
	            authentication
	    );

	    return ResponseEntity.ok(
	            "Event media saved"
	    );
	}

	// =====================================================
	// EVENT MEDIA SLOTS — thumbnail + up to 2 teaser videos
	// =====================================================

	@PostMapping("/{eventId}/media/{slot}/upload-url")
	public ResponseEntity<UploadResponse> getEventMediaUploadUrl(
			Authentication authentication,
			@PathVariable UUID eventId,
			@PathVariable EventMediaSlot slot,
			@RequestParam String fileType,
			@RequestParam long fileSize
	) {
		eventService.assertCanManageEventMedia(eventId, authentication);

		String key = fileKeyService.generateEventMediaKey(eventId, slot.name(), fileType);

		UploadResponse response = uploadService.generateUploadUrl(key, fileType, fileSize);

		return ResponseEntity.ok(response);
	}

	@PostMapping("/{eventId}/media/{slot}")
	public ResponseEntity<String> confirmEventMediaUpload(
			@PathVariable UUID eventId,
			@PathVariable EventMediaSlot slot,
			@RequestBody MediaRequest request,
			Authentication authentication
	) {
		eventService.saveEventMediaSlot(
				eventId,
				slot,
				request.getKey(),
				request.getFileType(),
				authentication
		);

		return ResponseEntity.ok("Event media saved");
	}

	@DeleteMapping("/{eventId}/media/{slot}")
	public ResponseEntity<String> clearEventMedia(
			@PathVariable UUID eventId,
			@PathVariable EventMediaSlot slot,
			Authentication authentication
	) {
		eventService.clearEventMediaSlot(eventId, slot, authentication);

		return ResponseEntity.ok("Event media removed");
	}

}
