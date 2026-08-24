# Decision Engine V1.0 Stress Matrix

The isolated Decision Engine is validated against 12 scenarios spanning normal operation, warning states, risk states, zero-progress spending, and threshold boundaries.

The engine must return a non-empty reason and action for every scenario, with priority mapping: SEHAT=RENDAH, PERLU PENGAWASAN=SEDANG, BERISIKO=TINGGI.

This matrix is test-only and does not affect production Dashboard or database.