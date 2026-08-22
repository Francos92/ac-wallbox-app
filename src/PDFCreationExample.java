// ...existing code...
// Instead of using default encoding:
// document.add(new Paragraph("x ≤ y"));

// Use UTF-8 encoding with a Unicode font
BaseFont bf = BaseFont.createFont("path/to/font.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
Font font = new Font(bf, 12);
document.add(new Paragraph("x ≤ y", font));
// ...existing code...
