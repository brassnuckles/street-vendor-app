from math import radians, cos, sin, asin, sqrt
from sqlalchemy import and_, func
from app.models import Vendor

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points
    on earth (specified in decimal degrees)
    """
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    km = 6371 * c
    return km

def get_vendors_nearby(
    latitude: float,
    longitude: float,
    radius_km: float = 10,
    db = None
) -> list:
    """
    Get vendors within a specified radius using haversine distance
    """
    if db is None:
        return []

    all_vendors = db.query(Vendor).filter(Vendor.latitude.isnot(None), Vendor.longitude.isnot(None)).all()
    nearby_vendors = []

    for vendor in all_vendors:
        if vendor.latitude and vendor.longitude:
            distance = haversine_distance(latitude, longitude, vendor.latitude, vendor.longitude)
            if distance <= radius_km:
                nearby_vendors.append({
                    'vendor': vendor,
                    'distance': distance
                })

    nearby_vendors.sort(key=lambda x: x['distance'])
    return nearby_vendors

def get_bounding_box(latitude: float, longitude: float, radius_km: float):
    """
    Get bounding box for a given center point and radius
    Useful for optimizing database queries
    """
    lat_delta = (radius_km / 111.0)
    lon_delta = (radius_km / (111.0 * cos(radians(latitude))))

    return {
        'min_lat': latitude - lat_delta,
        'max_lat': latitude + lat_delta,
        'min_lon': longitude - lon_delta,
        'max_lon': longitude + lon_delta,
    }
