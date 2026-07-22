package com.botleague.backend.certificate.engine;

/** Output of one PdfCertificateRenderer.render() call. */
public class RenderedCertificate {

    private final byte[] pdfBytes;
    private final byte[] imageBytes;

    public RenderedCertificate(byte[] pdfBytes, byte[] imageBytes) {
        this.pdfBytes = pdfBytes;
        this.imageBytes = imageBytes;
    }

    public byte[] getPdfBytes() { return pdfBytes; }
    public byte[] getImageBytes() { return imageBytes; }
}
