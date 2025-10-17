-- Create DB
CREATE DATABASE IF NOT EXISTS clinicflow_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;
USE clinicflow_db;

-- Users who log in to the webapp
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL, 
  full_name     VARCHAR(255) NOT NULL,
  role          ENUM('admin','staff') DEFAULT 'staff',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients (added from webapp)
CREATE TABLE IF NOT EXISTS patients (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  dob           DATE,
  phone         VARCHAR(30),
  email         VARCHAR(255),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Appointments (optional but useful)
CREATE TABLE IF NOT EXISTS appointments (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  patient_id     INT UNSIGNED NOT NULL,
  scheduled_for  DATETIME NOT NULL,
  reason         VARCHAR(255),
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appt_patient
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);