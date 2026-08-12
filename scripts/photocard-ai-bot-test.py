#!/usr/bin/env python3
"""
Photocard AI Bot Test Script
Processes and evaluates photocard images from URLs with side-by-side comparison.
"""

import os
import sys
import json
from pathlib import Path
from typing import List, Tuple, Optional
import logging

import cv2
import numpy as np
from PIL import Image
import requests
from io import BytesIO
from rembg import remove, new_session

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

SCRIPT_DIR = Path(__file__).parent
OUTPUT_DIR = SCRIPT_DIR / "output"
OUTPUT_DIR.mkdir(exist_ok=True)

FACE_MODEL_PATH = SCRIPT_DIR / "models" / "face_detection_yunet_2023mar.onnx"
SFACE_MODEL_PATH = SCRIPT_DIR / "models" / "face_recognition_sface_2021dec.onnx"
REFERENCE_FACES_DIR = SCRIPT_DIR / "reference_faces"

# Which member to extract when a source photo turns out to contain several
# cards (a "template"/set listing photo). Matched against
# reference_faces/{TARGET_MEMBER}.png by face similarity.
TARGET_MEMBER = "RM"

# More faces than this in one source photo is treated as "definitely a
# multi-card template/set" and skips straight to target-member face
# matching, rather than trying whole-image quad detection first. A real
# single card's own artwork realistically shows at most a handful of
# members (official duo/unit cards); a full member template/set listing
# shows many more. This isn't just a performance shortcut — verified
# directly that whole-image quad detection can accept a wrong,
# multi-card-spanning region once there are enough separate faces, since
# the accepted region can still coincidentally land in a plausible
# portrait aspect ratio.
MAX_FACES_FOR_SINGLE_CARD = 4

# Photocard aspect ratio (width:height)
PHOTOCARD_ASPECT_RATIO = 1 / 1.54

# A contour smaller than this fraction of the image can't be a photographed
# card filling most of the frame — treat it as "no card found" rather than
# risk latching onto a stray background shape.
MIN_CARD_AREA_RATIO = 0.05

# SFace's own docs suggest ~0.363 cosine similarity as the "same person"
# cutoff at a low false-accept rate. 0.3 is a bit more permissive — checked
# against a real 7-member set photo, the true match scored 0.39 with the
# next-closest impostor at 0.22, a wide enough gap that a small margin of
# extra permissiveness doesn't risk false-accepting the wrong member.
MIN_FACE_MATCH_SIMILARITY = 0.3

class PhotocardProcessor:
    def __init__(self):
        self.images = {}
        self.processed_images = {}
        self.original_images = {}
        self.scores = {}
        self.rembg_session = new_session("u2net")
        self.face_recognizer = (
            cv2.FaceRecognizerSF_create(str(SFACE_MODEL_PATH), "")
            if SFACE_MODEL_PATH.exists()
            else None
        )
        self.reference_embedding = self._load_reference_embedding()

    def _load_reference_embedding(self):
        """Load and embed the bundled reference face for TARGET_MEMBER, used
        to pick that member's card out of a multi-card template/set photo."""
        ref_path = REFERENCE_FACES_DIR / f"{TARGET_MEMBER}.png"
        if self.face_recognizer is None or not ref_path.exists():
            logger.warning(
                f"No reference face for '{TARGET_MEMBER}' at {ref_path} — "
                "multi-card target-member matching will be unavailable"
            )
            return None

        ref_img = cv2.imread(str(ref_path))
        faces = self.detect_all_faces(ref_img)
        if not faces:
            logger.warning(f"No face found in reference image {ref_path}")
            return None

        face = max(faces, key=lambda f: f[-1])
        aligned = self.face_recognizer.alignCrop(ref_img, face)
        return self.face_recognizer.feature(aligned)

    def download_image(self, url_or_path: str, timeout: int = 10) -> Tuple[bool, np.ndarray]:
        """Download image from URL or load from local path."""
        try:
            # Check if it's a local file path
            path = Path(url_or_path)
            if path.exists():
                img = Image.open(path)
                return True, cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

            # Handle file:// URLs
            if url_or_path.startswith('file://'):
                file_path = url_or_path.replace('file:///', '').replace('/', '\\')
                path = Path(file_path)
                if path.exists():
                    img = Image.open(path)
                    return True, cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)

            # Try URL download
            response = requests.get(url_or_path, timeout=timeout)
            response.raise_for_status()
            img = Image.open(BytesIO(response.content))
            return True, cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            logger.error(f"Failed to load {url_or_path}: {e}")
            return False, None

    def detect_all_faces(self, img: np.ndarray, score_threshold: float = 0.5) -> list:
        """Detect every face in the image (not just the best one) — used to
        tell a single-subject photo apart from a multi-card template/set."""
        h, w = img.shape[:2]
        if h == 0 or w == 0:
            return []
        detector = cv2.FaceDetectorYN_create(
            str(FACE_MODEL_PATH), "", (w, h), score_threshold=score_threshold
        )
        _, faces = detector.detect(img)
        return list(faces) if faces is not None else []

    def find_target_member_face(self, img: np.ndarray, faces: list) -> Optional[np.ndarray]:
        """
        Among several detected faces (multi-card template/set photo), pick
        the one matching TARGET_MEMBER by face-embedding similarity —
        OCR-based name matching (reading a printed name label) would often
        be more precise when a label exists, but this project has no OCR
        dependency installed (pytesseract needs a system Tesseract binary;
        easyocr pulls in torch), so this uses the vision-similarity
        fallback the spec calls out as the option for when text isn't
        available or reliable.
        """
        if self.reference_embedding is None or self.face_recognizer is None:
            return None

        best_face, best_score = None, -1.0
        for face in faces:
            aligned = self.face_recognizer.alignCrop(img, face)
            embedding = self.face_recognizer.feature(aligned)
            score = self.face_recognizer.match(
                self.reference_embedding, embedding, cv2.FaceRecognizerSF_FR_COSINE
            )
            if score > best_score:
                best_score = score
                best_face = face

        if best_score < MIN_FACE_MATCH_SIMILARITY:
            logger.warning(
                f"Best face match for '{TARGET_MEMBER}' scored {best_score:.3f}, "
                f"below the {MIN_FACE_MATCH_SIMILARITY} confidence floor"
            )
            return None

        logger.info(f"Matched '{TARGET_MEMBER}' face with similarity {best_score:.3f}")
        return best_face

    def build_face_roi(self, img: np.ndarray, face: np.ndarray) -> np.ndarray:
        """
        Crop a generous region around one matched face, sized for typical
        photocard headshot framing (face in the upper-middle third, body
        below). This is how a single member's card gets isolated out of a
        multi-card template: rembg's foreground mask merges tightly-packed
        or even gap-separated cards into one connected blob (verified
        directly — it's a single-salient-object segmenter, not built for
        multi-instance separation), so splitting the *original* image
        around a *detected face* sidesteps that mask entirely. Running
        find_card_quad on this smaller, single-subject ROI afterward then
        finds a clean border the same way it would for a genuine
        single-card photo.
        """
        h, w = img.shape[:2]
        x, y, fw, fh = face[:4].astype(int)
        margin_x = int(fw * 1.8)
        margin_top = int(fh * 1.5)
        margin_bottom = int(fh * 5.0)
        rx1 = max(0, x - margin_x)
        ry1 = max(0, y - margin_top)
        rx2 = min(w, x + fw + margin_x)
        ry2 = min(h, y + fh + margin_bottom)
        return img[ry1:ry2, rx1:rx2]

    def find_card_quad(self, img: np.ndarray) -> Optional[np.ndarray]:
        """
        Locate the card's outer border as a 4-corner quadrilateral, using a
        rembg foreground mask instead of raw Canny edges — Canny alone picks
        up skin/lighting gradients on a face just as readily as a card
        border (that's the original bug: it would zoom into a chin/neck
        because that's where the strongest local edges were, with no check
        that the "card" it found is even card-shaped).
        Returns None if nothing card-shaped is found — callers must treat
        that as "no card here" and fall back safely, not crop blindly.
        """
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        mask = remove(rgb, session=self.rembg_session, only_mask=True)
        mask = np.array(mask)

        # Close small gaps in the mask (e.g. a light glare crossing the
        # border) and drop isolated speckle noise.
        kernel = np.ones((15, 15), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None

        # When this runs on a face-centered ROI cropped out of a multi-card
        # template, a neighboring card's sliver often survives at the ROI's
        # edge alongside the fully-framed target card. A sliver cut off by
        # the crop boundary touches that boundary; the actual card we
        # framed around normally doesn't (verified directly: in a real
        # multi-card ROI, the true card was the non-border-touching
        # contour, while a same-sized neighbor sliver touched the edge).
        # Prefer non-border-touching contours when any exist.
        h_img, w_img = mask.shape[:2]

        def touches_border(c, margin=2):
            x, y, cw, ch = cv2.boundingRect(c)
            return x <= margin or y <= margin or x + cw >= w_img - margin or y + ch >= h_img - margin

        interior = [c for c in contours if not touches_border(c)]
        largest = max(interior, key=cv2.contourArea) if interior else max(contours, key=cv2.contourArea)

        img_area = img.shape[0] * img.shape[1]
        if cv2.contourArea(largest) < img_area * MIN_CARD_AREA_RATIO:
            return None

        # Require an (approximately) rectangular quad, not just "the
        # biggest blob" — this is the actual Quad Polygon check.
        peri = cv2.arcLength(largest, True)
        approx = cv2.approxPolyDP(largest, 0.02 * peri, True)
        if len(approx) == 4 and cv2.isContourConvex(approx):
            return approx.reshape(4, 2).astype("float32")

        # Foreground mask wasn't a clean quad (rounded corners, a sticker
        # overlapping the card, etc.) — minAreaRect's fitted box is still a
        # legitimate quad, just not the exact traced outline.
        rect = cv2.minAreaRect(largest)
        return cv2.boxPoints(rect).astype("float32")

    def rotate_crop_to_quad(self, img: np.ndarray, quad: np.ndarray) -> np.ndarray:
        """
        Rotate+crop the card to axis-aligned, using minAreaRect's own
        self-consistent (center, size, angle) rather than a corner-labeling
        heuristic (e.g. "top-left = min(x+y)"). That kind of heuristic
        assumes the quad is roughly upright already, and silently produces
        sideways output whenever the source photo has the card rotated
        close to 90deg — the output *dimensions* still look portrait-shaped
        by coincidence, but the pixels inside are rotated.
        """
        center, size, angle = cv2.minAreaRect(quad)
        w, h = size
        if w == 0 or h == 0:
            return img

        # Small padding so the border itself isn't shaved off.
        pad = 1.03
        w, h = w * pad, h * pad

        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            img, M, (img.shape[1], img.shape[0]), flags=cv2.INTER_CUBIC
        )

        x = max(0, int(center[0] - w / 2))
        y = max(0, int(center[1] - h / 2))
        cropped = rotated[y : y + int(h), x : x + int(w)]
        if cropped.size == 0:
            return img

        # minAreaRect can't distinguish "portrait, right way up" from
        # "landscape" — the unambiguous half of the fix is free here.
        if cropped.shape[1] > cropped.shape[0]:
            cropped = cv2.rotate(cropped, cv2.ROTATE_90_CLOCKWISE)

        return cropped

    def resolve_upright_orientation(self, img: np.ndarray) -> np.ndarray:
        """
        minAreaRect's angle still leaves a 90deg-multiple ambiguity after
        rotate_crop_to_quad (it can't tell the card's true "up" from
        "sideways" — that's a semantic question, not a geometric one, and
        some cards are legitimately landscape — e.g. an official multi-member
        group card — so rotate_crop_to_quad's own portrait-forcing step
        can't be the final word either). Photocards always show an upright
        face, so try all 4 rotations and keep whichever YuNet finds the
        highest-confidence face in.

        This can misfire if handed a region that isn't really one card to
        begin with (verified directly: fed a merged multi-card blob, it
        picked a spurious sideways "face" and flipped an otherwise-correct
        portrait crop to landscape) — the fix for that is keeping bad
        multi-card regions out of this function in the first place
        (MAX_FACES_FOR_SINGLE_CARD in process_image), not narrowing the
        rotation search, which only breaks legitimate landscape cards.
        """
        if not FACE_MODEL_PATH.exists():
            logger.warning(f"Face model not found at {FACE_MODEL_PATH}, skipping orientation check")
            return img

        best_rotation, best_score = img, -1.0
        for rot in [None, cv2.ROTATE_90_CLOCKWISE, cv2.ROTATE_180, cv2.ROTATE_90_COUNTERCLOCKWISE]:
            candidate = cv2.rotate(img, rot) if rot is not None else img
            h, w = candidate.shape[:2]
            if h == 0 or w == 0:
                continue
            # A tight, extreme-close-up crop (common once the card border
            # itself has already been isolated) can push YuNet's default
            # ~0.9 confidence threshold to reject every orientation,
            # including the correct one — verified against a real card
            # where the default threshold found zero faces in all 4
            # rotations and silently kept the wrong (upside-down) one. This
            # is only being used for a 4-way relative comparison, not a
            # real face-auth decision, so a permissive threshold is fine.
            detector = cv2.FaceDetectorYN_create(
                str(FACE_MODEL_PATH), "", (w, h), score_threshold=0.3
            )
            _, faces = detector.detect(candidate)
            if faces is None:
                continue
            for face in faces:
                score = float(face[-1])
                if score > best_score:
                    best_score = score
                    best_rotation = candidate

        return best_rotation

    def center_crop_to_ratio(self, img: np.ndarray, target_ratio: float = PHOTOCARD_ASPECT_RATIO) -> np.ndarray:
        """Safe fallback: crop to the target aspect ratio around the image
        center, without guessing at any particular region."""
        h, w = img.shape[:2]
        if w / h > target_ratio:
            new_w = int(h * target_ratio)
            x = (w - new_w) // 2
            return img[:, x : x + new_w]
        new_h = int(w / target_ratio)
        y = (h - new_h) // 2
        return img[y : y + new_h, :]

    def try_crop_to_single_card(self, img: np.ndarray) -> Optional[np.ndarray]:
        """
        Find one card's quad in `img` and rotate+crop to it, resolving
        orientation. Returns None (rather than falling back internally)
        when no card-shaped region is found, or when the detected quad
        doesn't plausibly look like a single card (e.g. the "quad" spans
        multiple cards fused together in the foreground mask — see
        find_card_quad) — callers decide how to fall back, since a caller
        working on a face-matched ROI has a better fallback available
        (that ROI's own center-crop) than one working on the full image.
        """
        quad = self.find_card_quad(img)
        if quad is None:
            return None

        candidate = self.rotate_crop_to_quad(img, quad)
        ch, cw = candidate.shape[:2]
        if ch == 0 or cw == 0:
            return None

        ratio = cw / ch
        if not (0.5 <= ratio <= 0.85):
            logger.warning(
                f"Detected quad has an implausible card ratio ({ratio:.2f}) — "
                "likely a multi-card collage, not a single card."
            )
            return None

        return self.resolve_upright_orientation(candidate)

    def crop_via_target_member_match(self, img: np.ndarray, faces: list) -> Optional[np.ndarray]:
        """Match TARGET_MEMBER among several detected faces and isolate
        just their card. Returns None if the member can't be confidently
        matched — caller decides the fallback."""
        target_face = self.find_target_member_face(img, faces)
        if target_face is None:
            logger.warning(
                f"'{TARGET_MEMBER}' not confidently matched among "
                f"{len(faces)} faces — falling back to a centered crop"
            )
            return None

        roi = self.build_face_roi(img, target_face)
        cropped = self.try_crop_to_single_card(roi)
        if cropped is None:
            logger.warning(
                f"No clean card border found around '{TARGET_MEMBER}' — "
                "falling back to a centered crop of that region"
            )
            return self.center_crop_to_ratio(roi)
        return cropped

    def process_image(self, img: np.ndarray) -> np.ndarray:
        """
        Process image down to one card. Order of attempts:

        1. Count faces in the full image first. More than
           MAX_FACES_FOR_SINGLE_CARD (a real BTS card design realistically
           shows at most a handful of members) is a strong sign this is a
           multi-card template/set, not a single card — go straight to
           target-member face matching rather than risk the whole-image
           quad detector accepting a wrong region. Verified directly: on a
           7-member set image, the geometric detector *did* accept a
           portrait-ratio quad that actually spanned pieces of 4 different
           cards — passing the aspect-ratio plausibility check is not
           sufficient on its own once there are this many separate faces.
        2. Otherwise (0 faces, or few enough to plausibly be one card's own
           artwork — e.g. an official duo/unit card), try whole-image quad
           detection directly. This correctly handles both an ordinary
           single-card photo and a legitimate multi-person single card,
           since geometric quad detection doesn't care how many faces are
           on the one card it finds.
        3. If step 2 fails (no quad, or an implausible ratio) and there
           were 2+ faces after all, fall back to target-member matching.
        4. Last resort: a centered crop, never a blind geometric guess.

        Normalizes height without forcing any particular width — a forced
        fixed W x H resize would silently stretch/squish whatever aspect
        ratio the true crop has, which is the distortion bug this was
        written against.
        """
        faces = self.detect_all_faces(img)
        cropped = None

        if len(faces) > MAX_FACES_FOR_SINGLE_CARD:
            logger.info(
                f"{len(faces)} faces detected (> {MAX_FACES_FOR_SINGLE_CARD}) — "
                f"likely a multi-card template/set; matching target member '{TARGET_MEMBER}'"
            )
            cropped = self.crop_via_target_member_match(img, faces)
        else:
            cropped = self.try_crop_to_single_card(img)
            if cropped is None and len(faces) > 1:
                logger.info(
                    f"No single card found directly, but {len(faces)} faces "
                    f"detected — matching target member '{TARGET_MEMBER}'"
                )
                cropped = self.crop_via_target_member_match(img, faces)

        if cropped is None:
            logger.warning("No card-shaped region found — falling back to a centered crop")
            cropped = self.center_crop_to_ratio(img)

        # Preserve the crop's own aspect ratio — only scale to a consistent
        # height, never force a fixed width alongside it.
        standard_h = 400
        scale = standard_h / cropped.shape[0]
        new_w = max(1, int(cropped.shape[1] * scale))
        return cv2.resize(cropped, (new_w, standard_h), interpolation=cv2.INTER_LANCZOS4)

    def create_comparison_image(self, original: np.ndarray, processed: np.ndarray) -> np.ndarray:
        """Create side-by-side comparison of original and processed images."""
        # Normalize dimensions for comparison
        orig_h, orig_w = original.shape[:2]
        proc_h, proc_w = processed.shape[:2]

        # Resize original to match processed height for better comparison
        scale = proc_h / orig_h
        target_w = int(orig_w * scale)
        if target_w > 0:
            original_resized = cv2.resize(original, (target_w, proc_h), interpolation=cv2.INTER_LANCZOS4)
        else:
            original_resized = original

        # Ensure same height
        if original_resized.shape[0] != processed.shape[0]:
            max_h = max(original_resized.shape[0], processed.shape[0])
            original_resized = cv2.resize(original_resized, (original_resized.shape[1], max_h))
            processed = cv2.resize(processed, (processed.shape[1], max_h))

        # Create separator line
        separator = np.ones((processed.shape[0], 5, 3), dtype=np.uint8) * 200

        # Concatenate horizontally with labels
        comparison = np.hstack([original_resized, separator, processed])

        # Add labels
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.6
        thickness = 2
        color = (0, 0, 0)

        # "Original" label
        cv2.putText(comparison, "Original", (10, 30), font, font_scale, color, thickness)
        # "Processed" label
        processed_x = original_resized.shape[1] + separator.shape[1] + 10
        cv2.putText(comparison, "Processed", (processed_x, 30), font, font_scale, color, thickness)

        return comparison

    def calculate_sharpness(self, img: np.ndarray) -> float:
        """Calculate image sharpness using Laplacian variance."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness = np.var(laplacian)
        # Normalize to 0-100 scale (typical max ~1000)
        return min(100, (sharpness / 10.0))

    def calculate_aspect_ratio_score(self, img: np.ndarray) -> float:
        """Score based on aspect ratio proximity to 1:1.54."""
        h, w = img.shape[:2]
        actual_ratio = w / h
        target_ratio = 1 / 1.54

        ratio_diff = abs(actual_ratio - target_ratio) / target_ratio
        score = max(0, 100 - (ratio_diff * 100))
        return min(100, score)

    def calculate_resolution_score(self, img: np.ndarray) -> float:
        """Score based on image resolution."""
        h, w = img.shape[:2]
        pixels = h * w
        target_pixels = 400 * 260

        if pixels < 100000:
            return 10
        elif pixels < target_pixels:
            return (pixels / target_pixels) * 90 + 10
        else:
            return 100

    def calculate_noise_score(self, img: np.ndarray) -> float:
        """Score based on noise level (texture quality)."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

        # Calculate Laplacian variance (edges/texture indicator)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        noise_level = np.var(laplacian)

        # Higher variance = more texture (good for photocards)
        # Normalize to 0-100
        if noise_level < 100:
            score = 30
        elif noise_level < 500:
            score = (noise_level - 100) / 4 + 30
        else:
            score = 100

        return min(100, max(0, score))

    def calculate_brightness_score(self, img: np.ndarray) -> float:
        """Score based on brightness and contrast."""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

        brightness = np.mean(gray)
        contrast = np.std(gray)

        # Ideal brightness around 128, good contrast > 30
        brightness_penalty = abs(brightness - 128) / 128
        contrast_score = min(100, (contrast / 50) * 100)

        brightness_score = max(0, 100 - (brightness_penalty * 50))

        return (brightness_score + contrast_score) / 2

    def evaluate_image(self, img: np.ndarray) -> dict:
        """Calculate overall quality score."""
        sharpness = self.calculate_sharpness(img)
        aspect_ratio = self.calculate_aspect_ratio_score(img)
        resolution = self.calculate_resolution_score(img)
        noise = self.calculate_noise_score(img)
        brightness = self.calculate_brightness_score(img)

        # Weighted average
        overall_score = (
            sharpness * 0.30 +
            aspect_ratio * 0.20 +
            resolution * 0.20 +
            noise * 0.15 +
            brightness * 0.15
        )

        return {
            "overall": overall_score,
            "sharpness": sharpness,
            "aspect_ratio": aspect_ratio,
            "resolution": resolution,
            "noise": noise,
            "brightness": brightness
        }

    def run(self, image_urls: List[str]):
        """Process multiple images and select the best one."""
        logger.info(f"Processing {len(image_urls)} images...")

        for idx, url in enumerate(image_urls, 1):
            logger.info(f"\n[Image {idx}/{len(image_urls)}] Processing {url}")

            # Download
            success, img = self.download_image(url)
            if not success:
                continue

            self.original_images[idx] = img.copy()
            logger.info(f"  Downloaded: {img.shape}")

            # Process
            img_processed = self.process_image(img)
            logger.info(f"  Processed: {img_processed.shape}")

            # Evaluate
            scores = self.evaluate_image(img_processed)
            self.images[idx] = img_processed
            self.processed_images[idx] = img_processed
            self.scores[idx] = scores

            # Log scores
            logger.info(f"  Scores:")
            logger.info(f"    Overall:      {scores['overall']:.1f}")
            logger.info(f"    Sharpness:    {scores['sharpness']:.1f}")
            logger.info(f"    Aspect Ratio: {scores['aspect_ratio']:.1f}")
            logger.info(f"    Resolution:   {scores['resolution']:.1f}")
            logger.info(f"    Noise:        {scores['noise']:.1f}")
            logger.info(f"    Brightness:   {scores['brightness']:.1f}")

        # Select best image
        if not self.images:
            logger.error("No images processed successfully!")
            return

        best_idx = max(self.scores, key=lambda x: self.scores[x]['overall'])
        best_score = self.scores[best_idx]['overall']

        logger.info(f"\n{'='*50}")
        logger.info(f"BEST IMAGE: Image {best_idx}")
        logger.info(f"Overall Score: {best_score:.1f}/100")
        logger.info(f"{'='*50}")

        # Save best image
        output_path = OUTPUT_DIR / "best_card.png"
        cv2.imwrite(str(output_path), self.images[best_idx])
        logger.info(f"Saved to: {output_path}")

        # Save comparison image (original vs processed for best)
        if best_idx in self.original_images:
            comparison = self.create_comparison_image(
                self.original_images[best_idx],
                self.processed_images[best_idx]
            )
            comparison_path = OUTPUT_DIR / "comparison_result.png"
            cv2.imwrite(str(comparison_path), comparison)
            logger.info(f"Comparison saved to: {comparison_path}")

        # Save detailed report
        self._save_report(best_idx)

    def _save_report(self, best_idx: int):
        """Save detailed evaluation report."""
        report = {
            "best_image_index": best_idx,
            "best_score": self.scores[best_idx]['overall'],
            "all_scores": {}
        }

        for idx, scores in self.scores.items():
            report["all_scores"][f"image_{idx}"] = {
                k: float(v) for k, v in scores.items()
            }

        report_path = OUTPUT_DIR / "evaluation_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        logger.info(f"Report saved to: {report_path}")


def main():
    if len(sys.argv) < 2:
        logger.error("Usage: python photocard-ai-bot-test.py <url1> [url2] [url3] ...")
        logger.info("\nExample:")
        logger.info("  python photocard-ai-bot-test.py 'https://example.com/card1.jpg' 'https://example.com/card2.jpg'")
        sys.exit(1)

    image_urls = sys.argv[1:]
    processor = PhotocardProcessor()
    processor.run(image_urls)


if __name__ == "__main__":
    main()
