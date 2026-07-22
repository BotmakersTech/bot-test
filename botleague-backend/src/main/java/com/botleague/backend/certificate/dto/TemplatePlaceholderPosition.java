package com.botleague.backend.certificate.dto;

/**
 * One entry in a CertificateTemplate's placeholder_map JSON array — where on
 * the background image (in px, top-left origin) a given PlaceholderKey gets
 * drawn, and how. Text fields (fontSize/fontFamily/color/align/bold/maxWidth)
 * are ignored for key=QR_CODE, which instead uses sizePx as the square side
 * length.
 */
public class TemplatePlaceholderPosition {

    private String key; // PlaceholderKey enum name
    private double x;
    private double y;
    private Double fontSize;
    private String fontFamily;
    private String color; // hex, e.g. "#1A1A1A"
    private String align; // LEFT | CENTER | RIGHT
    private Double maxWidth;
    private Boolean bold;
    private Double sizePx; // QR_CODE only

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public double getX() { return x; }
    public void setX(double x) { this.x = x; }

    public double getY() { return y; }
    public void setY(double y) { this.y = y; }

    public Double getFontSize() { return fontSize; }
    public void setFontSize(Double fontSize) { this.fontSize = fontSize; }

    public String getFontFamily() { return fontFamily; }
    public void setFontFamily(String fontFamily) { this.fontFamily = fontFamily; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getAlign() { return align; }
    public void setAlign(String align) { this.align = align; }

    public Double getMaxWidth() { return maxWidth; }
    public void setMaxWidth(Double maxWidth) { this.maxWidth = maxWidth; }

    public Boolean getBold() { return bold; }
    public void setBold(Boolean bold) { this.bold = bold; }

    public Double getSizePx() { return sizePx; }
    public void setSizePx(Double sizePx) { this.sizePx = sizePx; }
}
