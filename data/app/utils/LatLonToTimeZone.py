from tzfpy import get_tz
from zoneinfo import ZoneInfo
from datetime import datetime, timezone
import pandas as pd

def colect_timezone(lat,lon):
    tz = get_tz(lon, lat)

    now = datetime.now(timezone.utc)
    now = now.replace(tzinfo=ZoneInfo(tz))

    td = ZoneInfo(tz).utcoffset(now)
    return td


