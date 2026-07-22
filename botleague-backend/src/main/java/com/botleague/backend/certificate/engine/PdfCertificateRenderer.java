package com.botleague.backend.certificate.engine;

import com.botleague.backend.certificate.dto.TemplatePlaceholderPosition;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Draws one template's background image + the recipient's resolved
 * placeholder values (text and/or a QR code) onto a single-page PDF, then
 * rasterizes the same page to a PNG for the "image" download variant. The
 * template is a flat design asset with a fixed coordinate map — never a
 * code-editable document.
 */
@Component
public class PdfCertificateRenderer {

    private static final float DEFAULT_FONT_SIZE = 18f;
    private static final float DEFAULT_QR_SIZE_PX = 120f;
    private static final Color DEFAULT_COLOR = Color.BLACK;
    private static final int RASTER_DPI = 150;

    private final ObjectMapper objectMapper;

    public PdfCertificateRenderer(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public RenderedCertificate render(
            byte[] backgroundImageBytes,
            int pageWidthPx,
            int pageHeightPx,
            String placeholderMapJson,
            PlaceholderContext context,
            byte[] qrPngBytes
    ) {
        List<TemplatePlaceholderPosition> positions = parsePositions(placeholderMapJson);

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(new PDRectangle(pageWidthPx, pageHeightPx));
            document.addPage(page);

            PDImageXObject background = PDImageXObject.createFromByteArray(document, backgroundImageBytes, "background");
            PDImageXObject qrImage = qrPngBytes != null
                    ? PDImageXObject.createFromByteArray(document, qrPngBytes, "qr")
                    : null;

            PDFont regularFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDFont boldFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

            try (PDPageContentStream stream = new PDPageContentStream(document, page)) {
                stream.drawImage(background, 0, 0, pageWidthPx, pageHeightPx);

                for (TemplatePlaceholderPosition position : positions) {
                    PlaceholderKey key = resolveKey(position.getKey());
                    if (key == null) {
                        continue;
                    }
                    if (key.getKind() == PlaceholderKey.Kind.IMAGE) {
                        if (qrImage != null) {
                            drawQr(stream, qrImage, position, pageHeightPx);
                        }
                    } else {
                        PDFont font = Boolean.TRUE.equals(position.getBold()) ? boldFont : regularFont;
                        drawText(stream, context.get(key), position, pageHeightPx, font);
                    }
                }
            }

            ByteArrayOutputStream pdfOut = new ByteArrayOutputStream();
            document.save(pdfOut);

            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage rasterized = renderer.renderImageWithDPI(0, RASTER_DPI, ImageType.RGB);
            ByteArrayOutputStream imageOut = new ByteArrayOutputStream();
            ImageIO.write(rasterized, "PNG", imageOut);

            return new RenderedCertificate(pdfOut.toByteArray(), imageOut.toByteArray());
        } catch (IOException e) {
            throw new IllegalStateException("Failed to render certificate PDF", e);
        }
    }

    private void drawQr(PDPageContentStream stream, PDImageXObject qrImage,
                         TemplatePlaceholderPosition position, int pageHeightPx) throws IOException {
        float size = position.getSizePx() != null ? position.getSizePx().floatValue() : DEFAULT_QR_SIZE_PX;
        float x = (float) position.getX();
        float y = pageHeightPx - (float) position.getY() - size;
        stream.drawImage(qrImage, x, y, size, size);
    }

    private void drawText(PDPageContentStream stream, String text, TemplatePlaceholderPosition position,
                           int pageHeightPx, PDFont font) throws IOException {
        if (text == null || text.isBlank()) {
            return;
        }

        float fontSize = position.getFontSize() != null ? position.getFontSize().floatValue() : DEFAULT_FONT_SIZE;
        Color color = parseColor(position.getColor());
        String align = position.getAlign() != null ? position.getAlign().toUpperCase() : "LEFT";
        Float maxWidth = position.getMaxWidth() != null ? position.getMaxWidth().floatValue() : null;

        List<String> lines = wrap(text, font, fontSize, maxWidth);
        float lineHeight = fontSize * 1.25f;
        float anchorX = (float) position.getX();
        float topY = pageHeightPx - (float) position.getY();

        stream.setNonStrokingColor(color);

        for (int i = 0; i < lines.size(); i++) {
            String line = lines.get(i);
            float lineWidth = stringWidth(font, line, fontSize);
            float drawX = switch (align) {
                case "CENTER" -> anchorX - (lineWidth / 2f);
                case "RIGHT" -> anchorX - lineWidth;
                default -> anchorX;
            };
            float drawY = topY - (i * lineHeight) - fontSize;

            stream.beginText();
            stream.setFont(font, fontSize);
            stream.newLineAtOffset(drawX, drawY);
            stream.showText(line);
            stream.endText();
        }
    }

    private List<String> wrap(String text, PDFont font, float fontSize, Float maxWidth) {
        if (maxWidth == null || maxWidth <= 0) {
            return List.of(text);
        }
        List<String> lines = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String word : text.split("\\s+")) {
            String candidate = current.isEmpty() ? word : current + " " + word;
            if (stringWidth(font, candidate, fontSize) > maxWidth && !current.isEmpty()) {
                lines.add(current.toString());
                current = new StringBuilder(word);
            } else {
                current = new StringBuilder(candidate);
            }
        }
        if (!current.isEmpty()) {
            lines.add(current.toString());
        }
        return lines.isEmpty() ? List.of(text) : lines;
    }

    private float stringWidth(PDFont font, String text, float fontSize) {
        try {
            return font.getStringWidth(text) / 1000f * fontSize;
        } catch (IOException e) {
            return text.length() * fontSize * 0.5f;
        }
    }

    private Color parseColor(String hex) {
        if (hex == null || hex.isBlank()) {
            return DEFAULT_COLOR;
        }
        try {
            return Color.decode(hex.startsWith("#") ? hex : "#" + hex);
        } catch (NumberFormatException e) {
            return DEFAULT_COLOR;
        }
    }

    private PlaceholderKey resolveKey(String rawKey) {
        if (rawKey == null) {
            return null;
        }
        try {
            return PlaceholderKey.valueOf(rawKey);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private List<TemplatePlaceholderPosition> parsePositions(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<TemplatePlaceholderPosition>>() {});
        } catch (IOException e) {
            throw new IllegalStateException("Invalid placeholder_map JSON on certificate template", e);
        }
    }
}
