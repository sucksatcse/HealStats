-- Idempotent clinic coordinate migration.
-- Safely applies only if columns/constraints do not already exist.
BEGIN;

ALTER TABLE public.clinics
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'clinics_coordinates_pair_check'
    ) THEN
        ALTER TABLE public.clinics
            ADD CONSTRAINT clinics_coordinates_pair_check
            CHECK ((latitude IS NULL) = (longitude IS NULL));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'clinics_latitude_range_check'
    ) THEN
        ALTER TABLE public.clinics
            ADD CONSTRAINT clinics_latitude_range_check
            CHECK (latitude IS NULL OR latitude BETWEEN 20.5 AND 26.7);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'clinics_longitude_range_check'
    ) THEN
        ALTER TABLE public.clinics
            ADD CONSTRAINT clinics_longitude_range_check
            CHECK (longitude IS NULL OR longitude BETWEEN 88 AND 92.7);
    END IF;
END $$;

COMMENT ON COLUMN public.clinics.latitude IS
    'Clinic latitude in decimal degrees; nullable with longitude until explicitly set. No inferred default.';
COMMENT ON COLUMN public.clinics.longitude IS
    'Clinic longitude in decimal degrees; nullable with longitude until explicitly set. No inferred default.';

COMMIT;