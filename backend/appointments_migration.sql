USE clinicflow_db;

-- Create table if it's not there at all
CREATE TABLE IF NOT EXISTS appointments (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id    INT UNSIGNED NOT NULL,
  provider_name VARCHAR(100) NOT NULL,
  start_time    DATETIME NOT NULL,
  end_time      DATETIME NOT NULL,
  status        ENUM('scheduled','checked-in','completed','canceled','no-show') NOT NULL DEFAULT 'scheduled',
  reason        VARCHAR(255) NULL,
  notes         TEXT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Helper: add column if missing (dynamic SQL)
SET @schema := DATABASE();

-- patient_id
SET @missing := (
  SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='appointments' AND COLUMN_NAME='patient_id'
);
SET @sql := IF(@missing,
  'ALTER TABLE appointments ADD COLUMN patient_id INT UNSIGNED NOT NULL;',
  'SELECT 1;'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- provider_name
SET @missing := (
  SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='appointments' AND COLUMN_NAME='provider_name'
);
SET @sql := IF(@missing,
  'ALTER TABLE appointments ADD COLUMN provider_name VARCHAR(100) NOT NULL;',
  'SELECT 1;'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- start_time
SET @missing := (
  SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='appointments' AND COLUMN_NAME='start_time'
);
SET @sql := IF(@missing,
  'ALTER TABLE appointments ADD COLUMN start_time DATETIME NOT NULL;',
  'SELECT 1;'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- end_time
SET @missing := (
  SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='appointments' AND COLUMN_NAME='end_time'
);
SET @sql := IF(@missing,
  'ALTER TABLE appointments ADD COLUMN end_time DATETIME NOT NULL;',
  'SELECT 1;'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- status
SET @missing := (
  SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='appointments' AND COLUMN_NAME='status'
);
SET @sql := IF(@missing,
  'ALTER TABLE appointments ADD COLUMN status ENUM(''scheduled'',''checked-in'',''completed'',''canceled'',''no-show'') NOT NULL DEFAULT ''scheduled'';',
  'SELECT 1;'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- reason
SET @missing := (
  SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='appointments' AND COLUMN_NAME='reason'
);
SET @sql := IF(@missing,
  'ALTER TABLE appointments ADD COLUMN reason VARCHAR(255) NULL;',
  'SELECT 1;'
);
PREPARE s FROM @sql; EXECUTE s; DEAlLOCATE PREPARE s;

-- notes
SET @missing := (
  SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='appointments' AND COLUMN_NAME='notes'
);
SET @sql := IF(@missing,
  'ALTER TABLE appointments ADD COLUMN notes TEXT NULL;',
  'SELECT 1;'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- created_at
SET @missing := (
  SELECT COUNT(*) = 0 FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA=@schema AND TABLE_NAME='appointments' AND COLUMN_NAME='created_at'
);
SET @sql := IF(@missing,
  'ALTER TABLE appointments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;',
  'SELECT 1;'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Ensure NOT NULL + correct types (safe to run)
ALTER TABLE appointments MODIFY patient_id INT UNSIGNED NOT NULL;
ALTER TABLE appointments MODIFY provider_name VARCHAR(100) NOT NULL;
ALTER TABLE appointments MODIFY start_time DATETIME NOT NULL;
ALTER TABLE appointments MODIFY end_time DATETIME NOT NULL;
ALTER TABLE appointments MODIFY status ENUM('scheduled','checked-in','completed','canceled','no-show') NOT NULL DEFAULT 'scheduled';

-- Foreign key to patients(id) if missing
SET @has_fk := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA=@schema AND TABLE_NAME='appointments' AND CONSTRAINT_NAME='fk_appt_patient'
);
SET @sql := IF(@has_fk = 0,
  'ALTER TABLE appointments ADD CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;',
  'SELECT 1;'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Index: provider_name + start_time
SET @has_idx1 := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema=@schema AND table_name='appointments' AND index_name='idx_appt_provider_time'
);
SET @sql := IF(@has_idx1 = 0,
  'CREATE INDEX idx_appt_provider_time ON appointments(provider_name, start_time);',
  'SELECT 1;'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- Index: status
SET @has_idx2 := (
  SELECT COUNT(*) FROM information_schema.statistics
  WHERE table_schema=@schema AND table_name='appointments' AND index_name='idx_appt_status'
);
SET @sql := IF(@has_idx2 = 0,
  'CREATE INDEX idx_appt_status ON appointments(status);',
  'SELECT 1;'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
