#!/usr/bin/env python3
"""
Member Detection and Cropping Module
Identifies individual member faces (via YuNet DNN face detector) and crops
a photocard-framed region using eye-center-based vertical alignment.
"""

import os
import cv2
import numpy as np
from typing import List, Tuple, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Standard photocard aspect ratio (width / height)
TARGET_CARD_RATIO = 259 / 400

# Face bbox height as a fraction of the final crop frame height.
# Smaller value => more headroom/body included around the face.
FACE_HEIGHT_FRACTION = 0.36

# Vertical position of the eye-line within the crop frame, measured from
# the top (0 = top edge, 1 = bottom edge). Placing eyes at ~38% down
# leaves room above for hair/forehead and room below for chin/neck/chest,
# matching standard photocard framing (not a mouth/neck-only crop).
EYE_LINE_FRACTION = 0.38

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "models", "face_detection_yunet_2023mar.onnx")


class MemberDetector:
    """Detects individual member faces (YuNet) and crops the photocard region
    using the eye-center as the vertical/horizontal reference axis."""

    def __init__(self, model_path: str = MODEL_PATH):
        """Initialize detector with the YuNet ONNX face detector."""
        self.detector = None
        self.use_yunet = False

        if os.path.exists(model_path):
            try:
                self.detector = cv2.FaceDetectorYN.create(
                    model_path, "", (320, 320),
                    score_threshold=0.6, nms_threshold=0.3, top_k=5000
                )
                self.use_yunet = True
                logger.info(f"✓ YuNet face detector loaded: {model_path}")
            except Exception as e:
                logger.warning(f"⚠️  Failed to load YuNet model ({e}) - using heuristic fallback")
        else:
            logger.warning(f"⚠️  YuNet model not found at {model_path} - using heuristic fallback")

    def detect_faces(self, img: np.ndarray) -> List[Dict]:
        """
        Detect faces in image using YuNet (or heuristic fallback).

        Args:
            img: Input image (BGR)

        Returns:
            List of dicts, each with:
              - bbox: (x, y, w, h)
              - right_eye, left_eye: (x, y) landmark coordinates
              - score: detection confidence (0.0-1.0)
              - source: "yunet" or "heuristic"
        """
        h_img, w_img = img.shape[:2]

        if self.use_yunet:
            self.detector.setInputSize((w_img, h_img))
            retval, faces = self.detector.detect(img)
            if faces is not None and len(faces) > 0:
                results = []
                for f in faces:
                    x, y, w, h = f[0:4]
                    right_eye = (f[4], f[5])
                    left_eye = (f[6], f[7])
                    score = float(f[14])
                    results.append({
                        "bbox": (float(x), float(y), float(w), float(h)),
                        "right_eye": right_eye,
                        "left_eye": left_eye,
                        "score": score,
                        "source": "yunet",
                    })
                return results
            # YuNet ran but found nothing real - fall through to heuristic
            logger.warning("⚠️  YuNet found no faces - using heuristic fallback")

        # Heuristic fallback: assume a photocard-style portrait with the
        # face in the upper-middle third of the frame (not dead-center),
        # so the estimated eye-line still lands near the eyes rather than
        # the mouth/chin for typical photocard photography.
        face_w = min(w_img // 3, 260)
        face_h = min(h_img // 3, 340)
        x = (w_img - face_w) // 2
        y = int(h_img * 0.12)
        eye_y = y + face_h * 0.4
        eye_dx = face_w * 0.22
        eye_cx = x + face_w / 2
        return [{
            "bbox": (float(x), float(y), float(face_w), float(face_h)),
            "right_eye": (eye_cx - eye_dx, eye_y),
            "left_eye": (eye_cx + eye_dx, eye_y),
            "score": 0.0,
            "source": "heuristic",
        }]

    def identify_member_region(self, img: np.ndarray, faces: List[Dict]) -> Optional[Dict]:
        """
        Identify primary member (highest-confidence / largest face).

        Args:
            img: Input image
            faces: List of detected faces (from detect_faces)

        Returns:
            The chosen face dict, or None
        """
        if not faces:
            logger.warning("No faces detected in image")
            return None

        # Prefer highest detection score; fall back to largest bbox area
        return max(faces, key=lambda f: (f["score"], f["bbox"][2] * f["bbox"][3]))

    def crop_member_region(self, img: np.ndarray, face: Dict,
                          target_ratio: float = TARGET_CARD_RATIO) -> Tuple[np.ndarray, Tuple[int, int, int, int]]:
        """
        Crop a photocard-framed region using the eye-center as the
        alignment axis, including forehead/hairline above and
        chin/neck/shoulders below - not just the mouth/neck area.

        Args:
            img: Input image
            face: Face dict from detect_faces (bbox + eye landmarks)
            target_ratio: Target width/height ratio (default: 259/400)

        Returns:
            (cropped_img, actual_crop_bbox) where actual_crop_bbox is
            (x_min, y_min, width, height) in original image coordinates.
        """
        h_img, w_img = img.shape[:2]
        _, _, face_w, face_h = face["bbox"]
        rx, ry = face["right_eye"]
        lx, ly = face["left_eye"]

        eye_center_x = (rx + lx) / 2
        eye_center_y = (ry + ly) / 2

        # Frame sized off the face height so the face occupies a
        # proportionate share of the card, with the eye-line positioned
        # near the top third (hair/forehead above, chin/chest below).
        frame_h = max(face_h, 1.0) / FACE_HEIGHT_FRACTION
        frame_top = eye_center_y - frame_h * EYE_LINE_FRACTION
        frame_bottom = frame_top + frame_h

        frame_w = frame_h * target_ratio
        frame_left = eye_center_x - frame_w / 2
        frame_right = frame_left + frame_w

        # Shift the window fully inside image bounds before clamping,
        # so we don't lose framing accuracy near edges unless the
        # image itself is too small for the full frame.
        if frame_left < 0:
            frame_right -= frame_left
            frame_left = 0
        if frame_right > w_img:
            overflow = frame_right - w_img
            frame_left = max(0, frame_left - overflow)
            frame_right = w_img
        if frame_top < 0:
            frame_bottom -= frame_top
            frame_top = 0
        if frame_bottom > h_img:
            overflow = frame_bottom - h_img
            frame_top = max(0, frame_top - overflow)
            frame_bottom = h_img

        x_min = max(0, int(round(frame_left)))
        y_min = max(0, int(round(frame_top)))
        x_max = min(w_img, int(round(frame_right)))
        y_max = min(h_img, int(round(frame_bottom)))

        cropped = img[y_min:y_max, x_min:x_max]
        return cropped, (x_min, y_min, x_max - x_min, y_max - y_min)

    def extract_member_card(self, img: np.ndarray) -> Dict:
        """
        Complete member extraction pipeline.

        Args:
            img: Input image

        Returns:
            Dictionary with:
            - cropped_img: Extracted member card
            - bbox: Original face bounding box
            - crop_bbox: Actual crop region used (x, y, w, h)
            - confidence: Detection confidence (real YuNet score, or 0.0 for heuristic)
            - status: "member_detected" or "heuristic_fallback"
            - source: "yunet" or "heuristic"
        """
        faces = self.detect_faces(img)

        face = self.identify_member_region(img, faces)
        if face is None:
            logger.warning("⚠️  No member face detected - returning full image")
            return {
                "cropped_img": img,
                "bbox": (0, 0, img.shape[1], img.shape[0]),
                "crop_bbox": (0, 0, img.shape[1], img.shape[0]),
                "confidence": 0.0,
                "status": "no_face_detected",
                "source": "none",
                "face_count": 0,
            }

        cropped, crop_bbox = self.crop_member_region(img, face)

        status = "member_detected" if face["source"] == "yunet" else "heuristic_fallback"

        return {
            "cropped_img": cropped,
            "bbox": tuple(round(v, 1) for v in face["bbox"]),
            "crop_bbox": crop_bbox,
            "eye_center": (
                round((face["right_eye"][0] + face["left_eye"][0]) / 2, 1),
                round((face["right_eye"][1] + face["left_eye"][1]) / 2, 1),
            ),
            "confidence": round(face["score"], 4),
            "status": status,
            "source": face["source"],
            "face_count": len(faces),
        }

    def validate_member_card(self, img: np.ndarray) -> Dict:
        """
        Validate if image contains valid member photocard.

        Args:
            img: Input image

        Returns:
            Validation result with status and metrics
        """
        h, w = img.shape[:2]
        aspect_ratio = w / h if h > 0 else 0

        min_size = 100  # Minimum size in pixels
        is_valid_size = w >= min_size and h >= min_size

        valid_ratios = [0.5, 1.0, 1.5, 2.0]
        is_valid_ratio = any(abs(aspect_ratio - r) < 0.3 for r in valid_ratios)

        return {
            "is_valid": is_valid_size and is_valid_ratio,
            "width": w,
            "height": h,
            "aspect_ratio": round(aspect_ratio, 2),
            "is_valid_size": is_valid_size,
            "is_valid_ratio": is_valid_ratio
        }


if __name__ == "__main__":
    # Test member detector
    detector = MemberDetector()
    print("✓ MemberDetector initialized")
    print(f"  • Face detector: {'YuNet DNN' if detector.use_yunet else 'heuristic fallback (model missing)'}")
    print("  • Crop axis: eye-center (forehead/hair above, chin/chest below)")
    print("  • Ready to extract member photocards")
