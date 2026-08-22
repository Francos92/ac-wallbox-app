// ...existing code...
// Instead of:
// $pdf->SetFont('Arial', '', 12);

// Use UTF-8 encoding
$pdf->SetFont('DejaVu', '', 12); // DejaVu has good Unicode support
$pdf->AddPage();
$pdf->Cell(0, 10, 'x ≤ y', 0, 1, 'L', false, '', 0, false, 'T', 'M');
// ...existing code...
