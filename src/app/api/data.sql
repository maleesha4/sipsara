-- ============================================
-- Schema: Sipsara / Exams (single-grade model)
-- ============================================

-- Custom ENUM Types
CREATE TYPE user_role AS ENUM ('admin', 'tutor', 'student');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE grade_status AS ENUM ('active', 'completed');
CREATE TYPE gender_enum AS ENUM ('male', 'female');

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    full_name VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(10),
    status user_status DEFAULT 'active' NOT NULL,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
   
-- Grades Table (Years 6-11 only)
CREATE TABLE IF NOT EXISTS grades (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    grade_name VARCHAR(50) NOT NULL,  -- e.g., 'Grade 6'
    year INT NOT NULL CHECK (year BETWEEN 4 AND 12),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL CHECK (end_date > start_date),
    status grade_status DEFAULT 'active' NOT NULL,
    UNIQUE(year, status)
);

CREATE INDEX IF NOT EXISTS idx_grades_year_status ON grades(year, status);

-- Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- Students Table (subtype)
CREATE TABLE IF NOT EXISTS students (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    current_grade_id INT NOT NULL REFERENCES grades(id) ON UPDATE CASCADE,
    gender gender_enum,
    date_of_birth DATE,
    address TEXT,
    parent_name VARCHAR(100),
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    promotion_date DATE
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);

-- Tutors Table
CREATE TABLE IF NOT EXISTS tutors (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_id INT REFERENCES subjects(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tutors_user_id ON tutors(user_id);
CREATE INDEX IF NOT EXISTS idx_tutors_subject ON tutors(subject_id);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(user_id);

-- Initial Data Insertion for Grades (Years 6-11)
INSERT INTO grades (grade_name, year, start_date, end_date, status) VALUES
('Grade 4', 4, '2025-09-01', '2026-12-31', 'active'),
('Grade 5', 5, '2025-09-01', '2026-12-31', 'active'),
('Grade 6', 6, '2025-09-01', '2026-12-31', 'active'),
('Grade 7', 7, '2025-09-01', '2026-12-31', 'active'),
('Grade 8', 8, '2025-09-01', '2026-12-31', 'active'),
('Grade 9', 9, '2025-09-01', '2026-12-31', 'active'),
('Grade 10', 10, '2025-09-01', '2026-12-31', 'active'),
('Grade 11', 11, '2025-09-01', '2026-12-31', 'active'),
('Grade 12', 12, '2025-09-01', '2026-12-31', 'active')
ON CONFLICT (year, status) DO NOTHING;

-- Enrollments Table (junction student <-> subject, tied to a grade)
CREATE TABLE IF NOT EXISTS enrollments (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    tutor_id INT REFERENCES tutors(id) ON DELETE SET NULL,
    grade_id INT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id, grade_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student_subject ON enrollments(student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_tutor_subject ON enrollments(tutor_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_grade_status ON enrollments(grade_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Central Admin Exams (single-grade model)
CREATE TABLE IF NOT EXISTS admin_exams (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exam_name VARCHAR(200) NOT NULL,
    grade_id INT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    registration_start_date DATE NOT NULL,
    registration_end_date DATE NOT NULL CHECK (registration_end_date > registration_start_date),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'registration_open', 'closed', 'send_admission_cards','in_progress', 'completed', 'published')),
    description TEXT,
    created_by INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_exams_grade_status ON admin_exams(grade_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_exams_dates ON admin_exams(exam_date, registration_start_date, registration_end_date);

-- Admin Exam Subjects (junction) - Updated with date, start_time, and end_time
CREATE TABLE IF NOT EXISTS admin_exam_subjects (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_exam_id INT NOT NULL REFERENCES admin_exams(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL DEFAULT '09:00:00',
    end_time TIME NOT NULL DEFAULT '11:00:00',
    UNIQUE(admin_exam_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_exam_subjects_exam ON admin_exam_subjects(admin_exam_id);
CREATE INDEX IF NOT EXISTS idx_admin_exam_subjects_subject ON admin_exam_subjects(subject_id);

-- Admin Exam Registrations (students register for admin_exams)
CREATE TABLE IF NOT EXISTS admin_exam_registrations (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admission_number VARCHAR(8),
    admin_exam_id INT NOT NULL REFERENCES admin_exams(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(admin_exam_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_exam_registrations_exam ON admin_exam_registrations(admin_exam_id);
CREATE INDEX IF NOT EXISTS idx_admin_exam_registrations_student ON admin_exam_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_admin_exam_registrations_status ON admin_exam_registrations(status);

-- Student's selected subjects for an admin exam registration
CREATE TABLE IF NOT EXISTS admin_exam_student_choices (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    registration_id INT NOT NULL REFERENCES admin_exam_registrations(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    choice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(registration_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_exam_choices_registration ON admin_exam_student_choices(registration_id);
CREATE INDEX IF NOT EXISTS idx_admin_exam_choices_subject ON admin_exam_student_choices(subject_id);

-- Admin Exam Marks (tutors mark choices)
CREATE TABLE IF NOT EXISTS admin_exam_marks (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    choice_id INT NOT NULL REFERENCES admin_exam_student_choices(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    score INT CHECK (score >= 0 AND score <= 100),
    comments TEXT,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(choice_id, tutor_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_exam_marks_choice ON admin_exam_marks(choice_id);
CREATE INDEX IF NOT EXISTS idx_admin_exam_marks_tutor ON admin_exam_marks(tutor_id);
CREATE INDEX IF NOT EXISTS idx_admin_exam_marks_marked ON admin_exam_marks(marked_at);

-- Exam-Subject-Tutors (optional assignment)
CREATE TABLE IF NOT EXISTS admin_exam_subject_tutors (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_exam_id INT NOT NULL REFERENCES admin_exams(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(admin_exam_id, subject_id, tutor_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_exam_subject_tutors_exam_subject ON admin_exam_subject_tutors(admin_exam_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_admin_exam_subject_tutors_tutor ON admin_exam_subject_tutors(tutor_id);

-- Generate Admission Card Flag on registration confirmation
CREATE OR REPLACE FUNCTION generate_admission_card_flag()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'confirmed' THEN
        INSERT INTO admin_exam_admission_cards (registration_id)
        VALUES (NEW.id)
        ON CONFLICT (registration_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_admission_card
    AFTER UPDATE ON admin_exam_registrations
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION generate_admission_card_flag();

-- Admin exams list view (aggregated)
CREATE OR REPLACE VIEW admin_exams_view AS
SELECT 
    ae.*,
    g.grade_name AS grade_name,
    COUNT(aer.id) AS registration_count
FROM admin_exams ae
LEFT JOIN grades g ON ae.grade_id = g.id
LEFT JOIN admin_exam_registrations aer ON ae.id = aer.admin_exam_id
GROUP BY ae.id, g.grade_name
ORDER BY ae.created_at DESC;

CREATE OR REPLACE VIEW admin_exam_publish_status AS
SELECT 
    ae.id AS admin_exam_id,
    COUNT(aesc.id) AS total_choices,
    COUNT(aem.id) AS marked_choices,
    CASE WHEN COUNT(aesc.id) > 0 AND COUNT(aesc.id) = COUNT(aem.id) THEN true ELSE false END AS ready_to_publish
FROM admin_exams ae
LEFT JOIN admin_exam_registrations aer ON ae.id = aer.admin_exam_id
LEFT JOIN admin_exam_student_choices aesc ON aer.id = aesc.registration_id
LEFT JOIN admin_exam_marks aem ON aesc.id = aem.choice_id
GROUP BY ae.id;

/*
UPDATE students
SET current_grade_id = g2.id
FROM grades g1
JOIN grades g2 ON g2.year = LEAST(g1.year + 1, (SELECT MAX(year) FROM grades))
WHERE students.current_grade_id = g1.id;
*/

-- Assignments Table (supports multiple grades)
CREATE TABLE IF NOT EXISTS assignments (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tutor_id INT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    closing_time TIME NOT NULL,  -- Time when submissions close
    max_score INT DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignment Grades (junction table - assignments can target multiple grades)
CREATE TABLE IF NOT EXISTS assignment_grades (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    grade_id INT NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    UNIQUE(assignment_id, grade_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_grades_assignment ON assignment_grades(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_grades_grade ON assignment_grades(grade_id);

CREATE INDEX IF NOT EXISTS idx_assignments_tutor_subject ON assignments(tutor_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON assignments(due_date, closing_time);

-- Assignment Submissions Table (UPDATED)
CREATE TABLE IF NOT EXISTS assignment_submissions (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assignment_id INT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INT CHECK (score >= 0),
    feedback TEXT,
    is_late BOOLEAN DEFAULT FALSE,  -- NEW: Track if submission is late
    is_group BOOLEAN DEFAULT FALSE,  -- NEW: Track if submission is a group submission
    status VARCHAR(20) DEFAULT 'not_submitted' CHECK (status IN ('not_submitted', 'submitted', 'graded')),
    CONSTRAINT unique_individual_submission UNIQUE (assignment_id, student_id) WHERE is_group = false
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment ON assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student ON assignment_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON assignment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_is_late ON assignment_submissions(is_late);

-- Assignment Submission Files Table
CREATE TABLE IF NOT EXISTS assignment_submission_files (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assignment_submission_files_submission ON assignment_submission_files(submission_id);

-- Assignment Group Members Table (for group assignments)
CREATE TABLE IF NOT EXISTS assignment_group_members (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    submission_id INT NOT NULL REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE(submission_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_group_members_submission ON assignment_group_members(submission_id);
CREATE INDEX IF NOT EXISTS idx_assignment_group_members_student ON assignment_group_members(student_id);

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;