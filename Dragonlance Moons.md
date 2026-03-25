{
  "system_name": "Krynn",
  "model_version": "earth_analog_336day_year_synodic_canon_equal_apparent_size",
  "planet": {
    "mass_model": "Earth",
    "radius_model": "Earth",
    "year_length_days": 336.0,
    "day_length_hours": 24.0,
    "solar_mean_motion_deg_per_day": 1.0714285714285714
  },
  "apparent_size_anchor": {
    "reference_body": "Earth Moon",
    "reference_diameter_km": 3474.8,
    "reference_distance_km": 384400.0,
    "target_same_apparent_size": true
  },
  "epoch": {
    "description": "Arbitrary script epoch. Replace offsets if desired.",
    "day_number": 0,
    "phase_convention": "0 deg = new, 90 deg = first quarter, 180 deg = full, 270 deg = last quarter"
  },
  "moons": [
    {
      "name": "Solinari",
      "color": "silver_white",
      "visible_to_common_observers": true,
      "synodic_period_days": 36.0,
      "sidereal_period_days": 32.516129032258064,
      "semimajor_axis_km": 433562.6450335759,
      "diameter_km": 3919.2078016718774,
      "mean_motion_sidereal_deg_per_day": 11.071428571428571,
      "mean_motion_synodic_deg_per_day": 10.0,
      "phase_offset_deg_at_epoch": 0.0,
      "angular_size_relative_to_earth_moon": 1.0
    },
    {
      "name": "Lunitari",
      "color": "red",
      "visible_to_common_observers": true,
      "synodic_period_days": 28.0,
      "sidereal_period_days": 25.846153846153847,
      "semimajor_axis_km": 370432.65421999485,
      "diameter_km": 3348.5415891874045,
      "mean_motion_sidereal_deg_per_day": 13.928571428571429,
      "mean_motion_synodic_deg_per_day": 12.857142857142858,
      "phase_offset_deg_at_epoch": 0.0,
      "angular_size_relative_to_earth_moon": 1.0
    },
    {
      "name": "Nuitari",
      "color": "black",
      "visible_to_common_observers": false,
      "synodic_period_days": 8.0,
      "sidereal_period_days": 7.813953488372094,
      "semimajor_axis_km": 166862.6723285724,
      "diameter_km": 1508.3621587079174,
      "mean_motion_sidereal_deg_per_day": 46.07142857142857,
      "mean_motion_synodic_deg_per_day": 45.0,
      "phase_offset_deg_at_epoch": 0.0,
      "angular_size_relative_to_earth_moon": 1.0
    }
  ]
}