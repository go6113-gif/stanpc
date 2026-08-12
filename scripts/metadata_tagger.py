#!/usr/bin/env python3
"""
Metadata Auto-Tagging Module
Automatically tags photocard metadata based on collection source and processing.
"""

from typing import Dict, Optional
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Tier 1 Groups from GROUP_EXPANSION_ROADMAP.md
TIER1_GROUPS = {
    6: "Stray Kids",
    7: "NCT 127",
    8: "AESPA",
    9: "IVE",
    10: "LE SSERAFIM",
    11: "ENHYPEN",
    12: "ATEEZ",
    13: "TXT",
    14: "ZB1",
    15: "RIIZE",
    16: "BABYMONSTER",
    17: "ILLIT",
    18: "BOYNEXTDOOR",
    19: "TWS",
    20: "FIFTY FIFTY",
    21: "KISS OF LIFE",
    22: "JEANNETTE",
    23: "EVESUND",
    24: "LOONA",
    25: "SEVENTEEN (Unit)",
    26: "GOT7",
    27: "XODIAC",
    28: "DIAMOND",
    29: "UNIVERSE COWARDS",
    30: "ROCKSTAR GAME"
}

class MetadataTagger:
    """Auto-tags photocard metadata."""

    def __init__(self):
        """Initialize metadata tagger."""
        self.tier1_groups = TIER1_GROUPS
        self.member_roles = {
            "Leader": ["leader"],
            "Vocalist": ["vocal", "vocals"],
            "Dancer": ["dance", "dancer"],
            "Rapper": ["rap", "rapper"],
            "Sub-Vocalist": ["sub-vocal"],
            "Visual": ["visual"],
            "Maknae": ["maknae", "youngest"],
        }

    def extract_group_name(self, query: str) -> Optional[str]:
        """
        Extract group name from search query.

        Args:
            query: Search query (e.g., "BTS RM photocard")

        Returns:
            Extracted group name or None
        """
        query_upper = query.upper()

        # Check Tier 1 groups
        for rank, group_name in self.tier1_groups.items():
            if group_name.upper() in query_upper:
                return group_name

        # Try generic K-POP groups
        common_groups = [
            "BTS", "SEVENTEEN", "TWICE", "BLACKPINK", "NewJeans",
            "EXO", "RED VELVET", "TWICE", "IVE", "AESPA"
        ]
        for group in common_groups:
            if group in query_upper:
                return group

        return None

    def extract_member_name(self, query: str) -> Optional[str]:
        """
        Extract member name from search query.

        Args:
            query: Search query (e.g., "BTS RM photocard")

        Returns:
            Extracted member name or None
        """
        # Common K-POP member names
        common_members = [
            "RM", "Jin", "Suga", "Hobi", "Jhope", "Jimin", "V", "Kook", "Jungkook",
            "SK", "Woozi", "Vernon", "DK", "Seungkwan",
            "Nayeon", "Jeongyeon", "Momo", "Sana", "Jihyo", "Mina", "Dahyun", "Chaeyoung", "Tzuyu",
            # Add more as needed
        ]

        query_upper = query.upper()
        for member in common_members:
            if member.upper() in query_upper:
                return member

        return None

    def generate_metadata(self, query: str, ebay_listing: Dict = None,
                         processing_info: Dict = None) -> Dict:
        """
        Generate complete metadata for photocard.

        Args:
            query: Search query
            ebay_listing: eBay listing data (optional)
            processing_info: Image processing results (optional)

        Returns:
            Complete metadata dictionary
        """
        group_name = self.extract_group_name(query)
        member_name = self.extract_member_name(query)

        metadata = {
            # Basic info
            "group": group_name or "Unknown",
            "member": member_name or "Unknown",
            "search_query": query,

            # Processing info
            "processing": processing_info or {},

            # Source info
            "source": {
                "platform": "eBay",
                "listing_id": ebay_listing.get("item_id") if ebay_listing else "unknown",
                "listing_title": ebay_listing.get("title") if ebay_listing else "unknown",
                "seller": ebay_listing.get("seller") if ebay_listing else "unknown",
                "price": ebay_listing.get("price") if ebay_listing else None,
                "currency": ebay_listing.get("currency") if ebay_listing else "USD",
                "condition": ebay_listing.get("condition") if ebay_listing else "unknown",
                "collection_timestamp": datetime.now().isoformat(),
            },

            # Processing status
            "processing_status": {
                "member_detected": processing_info.get("status") == "member_detected" if processing_info else False,
                "aspect_ratio_corrected": processing_info.get("validation", {}).get("is_valid") if processing_info else False,
                "face_detection_confidence": processing_info.get("confidence", 0) if processing_info else 0,
                "padding_applied": processing_info.get("padding", {}).get("needs_padding", False) if processing_info else False,
            },

            # Quality metrics
            "quality": {
                "original_dimensions": processing_info.get("original", {}) if processing_info else {},
                "processed_dimensions": processing_info.get("processed", {}) if processing_info else {},
                "aspect_ratio": processing_info.get("processed", {}).get("ratio") if processing_info else None,
            },

            # Tier classification
            "tier": {
                "level": "Tier 1",
                "collection_frequency": "24h (daily automation)",
                "priority": "High"
            },

            # Tags for search/filter
            "tags": self._generate_tags(group_name, member_name, processing_info),

            # Metadata version
            "schema_version": "1.0",
            "generated_at": datetime.now().isoformat(),
        }

        return metadata

    def _generate_tags(self, group_name: Optional[str], member_name: Optional[str],
                       processing_info: Optional[Dict]) -> list:
        """Generate searchable tags."""
        tags = []

        if group_name:
            tags.append(f"group:{group_name.lower()}")
        if member_name:
            tags.append(f"member:{member_name.lower()}")

        if processing_info:
            if processing_info.get("status") == "member_detected":
                tags.append("member-detected")
            if processing_info.get("validation", {}).get("is_valid"):
                tags.append("aspect-ratio-corrected")
            if processing_info.get("padding", {}).get("needs_padding"):
                tags.append("padded")

        tags.extend(["photocard", "kpop", "tier-1"])

        return list(set(tags))  # Remove duplicates

    def format_metadata_log(self, metadata: Dict) -> str:
        """
        Format metadata for logging output.

        Args:
            metadata: Metadata dictionary

        Returns:
            Formatted string for logging
        """
        lines = []
        lines.append("📝 Metadata Tags:")
        lines.append(f"  • Group: {metadata.get('group', 'Unknown')}")
        lines.append(f"  • Member: {metadata.get('member', 'Unknown')}")
        lines.append(f"  • Source: {metadata['source'].get('platform')} ({metadata['source'].get('seller', 'Unknown')})")
        lines.append(f"  • Condition: {metadata['source'].get('condition', 'Unknown')}")
        lines.append(f"  • Price: ${metadata['source'].get('price', 'N/A')} {metadata['source'].get('currency', 'USD')}")

        lines.append("📊 Processing Status:")
        ps = metadata.get("processing_status", {})
        lines.append(f"  • Member Detected: {'✓' if ps.get('member_detected') else '✗'}")
        lines.append(f"  • Aspect Ratio Corrected: {'✓' if ps.get('aspect_ratio_corrected') else '✗'}")
        lines.append(f"  • Face Detection Confidence: {ps.get('face_detection_confidence', 0):.2f}")
        lines.append(f"  • Padding Applied: {'✓' if ps.get('padding_applied') else '✗'}")

        quality = metadata.get("quality", {})
        if quality.get("aspect_ratio"):
            lines.append(f"  • Final Aspect Ratio: {quality.get('aspect_ratio'):.3f}")

        return "\n".join(lines)


if __name__ == "__main__":
    # Test metadata tagger
    tagger = MetadataTagger()
    print("✓ MetadataTagger initialized")
    print(f"  • Tier 1 Groups: {len(tagger.tier1_groups)} groups")
    print("  • Ready to auto-tag photocard metadata")
