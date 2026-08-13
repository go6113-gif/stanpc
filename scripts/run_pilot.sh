#!/bin/bash
# Run dual-source image pipeline pilot

export PYTHONIOENCODING=utf-8
cd "$(dirname "$0")"

echo "Starting Dual-Source Image Pipeline Pilot Test..."
echo "=================================================="
echo ""

python3 dual_source_pilot.py

echo ""
echo "Pilot completed. Results in: pilot_output/"
echo ""
echo "Next steps:"
echo "1. Check pilot_output/dual_source_report.json for detailed results"
echo "2. Review pilot_output/review_queue_dual/ for ambiguous cases"
echo "3. Run manual validation on 20 high-confidence cards"
