-- PREPARED ONLY: requires explicit operator authorization before application.
-- No geocoding/backfill, data updates, or authorization/RLS policy changes.
-- The Bangladesh rectangle is a map validation envelope, not a border polygon.
BEGIN;

ALTER TABLE public.clinics
    ADD COLUMN latitude DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION,
    ADD CONSTRAINT clinics_coordinates_pair_check
        CHECK ((latitude IS NULL) = (longitude IS NULL)),
    ADD CONSTRAINT clinics_latitude_range_check
        CHECK (latitude IS NULL OR latitude BETWEEN 20.5 AND 26.7),
    ADD CONSTRAINT clinics_longitude_range_check
        CHECK (longitude IS NULL OR longitude BETWEEN 88 AND 92.7);

COMMENT ON COLUMN public.clinics.latitude IS
    'Clinic latitude in decimal degrees; nullable with longitude until explicitly set. No inferred default.';
COMMENT ON COLUMN public.clinics.longitude IS
    'Clinic longitude in decimal degrees; nullable with latitude until explicitly set. No inferred default.';

COMMIT;