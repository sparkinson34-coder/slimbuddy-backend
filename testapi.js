Invoke-WebRequest -Uri http://localhost:3000/api/log_weight -Method POST -Body (@{
    user_id = "abc-123"
    weight = 74.2
    preferred_weight_unit = "kg"
    date = "2025-07-09"
    notes = "Morning weigh-in"
} | ConvertTo-Json) -ContentType "application/json"
