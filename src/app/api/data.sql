-- ============================================
-- Schema: School / Exams (single-grade model)
-- ============================================

-- Custom ENUM Types
CREATE TYPE user_role AS ENUM ('admin', 'tutor', 'student');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE grade_status AS ENUM ('active', 'completed');
CREATE TYPE gender_enum AS ENUM ('male', 'female');

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
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
    year INT NOT NULL CHECK (year BETWEEN 6 AND 11),
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
    index_number VARCHAR(20) UNIQUE NOT NULL,
    current_grade_id INT NOT NULL REFERENCES grades(id) ON UPDATE CASCADE,
    gender gender_enum,
    date_of_birth DATE CHECK (date_of_birth < CURRENT_DATE),
    address TEXT,
    parent_name VARCHAR(100),
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    promotion_date DATE
);

CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_index_grade ON students(index_number, current_grade_id);

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

-- Trigger Function for Student Promotion (simplified safe version)
-- Note: this function attempts to promote students when an admin marks a grade 'completed'
CREATE OR REPLACE FUNCTION promote_students()
RETURNS TRIGGER AS $$
DECLARE
    rec_student RECORD;
    next_grade_id INT;
BEGIN
    -- Only operate when a grade becomes completed
    IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status <> 'completed' THEN
        -- For each student currently in the completed grade, try to move to year+1 active grade (if any)
        FOR rec_student IN
            SELECT s.id, s.current_grade_id
            FROM students s
            WHERE s.current_grade_id = OLD.id
        LOOP
            SELECT id INTO next_grade_id
            FROM grades
            WHERE year = (SELECT year FROM grades WHERE id = OLD.id) + 1
              AND status = 'active'
            LIMIT 1;

            IF next_grade_id IS NOT NULL THEN
                UPDATE students
                SET current_grade_id = next_grade_id,
                    promotion_date = CURRENT_DATE
                WHERE id = rec_student.id;
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_promote_students
    AFTER UPDATE ON grades
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION promote_students();

-- Initial Data Insertion for Grades (Years 6-11)
INSERT INTO grades (grade_name, year, start_date, end_date, status) VALUES
('Grade 6', 6, '2025-09-01', '2026-12-31', 'active'),
('Grade 7', 7, '2025-09-01', '2026-12-31', 'active'),
('Grade 8', 8, '2025-09-01', '2026-12-31', 'active'),
('Grade 9', 9, '2025-09-01', '2026-12-31', 'active'),
('Grade 10', 10, '2025-09-01', '2026-12-31', 'active'),
('Grade 11', 11, '2025-09-01', '2026-12-31', 'active')
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
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'registration_open', 'closed', ' send_admission_cards','in_progress', 'completed', 'published')),
    description TEXT,
    created_by INT NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_exams_grade_status ON admin_exams(grade_id, status);
CREATE INDEX IF NOT EXISTS idx_admin_exams_dates ON admin_exams(exam_date, registration_start_date, registration_end_date);
CREATE INDEX IF NOT EXISTS idx_admin_exams_published ON admin_exams(published_at);

-- Admin Exam Subjects (junction) - Updated with date, start_time, and end_time
CREATE TABLE IF NOT EXISTS admin_exam_subjects (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    admin_exam_id INT NOT NULL REFERENCES admin_exams(id) ON DELETE CASCADE,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
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

-- Admission Cards (auto-generated flag row)
CREATE TABLE IF NOT EXISTS admin_exam_admission_cards (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    registration_id INT NOT NULL REFERENCES admin_exam_registrations(id) ON DELETE CASCADE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_path VARCHAR(255),
    shared_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'generated' CHECK (status IN ('generated', 'shared', 'downloaded')),
    UNIQUE(registration_id)
);
CREATE INDEX IF NOT EXISTS idx_admission_cards_registration ON admin_exam_admission_cards(registration_id);
CREATE INDEX IF NOT EXISTS idx_admission_cards_status ON admin_exam_admission_cards(status);

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

-- Papers Table (tutor uploaded papers)
CREATE TABLE IF NOT EXISTS papers (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    file_path VARCHAR(255),
    description TEXT,
    grade_id INT REFERENCES grades(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
);
CREATE INDEX IF NOT EXISTS idx_papers_tutor_subject ON papers(tutor_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_papers_grade ON papers(grade_id);

-- Marks Table (per enrollment / paper)
CREATE TABLE IF NOT EXISTS marks (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    enrollment_id INT NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
    paper_id INT REFERENCES papers(id) ON DELETE CASCADE,
    score INT CHECK (score >= 0 AND score <= 100),
    comments TEXT,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_marks_enrollment ON marks(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_marks_paper ON marks(paper_id);

-- Notes Table (tutor notes)
CREATE TABLE IF NOT EXISTS notes (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    file_path VARCHAR(255),
    grade_id INT REFERENCES grades(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived'))
);
CREATE INDEX IF NOT EXISTS idx_notes_tutor_subject ON notes(tutor_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_grade ON notes(grade_id);

-- Exams Table (tutor-created exams)
CREATE TABLE IF NOT EXISTS exams (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    exam_name VARCHAR(200) NOT NULL,
    subject_id INT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    grade_id INT REFERENCES grades(id) ON DELETE CASCADE,
    exam_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    description TEXT,
    registration_fee DECIMAL(10,2) DEFAULT 0.00,
    max_registrations INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_exams_tutor_subject ON exams(tutor_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_grade_status ON exams(grade_id, status);
CREATE INDEX IF NOT EXISTS idx_exams_date_status ON exams(exam_date, status);

-- Views

-- Student results view (visible only after publish)
CREATE OR REPLACE VIEW student_exam_results AS
SELECT 
    ae.id AS exam_id,
    ae.exam_name,
    s.id AS student_id,
    u.full_name AS student_name,
    aesc.subject_id,
    sub.name AS subject_name,
    aem.score,
    aem.comments,
    aem.marked_at,
    ae.published_at
FROM admin_exams ae
JOIN admin_exam_registrations aer ON ae.id = aer.admin_exam_id
JOIN students s ON aer.student_id = s.id
JOIN users u ON s.user_id = u.id
JOIN admin_exam_student_choices aesc ON aer.id = aesc.registration_id
JOIN subjects sub ON aesc.subject_id = sub.id
LEFT JOIN admin_exam_marks aem ON aesc.id = aem.choice_id
WHERE ae.published_at IS NOT NULL
  AND aer.status = 'confirmed';

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

-- Publish status view: ready_to_publish = all choices marked
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

-- End of schema
