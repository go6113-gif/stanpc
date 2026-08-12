#!/usr/bin/env python3
"""
Price Analytics Module
Analyze and normalize price trends from collected market data
(Min, Average, Max prices with temporal statistics)
"""

import json
import logging
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from pathlib import Path
import statistics

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class PricePoint:
    """Single price observation"""
    timestamp: str
    price: float
    currency: str
    market: str
    source_url: Optional[str] = None


@dataclass
class PriceStatistics:
    """Aggregated price statistics"""
    min_price: float
    max_price: float
    avg_price: float
    median_price: float
    std_dev: float
    total_samples: int
    currency: str
    markets: List[str]
    time_period_days: int
    price_change_pct: float


@dataclass
class CardPriceAnalysis:
    """Complete price analysis for a single card"""
    card_id: str
    card_name: str
    statistics: PriceStatistics
    trend: str  # 'up', 'down', 'stable'
    price_points: List[PricePoint]
    last_updated: str


class PriceAnalyzer:
    """Analyze price trends and generate statistics"""

    def __init__(self):
        self.price_data = {}

    def add_price_point(self,
                       card_id: str,
                       card_name: str,
                       price: float,
                       currency: str = "KRW",
                       market: str = "unknown",
                       source_url: Optional[str] = None,
                       timestamp: Optional[str] = None):
        """Add a price observation for a card"""
        if timestamp is None:
            timestamp = datetime.utcnow().isoformat()

        if card_id not in self.price_data:
            self.price_data[card_id] = {
                'card_name': card_name,
                'prices': []
            }

        point = PricePoint(
            timestamp=timestamp,
            price=price,
            currency=currency,
            market=market,
            source_url=source_url
        )

        self.price_data[card_id]['prices'].append(point)
        logger.debug(f"Added price point for {card_name}: {price} {currency}")

    def load_from_json(self, json_file: str):
        """Load price data from JSON file (eBay or Bungle crawler output)"""
        json_path = Path(json_file)
        if not json_path.exists():
            logger.warning(f"File not found: {json_file}")
            return

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if isinstance(data, list):
                for item in data:
                    self.add_price_point(
                        card_id=item.get('item_id') or item.get('title', 'unknown'),
                        card_name=item.get('title', 'Unknown Card'),
                        price=float(item.get('price', 0)),
                        currency=item.get('currency', 'KRW'),
                        market='ebay' if item.get('platform') != 'bungle' else 'bungle',
                        source_url=item.get('listing_url') or item.get('item_link'),
                        timestamp=item.get('fetched_at')
                    )

            logger.info(f"Loaded {len(self.price_data)} unique cards from {json_file}")

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
        except Exception as e:
            logger.error(f"Error loading price data: {e}")

    def analyze_card(self, card_id: str) -> Optional[CardPriceAnalysis]:
        """Analyze price trend for a single card"""
        if card_id not in self.price_data:
            logger.warning(f"No price data found for card: {card_id}")
            return None

        data = self.price_data[card_id]
        prices = data['prices']

        if len(prices) == 0:
            return None

        # Extract price values
        price_values = [p.price for p in prices]
        currencies = list(set(p.currency for p in prices))
        markets = list(set(p.market for p in prices))

        # Calculate statistics
        min_price = min(price_values)
        max_price = max(price_values)
        avg_price = statistics.mean(price_values)
        median_price = statistics.median(price_values)

        # Standard deviation (if more than 1 sample)
        std_dev = statistics.stdev(price_values) if len(price_values) > 1 else 0.0

        # Time period
        timestamps = [datetime.fromisoformat(p.timestamp.replace('Z', '+00:00')) for p in prices]
        time_span = max(timestamps) - min(timestamps)
        time_period_days = max(1, time_span.days)

        # Price trend (first vs last)
        price_change = ((price_values[-1] - price_values[0]) / price_values[0] * 100) if price_values[0] != 0 else 0
        price_change_pct = round(price_change, 2)

        # Trend direction
        if price_change_pct > 5:
            trend = 'up'
        elif price_change_pct < -5:
            trend = 'down'
        else:
            trend = 'stable'

        stats = PriceStatistics(
            min_price=round(min_price, 2),
            max_price=round(max_price, 2),
            avg_price=round(avg_price, 2),
            median_price=round(median_price, 2),
            std_dev=round(std_dev, 2),
            total_samples=len(price_values),
            currency=currencies[0] if currencies else 'KRW',
            markets=markets,
            time_period_days=time_period_days,
            price_change_pct=price_change_pct
        )

        return CardPriceAnalysis(
            card_id=card_id,
            card_name=data['card_name'],
            statistics=stats,
            trend=trend,
            price_points=prices,
            last_updated=datetime.utcnow().isoformat()
        )

    def analyze_all(self) -> List[CardPriceAnalysis]:
        """Analyze all cards in the dataset"""
        analyses = []
        for card_id in self.price_data.keys():
            analysis = self.analyze_card(card_id)
            if analysis:
                analyses.append(analysis)
        return analyses

    def get_market_summary(self) -> Dict:
        """Get summary statistics across all markets"""
        if not self.price_data:
            return {}

        all_prices = []
        market_prices = {}

        for card_data in self.price_data.values():
            for price_point in card_data['prices']:
                all_prices.append(price_point.price)
                market = price_point.market
                if market not in market_prices:
                    market_prices[market] = []
                market_prices[market].append(price_point.price)

        summary = {
            'total_observations': len(all_prices),
            'unique_cards': len(self.price_data),
            'overall_min': min(all_prices) if all_prices else 0,
            'overall_max': max(all_prices) if all_prices else 0,
            'overall_avg': round(statistics.mean(all_prices), 2) if all_prices else 0,
            'market_breakdown': {}
        }

        for market, prices in market_prices.items():
            summary['market_breakdown'][market] = {
                'count': len(prices),
                'min': min(prices),
                'max': max(prices),
                'avg': round(statistics.mean(prices), 2)
            }

        return summary

    def export_report(self,
                     analyses: List[CardPriceAnalysis],
                     output_file: str = "price_analysis_report.json") -> bool:
        """Export analysis report to JSON"""
        output_path = Path(__file__).parent.parent / output_file

        try:
            report = {
                'generated_at': datetime.utcnow().isoformat(),
                'market_summary': self.get_market_summary(),
                'card_analyses': [asdict(a) for a in analyses],
                'trend_summary': {
                    'up': len([a for a in analyses if a.trend == 'up']),
                    'down': len([a for a in analyses if a.trend == 'down']),
                    'stable': len([a for a in analyses if a.trend == 'stable'])
                }
            }

            # Convert PricePoint objects to dicts
            for analysis_dict in report['card_analyses']:
                analysis_dict['price_points'] = [asdict(p) for p in analysis_dict['price_points']]

            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)

            logger.info(f"Report exported to {output_file}")
            return True

        except Exception as e:
            logger.error(f"Failed to export report: {e}")
            return False

    def print_summary(self, analyses: List[CardPriceAnalysis]):
        """Print human-readable summary"""
        print("\n" + "=" * 70)
        print("PRICE ANALYTICS REPORT")
        print("=" * 70)

        summary = self.get_market_summary()
        print(f"\nMarket Summary:")
        print(f"  Total observations: {summary['total_observations']}")
        print(f"  Unique cards: {summary['unique_cards']}")
        print(f"  Price range: {summary['overall_min']:,.0f} - {summary['overall_max']:,.0f}")
        print(f"  Average price: {summary['overall_avg']:,.0f}")

        if summary['market_breakdown']:
            print(f"\nBreakdown by Market:")
            for market, stats in summary['market_breakdown'].items():
                print(f"  {market.upper()}:")
                print(f"    Count: {stats['count']}")
                print(f"    Range: {stats['min']:,.0f} - {stats['max']:,.0f}")
                print(f"    Average: {stats['avg']:,.0f}")

        print(f"\nTrend Analysis:")
        trend_summary = {
            'up': len([a for a in analyses if a.trend == 'up']),
            'down': len([a for a in analyses if a.trend == 'down']),
            'stable': len([a for a in analyses if a.trend == 'stable'])
        }
        print(f"  Uptrend: {trend_summary['up']} cards")
        print(f"  Downtrend: {trend_summary['down']} cards")
        print(f"  Stable: {trend_summary['stable']} cards")

        print(f"\nTop 5 Most Expensive Cards:")
        top_cards = sorted(analyses, key=lambda a: a.statistics.max_price, reverse=True)[:5]
        for i, card in enumerate(top_cards, 1):
            print(f"  {i}. {card.card_name}: {card.statistics.max_price:,.0f} {card.statistics.currency}")

        print(f"\nTop 5 Most Volatile Cards (by price range):")
        volatile_cards = sorted(
            analyses,
            key=lambda a: a.statistics.max_price - a.statistics.min_price,
            reverse=True
        )[:5]
        for i, card in enumerate(volatile_cards, 1):
            price_range = card.statistics.max_price - card.statistics.min_price
            print(f"  {i}. {card.card_name}: {price_range:,.0f} range (volatility)")

        print("=" * 70 + "\n")


def main():
    """Demo usage"""
    analyzer = PriceAnalyzer()

    # Try to load from existing crawler outputs
    ebay_file = Path(__file__).parent.parent / "ebay_listings.json"
    bungle_file = Path(__file__).parent.parent / "bungle_listings.json"

    if ebay_file.exists():
        analyzer.load_from_json(str(ebay_file))
    if bungle_file.exists():
        analyzer.load_from_json(str(bungle_file))

    # If no real data, create demo data
    if not analyzer.price_data:
        logger.info("Creating demo price data...")
        demo_cards = [
            ("BTS_V_001", "BTS V Official Photocard (2021)", [5000, 5200, 5100, 5300]),
            ("TWICE_NAYEON_001", "TWICE Nayeon Card (Opened)", [8000, 8500, 8200, 8800, 8600]),
            ("NEWJEANS_HANNI_001", "NewJeans Hanni Card (Sealed)", [15000, 14500, 15500, 15200, 15800]),
        ]

        for card_id, card_name, prices in demo_cards:
            for price in prices:
                analyzer.add_price_point(
                    card_id=card_id,
                    card_name=card_name,
                    price=price,
                    currency="KRW",
                    market="ebay" if price < 10000 else "bungle"
                )

    # Analyze
    analyses = analyzer.analyze_all()

    # Print summary
    analyzer.print_summary(analyses)

    # Export report
    analyzer.export_report(analyses, output_file="output/price_analysis_report.json")


if __name__ == "__main__":
    main()
