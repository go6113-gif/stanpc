# Card Layout Classification Validation Report

**Test Date**: 2026-08-11 14:25:02
**Duration**: 13.27s
**Pipeline**: photocard_pipeline.py `PhotocardPipeline` (production path, real eBay Browse API)

## Summary

| Outcome | Count |
|---|---|
| Auto-processed (single_card) | 2 |
| Routed to review queue (multi_card / ambiguous) | 6 |
| Download failures | 0 |

## Classification Detail

| Outcome | Listing Title | Classification Reason | Card Type | Members | Final Size |
|---|---|---|---|---|---|
| AUTO-PROCESSED | Felix 5-Star Stray Kids Photocard | no_card_boundary_detected_assumed_single_full_frame | individual | 1 | 259x400 |
| AUTO-PROCESSED | Stray Kids Hyunjin and Felix This & That Unit Photocard | no_card_boundary_detected_assumed_single_full_frame | unit | 2 | 259x400 |
| REVIEW QUEUE | Stray Kids Japan 1st Single TOP Official Photocard Photo Card PC  | many_small_faces_grid_layout | - | 8 | - |
| REVIEW QUEUE | PRE Stray Kids THIS & THAT Official Album Photocard TRUCK and FAN | many_small_faces_grid_layout | - | 114 | - |
| REVIEW QUEUE | [IN HAND] STRAY KIDS SKZ THIS & THAT Official & Ver. / TRUCK Ver. | many_small_faces_grid_layout | - | 58 | - |
| REVIEW QUEUE | PRE Stray Kids THIS & THAT LUCKY DRAW POB JAPAN Photocard JYP  HM | many_small_faces_grid_layout | - | 56 | - |
| REVIEW QUEUE | 4 Pcs/set AESPA KISS N TELL NINGNING KARINA WINTER GISELLE Specia | many_small_faces_grid_layout | - | 55 | - |
| REVIEW QUEUE | aespa KISS N TELL ALBUM PHOTO CARD & JAPAN POB OFFICIAL | many_small_faces_grid_layout | - | 61 | - |

## Auto-Processed Images

- `temp_test_run\images\001_stray_kids_unknown_20260811_142451.png`
- `temp_test_run\images\001_stray_kids_jin_20260811_142454.png`

## Review Queue Images

- `temp_test_run\review_queue\002_review_20260811_142452_original.png`
- `temp_test_run\review_queue\002_review_20260811_142455_original.png`
- `temp_test_run\review_queue\001_review_20260811_142457_original.png`
- `temp_test_run\review_queue\002_review_20260811_142458_original.png`
- `temp_test_run\review_queue\001_review_20260811_142500_original.png`
- `temp_test_run\review_queue\002_review_20260811_142501_original.png`
