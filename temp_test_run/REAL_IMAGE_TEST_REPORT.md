# 🎴 Real Data Pipeline Validation Report

**Test Date**: 2026-08-11 13:32:20
**Status**: ✅ SUCCESS (6/6)
**Image Source**: eBay Browse API (real listings) -> web image search fallback -> mock (last resort)

## Source Breakdown

| Source | Count |
|--------|-------|
| ebay | 6 |

## Detailed Results

| Group | Source | Listing Title | Original | Cropped | Final | Ratio Valid | Detection Confidence | Time |
|-------|--------|---------------|----------|---------|-------|------------|----------------------|------|
| Stray Kids | ebay | [IN HAND] STRAY KIDS SKZ THIS & THAT Official & Ver. / TRUCK Ver. Phot | 1600×1600 | 276×426 | 259×400 | ✓ | 0.941 | 0.118s |
| Stray Kids | ebay | PRE Stray Kids THIS & THAT LUCKY DRAW POB JAPAN Photocard JYP  HMV SON | 1200×1200 | 50×76 | 259×400 | ✓ | 0.923 | 0.056s |
| AESPA | ebay | 4 Pcs/set AESPA KISS N TELL NINGNING KARINA WINTER GISELLE Special Pho | 1200×1200 | 150×231 | 259×400 | ✓ | 0.932 | 0.056s |
| AESPA | ebay | aespa KISS N TELL ALBUM PHOTO CARD & JAPAN POB OFFICIAL | 960×958 | 55×84 | 259×400 | ✓ | 0.909 | 0.037s |
| IVE | ebay | IVE The 2nd Album REVIVE+ Withmuu Last Fan Sign Event Photocard | 1000×1000 | 232×358 | 259×400 | ✓ | 0.925 | 0.042s |
| IVE | ebay | IVE LUCID DREAM 6/24 TOKYO DOME JAPAN Venue Limited Benefit Official P | 1037×535 | 202×312 | 259×400 | ✓ | 0.928 | 0.027s |

## Key Findings

- Real eBay Browse API integration: ACTIVE (real listings used)
- Member detection: YuNet DNN face detector with eye-center-based crop axis (replaces broken Haar Cascade / center-crop mock)
- Crop framing includes forehead/hairline above and chin/neck/chest below the eye-line - not a mouth/neck-only crop
- Aspect ratio correction: Letterbox padding to 259×400px standard
- Total duration: 10.50s

## Conclusion

Real data pipeline validation PASSED: 6/6 real photocard images processed successfully end-to-end (eBay/web sourced download -> eye-center member crop -> aspect ratio correction -> metadata tagging -> storage).
