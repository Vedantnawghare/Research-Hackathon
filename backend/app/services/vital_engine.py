from app.models.core import AlertSeverity


def evaluate_vital(value, plan):
    """
    Dynamically evaluates a vital against thresholds
    stored in the patient's MonitoringPlan.
    """

    if value is None or not plan.is_enabled:
        return None

    # Critical checks first
    if (
        plan.critical_low is not None
        and value < plan.critical_low
    ):
        return {
            "severity": AlertSeverity.CRITICAL,
            "threshold": plan.critical_low,
            "message": (
                f"{plan.vital_name} is critically low: "
                f"{value}"
            ),
        }

    if (
        plan.critical_high is not None
        and value > plan.critical_high
    ):
        return {
            "severity": AlertSeverity.CRITICAL,
            "threshold": plan.critical_high,
            "message": (
                f"{plan.vital_name} is critically high: "
                f"{value}"
            ),
        }

    # Warning checks
    if (
        plan.warning_low is not None
        and value < plan.warning_low
    ):
        return {
            "severity": AlertSeverity.WARNING,
            "threshold": plan.warning_low,
            "message": (
                f"{plan.vital_name} is below warning range: "
                f"{value}"
            ),
        }

    if (
        plan.warning_high is not None
        and value > plan.warning_high
    ):
        return {
            "severity": AlertSeverity.WARNING,
            "threshold": plan.warning_high,
            "message": (
                f"{plan.vital_name} is above warning range: "
                f"{value}"
            ),
        }

    return None