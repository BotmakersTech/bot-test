package com.botleague.backend.certificate.dto;

/** A one-off rendered sample — never stored, never issued, just base64 PNG bytes for an <img> preview. */
public class TemplatePreviewResponse {

    private String imageBase64;
    private boolean hasQrPlaceholder;

    public String getImageBase64() { return imageBase64; }
    public void setImageBase64(String imageBase64) { this.imageBase64 = imageBase64; }

    public boolean isHasQrPlaceholder() { return hasQrPlaceholder; }
    public void setHasQrPlaceholder(boolean hasQrPlaceholder) { this.hasQrPlaceholder = hasQrPlaceholder; }
}
