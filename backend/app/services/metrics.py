from datetime import date, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.database.models import HealthCheck

SLA_AVAILABILITY_THRESHOLD = 99.9


def apply_filters(
    statement,
    upload_id: UUID | None,
    start_date: date | None,
    end_date: date | None,
):
    if upload_id is not None:
        statement = statement.where(HealthCheck.upload_id == upload_id)

    if start_date is not None:
        statement = statement.where(
            HealthCheck.timestamp
            >= datetime.combine(
                start_date,
                datetime.min.time(),
            )
        )

    if end_date is not None:
        next_day = end_date + timedelta(days=1)

        statement = statement.where(
            HealthCheck.timestamp
            < datetime.combine(
                next_day,
                datetime.min.time(),
            )
        )

    return statement


def calculate_stats(
    session: Session,
    upload_id: UUID | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> dict:
    total_checks = session.execute(
        apply_filters(
            select(func.count(HealthCheck.id)).where(HealthCheck.is_valid.is_(True)),
            upload_id,
            start_date,
            end_date,
        )
    ).scalar_one()

    successful_checks = session.execute(
        apply_filters(
            select(func.count(HealthCheck.id)).where(
                HealthCheck.is_valid.is_(True),
                HealthCheck.is_success.is_(True),
            ),
            upload_id,
            start_date,
            end_date,
        )
    ).scalar_one()

    failed_checks = total_checks - successful_checks

    availability = successful_checks / total_checks * 100 if total_checks else 100.0

    error_rate = failed_checks / total_checks * 100 if total_checks else 0.0

    latency_values = (
        session.execute(
            apply_filters(
                select(HealthCheck.latency_ms).where(
                    HealthCheck.is_valid.is_(True),
                    HealthCheck.latency_ms.is_not(None),
                ),
                upload_id,
                start_date,
                end_date,
            )
        )
        .scalars()
        .all()
    )

    latency_values.sort()

    latency = {
        "p50_ms": percentile(latency_values, 50),
        "p95_ms": percentile(latency_values, 95),
        "p99_ms": percentile(latency_values, 99),
        "max_ms": max(latency_values) if latency_values else None,
    }

    service_stats = calculate_service_stats(
        session=session,
        upload_id=upload_id,
        start_date=start_date,
        end_date=end_date,
    )

    return {
        "availability_percent": round(availability, 3),
        "error_rate_percent": round(error_rate, 3),
        "total_checks": total_checks,
        "successful_checks": successful_checks,
        "failed_checks": failed_checks,
        "sla_threshold_percent": SLA_AVAILABILITY_THRESHOLD,
        "sla_met": availability >= SLA_AVAILABILITY_THRESHOLD,
        "latency": latency,
        "services": service_stats,
    }


def calculate_service_stats(
    session: Session,
    upload_id: UUID | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> list[dict]:
    services = session.execute(
        apply_filters(
            select(
                HealthCheck.service_id,
                HealthCheck.service_name,
            )
            .distinct()
            .order_by(HealthCheck.service_name),
            upload_id,
            start_date,
            end_date,
        )
    ).all()

    stats = []

    for service_id, service_name in services:
        total_checks = session.execute(
            apply_filters(
                select(func.count(HealthCheck.id)).where(
                    HealthCheck.service_id == service_id,
                    HealthCheck.is_valid.is_(True),
                ),
                upload_id,
                start_date,
                end_date,
            )
        ).scalar_one()

        successful_checks = session.execute(
            apply_filters(
                select(func.count(HealthCheck.id)).where(
                    HealthCheck.service_id == service_id,
                    HealthCheck.is_valid.is_(True),
                    HealthCheck.is_success.is_(True),
                ),
                upload_id,
                start_date,
                end_date,
            )
        ).scalar_one()

        failed_checks = total_checks - successful_checks

        availability = successful_checks / total_checks * 100 if total_checks else 100.0

        latencies = (
            session.execute(
                apply_filters(
                    select(HealthCheck.latency_ms).where(
                        HealthCheck.service_id == service_id,
                        HealthCheck.is_valid.is_(True),
                        HealthCheck.latency_ms.is_not(None),
                    ),
                    upload_id,
                    start_date,
                    end_date,
                )
            )
            .scalars()
            .all()
        )

        latencies.sort()

        stats.append(
            {
                "service_id": service_id,
                "service_name": service_name,
                "availability_percent": round(
                    availability,
                    3,
                ),
                "error_rate_percent": (
                    round(
                        failed_checks / total_checks * 100,
                        3,
                    )
                    if total_checks
                    else 0.0
                ),
                "total_checks": total_checks,
                "successful_checks": successful_checks,
                "failed_checks": failed_checks,
                "latency": {
                    "p50_ms": percentile(latencies, 50),
                    "p95_ms": percentile(latencies, 95),
                    "p99_ms": percentile(latencies, 99),
                    "max_ms": max(latencies) if latencies else None,
                },
                "sla_met": availability >= SLA_AVAILABILITY_THRESHOLD,
            }
        )

    return stats


def percentile(
    values: list[float],
    percentile_value: float,
) -> float | None:
    if not values:
        return None

    index = (len(values) - 1) * percentile_value / 100

    lower = int(index)
    upper = lower + 1

    if upper >= len(values):
        return round(values[lower], 2)

    fraction = index - lower

    return round(
        values[lower] + (values[upper] - values[lower]) * fraction,
        2,
    )
