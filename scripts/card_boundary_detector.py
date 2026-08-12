#!/usr/bin/env python3
"""
Photocard Layout Classification Module
Determines whether a listing photo shows ONE physical photocard
(individual, unit, or full-group - multiple people can appear on a
single printed card) vs a listing photo showing SEVERAL separate
physical cards laid out / gridded together (which must NOT be
auto-cropped to a single member).

Two signals are combined, since either alone proved unreliable on real
eBay photos during testing:

  1. Geometric card-boundary detection (Canny edges -> quad contours
     matching the photocard aspect ratio). Reliable when a card sits on
     a plain, contrasting background, but fails on cluttered/patterned
     backgrounds and on tightly-packed multi-card grids (cards touching
     edge-to-edge give no separating edge to detect).

  2. Face count + face-size analysis (YuNet). A grid of many separate
     small cards produces MANY small faces spread across most of the
     frame; one physical card (even a unit/group photocard) produces a
     handful of comparatively large, clustered faces. Empirically this
     was the more reliable signal on real listing photos, so it is
     used to both catch grids the geometric detector misses AND to
     override a spurious single geometric "boundary" that is really
     just the outer frame of a whole grid photo.
"""

import cv2
import numpy as np
from typing import Dict, List, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Standard photocard ratio (259x400) and its rotated/landscape equivalent
PORTRAIT_RATIO = 259 / 400
LANDSCAPE_RATIO = 400 / 259

RATIO_TOLERANCE = 0.28          # generous - real photos have perspective skew
MIN_AREA_FRACTION = 0.025       # ignore tiny noise contours
MAX_AREA_FRACTION = 0.98        # allow a near-full-frame single card
IOU_MERGE_THRESHOLD = 0.45      # merge/deduplicate overlapping quad candidates

# Face-based grid-vs-single-card thresholds (calibrated against real
# eBay listing photos - see TIER1_IMPLEMENTATION_REPORT / validation logs)
MULTI_CARD_FACE_COUNT_THRESHOLD = 4   # >=4 faces triggers face-based analysis
SMALL_FACE_FRACTION = 0.04            # largest face < 4% of frame -> grid of small cards
AMBIGUOUS_FACE_FRACTION = 0.07        # 4%-7% with many faces -> uncertain, send to review


def _order_corners(pts: np.ndarray) -> np.ndarray:
    """Order 4 points as top-left, top-right, bottom-right, bottom-left."""
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def _iou(a, b) -> float:
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    ix1, iy1 = max(ax, bx), max(ay, by)
    ix2, iy2 = min(ax + aw, bx + bw), min(ay + ah, by + bh)
    iw, ih = max(0, ix2 - ix1), max(0, iy2 - iy1)
    inter = iw * ih
    union = aw * ah + bw * bh - inter
    return inter / union if union > 0 else 0.0


def _merge_candidates(candidates: List[Dict], iou_threshold: float = IOU_MERGE_THRESHOLD) -> List[Dict]:
    """Drop near-duplicate quads (Canny commonly yields inner+outer edges
    of the same physical card border)."""
    candidates = sorted(candidates, key=lambda c: c["bbox"][2] * c["bbox"][3], reverse=True)
    kept = []
    for c in candidates:
        if all(_iou(c["bbox"], k["bbox"]) < iou_threshold for k in kept):
            kept.append(c)
    return kept


def detect_card_boundaries(img: np.ndarray) -> List[Dict]:
    """
    Detect card-shaped rectangular contours in the image via edge
    detection. Returns a list of candidate dicts, largest first:
      - bbox: axis-aligned (x, y, w, h)
      - corners: 4x2 float32 array, ordered TL/TR/BR/BL (for perspective warp)
      - area_fraction: fraction of total image area
      - aspect_ratio: w/h of the axis-aligned bbox
      - orientation: "portrait" | "landscape"
    """
    h_img, w_img = img.shape[:2]
    img_area = h_img * w_img

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 40, 120)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=2)
    edges = cv2.erode(edges, np.ones((3, 3), np.uint8), iterations=1)

    contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

    candidates = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        area_fraction = area / img_area
        if area_fraction < MIN_AREA_FRACTION or area_fraction > MAX_AREA_FRACTION:
            continue

        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if not (4 <= len(approx) <= 6):
            continue

        rect = cv2.minAreaRect(cnt)
        (rw, rh) = rect[1]
        if rw == 0 or rh == 0:
            continue
        rect_ratio = max(rw, rh) / min(rw, rh)

        if abs(rect_ratio - LANDSCAPE_RATIO) >= RATIO_TOLERANCE:
            continue

        box_pts = cv2.boxPoints(rect).astype("float32")
        x, y, w, h = cv2.boundingRect(cnt)
        orientation = "portrait" if rh > rw else "landscape"

        candidates.append({
            "bbox": (x, y, w, h),
            "corners": _order_corners(box_pts),
            "area_fraction": round(area_fraction, 4),
            "aspect_ratio": round(w / h, 3) if h else 0,
            "orientation": orientation,
        })

    return _merge_candidates(candidates)


def warp_card(img: np.ndarray, corners: np.ndarray) -> np.ndarray:
    """Perspective-correct a (possibly rotated) card quad into an
    axis-aligned crop at the quad's natural resolution."""
    (tl, tr, br, bl) = corners

    width_a = np.linalg.norm(br - bl)
    width_b = np.linalg.norm(tr - tl)
    max_width = max(int(width_a), int(width_b), 1)

    height_a = np.linalg.norm(tr - br)
    height_b = np.linalg.norm(tl - bl)
    max_height = max(int(height_a), int(height_b), 1)

    dst = np.array([
        [0, 0],
        [max_width - 1, 0],
        [max_width - 1, max_height - 1],
        [0, max_height - 1],
    ], dtype="float32")

    matrix = cv2.getPerspectiveTransform(corners, dst)
    warped = cv2.warpPerspective(img, matrix, (max_width, max_height))

    # Normalize orientation to portrait (cards are taller than wide)
    if warped.shape[1] > warped.shape[0]:
        warped = cv2.rotate(warped, cv2.ROTATE_90_CLOCKWISE)

    return warped


def _face_stats(img: np.ndarray, faces: List[Dict]) -> Dict:
    h_img, w_img = img.shape[:2]
    img_area = h_img * w_img
    n = len(faces)
    if n == 0:
        return {"count": 0, "largest_fraction": 0.0}
    areas = [(f["bbox"][2] * f["bbox"][3]) / img_area for f in faces]
    return {"count": n, "largest_fraction": round(max(areas), 4)}


def classify_card_layout(img: np.ndarray, faces: List[Dict]) -> Dict:
    """
    Classify a listing image as a single photocard (individual, unit, or
    group photo on ONE physical card) vs a multi-card listing photo
    (several separate physical cards shown in one image, or an
    ambiguous case that can't be confidently resolved either way).

    Args:
        img: the listing image
        faces: face list from MemberDetector.detect_faces(img) - passed
               in so the caller (which already needs face data for
               member-count metadata) doesn't pay for detection twice.

    Returns dict with:
      - layout: "single_card" | "multi_card"
      - is_multi_card_listing: bool (True for "multi_card")
      - reason: human-readable classification reason
      - card_bbox: (x, y, w, h) region to crop for single_card layouts
      - card_corners: 4x2 array for perspective warp, or None
      - num_boundaries: geometric candidate count
      - face_count / largest_face_fraction: face-signal stats
      - boundaries: full geometric candidate list (debugging/QA)
    """
    h_img, w_img = img.shape[:2]
    boundaries = detect_card_boundaries(img)
    n_boundaries = len(boundaries)
    fstats = _face_stats(img, faces)

    base = {
        "num_boundaries": n_boundaries,
        "boundaries": boundaries,
        "face_count": fstats["count"],
        "largest_face_fraction": fstats["largest_fraction"],
    }

    def multi(reason: str) -> Dict:
        return {
            **base,
            "layout": "multi_card",
            "is_multi_card_listing": True,
            "reason": reason,
            "card_bbox": None,
            "card_corners": None,
        }

    def single(reason: str, bbox, corners) -> Dict:
        return {
            **base,
            "layout": "single_card",
            "is_multi_card_listing": False,
            "reason": reason,
            "card_bbox": bbox,
            "card_corners": corners,
        }

    # Strong geometric signal: 2+ distinct card-shaped quads found.
    if n_boundaries >= 2:
        return multi("multiple_card_boundaries_detected")

    # Face-based analysis kicks in for 4+ detected faces, since a grid of
    # small separate cards (or an ambiguous cluster) is the main risk a
    # lone geometric "1 boundary" read can miss (it can end up being just
    # the outer frame of the whole collage).
    if fstats["count"] >= MULTI_CARD_FACE_COUNT_THRESHOLD:
        if fstats["largest_fraction"] < SMALL_FACE_FRACTION:
            return multi("many_small_faces_grid_layout")
        if fstats["largest_fraction"] < AMBIGUOUS_FACE_FRACTION:
            return multi("ambiguous_face_count_and_size")
        # else: faces are large enough that this plausibly IS one
        # full-group photocard - fall through to the single-card path.

    if n_boundaries == 1:
        b = boundaries[0]
        return single("exactly_one_card_boundary_detected", b["bbox"], b["corners"])

    # No confident card edge found - common for listing photos already
    # tightly cropped to a single card (little/no contrasting background
    # to form a detectable edge), and consistent with the face signal
    # above not flagging a grid. Treat the full frame as the card.
    return single("no_card_boundary_detected_assumed_single_full_frame",
                   (0, 0, w_img, h_img), None)


if __name__ == "__main__":
    import sys
    from member_detector import MemberDetector

    path = sys.argv[1] if len(sys.argv) > 1 else None
    if not path:
        print("Usage: python card_boundary_detector.py <image_path>")
        sys.exit(1)

    img = cv2.imread(path)
    detector = MemberDetector()
    faces = detector.detect_faces(img)
    result = classify_card_layout(img, faces)
    print(f"Layout: {result['layout']} ({result['reason']})")
    print(f"Geometric boundaries: {result['num_boundaries']} | Faces: {result['face_count']} (largest={result['largest_face_fraction']*100:.2f}%)")
