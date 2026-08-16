const db = require('../db');
const logger = require('../utils/logger');

const MONTHS = [
  { name: 'April',     index: 1 },
  { name: 'May',       index: 2 },
  { name: 'June',      index: 3 },
  { name: 'July',      index: 4 },
  { name: 'August',    index: 5 },
  { name: 'September', index: 6 },
  { name: 'October',   index: 7 },
  { name: 'November',  index: 8 },
  { name: 'December',  index: 9 },
  { name: 'January',   index: 10 },
  { name: 'February',  index: 11 },
  { name: 'March',     index: 12 },
];

/**
 * GET /api/fee-setup
 * List all class fee templates for the school + academic year
 */
exports.getTemplates = async (req, res) => {
  const { academicYear } = req.query;
  const year = academicYear || '2026-2027';

  try {
    const result = await db.query(
      `SELECT * FROM class_fee_templates 
       WHERE school_id = $1 AND academic_year = $2
       ORDER BY class_name ASC`,
      [req.user.school_id, year]
    );
    res.json({ data: result.rows });
  } catch (err) {
    logger.error('Error fetching fee templates:', err);
    res.status(500).json({ error: 'Failed to fetch fee templates' });
  }
};

/**
 * POST /api/fee-setup
 * Create or update a class fee template (upsert)
 * Now includes one-time charges: admission_fee, annual_fee, id_card_fee, exam_fee
 */
exports.upsertTemplate = async (req, res) => {
  const { 
    class_name, academic_year, 
    tuition_fee, transport_fee, other_fee,
    // One-time annual charges
    admission_fee, annual_fee, id_card_fee, exam_fee,
  } = req.body;

  if (!class_name) {
    return res.status(400).json({ error: 'class_name is required' });
  }

  const year = academic_year || '2026-2027';

  try {
    const result = await db.query(
      `INSERT INTO class_fee_templates 
         (class_name, academic_year, tuition_fee, transport_fee, other_fee, 
          admission_fee, annual_fee, id_card_fee, exam_fee, school_id, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (class_name, academic_year, school_id) 
       DO UPDATE SET 
         tuition_fee   = EXCLUDED.tuition_fee,
         transport_fee = EXCLUDED.transport_fee,
         other_fee     = EXCLUDED.other_fee,
         admission_fee = EXCLUDED.admission_fee,
         annual_fee    = EXCLUDED.annual_fee,
         id_card_fee   = EXCLUDED.id_card_fee,
         exam_fee      = EXCLUDED.exam_fee,
         updated_at    = NOW()
       RETURNING *`,
      [
        class_name, year,
        parseFloat(tuition_fee   || 0),
        parseFloat(transport_fee || 0),
        parseFloat(other_fee     || 0),
        parseFloat(admission_fee || 0),
        parseFloat(annual_fee    || 0),
        parseFloat(id_card_fee   || 0),
        parseFloat(exam_fee      || 0),
        req.user.school_id,
      ]
    );

    res.json({ message: 'Fee template saved', data: result.rows[0] });
  } catch (err) {
    logger.error('Error saving fee template:', err);
    res.status(500).json({ error: 'Failed to save fee template' });
  }
};

/**
 * DELETE /api/fee-setup/:id
 */
exports.deleteTemplate = async (req, res) => {
  try {
    await db.query(
      `DELETE FROM class_fee_templates WHERE id = $1 AND school_id = $2`,
      [req.params.id, req.user.school_id]
    );
    res.json({ message: 'Template deleted' });
  } catch (err) {
    logger.error('Error deleting fee template:', err);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};

/**
 * POST /api/fee-setup/apply
 * Takes a class_name + academic_year, fetches the template,
 * and generates:
 *   - 1 "Admission" row (month_index=0, is_one_time=true) with one-time charges
 *   - 12 monthly due rows for every student in that class (recurring fees only)
 *
 * KEY RULE: One-time charges (Admission Fee, Annual Charge, ID Card, Exam Fee)
 * are placed ONLY in the Admission row (month_index=0) and are NOT spread across months.
 */
exports.applyTemplate = async (req, res) => {
  const { class_name, academic_year } = req.body;
  const year = academic_year || '2026-2027';

  if (!class_name) {
    return res.status(400).json({ error: 'class_name is required' });
  }

  try {
    // 1. Get the template
    const tplRes = await db.query(
      `SELECT * FROM class_fee_templates WHERE class_name = $1 AND academic_year = $2 AND school_id = $3`,
      [class_name, year, req.user.school_id]
    );

    if (tplRes.rows.length === 0) {
      return res.status(404).json({ error: `No fee template found for ${class_name} (${year}). Create one first.` });
    }

    const tpl = tplRes.rows[0];

    // Monthly recurring fees (divided by 12)
    const monthlyTuition   = Math.round((parseFloat(tpl.tuition_fee)   / 12) * 100) / 100;
    const monthlyTransport = Math.round((parseFloat(tpl.transport_fee)  / 12) * 100) / 100;
    const monthlyOther     = Math.round((parseFloat(tpl.other_fee)      / 12) * 100) / 100;

    // One-time charges (collected ONCE — stored only in Admission row)
    const oneTimeAdmission = parseFloat(tpl.admission_fee || 0);
    const oneTimeAnnual    = parseFloat(tpl.annual_fee    || 0);
    const oneTimeIdCard    = parseFloat(tpl.id_card_fee   || 0);
    const oneTimeExam      = parseFloat(tpl.exam_fee      || 0);
    // We store one-time total in the "other_due" of the Admission row
    // Individual heads stored in dedicated columns
    const oneTimeTotal     = oneTimeAdmission + oneTimeAnnual + oneTimeIdCard + oneTimeExam;

    // 2. Get all students in this class
    const studentsRes = await db.query(
      `SELECT adm_no, concession FROM students WHERE class_name = $1 AND academic_year = $2 AND school_id = $3`,
      [class_name, year, req.user.school_id]
    );

    if (studentsRes.rows.length === 0) {
      return res.status(404).json({ error: `No students found in ${class_name} for ${year}. Import students first.` });
    }

    let applied = 0;

    for (const student of studentsRes.rows) {
      const studentConcession = Math.round((parseFloat(student.concession || 0) / 12) * 100) / 100;

      // ── ROW 0: One-time Admission row ───────────────────────────────────────
      if (oneTimeTotal > 0) {
        await db.query(
          `INSERT INTO student_monthly_dues 
            (student_adm_no, month_name, month_index, is_one_time,
             tuition_due, transport_due, other_due, concession,
             admission_fee_due, annual_fee_due, id_card_due, exam_fee_due,
             academic_year, school_id)
           VALUES ($1, 'Admission', 0, true, 0, 0, $2, 0, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (student_adm_no, month_name, academic_year, school_id)
           DO UPDATE SET
             is_one_time       = true,
             other_due         = EXCLUDED.other_due,
             admission_fee_due = EXCLUDED.admission_fee_due,
             annual_fee_due    = EXCLUDED.annual_fee_due,
             id_card_due       = EXCLUDED.id_card_due,
             exam_fee_due      = EXCLUDED.exam_fee_due`,
          [
            student.adm_no, oneTimeTotal,
            oneTimeAdmission, oneTimeAnnual, oneTimeIdCard, oneTimeExam,
            year, req.user.school_id,
          ]
        );
      }

      // ── ROWS 1-12: Monthly recurring fees ───────────────────────────────────
      for (const month of MONTHS) {
        await db.query(
          `INSERT INTO student_monthly_dues 
            (student_adm_no, month_name, month_index, is_one_time,
             tuition_due, transport_due, other_due, concession,
             academic_year, school_id)
           VALUES ($1, $2, $3, false, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (student_adm_no, month_name, academic_year, school_id)
           DO UPDATE SET
             tuition_due   = EXCLUDED.tuition_due,
             transport_due = EXCLUDED.transport_due,
             other_due     = EXCLUDED.other_due,
             concession    = EXCLUDED.concession,
             is_one_time   = false,
             status = CASE 
               WHEN student_monthly_dues.tuition_paid + student_monthly_dues.transport_paid + student_monthly_dues.other_paid >= 
                    (EXCLUDED.tuition_due + EXCLUDED.transport_due + EXCLUDED.other_due - EXCLUDED.concession) THEN 'PAID'
               WHEN student_monthly_dues.tuition_paid + student_monthly_dues.transport_paid + student_monthly_dues.other_paid > 0 THEN 'PARTIAL'
               ELSE 'UNPAID'
             END`,
          [student.adm_no, month.name, month.index, monthlyTuition, monthlyTransport, monthlyOther, studentConcession, year, req.user.school_id]
        );
      }

      // Update student flat fields
      await db.query(
        `UPDATE students SET payable_fee = $1, transport_fee = $2 WHERE adm_no = $3 AND school_id = $4 AND academic_year = $5`,
        [tpl.tuition_fee, tpl.transport_fee, student.adm_no, req.user.school_id, year]
      );

      applied++;
    }

    res.json({
      message: `Fee structure applied to ${applied} students. One-time charges: ₹${oneTimeTotal}. Monthly rows: ${12 * applied} created.`,
      studentsApplied: applied,
    });
  } catch (err) {
    logger.error('Error applying fee template:', err);
    res.status(500).json({ error: 'Failed to apply fee template: ' + err.message });
  }
};

/**
 * POST /api/fee-setup/apply-single
 * Apply template to a single student (for new admissions or manual override)
 */
exports.applySingleStudent = async (req, res) => {
  const { adm_no, academic_year, tuition_fee, transport_fee, other_fee, concession, admission_fee, annual_fee, id_card_fee, exam_fee } = req.body;
  const year = academic_year || '2026-2027';

  if (!adm_no) {
    return res.status(400).json({ error: 'adm_no is required' });
  }

  try {
    const monthlyTuition    = Math.round((parseFloat(tuition_fee   || 0) / 12) * 100) / 100;
    const monthlyTransport  = Math.round((parseFloat(transport_fee || 0) / 12) * 100) / 100;
    const monthlyOther      = Math.round((parseFloat(other_fee     || 0) / 12) * 100) / 100;
    const monthlyConcession = Math.round((parseFloat(concession    || 0) / 12) * 100) / 100;

    const oneTimeAdmission = parseFloat(admission_fee || 0);
    const oneTimeAnnual    = parseFloat(annual_fee    || 0);
    const oneTimeIdCard    = parseFloat(id_card_fee   || 0);
    const oneTimeExam      = parseFloat(exam_fee      || 0);
    const oneTimeTotal     = oneTimeAdmission + oneTimeAnnual + oneTimeIdCard + oneTimeExam;

    // One-time admission row
    if (oneTimeTotal > 0) {
      await db.query(
        `INSERT INTO student_monthly_dues 
          (student_adm_no, month_name, month_index, is_one_time,
           tuition_due, transport_due, other_due, concession,
           admission_fee_due, annual_fee_due, id_card_due, exam_fee_due,
           academic_year, school_id)
         VALUES ($1, 'Admission', 0, true, 0, 0, $2, 0, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (student_adm_no, month_name, academic_year, school_id)
         DO UPDATE SET
           is_one_time = true, other_due = EXCLUDED.other_due,
           admission_fee_due = EXCLUDED.admission_fee_due,
           annual_fee_due = EXCLUDED.annual_fee_due,
           id_card_due = EXCLUDED.id_card_due,
           exam_fee_due = EXCLUDED.exam_fee_due`,
        [adm_no, oneTimeTotal, oneTimeAdmission, oneTimeAnnual, oneTimeIdCard, oneTimeExam, year, req.user.school_id]
      );
    }

    for (const month of MONTHS) {
      await db.query(
        `INSERT INTO student_monthly_dues 
          (student_adm_no, month_name, month_index, is_one_time,
           tuition_due, transport_due, other_due, concession,
           academic_year, school_id)
         VALUES ($1, $2, $3, false, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (student_adm_no, month_name, academic_year, school_id)
         DO UPDATE SET
           tuition_due = EXCLUDED.tuition_due,
           transport_due = EXCLUDED.transport_due,
           other_due = EXCLUDED.other_due,
           concession = EXCLUDED.concession`,
        [adm_no, month.name, month.index, monthlyTuition, monthlyTransport, monthlyOther, monthlyConcession, year, req.user.school_id]
      );
    }

    res.json({ message: `Monthly dues created for student ${adm_no}` });
  } catch (err) {
    logger.error('Error applying single student:', err);
    res.status(500).json({ error: 'Failed to apply fee structure' });
  }
};
