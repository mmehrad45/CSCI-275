USE clinicflow_db;

-- Drop FK on patient_id if it exists
SET @fk := (
  SELECT CONSTRAINT_NAME
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE TABLE_SCHEMA='clinicflow_db'
    AND TABLE_NAME='appointments'
    AND COLUMN_NAME='patient_id'
    AND REFERENCED_TABLE_NAME IS NOT NULL
  LIMIT 1
);
SET @stmt := IF(@fk IS NULL,
  'SELECT "no fk to drop" AS info;',
  CONCAT('ALTER TABLE appointments DROP FOREIGN KEY `', @fk, '`;')
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- Drop patient_id column if it exists
SET @has_col := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='clinicflow_db'
    AND TABLE_NAME='appointments'
    AND COLUMN_NAME='patient_id'
);
SET @stmt := IF(@has_col=0,
  'SELECT "no patient_id column" AS info;',
  'ALTER TABLE appointments DROP COLUMN patient_id;'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- Add patient_name column if it does not exist
SET @has_name := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA='clinicflow_db'
    AND TABLE_NAME='appointments'
    AND COLUMN_NAME='patient_name'
);
SET @stmt := IF(@has_name>0,
  'SELECT "patient_name already exists" AS info;',
  'ALTER TABLE appointments ADD COLUMN patient_name VARCHAR(255) NOT NULL AFTER id;'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- Add index on patient_name if it does not exist
SET @has_idx := (
  SELECT COUNT(*)
  FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA='clinicflow_db'
    AND TABLE_NAME='appointments'
    AND INDEX_NAME='idx_appointments_patient_name'
);
SET @stmt := IF(@has_idx>0,
  'SELECT "index exists" AS info;',
  'ALTER TABLE appointments ADD INDEX idx_appointments_patient_name (patient_name);'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
