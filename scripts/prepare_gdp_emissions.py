from __future__ import annotations

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RAW_INPUT_CANDIDATES = [
    ROOT / "data" / "raw" / "owid_co2_data.csv",
    ROOT / "data" / "raw" / "owid-co2-data.csv",
]
INPUT_PATH = next((path for path in RAW_INPUT_CANDIDATES if path.exists()), RAW_INPUT_CANDIDATES[0])
OUTPUT_PATH = ROOT / "data" / "processed" / "gdp_emissions.csv"
OUTPUT_START_YEAR = 1995
STRONG_DECOUPLING_RATIO = 2
STRONG_DECOUPLING_GAP = 10
NO_DECOUPLING_RATIO = 1.5
NO_DECOUPLING_GAP = 10

COUNTRIES = {
    "Argentina",
    "Australia",
    "Bangladesh",
    "Brazil",
    "Canada",
    "China",
    "Egypt",
    "France",
    "Germany",
    "India",
    "Indonesia",
    "Iran",
    "Italy",
    "Japan",
    "Kazakhstan",
    "Malaysia",
    "Mexico",
    "Mongolia",
    "Nigeria",
    "Pakistan",
    "Philippines",
    "Poland",
    "Qatar",
    "Russia",
    "Saudi Arabia",
    "South Africa",
    "South Korea",
    "Thailand",
    "Turkey",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Vietnam",
}

COUNTRY_REGIONS = {
    "Argentina": "南美洲",
    "Australia": "大洋洲",
    "Bangladesh": "亚洲",
    "Brazil": "南美洲",
    "Canada": "北美洲",
    "China": "亚洲",
    "Egypt": "非洲",
    "France": "欧洲",
    "Germany": "欧洲",
    "India": "亚洲",
    "Indonesia": "亚洲",
    "Iran": "亚洲",
    "Italy": "欧洲",
    "Japan": "亚洲",
    "Kazakhstan": "亚洲",
    "Malaysia": "亚洲",
    "Mexico": "北美洲",
    "Mongolia": "亚洲",
    "Nigeria": "非洲",
    "Pakistan": "亚洲",
    "Philippines": "亚洲",
    "Poland": "欧洲",
    "Qatar": "亚洲",
    "Russia": "欧洲",
    "Saudi Arabia": "亚洲",
    "South Africa": "非洲",
    "South Korea": "亚洲",
    "Thailand": "亚洲",
    "Turkey": "亚洲",
    "United Arab Emirates": "亚洲",
    "United Kingdom": "欧洲",
    "United States": "北美洲",
    "Vietnam": "亚洲",
}

COUNTRY_DEVELOPMENT_TYPES = {
    "Argentina": "资源出口型经济；交通、航空、物流快速扩张",
    "Bangladesh": "工业化早中期；出口制造型增长；交通、航空、物流快速扩张",
    "Brazil": "资源出口型经济；交通、航空、物流快速扩张",
    "China": "工业化早中期；能源结构以煤炭为主；出口制造型增长；交通、航空、物流快速扩张",
    "Egypt": "工业化早中期；交通、航空、物流快速扩张",
    "India": "工业化早中期；能源结构以煤炭为主；出口制造型增长；交通、航空、物流快速扩张",
    "Indonesia": "工业化早中期；能源结构以煤炭为主；出口制造型增长；资源出口型经济",
    "Iran": "资源出口型经济；交通、航空、物流快速扩张",
    "Kazakhstan": "能源结构以煤炭为主；资源出口型经济",
    "Malaysia": "出口制造型增长；资源出口型经济；交通、航空、物流快速扩张",
    "Mexico": "出口制造型增长；交通、航空、物流快速扩张；资源出口型经济",
    "Mongolia": "能源结构以煤炭为主；资源出口型经济",
    "Nigeria": "资源出口型经济；交通、航空、物流快速扩张",
    "Pakistan": "工业化早中期；能源结构以煤炭为主；交通、航空、物流快速扩张",
    "Philippines": "工业化早中期；能源结构以煤炭为主；出口制造型增长；交通、航空、物流快速扩张",
    "Poland": "能源结构以煤炭为主；出口制造型增长",
    "Qatar": "资源出口型经济；交通、航空、物流快速扩张",
    "Russia": "资源出口型经济；能源结构以煤炭为主",
    "Saudi Arabia": "资源出口型经济；交通、航空、物流快速扩张",
    "South Africa": "能源结构以煤炭为主；资源出口型经济；工业化早中期",
    "Thailand": "工业化早中期；出口制造型增长；交通、航空、物流快速扩张",
    "Turkey": "工业化早中期；出口制造型增长；交通、航空、物流快速扩张",
    "United Arab Emirates": "资源出口型经济；交通、航空、物流快速扩张",
    "Vietnam": "工业化早中期；能源结构以煤炭为主；出口制造型增长；交通、航空、物流快速扩张",
}

OUTPUT_FIELDS = [
    "country",
    "iso3",
    "region",
    "development_type",
    "year",
    "gdp_ppp",
    "population",
    "total_co2",
    "co2_per_capita",
    "carbon_intensity",
    "gdp_growth_5y",
    "co2_growth_5y",
    "intensity_change_5y",
    "decoupling_status",
]


def parse_float(value: str) -> float | None:
    if value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None


def pct_change(current: float | None, previous: float | None) -> float | None:
    if current is None or previous is None or previous == 0:
        return None
    return (current - previous) / previous * 100


def round_or_empty(value: float | None, digits: int) -> str:
    if value is None:
        return ""
    return f"{value:.{digits}f}"


def classify_decoupling(gdp_growth: float | None, co2_growth: float | None) -> str:
    if gdp_growth is None or co2_growth is None:
        return "数据不足"
    if gdp_growth <= 0 and co2_growth < 0:
        return "经济收缩型减排"
    if gdp_growth > 0 and co2_growth < 0:
        return "完全脱钩"
    if gdp_growth > 0 and (
        gdp_growth >= co2_growth * STRONG_DECOUPLING_RATIO
        or gdp_growth - co2_growth >= STRONG_DECOUPLING_GAP
    ):
        return "基本脱钩"
    if gdp_growth > 0 and co2_growth >= 0 and (
        co2_growth >= gdp_growth * NO_DECOUPLING_RATIO
        or co2_growth - gdp_growth >= NO_DECOUPLING_GAP
    ):
        return "依赖"
    if gdp_growth > 0 and co2_growth >= 0:
        return "未脱钩"
    return "其他"


def load_rows() -> dict[tuple[str, int], dict[str, float | str | int | None]]:
    rows: dict[tuple[str, int], dict[str, float | str | int | None]] = {}

    with INPUT_PATH.open("r", encoding="utf-8", newline="") as file:
        reader = csv.DictReader(file)
        for raw in reader:
            country = raw["country"]
            iso3 = raw["iso_code"]
            if country not in COUNTRIES or len(iso3) != 3:
                continue

            year = int(raw["year"])
            gdp = parse_float(raw["gdp"])
            population = parse_float(raw["population"])
            co2 = parse_float(raw["co2"])
            co2_per_capita = parse_float(raw["co2_per_capita"])
            carbon_intensity = parse_float(raw["co2_per_gdp"])

            if gdp is None or population is None or co2 is None:
                continue

            rows[(country, year)] = {
                "country": country,
                "iso3": iso3,
                "region": COUNTRY_REGIONS[country],
                "year": year,
                "gdp": gdp,
                "population": population,
                "co2": co2,
                "co2_per_capita": co2_per_capita,
                "carbon_intensity": carbon_intensity,
            }

    return rows


def build_output_rows(
    rows: dict[tuple[str, int], dict[str, float | str | int | None]],
) -> list[dict[str, str | int]]:
    output_rows: list[dict[str, str | int]] = []

    for (country, year), row in sorted(rows.items(), key=lambda item: (item[0][0], item[0][1])):
        if year < OUTPUT_START_YEAR:
            continue

        previous = rows.get((country, year - 5))
        if previous is None:
            continue

        gdp_growth = pct_change(row["gdp"], previous["gdp"])  # type: ignore[arg-type]
        co2_growth = pct_change(row["co2"], previous["co2"])  # type: ignore[arg-type]
        intensity_change = pct_change(
            row["carbon_intensity"], previous["carbon_intensity"]  # type: ignore[arg-type]
        )

        if gdp_growth is None or co2_growth is None:
            continue

        output_rows.append(
            {
                "country": row["country"],
                "iso3": row["iso3"],
                "region": row["region"],
                "development_type": COUNTRY_DEVELOPMENT_TYPES.get(country, ""),
                "year": row["year"],
                "gdp_ppp": round_or_empty(row["gdp"] / 1_000_000_000, 2),  # type: ignore[operator]
                "population": round_or_empty(row["population"] / 1_000_000, 2),  # type: ignore[operator]
                "total_co2": round_or_empty(row["co2"] / 1_000, 4),  # type: ignore[operator]
                "co2_per_capita": round_or_empty(row["co2_per_capita"], 2),  # type: ignore[arg-type]
                "carbon_intensity": round_or_empty(row["carbon_intensity"], 8),  # type: ignore[arg-type]
                "gdp_growth_5y": round_or_empty(gdp_growth, 2),
                "co2_growth_5y": round_or_empty(co2_growth, 2),
                "intensity_change_5y": round_or_empty(intensity_change, 2),
                "decoupling_status": classify_decoupling(gdp_growth, co2_growth),
            }
        )

    return output_rows


def main() -> None:
    rows = load_rows()
    output_rows = build_output_rows(rows)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        writer.writerows(output_rows)

    print(f"Wrote {len(output_rows)} rows to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
