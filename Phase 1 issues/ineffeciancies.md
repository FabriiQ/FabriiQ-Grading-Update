| name                   | title                  | level | facing   | categories   | description                                                                                                 | detail                                                                                   | remediation                                                                                | metadata                                                                   | cache_key                                                    |
| ---------------------- | ---------------------- | ----- | -------- | ------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.user_permissions\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"user_permissions","type":"table","schema":"public"}               | rls_disabled_in_public_public_user_permissions               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.permissions\` is public, but RLS has not been enabled.                    | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"permissions","type":"table","schema":"public"}                    | rls_disabled_in_public_public_permissions                    |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.users\` is public, but RLS has not been enabled.                          | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"users","type":"table","schema":"public"}                          | rls_disabled_in_public_public_users                          |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.campuses\` is public, but RLS has not been enabled.                       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"campuses","type":"table","schema":"public"}                       | rls_disabled_in_public_public_campuses                       |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.user_campus_access\` is public, but RLS has not been enabled.             | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"user_campus_access","type":"table","schema":"public"}             | rls_disabled_in_public_public_user_campus_access             |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.courses\` is public, but RLS has not been enabled.                        | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"courses","type":"table","schema":"public"}                        | rls_disabled_in_public_public_courses                        |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.terms\` is public, but RLS has not been enabled.                          | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"terms","type":"table","schema":"public"}                          | rls_disabled_in_public_public_terms                          |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.subjects\` is public, but RLS has not been enabled.                       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"subjects","type":"table","schema":"public"}                       | rls_disabled_in_public_public_subjects                       |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_subject_qualifications\` is public, but RLS has not been enabled. | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_subject_qualifications","type":"table","schema":"public"} | rls_disabled_in_public_public_teacher_subject_qualifications |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.programs\` is public, but RLS has not been enabled.                       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"programs","type":"table","schema":"public"}                       | rls_disabled_in_public_public_programs                       |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.program_campuses\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"program_campuses","type":"table","schema":"public"}               | rls_disabled_in_public_public_program_campuses               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.timetables\` is public, but RLS has not been enabled.                     | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"timetables","type":"table","schema":"public"}                     | rls_disabled_in_public_public_timetables                     |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.timetable_periods\` is public, but RLS has not been enabled.              | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"timetable_periods","type":"table","schema":"public"}              | rls_disabled_in_public_public_timetable_periods              |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_subject_assignments\` is public, but RLS has not been enabled.    | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_subject_assignments","type":"table","schema":"public"}    | rls_disabled_in_public_public_teacher_subject_assignments    |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.student_profiles\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"student_profiles","type":"table","schema":"public"}               | rls_disabled_in_public_public_student_profiles               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.student_enrollments\` is public, but RLS has not been enabled.            | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"student_enrollments","type":"table","schema":"public"}            | rls_disabled_in_public_public_student_enrollments            |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_assignments\` is public, but RLS has not been enabled.            | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_assignments","type":"table","schema":"public"}            | rls_disabled_in_public_public_teacher_assignments            |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_profiles\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_profiles","type":"table","schema":"public"}               | rls_disabled_in_public_public_teacher_profiles               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.coordinator_profiles\` is public, but RLS has not been enabled.           | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"coordinator_profiles","type":"table","schema":"public"}           | rls_disabled_in_public_public_coordinator_profiles           |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.assessment_results\` is public, but RLS has not been enabled.             | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"assessment_results","type":"table","schema":"public"}             | rls_disabled_in_public_public_assessment_results             |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.assessment_submissions\` is public, but RLS has not been enabled.         | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"assessment_submissions","type":"table","schema":"public"}         | rls_disabled_in_public_public_assessment_submissions         |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.assessment_criteria\` is public, but RLS has not been enabled.            | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"assessment_criteria","type":"table","schema":"public"}            | rls_disabled_in_public_public_assessment_criteria            |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.attendance\` is public, but RLS has not been enabled.                     | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"attendance","type":"table","schema":"public"}                     | rls_disabled_in_public_public_attendance                     |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_attendance\` is public, but RLS has not been enabled.             | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_attendance","type":"table","schema":"public"}             | rls_disabled_in_public_public_teacher_attendance             |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.assessments\` is public, but RLS has not been enabled.                    | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"assessments","type":"table","schema":"public"}                    | rls_disabled_in_public_public_assessments                    |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.activities\` is public, but RLS has not been enabled.                     | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"activities","type":"table","schema":"public"}                     | rls_disabled_in_public_public_activities                     |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_assistant_interactions\` is public, but RLS has not been enabled. | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_assistant_interactions","type":"table","schema":"public"} | rls_disabled_in_public_public_teacher_assistant_interactions |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_assistant_searches\` is public, but RLS has not been enabled.     | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_assistant_searches","type":"table","schema":"public"}     | rls_disabled_in_public_public_teacher_assistant_searches     |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.campus_features\` is public, but RLS has not been enabled.                | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"campus_features","type":"table","schema":"public"}                | rls_disabled_in_public_public_campus_features                |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_preferences\` is public, but RLS has not been enabled.            | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_preferences","type":"table","schema":"public"}            | rls_disabled_in_public_public_teacher_preferences            |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.audit_logs\` is public, but RLS has not been enabled.                     | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"audit_logs","type":"table","schema":"public"}                     | rls_disabled_in_public_public_audit_logs                     |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.facilities\` is public, but RLS has not been enabled.                     | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"facilities","type":"table","schema":"public"}                     | rls_disabled_in_public_public_facilities                     |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.grade_books\` is public, but RLS has not been enabled.                    | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"grade_books","type":"table","schema":"public"}                    | rls_disabled_in_public_public_grade_books                    |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.student_grades\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"student_grades","type":"table","schema":"public"}                 | rls_disabled_in_public_public_student_grades                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.academic_cycles\` is public, but RLS has not been enabled.                | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"academic_cycles","type":"table","schema":"public"}                | rls_disabled_in_public_public_academic_cycles                |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.institutions\` is public, but RLS has not been enabled.                   | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"institutions","type":"table","schema":"public"}                   | rls_disabled_in_public_public_institutions                   |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.assessment_templates\` is public, but RLS has not been enabled.           | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"assessment_templates","type":"table","schema":"public"}           | rls_disabled_in_public_public_assessment_templates           |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_feedback\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_feedback","type":"table","schema":"public"}               | rls_disabled_in_public_public_teacher_feedback               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.feedback_responses\` is public, but RLS has not been enabled.             | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"feedback_responses","type":"table","schema":"public"}             | rls_disabled_in_public_public_feedback_responses             |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.analytics_events\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"analytics_events","type":"table","schema":"public"}               | rls_disabled_in_public_public_analytics_events               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.analytics_metrics\` is public, but RLS has not been enabled.              | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"analytics_metrics","type":"table","schema":"public"}              | rls_disabled_in_public_public_analytics_metrics              |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.feedback_base\` is public, but RLS has not been enabled.                  | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"feedback_base","type":"table","schema":"public"}                  | rls_disabled_in_public_public_feedback_base                  |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.student_feedback\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"student_feedback","type":"table","schema":"public"}               | rls_disabled_in_public_public_student_feedback               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.ProfessionalDevelopment\` is public, but RLS has not been enabled.        | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"ProfessionalDevelopment","type":"table","schema":"public"}        | rls_disabled_in_public_public_ProfessionalDevelopment        |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.student_course_completions\` is public, but RLS has not been enabled.     | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"student_course_completions","type":"table","schema":"public"}     | rls_disabled_in_public_public_student_course_completions     |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_schedules\` is public, but RLS has not been enabled.              | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_schedules","type":"table","schema":"public"}              | rls_disabled_in_public_public_teacher_schedules              |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_schedule_periods\` is public, but RLS has not been enabled.       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_schedule_periods","type":"table","schema":"public"}       | rls_disabled_in_public_public_teacher_schedule_periods       |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.facility_schedules\` is public, but RLS has not been enabled.             | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"facility_schedules","type":"table","schema":"public"}             | rls_disabled_in_public_public_facility_schedules             |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.facility_schedule_periods\` is public, but RLS has not been enabled.      | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"facility_schedule_periods","type":"table","schema":"public"}      | rls_disabled_in_public_public_facility_schedule_periods      |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.resources\` is public, but RLS has not been enabled.                      | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"resources","type":"table","schema":"public"}                      | rls_disabled_in_public_public_resources                      |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.course_campus\` is public, but RLS has not been enabled.                  | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"course_campus","type":"table","schema":"public"}                  | rls_disabled_in_public_public_course_campus                  |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.course_prerequisites\` is public, but RLS has not been enabled.           | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"course_prerequisites","type":"table","schema":"public"}           | rls_disabled_in_public_public_course_prerequisites           |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.conversations\` is public, but RLS has not been enabled.                  | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"conversations","type":"table","schema":"public"}                  | rls_disabled_in_public_public_conversations                  |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.messages\` is public, but RLS has not been enabled.                       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"messages","type":"table","schema":"public"}                       | rls_disabled_in_public_public_messages                       |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.fee_structures\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"fee_structures","type":"table","schema":"public"}                 | rls_disabled_in_public_public_fee_structures                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.discount_types\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"discount_types","type":"table","schema":"public"}                 | rls_disabled_in_public_public_discount_types                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.enrollment_fees\` is public, but RLS has not been enabled.                | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"enrollment_fees","type":"table","schema":"public"}                | rls_disabled_in_public_public_enrollment_fees                |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.resource_permissions\` is public, but RLS has not been enabled.           | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"resource_permissions","type":"table","schema":"public"}           | rls_disabled_in_public_public_resource_permissions           |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.files\` is public, but RLS has not been enabled.                          | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"files","type":"table","schema":"public"}                          | rls_disabled_in_public_public_files                          |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.fee_arrears\` is public, but RLS has not been enabled.                    | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"fee_arrears","type":"table","schema":"public"}                    | rls_disabled_in_public_public_fee_arrears                    |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.fee_challans\` is public, but RLS has not been enabled.                   | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"fee_challans","type":"table","schema":"public"}                   | rls_disabled_in_public_public_fee_challans                   |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.challan_templates\` is public, but RLS has not been enabled.              | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"challan_templates","type":"table","schema":"public"}              | rls_disabled_in_public_public_challan_templates              |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.fee_transactions\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"fee_transactions","type":"table","schema":"public"}               | rls_disabled_in_public_public_fee_transactions               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.enrollment_history\` is public, but RLS has not been enabled.             | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"enrollment_history","type":"table","schema":"public"}             | rls_disabled_in_public_public_enrollment_history             |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.worksheets\` is public, but RLS has not been enabled.                     | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"worksheets","type":"table","schema":"public"}                     | rls_disabled_in_public_public_worksheets                     |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_points\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_points","type":"table","schema":"public"}                 | rls_disabled_in_public_public_teacher_points                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.fee_discounts\` is public, but RLS has not been enabled.                  | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"fee_discounts","type":"table","schema":"public"}                  | rls_disabled_in_public_public_fee_discounts                  |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.additional_charges\` is public, but RLS has not been enabled.             | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"additional_charges","type":"table","schema":"public"}             | rls_disabled_in_public_public_additional_charges             |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_performance_metrics\` is public, but RLS has not been enabled.    | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_performance_metrics","type":"table","schema":"public"}    | rls_disabled_in_public_public_teacher_performance_metrics    |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.holidays\` is public, but RLS has not been enabled.                       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"holidays","type":"table","schema":"public"}                       | rls_disabled_in_public_public_holidays                       |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_points_aggregate\` is public, but RLS has not been enabled.       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_points_aggregate","type":"table","schema":"public"}       | rls_disabled_in_public_public_teacher_points_aggregate       |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.academic_calendar_events\` is public, but RLS has not been enabled.       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"academic_calendar_events","type":"table","schema":"public"}       | rls_disabled_in_public_public_academic_calendar_events       |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.schedule_exceptions\` is public, but RLS has not been enabled.            | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"schedule_exceptions","type":"table","schema":"public"}            | rls_disabled_in_public_public_schedule_exceptions            |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.grading_scales\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"grading_scales","type":"table","schema":"public"}                 | rls_disabled_in_public_public_grading_scales                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.academic_cycle_templates\` is public, but RLS has not been enabled.       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"academic_cycle_templates","type":"table","schema":"public"}       | rls_disabled_in_public_public_academic_cycle_templates       |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.schedule_patterns\` is public, but RLS has not been enabled.              | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"schedule_patterns","type":"table","schema":"public"}              | rls_disabled_in_public_public_schedule_patterns              |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.teacher_achievements\` is public, but RLS has not been enabled.           | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"teacher_achievements","type":"table","schema":"public"}           | rls_disabled_in_public_public_teacher_achievements           |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.holiday_templates\` is public, but RLS has not been enabled.              | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"holiday_templates","type":"table","schema":"public"}              | rls_disabled_in_public_public_holiday_templates              |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.assessment_policies\` is public, but RLS has not been enabled.            | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"assessment_policies","type":"table","schema":"public"}            | rls_disabled_in_public_public_assessment_policies            |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.archived_activity_grades\` is public, but RLS has not been enabled.       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"archived_activity_grades","type":"table","schema":"public"}       | rls_disabled_in_public_public_archived_activity_grades       |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.student_topic_grades\` is public, but RLS has not been enabled.           | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"student_topic_grades","type":"table","schema":"public"}           | rls_disabled_in_public_public_student_topic_grades           |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.question_banks\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"question_banks","type":"table","schema":"public"}                 | rls_disabled_in_public_public_question_banks                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.subject_topics\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"subject_topics","type":"table","schema":"public"}                 | rls_disabled_in_public_public_subject_topics                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.question_categories\` is public, but RLS has not been enabled.            | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"question_categories","type":"table","schema":"public"}            | rls_disabled_in_public_public_question_categories            |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.lesson_plans\` is public, but RLS has not been enabled.                   | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"lesson_plans","type":"table","schema":"public"}                   | rls_disabled_in_public_public_lesson_plans                   |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.activity_grades\` is public, but RLS has not been enabled.                | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"activity_grades","type":"table","schema":"public"}                | rls_disabled_in_public_public_activity_grades                |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.questions\` is public, but RLS has not been enabled.                      | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"questions","type":"table","schema":"public"}                      | rls_disabled_in_public_public_questions                      |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.h5p_content_completions\` is public, but RLS has not been enabled.        | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"h5p_content_completions","type":"table","schema":"public"}        | rls_disabled_in_public_public_h5p_content_completions        |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.canvases\` is public, but RLS has not been enabled.                       | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"canvases","type":"table","schema":"public"}                       | rls_disabled_in_public_public_canvases                       |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.student_achievements\` is public, but RLS has not been enabled.           | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"student_achievements","type":"table","schema":"public"}           | rls_disabled_in_public_public_student_achievements           |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.student_points\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"student_points","type":"table","schema":"public"}                 | rls_disabled_in_public_public_student_points                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.student_levels\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"student_levels","type":"table","schema":"public"}                 | rls_disabled_in_public_public_student_levels                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.leaderboard_snapshots\` is public, but RLS has not been enabled.          | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"leaderboard_snapshots","type":"table","schema":"public"}          | rls_disabled_in_public_public_leaderboard_snapshots          |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.student_points_aggregates\` is public, but RLS has not been enabled.      | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"student_points_aggregates","type":"table","schema":"public"}      | rls_disabled_in_public_public_student_points_aggregates      |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.question_versions\` is public, but RLS has not been enabled.              | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"question_versions","type":"table","schema":"public"}              | rls_disabled_in_public_public_question_versions              |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.question_category_mappings\` is public, but RLS has not been enabled.     | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"question_category_mappings","type":"table","schema":"public"}     | rls_disabled_in_public_public_question_category_mappings     |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.learning_goals\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"learning_goals","type":"table","schema":"public"}                 | rls_disabled_in_public_public_learning_goals                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.journey_events\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"journey_events","type":"table","schema":"public"}                 | rls_disabled_in_public_public_journey_events                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.personal_bests\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"personal_bests","type":"table","schema":"public"}                 | rls_disabled_in_public_public_personal_bests                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.class_performance\` is public, but RLS has not been enabled.              | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"class_performance","type":"table","schema":"public"}              | rls_disabled_in_public_public_class_performance              |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.question_sources\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"question_sources","type":"table","schema":"public"}               | rls_disabled_in_public_public_question_sources               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.learning_time_records\` is public, but RLS has not been enabled.          | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"learning_time_records","type":"table","schema":"public"}          | rls_disabled_in_public_public_learning_time_records          |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.CommitmentContract\` is public, but RLS has not been enabled.             | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"CommitmentContract","type":"table","schema":"public"}             | rls_disabled_in_public_public_CommitmentContract             |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.question_usage_stats\` is public, but RLS has not been enabled.           | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"question_usage_stats","type":"table","schema":"public"}           | rls_disabled_in_public_public_question_usage_stats           |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.LearningOutcome\` is public, but RLS has not been enabled.                | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"LearningOutcome","type":"table","schema":"public"}                | rls_disabled_in_public_public_LearningOutcome                |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.PerformanceLevel\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"PerformanceLevel","type":"table","schema":"public"}               | rls_disabled_in_public_public_PerformanceLevel               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.ActivityTemplate\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"ActivityTemplate","type":"table","schema":"public"}               | rls_disabled_in_public_public_ActivityTemplate               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.reward_points_config\` is public, but RLS has not been enabled.           | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"reward_points_config","type":"table","schema":"public"}           | rls_disabled_in_public_public_reward_points_config           |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.CriteriaLevel\` is public, but RLS has not been enabled.                  | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"CriteriaLevel","type":"table","schema":"public"}                  | rls_disabled_in_public_public_CriteriaLevel                  |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.RubricOutcome\` is public, but RLS has not been enabled.                  | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"RubricOutcome","type":"table","schema":"public"}                  | rls_disabled_in_public_public_RubricOutcome                  |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.RubricCriteria\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"RubricCriteria","type":"table","schema":"public"}                 | rls_disabled_in_public_public_RubricCriteria                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.topic_masteries\` is public, but RLS has not been enabled.                | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"topic_masteries","type":"table","schema":"public"}                | rls_disabled_in_public_public_topic_masteries                |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.Rubric\` is public, but RLS has not been enabled.                         | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"Rubric","type":"table","schema":"public"}                         | rls_disabled_in_public_public_Rubric                         |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.system_config\` is public, but RLS has not been enabled.                  | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"system_config","type":"table","schema":"public"}                  | rls_disabled_in_public_public_system_config                  |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.ActivityOutcome\` is public, but RLS has not been enabled.                | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"ActivityOutcome","type":"table","schema":"public"}                | rls_disabled_in_public_public_ActivityOutcome                |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public._CampusToHoliday\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"_CampusToHoliday","type":"table","schema":"public"}               | rls_disabled_in_public_public__CampusToHoliday               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public._ClassToHoliday\` is public, but RLS has not been enabled.                | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"_ClassToHoliday","type":"table","schema":"public"}                | rls_disabled_in_public_public__ClassToHoliday                |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public._HolidayUsers\` is public, but RLS has not been enabled.                  | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"_HolidayUsers","type":"table","schema":"public"}                  | rls_disabled_in_public_public__HolidayUsers                  |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public._AcademicCalendarEventToCampus\` is public, but RLS has not been enabled. | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"_AcademicCalendarEventToCampus","type":"table","schema":"public"} | rls_disabled_in_public_public__AcademicCalendarEventToCampus |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public._AcademicCalendarEventToClass\` is public, but RLS has not been enabled.  | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"_AcademicCalendarEventToClass","type":"table","schema":"public"}  | rls_disabled_in_public_public__AcademicCalendarEventToClass  |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public._EventUsers\` is public, but RLS has not been enabled.                    | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"_EventUsers","type":"table","schema":"public"}                    | rls_disabled_in_public_public__EventUsers                    |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public._LearningOutcomeToQuestion\` is public, but RLS has not been enabled.     | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"_LearningOutcomeToQuestion","type":"table","schema":"public"}     | rls_disabled_in_public_public__LearningOutcomeToQuestion     |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.AssessmentOutcome\` is public, but RLS has not been enabled.              | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"AssessmentOutcome","type":"table","schema":"public"}              | rls_disabled_in_public_public_AssessmentOutcome              |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.Session\` is public, but RLS has not been enabled.                        | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"Session","type":"table","schema":"public"}                        | rls_disabled_in_public_public_Session                        |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.classes\` is public, but RLS has not been enabled.                        | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"classes","type":"table","schema":"public"}                        | rls_disabled_in_public_public_classes                        |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.h5p_content\` is public, but RLS has not been enabled.                    | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"h5p_content","type":"table","schema":"public"}                    | rls_disabled_in_public_public_h5p_content                    |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.conversation_participants\` is public, but RLS has not been enabled.      | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"conversation_participants","type":"table","schema":"public"}      | rls_disabled_in_public_public_conversation_participants      |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.LessonPlanOutcome\` is public, but RLS has not been enabled.              | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"LessonPlanOutcome","type":"table","schema":"public"}              | rls_disabled_in_public_public_LessonPlanOutcome              |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.social_comments\` is public, but RLS has not been enabled.                | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"social_comments","type":"table","schema":"public"}                | rls_disabled_in_public_public_social_comments                |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.social_reactions\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"social_reactions","type":"table","schema":"public"}               | rls_disabled_in_public_public_social_reactions               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.social_user_tags\` is public, but RLS has not been enabled.               | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"social_user_tags","type":"table","schema":"public"}               | rls_disabled_in_public_public_social_user_tags               |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.social_moderation_logs\` is public, but RLS has not been enabled.         | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"social_moderation_logs","type":"table","schema":"public"}         | rls_disabled_in_public_public_social_moderation_logs         |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.social_archives\` is public, but RLS has not been enabled.                | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"social_archives","type":"table","schema":"public"}                | rls_disabled_in_public_public_social_archives                |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.social_posts\` is public, but RLS has not been enabled.                   | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"social_posts","type":"table","schema":"public"}                   | rls_disabled_in_public_public_social_posts                   |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.social_reports\` is public, but RLS has not been enabled.                 | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"social_reports","type":"table","schema":"public"}                 | rls_disabled_in_public_public_social_reports                 |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.social_activity_tags\` is public, but RLS has not been enabled.           | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"social_activity_tags","type":"table","schema":"public"}           | rls_disabled_in_public_public_social_activity_tags           |
| rls_disabled_in_public | RLS Disabled in Public | ERROR | EXTERNAL | ["SECURITY"] | Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST | Table \`public.notifications\` is public, but RLS has not been enabled.                  | https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public | {"name":"notifications","type":"table","schema":"public"}                  | rls_disabled_in_public_public_notifications                  |




ineffecient quries

slowest quries

[
  {
    "rolname": "postgres",
    "query": "with tables as (SELECT\n  c.oid :: int8 AS id,\n  nc.nspname AS schema,\n  c.relname AS name,\n  c.relrowsecurity AS rls_enabled,\n  c.relforcerowsecurity AS rls_forced,\n  CASE\n    WHEN c.relreplident = $1 THEN $2\n    WHEN c.relreplident = $3 THEN $4\n    WHEN c.relreplident = $5 THEN $6\n    ELSE $7\n  END AS replica_identity,\n  pg_total_relation_size(format($8, nc.nspname, c.relname)) :: int8 AS bytes,\n  pg_size_pretty(\n    pg_total_relation_size(format($9, nc.nspname, c.relname))\n  ) AS size,\n  pg_stat_get_live_tuples(c.oid) AS live_rows_estimate,\n  pg_stat_get_dead_tuples(c.oid) AS dead_rows_estimate,\n  obj_description(c.oid) AS comment,\n  coalesce(pk.primary_keys, $10) as primary_keys,\n  coalesce(\n    jsonb_agg(relationships) filter (where relationships is not null),\n    $11\n  ) as relationships\nFROM\n  pg_namespace nc\n  JOIN pg_class c ON nc.oid = c.relnamespace\n  left join (\n    select\n      table_id,\n      jsonb_agg(_pk.*) as primary_keys\n    from (\n      select\n        n.nspname as schema,\n        c.relname as table_name,\n        a.attname as name,\n        c.oid :: int8 as table_id\n      from\n        pg_index i,\n        pg_class c,\n        pg_attribute a,\n        pg_namespace n\n      where\n        i.indrelid = c.oid\n        and c.relnamespace = n.oid\n        and a.attrelid = c.oid\n        and a.attnum = any (i.indkey)\n        and i.indisprimary\n    ) as _pk\n    group by table_id\n  ) as pk\n  on pk.table_id = c.oid\n  left join (\n    select\n      c.oid :: int8 as id,\n      c.conname as constraint_name,\n      nsa.nspname as source_schema,\n      csa.relname as source_table_name,\n      sa.attname as source_column_name,\n      nta.nspname as target_table_schema,\n      cta.relname as target_table_name,\n      ta.attname as target_column_name\n    from\n      pg_constraint c\n    join (\n      pg_attribute sa\n      join pg_class csa on sa.attrelid = csa.oid\n      join pg_namespace nsa on csa.relnamespace = nsa.oid\n    ) on sa.attrelid = c.conrelid and sa.attnum = any (c.conkey)\n    join (\n      pg_attribute ta\n      join pg_class cta on ta.attrelid = cta.oid\n      join pg_namespace nta on cta.relnamespace = nta.oid\n    ) on ta.attrelid = c.confrelid and ta.attnum = any (c.confkey)\n    where\n      c.contype = $12\n  ) as relationships\n  on (relationships.source_schema = nc.nspname and relationships.source_table_name = c.relname)\n  or (relationships.target_table_schema = nc.nspname and relationships.target_table_name = c.relname)\nWHERE\n  c.relkind IN ($13, $14)\n  AND NOT pg_is_other_temp_schema(nc.oid)\n  AND (\n    pg_has_role(c.relowner, $15)\n    OR has_table_privilege(\n      c.oid,\n      $16\n    )\n    OR has_any_column_privilege(c.oid, $17)\n  )\ngroup by\n  c.oid,\n  c.relname,\n  c.relrowsecurity,\n  c.relforcerowsecurity,\n  c.relreplident,\n  nc.nspname,\n  pk.primary_keys\n)\n  , columns as (-- Adapted from information_schema.columns\n\nSELECT\n  c.oid :: int8 AS table_id,\n  nc.nspname AS schema,\n  c.relname AS table,\n  (c.oid || $18 || a.attnum) AS id,\n  a.attnum AS ordinal_position,\n  a.attname AS name,\n  CASE\n    WHEN a.atthasdef THEN pg_get_expr(ad.adbin, ad.adrelid)\n    ELSE $19\n  END AS default_value,\n  CASE\n    WHEN t.typtype = $20 THEN CASE\n      WHEN bt.typelem <> $21 :: oid\n      AND bt.typlen = $22 THEN $23\n      WHEN nbt.nspname = $24 THEN format_type(t.typbasetype, $25)\n      ELSE $26\n    END\n    ELSE CASE\n      WHEN t.typelem <> $27 :: oid\n      AND t.typlen = $28 THEN $29\n      WHEN nt.nspname = $30 THEN format_type(a.atttypid, $31)\n      ELSE $32\n    END\n  END AS data_type,\n  COALESCE(bt.typname, t.typname) AS format,\n  a.attidentity IN ($33, $34) AS is_identity,\n  CASE\n    a.attidentity\n    WHEN $35 THEN $36\n    WHEN $37 THEN $38\n    ELSE $39\n  END AS identity_generation,\n  a.attgenerated IN ($40) AS is_generated,\n  NOT (\n    a.attnotnull\n    OR t.typtype = $41 AND t.typnotnull\n  ) AS is_nullable,\n  (\n    c.relkind IN ($42, $43)\n    OR c.relkind IN ($44, $45) AND pg_column_is_updatable(c.oid, a.attnum, $46)\n  ) AS is_updatable,\n  uniques.table_id IS NOT NULL AS is_unique,\n  check_constraints.definition AS \"check\",\n  array_to_json(\n    array(\n      SELECT\n        enumlabel\n      FROM\n        pg_catalog.pg_enum enums\n      WHERE\n        enums.enumtypid = coalesce(bt.oid, t.oid)\n        OR enums.enumtypid = coalesce(bt.typelem, t.typelem)\n      ORDER BY\n        enums.enumsortorder\n    )\n  ) AS enums,\n  col_description(c.oid, a.attnum) AS comment\nFROM\n  pg_attribute a\n  LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid\n  AND a.attnum = ad.adnum\n  JOIN (\n    pg_class c\n    JOIN pg_namespace nc ON c.relnamespace = nc.oid\n  ) ON a.attrelid = c.oid\n  JOIN (\n    pg_type t\n    JOIN pg_namespace nt ON t.typnamespace = nt.oid\n  ) ON a.atttypid = t.oid\n  LEFT JOIN (\n    pg_type bt\n    JOIN pg_namespace nbt ON bt.typnamespace = nbt.oid\n  ) ON t.typtype = $47\n  AND t.typbasetype = bt.oid\n  LEFT JOIN (\n    SELECT DISTINCT ON (table_id, ordinal_position)\n      conrelid AS table_id,\n      conkey[$48] AS ordinal_position\n    FROM pg_catalog.pg_constraint\n    WHERE contype = $49 AND cardinality(conkey) = $50\n  ) AS uniques ON uniques.table_id = c.oid AND uniques.ordinal_position = a.attnum\n  LEFT JOIN (\n    -- We only select the first column check\n    SELECT DISTINCT ON (table_id, ordinal_position)\n      conrelid AS table_id,\n      conkey[$51] AS ordinal_position,\n      substring(\n        pg_get_constraintdef(pg_constraint.oid, $52),\n        $53,\n        length(pg_get_constraintdef(pg_constraint.oid, $54)) - $55\n      ) AS \"definition\"\n    FROM pg_constraint\n    WHERE contype = $56 AND cardinality(conkey) = $57\n    ORDER BY table_id, ordinal_position, oid asc\n  ) AS check_constraints ON check_constraints.table_id = c.oid AND check_constraints.ordinal_position = a.attnum\nWHERE\n  NOT pg_is_other_temp_schema(nc.oid)\n  AND a.attnum > $58\n  AND NOT a.attisdropped\n  AND (c.relkind IN ($59, $60, $61, $62, $63))\n  AND (\n    pg_has_role(c.relowner, $64)\n    OR has_column_privilege(\n      c.oid,\n      a.attnum,\n      $65\n    )\n  )\n)\nselect\n  *\n  , \nCOALESCE(\n  (\n    SELECT\n      array_agg(row_to_json(columns)) FILTER (WHERE columns.table_id = tables.id)\n    FROM\n      columns\n  ),\n  $66\n) AS columns\nfrom tables where schema IN ($67)",
    "calls": 12,
    "total_time": 27479.49591,
    "min_time": 1676.323328,
    "max_time": 2694.512882,
    "mean_time": 2289.9579925,
    "avg_rows": 130
  },
  {
    "rolname": "authenticator",
    "query": "SELECT name FROM pg_timezone_names",
    "calls": 263,
    "total_time": 19863.790643,
    "min_time": 53.165258,
    "max_time": 793.71405,
    "mean_time": 75.5277210760457,
    "avg_rows": 1194
  },
  {
    "rolname": "postgres",
    "query": "with tables as (SELECT\n  c.oid :: int8 AS id,\n  nc.nspname AS schema,\n  c.relname AS name,\n  c.relrowsecurity AS rls_enabled,\n  c.relforcerowsecurity AS rls_forced,\n  CASE\n    WHEN c.relreplident = $1 THEN $2\n    WHEN c.relreplident = $3 THEN $4\n    WHEN c.relreplident = $5 THEN $6\n    ELSE $7\n  END AS replica_identity,\n  pg_total_relation_size(format($8, nc.nspname, c.relname)) :: int8 AS bytes,\n  pg_size_pretty(\n    pg_total_relation_size(format($9, nc.nspname, c.relname))\n  ) AS size,\n  pg_stat_get_live_tuples(c.oid) AS live_rows_estimate,\n  pg_stat_get_dead_tuples(c.oid) AS dead_rows_estimate,\n  obj_description(c.oid) AS comment,\n  coalesce(pk.primary_keys, $10) as primary_keys,\n  coalesce(\n    jsonb_agg(relationships) filter (where relationships is not null),\n    $11\n  ) as relationships\nFROM\n  pg_namespace nc\n  JOIN pg_class c ON nc.oid = c.relnamespace\n  left join (\n    select\n      table_id,\n      jsonb_agg(_pk.*) as primary_keys\n    from (\n      select\n        n.nspname as schema,\n        c.relname as table_name,\n        a.attname as name,\n        c.oid :: int8 as table_id\n      from\n        pg_index i,\n        pg_class c,\n        pg_attribute a,\n        pg_namespace n\n      where\n        i.indrelid = c.oid\n        and c.relnamespace = n.oid\n        and a.attrelid = c.oid\n        and a.attnum = any (i.indkey)\n        and i.indisprimary\n    ) as _pk\n    group by table_id\n  ) as pk\n  on pk.table_id = c.oid\n  left join (\n    select\n      c.oid :: int8 as id,\n      c.conname as constraint_name,\n      nsa.nspname as source_schema,\n      csa.relname as source_table_name,\n      sa.attname as source_column_name,\n      nta.nspname as target_table_schema,\n      cta.relname as target_table_name,\n      ta.attname as target_column_name\n    from\n      pg_constraint c\n    join (\n      pg_attribute sa\n      join pg_class csa on sa.attrelid = csa.oid\n      join pg_namespace nsa on csa.relnamespace = nsa.oid\n    ) on sa.attrelid = c.conrelid and sa.attnum = any (c.conkey)\n    join (\n      pg_attribute ta\n      join pg_class cta on ta.attrelid = cta.oid\n      join pg_namespace nta on cta.relnamespace = nta.oid\n    ) on ta.attrelid = c.confrelid and ta.attnum = any (c.confkey)\n    where\n      c.contype = $12\n  ) as relationships\n  on (relationships.source_schema = nc.nspname and relationships.source_table_name = c.relname)\n  or (relationships.target_table_schema = nc.nspname and relationships.target_table_name = c.relname)\nWHERE\n  c.relkind IN ($13, $14)\n  AND NOT pg_is_other_temp_schema(nc.oid)\n  AND (\n    pg_has_role(c.relowner, $15)\n    OR has_table_privilege(\n      c.oid,\n      $16\n    )\n    OR has_any_column_privilege(c.oid, $17)\n  )\ngroup by\n  c.oid,\n  c.relname,\n  c.relrowsecurity,\n  c.relforcerowsecurity,\n  c.relreplident,\n  nc.nspname,\n  pk.primary_keys\n)\n  \nselect\n  *\n  \nfrom tables where schema IN ($18)",
    "calls": 40,
    "total_time": 4805.832284,
    "min_time": 19.189907,
    "max_time": 303.85586,
    "mean_time": 120.1458071,
    "avg_rows": 130
  },
  {
    "rolname": "postgres",
    "query": "SELECT\n                oid.namespace,\n                info.table_name,\n                info.column_name,\n                format_type(att.atttypid, att.atttypmod) as formatted_type,\n                info.numeric_precision,\n                info.numeric_scale,\n                info.numeric_precision_radix,\n                info.datetime_precision,\n                info.data_type,\n                info.udt_schema as type_schema_name,\n                info.udt_name as full_data_type,\n                pg_get_expr(attdef.adbin, attdef.adrelid) AS column_default,\n                info.is_nullable,\n                info.is_identity,\n                info.character_maximum_length,\n                col_description(att.attrelid, ordinal_position) AS description\n            FROM information_schema.columns info\n            JOIN pg_attribute att ON att.attname = info.column_name\n            JOIN (\n                 SELECT pg_class.oid, relname, pg_namespace.nspname as namespace\n                 FROM pg_class\n                 JOIN pg_namespace on pg_namespace.oid = pg_class.relnamespace\n                 AND pg_namespace.nspname = ANY ( $1 )\n                 WHERE reltype > $2\n                ) as oid on oid.oid = att.attrelid \n                  AND relname = info.table_name\n                  AND namespace = info.table_schema\n            LEFT OUTER JOIN pg_attrdef attdef ON attdef.adrelid = att.attrelid AND attdef.adnum = att.attnum AND table_schema = namespace\n            WHERE table_schema = ANY ( $1 ) \n            ORDER BY namespace, table_name, ordinal_position",
    "calls": 10,
    "total_time": 1675.092051,
    "min_time": 0.377655,
    "max_time": 281.410906,
    "mean_time": 167.5092051,
    "avg_rows": 1344
  },
  {
    "rolname": "postgres",
    "query": "SELECT\n  e.name,\n  n.nspname AS schema,\n  e.default_version,\n  x.extversion AS installed_version,\n  e.comment\nFROM\n  pg_available_extensions() e(name, default_version, comment)\n  LEFT JOIN pg_extension x ON e.name = x.extname\n  LEFT JOIN pg_namespace n ON x.extnamespace = n.oid",
    "calls": 35,
    "total_time": 966.968113,
    "min_time": 2.07745,
    "max_time": 246.764443,
    "mean_time": 27.6276603714286,
    "avg_rows": 76
  },
  {
    "rolname": "authenticator",
    "query": "-- Recursively get the base types of domains\n  WITH\n  base_types AS (\n    WITH RECURSIVE\n    recurse AS (\n      SELECT\n        oid,\n        typbasetype,\n        COALESCE(NULLIF(typbasetype, $3), oid) AS base\n      FROM pg_type\n      UNION\n      SELECT\n        t.oid,\n        b.typbasetype,\n        COALESCE(NULLIF(b.typbasetype, $4), b.oid) AS base\n      FROM recurse t\n      JOIN pg_type b ON t.typbasetype = b.oid\n    )\n    SELECT\n      oid,\n      base\n    FROM recurse\n    WHERE typbasetype = $5\n  ),\n  arguments AS (\n    SELECT\n      oid,\n      array_agg((\n        COALESCE(name, $6), -- name\n        type::regtype::text, -- type\n        CASE type\n          WHEN $7::regtype THEN $8\n          WHEN $9::regtype THEN $10\n          WHEN $11::regtype THEN $12\n          WHEN $13::regtype THEN $14\n          ELSE type::regtype::text\n        END, -- convert types that ignore the lenth and accept any value till maximum size\n        idx <= (pronargs - pronargdefaults), -- is_required\n        COALESCE(mode = $15, $16) -- is_variadic\n      ) ORDER BY idx) AS args,\n      CASE COUNT(*) - COUNT(name) -- number of unnamed arguments\n        WHEN $17 THEN $18\n        WHEN $19 THEN (array_agg(type))[$20] IN ($21::regtype, $22::regtype, $23::regtype, $24::regtype, $25::regtype)\n        ELSE $26\n      END AS callable\n    FROM pg_proc,\n         unnest(proargnames, proargtypes, proargmodes)\n           WITH ORDINALITY AS _ (name, type, mode, idx)\n    WHERE type IS NOT NULL -- only input arguments\n    GROUP BY oid\n  )\n  SELECT\n    pn.nspname AS proc_schema,\n    p.proname AS proc_name,\n    d.description AS proc_description,\n    COALESCE(a.args, $27) AS args,\n    tn.nspname AS schema,\n    COALESCE(comp.relname, t.typname) AS name,\n    p.proretset AS rettype_is_setof,\n    (t.typtype = $28\n     -- if any TABLE, INOUT or OUT arguments present, treat as composite\n     or COALESCE(proargmodes::text[] && $29, $30)\n    ) AS rettype_is_composite,\n    bt.oid <> bt.base as rettype_is_composite_alias,\n    p.provolatile,\n    p.provariadic > $31 as hasvariadic,\n    lower((regexp_split_to_array((regexp_split_to_array(iso_config, $32))[$33], $34))[$35]) AS transaction_isolation_level,\n    coalesce(func_settings.kvs, $36) as kvs\n  FROM pg_proc p\n  LEFT JOIN arguments a ON a.oid = p.oid\n  JOIN pg_namespace pn ON pn.oid = p.pronamespace\n  JOIN base_types bt ON bt.oid = p.prorettype\n  JOIN pg_type t ON t.oid = bt.base\n  JOIN pg_namespace tn ON tn.oid = t.typnamespace\n  LEFT JOIN pg_class comp ON comp.oid = t.typrelid\n  LEFT JOIN pg_description as d ON d.objoid = p.oid\n  LEFT JOIN LATERAL unnest(proconfig) iso_config ON iso_config LIKE $37\n  LEFT JOIN LATERAL (\n    SELECT\n      array_agg(row(\n        substr(setting, $38, strpos(setting, $39) - $40),\n        substr(setting, strpos(setting, $41) + $42)\n      )) as kvs\n    FROM unnest(proconfig) setting\n    WHERE setting ~ ANY($2)\n  ) func_settings ON $43\n  WHERE t.oid <> $44::regtype AND COALESCE(a.callable, $45)\nAND prokind = $46 AND pn.nspname = ANY($1)",
    "calls": 263,
    "total_time": 6226.156307,
    "min_time": 18.292095,
    "max_time": 136.314962,
    "mean_time": 23.6735981254753,
    "avg_rows": 1
  },
  {
    "rolname": "authenticator",
    "query": "WITH\n  columns AS (\n      SELECT\n          nc.nspname::name AS table_schema,\n          c.relname::name AS table_name,\n          a.attname::name AS column_name,\n          d.description AS description,\n  \n          CASE\n            WHEN t.typbasetype  != $2  THEN pg_get_expr(t.typdefaultbin, $3)\n            WHEN a.attidentity  = $4 THEN format($5, quote_literal(seqsch.nspname || $6 || seqclass.relname))\n            WHEN a.attgenerated = $7 THEN $8\n            ELSE pg_get_expr(ad.adbin, ad.adrelid)::text\n          END AS column_default,\n          not (a.attnotnull OR t.typtype = $9 AND t.typnotnull) AS is_nullable,\n          CASE\n              WHEN t.typtype = $10 THEN\n              CASE\n                  WHEN nbt.nspname = $11::name THEN format_type(t.typbasetype, $12::integer)\n                  ELSE format_type(a.atttypid, a.atttypmod)\n              END\n              ELSE\n              CASE\n                  WHEN nt.nspname = $13::name THEN format_type(a.atttypid, $14::integer)\n                  ELSE format_type(a.atttypid, a.atttypmod)\n              END\n          END::text AS data_type,\n          format_type(a.atttypid, a.atttypmod)::text AS nominal_data_type,\n          information_schema._pg_char_max_length(\n              information_schema._pg_truetypid(a.*, t.*),\n              information_schema._pg_truetypmod(a.*, t.*)\n          )::integer AS character_maximum_length,\n          COALESCE(bt.oid, t.oid) AS base_type,\n          a.attnum::integer AS position\n      FROM pg_attribute a\n          LEFT JOIN pg_description AS d\n              ON d.objoid = a.attrelid and d.objsubid = a.attnum\n          LEFT JOIN pg_attrdef ad\n              ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum\n          JOIN (pg_class c JOIN pg_namespace nc ON c.relnamespace = nc.oid)\n              ON a.attrelid = c.oid\n          JOIN (pg_type t JOIN pg_namespace nt ON t.typnamespace = nt.oid)\n              ON a.atttypid = t.oid\n          LEFT JOIN (pg_type bt JOIN pg_namespace nbt ON bt.typnamespace = nbt.oid)\n              ON t.typtype = $15 AND t.typbasetype = bt.oid\n          LEFT JOIN (pg_collation co JOIN pg_namespace nco ON co.collnamespace = nco.oid)\n              ON a.attcollation = co.oid AND (nco.nspname <> $16::name OR co.collname <> $17::name)\n          LEFT JOIN pg_depend dep\n              ON dep.refobjid = a.attrelid and dep.refobjsubid = a.attnum and dep.deptype = $18\n          LEFT JOIN pg_class seqclass\n              ON seqclass.oid = dep.objid\n          LEFT JOIN pg_namespace seqsch\n              ON seqsch.oid = seqclass.relnamespace\n      WHERE\n          NOT pg_is_other_temp_schema(nc.oid)\n          AND a.attnum > $19\n          AND NOT a.attisdropped\n          AND c.relkind in ($20, $21, $22, $23, $24)\n          AND nc.nspname = ANY($1)\n  ),\n  columns_agg AS (\n    SELECT DISTINCT\n        info.table_schema AS table_schema,\n        info.table_name AS table_name,\n        array_agg(row(\n          info.column_name,\n          info.description,\n          info.is_nullable::boolean,\n          info.data_type,\n          info.nominal_data_type,\n          info.character_maximum_length,\n          info.column_default,\n          coalesce(enum_info.vals, $25)) order by info.position) as columns\n    FROM columns info\n    LEFT OUTER JOIN (\n        SELECT\n            e.enumtypid,\n            array_agg(e.enumlabel ORDER BY e.enumsortorder) AS vals\n        FROM pg_type t\n        JOIN pg_enum e ON t.oid = e.enumtypid\n        JOIN pg_namespace n ON n.oid = t.typnamespace\n        GROUP BY enumtypid\n    ) AS enum_info ON info.base_type = enum_info.enumtypid\n    WHERE info.table_schema NOT IN ($26, $27)\n    GROUP BY info.table_schema, info.table_name\n  ),\n  tbl_constraints AS (\n      SELECT\n          c.conname::name AS constraint_name,\n          nr.nspname::name AS table_schema,\n          r.relname::name AS table_name\n      FROM pg_namespace nc\n      JOIN pg_constraint c ON nc.oid = c.connamespace\n      JOIN pg_class r ON c.conrelid = r.oid\n      JOIN pg_namespace nr ON nr.oid = r.relnamespace\n      WHERE\n        r.relkind IN ($28, $29)\n        AND NOT pg_is_other_temp_schema(nr.oid)\n        AND c.contype = $30\n  ),\n  key_col_usage AS (\n      SELECT\n          ss.conname::name AS constraint_name,\n          ss.nr_nspname::name AS table_schema,\n          ss.relname::name AS table_name,\n          a.attname::name AS column_name,\n          (ss.x).n::integer AS ordinal_position,\n          CASE\n              WHEN ss.contype = $31 THEN information_schema._pg_index_position(ss.conindid, ss.confkey[(ss.x).n])\n              ELSE $32::integer\n          END::integer AS position_in_unique_constraint\n      FROM pg_attribute a\n      JOIN (\n        SELECT r.oid AS roid,\n          r.relname,\n          r.relowner,\n          nc.nspname AS nc_nspname,\n          nr.nspname AS nr_nspname,\n          c.oid AS coid,\n          c.conname,\n          c.contype,\n          c.conindid,\n          c.confkey,\n          information_schema._pg_expandarray(c.conkey) AS x\n        FROM pg_namespace nr\n        JOIN pg_class r\n          ON nr.oid = r.relnamespace\n        JOIN pg_constraint c\n          ON r.oid = c.conrelid\n        JOIN pg_namespace nc\n          ON c.connamespace = nc.oid\n        WHERE\n          c.contype in ($33, $34)\n          AND r.relkind IN ($35, $36)\n          AND NOT pg_is_other_temp_schema(nr.oid)\n      ) ss ON a.attrelid = ss.roid AND a.attnum = (ss.x).x\n      WHERE\n        NOT a.attisdropped\n  ),\n  tbl_pk_cols AS (\n    SELECT\n        key_col_usage.table_schema,\n        key_col_usage.table_name,\n        array_agg(key_col_usage.column_name) as pk_cols\n    FROM\n        tbl_constraints\n    JOIN\n        key_col_usage\n    ON\n        key_col_usage.table_name = tbl_constraints.table_name AND\n        key_col_usage.table_schema = tbl_constraints.table_schema AND\n        key_col_usage.constraint_name = tbl_constraints.constraint_name\n    WHERE\n        key_col_usage.table_schema NOT IN ($37, $38)\n    GROUP BY key_col_usage.table_schema, key_col_usage.table_name\n  )\n  SELECT\n    n.nspname AS table_schema,\n    c.relname AS table_name,\n    d.description AS table_description,\n    c.relkind IN ($39,$40) as is_view,\n    (\n      c.relkind IN ($41,$42)\n      OR (\n        c.relkind in ($43,$44)\n        -- The function `pg_relation_is_updateable` returns a bitmask where 8\n        -- corresponds to `1 << CMD_INSERT` in the PostgreSQL source code, i.e.\n        -- it's possible to insert into the relation.\n        AND (pg_relation_is_updatable(c.oid::regclass, $45) & $46) = $47\n      )\n    ) AS insertable,\n    (\n      c.relkind IN ($48,$49)\n      OR (\n        c.relkind in ($50,$51)\n        -- CMD_UPDATE\n        AND (pg_relation_is_updatable(c.oid::regclass, $52) & $53) = $54\n      )\n    ) AS updatable,\n    (\n      c.relkind IN ($55,$56)\n      OR (\n        c.relkind in ($57,$58)\n        -- CMD_DELETE\n        AND (pg_relation_is_updatable(c.oid::regclass, $59) & $60) = $61\n      )\n    ) AS deletable,\n    coalesce(tpks.pk_cols, $62) as pk_cols,\n    coalesce(cols_agg.columns, $63) as columns\n  FROM pg_class c\n  JOIN pg_namespace n ON n.oid = c.relnamespace\n  LEFT JOIN pg_description d on d.objoid = c.oid and d.objsubid = $64\n  LEFT JOIN tbl_pk_cols tpks ON n.nspname = tpks.table_schema AND c.relname = tpks.table_name\n  LEFT JOIN columns_agg cols_agg ON n.nspname = cols_agg.table_schema AND c.relname = cols_agg.table_name\n  WHERE c.relkind IN ($65,$66,$67,$68,$69)\n  AND n.nspname NOT IN ($70, $71)  AND not c.relispartition ORDER BY table_schema, table_name",
    "calls": 263,
    "total_time": 11104.912669,
    "min_time": 1.849986,
    "max_time": 98.456578,
    "mean_time": 42.2240025437262,
    "avg_rows": 122
  },
  {
    "rolname": "pgbouncer",
    "query": "SELECT t.oid, t.typname, t.typsend, t.typreceive, t.typoutput, t.typinput,\n       coalesce(d.typelem, t.typelem), coalesce(r.rngsubtype, $1), ARRAY (\n  SELECT a.atttypid\n  FROM pg_attribute AS a\n  WHERE a.attrelid = t.typrelid AND a.attnum > $2 AND NOT a.attisdropped\n  ORDER BY a.attnum\n)\nFROM pg_type AS t\nLEFT JOIN pg_type AS d ON t.typbasetype = d.oid\nLEFT JOIN pg_range AS r ON r.rngtypid = t.oid OR r.rngmultitypid = t.oid OR (t.typbasetype <> $3 AND r.rngtypid = t.typbasetype)\nWHERE (t.typrelid = $4)\nAND (t.typelem = $5 OR NOT EXISTS (SELECT $6 FROM pg_catalog.pg_type s WHERE s.typrelid != $7 AND s.oid = t.typelem))",
    "calls": 31,
    "total_time": 408.094947,
    "min_time": 4.416925,
    "max_time": 90.457163,
    "mean_time": 13.1643531290323,
    "avg_rows": 321
  },
  {
    "rolname": "postgres",
    "query": "-- reports-database-large-objects\nSELECT \n        SCHEMA_NAME,\n        relname,\n        table_size\n      FROM\n        (SELECT \n          pg_catalog.pg_namespace.nspname AS SCHEMA_NAME,\n          relname,\n          pg_total_relation_size(pg_catalog.pg_class.oid) AS table_size\n        FROM pg_catalog.pg_class\n        JOIN pg_catalog.pg_namespace ON relnamespace = pg_catalog.pg_namespace.oid\n        ) t\n      WHERE SCHEMA_NAME NOT LIKE $1\n      ORDER BY table_size DESC\n      LIMIT $2",
    "calls": 1,
    "total_time": 85.960608,
    "min_time": 85.960608,
    "max_time": 85.960608,
    "mean_time": 85.960608,
    "avg_rows": 5
  },
  {
    "rolname": "postgres",
    "query": "WITH rawindex AS (\r\n    SELECT\r\n        indrelid, \r\n        indexrelid,\r\n        indisunique,\r\n        indisprimary,\r\n        unnest(indkey) AS indkeyid,\r\n        generate_subscripts(indkey, $2) AS indkeyidx,\r\n        unnest(indclass) AS indclass,\r\n        unnest(indoption) AS indoption\r\n    FROM pg_index -- https://www.postgresql.org/docs/current/catalog-pg-index.html\r\n    WHERE\r\n        indpred IS NULL -- filter out partial indexes\r\n        AND NOT indisexclusion -- filter out exclusion constraints\r\n)\r\nSELECT\r\n    schemainfo.nspname AS namespace,\r\n    indexinfo.relname AS index_name,\r\n    tableinfo.relname AS table_name,\r\n    columninfo.attname AS column_name,\r\n    rawindex.indisunique AS is_unique,\r\n    rawindex.indisprimary AS is_primary_key,\r\n    rawindex.indkeyidx AS column_index,\r\n    opclass.opcname AS opclass,\r\n    opclass.opcdefault AS opcdefault,\r\n    indexaccess.amname AS index_algo,\r\n    CASE rawindex.indoption & $3\r\n        WHEN $4 THEN $5\r\n        ELSE $6 END\r\n        AS column_order,\r\n    CASE rawindex.indoption & $7\r\n        WHEN $8 THEN $9\r\n        ELSE $10 END\r\n        AS nulls_first,\r\n    pc.condeferrable AS condeferrable,\r\n    pc.condeferred AS condeferred\r\nFROM\r\n    rawindex\r\n    INNER JOIN pg_class AS tableinfo ON tableinfo.oid = rawindex.indrelid\r\n    INNER JOIN pg_class AS indexinfo ON indexinfo.oid = rawindex.indexrelid\r\n    INNER JOIN pg_namespace AS schemainfo ON schemainfo.oid = tableinfo.relnamespace\r\n    LEFT JOIN pg_attribute AS columninfo\r\n        ON columninfo.attrelid = tableinfo.oid AND columninfo.attnum = rawindex.indkeyid\r\n    INNER JOIN pg_am AS indexaccess ON indexaccess.oid = indexinfo.relam\r\n    LEFT JOIN pg_opclass AS opclass -- left join because crdb has no opclasses\r\n        ON opclass.oid = rawindex.indclass\r\n    LEFT JOIN pg_constraint pc ON rawindex.indexrelid = pc.conindid AND pc.contype <> $11\r\nWHERE schemainfo.nspname = ANY ( $1 )\r\nORDER BY namespace, table_name, index_name, column_index",
    "calls": 10,
    "total_time": 588.039596,
    "min_time": 0.873411,
    "max_time": 74.828495,
    "mean_time": 58.8039596,
    "avg_rows": 676
  },
  {
    "rolname": "supabase_storage_admin",
    "query": "DO $$\nBEGIN\n    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buckets' AND column_name = 'max_file_size_kb') THEN\n        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'buckets' AND column_name = 'file_size_limit') THEN\n            ALTER TABLE storage.buckets RENAME COLUMN max_file_size_kb TO file_size_limit;\n            ALTER TABLE storage.buckets ALTER COLUMN file_size_limit TYPE bigint;\n        ELSE\n            ALTER TABLE storage.buckets DROP COLUMN max_file_size_kb;\n        END IF;\n    END IF;\nEND$$",
    "calls": 1,
    "total_time": 61.927983,
    "min_time": 61.927983,
    "max_time": 61.927983,
    "mean_time": 61.927983,
    "avg_rows": 0
  },
  {
    "rolname": "postgres",
    "query": "CREATE TABLE \"social_activity_tags\" (\n    \"id\" TEXT NOT NULL,\n    \"activityId\" TEXT NOT NULL,\n    \"taggerId\" TEXT NOT NULL,\n    \"postId\" TEXT,\n    \"commentId\" TEXT,\n    \"context\" TEXT,\n    \"position\" INTEGER,\n    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n\n    CONSTRAINT \"social_activity_tags_pkey\" PRIMARY KEY (\"id\")\n)",
    "calls": 1,
    "total_time": 56.80756,
    "min_time": 56.80756,
    "max_time": 56.80756,
    "mean_time": 56.80756,
    "avg_rows": 0
  },
  {
    "rolname": "supabase_admin",
    "query": "do $$\n    declare\n        tbl record;\n        seq_name text;\n        new_seq_name text;\n        archive_table_name text;\n    begin\n        -- No tables should be owned by the extension.\n        -- We want them to be included in logical backups\n        for tbl in\n            select c.relname as table_name\n            from pg_class c\n              join pg_depend d\n                on c.oid = d.objid\n              join pg_extension e\n                on d.refobjid = e.oid\n            where\n              c.relkind in ('r', 'p', 'u')\n              and e.extname = 'pgmq'\n              and (c.relname like 'q\\_%' or c.relname like 'a\\_%')\n        loop\n          execute format('\n            alter extension pgmq drop table pgmq.\"%s\";',\n            tbl.table_name\n          );\n        end loop;\n    end $$",
    "calls": 32,
    "total_time": 501.433844,
    "min_time": 1.94769,
    "max_time": 54.198942,
    "mean_time": 15.669807625,
    "avg_rows": 0
  },
  {
    "rolname": "postgres",
    "query": "CREATE TABLE \"notifications\" (\n    \"id\" TEXT NOT NULL,\n    \"title\" TEXT NOT NULL,\n    \"content\" TEXT NOT NULL,\n    \"type\" \"NotificationType\" NOT NULL,\n    \"priority\" \"NotificationPriority\" NOT NULL DEFAULT 'MEDIUM',\n    \"status\" TEXT NOT NULL DEFAULT 'UNREAD',\n    \"userId\" TEXT NOT NULL,\n    \"classId\" TEXT,\n    \"metadata\" JSONB,\n    \"actionUrl\" TEXT,\n    \"createdAt\" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,\n    \"updatedAt\" TIMESTAMP(3) NOT NULL,\n\n    CONSTRAINT \"notifications_pkey\" PRIMARY KEY (\"id\")\n)",
    "calls": 1,
    "total_time": 48.42782,
    "min_time": 48.42782,
    "max_time": 48.42782,
    "mean_time": 48.42782,
    "avg_rows": 0
  },
  {
    "rolname": "postgres",
    "query": "select\n    auth.rolname,\n    statements.query,\n    statements.calls,\n    statements.total_exec_time + statements.total_plan_time as total_time,\n    to_char(((statements.total_exec_time + statements.total_plan_time)/sum(statements.total_exec_time + statements.total_plan_time) OVER()) * $1, $2) || $3  AS prop_total_time\n  from pg_stat_statements as statements\n    inner join pg_authid as auth on statements.userid = auth.oid\n  \n  order by total_time desc\n  limit $4\n\n-- source: dashboard\n-- user: fdea4ddf-c839-49e5-8a0a-7e351484490e\n-- date: 2025-07-03T18:04:13.097Z",
    "calls": 11,
    "total_time": 234.421267,
    "min_time": 12.409311,
    "max_time": 45.89261,
    "mean_time": 21.3110242727273,
    "avg_rows": 20
  },
  {
    "rolname": "supabase_admin",
    "query": "SELECT t.oid, t.typname, t.typsend, t.typreceive, t.typoutput, t.typinput,\n       coalesce(d.typelem, t.typelem), coalesce(r.rngsubtype, $1), ARRAY (\n  SELECT a.atttypid\n  FROM pg_attribute AS a\n  WHERE a.attrelid = t.typrelid AND a.attnum > $2 AND NOT a.attisdropped\n  ORDER BY a.attnum\n)\n\nFROM pg_type AS t\nLEFT JOIN pg_type AS d ON t.typbasetype = d.oid\nLEFT JOIN pg_range AS r ON r.rngtypid = t.oid OR r.rngmultitypid = t.oid OR (t.typbasetype <> $3 AND r.rngtypid = t.typbasetype)\nWHERE (t.typrelid = $4)\nAND (t.typelem = $5 OR NOT EXISTS (SELECT $6 FROM pg_catalog.pg_type s WHERE s.typrelid != $7 AND s.oid = t.typelem))",
    "calls": 29,
    "total_time": 419.033253,
    "min_time": 4.715349,
    "max_time": 42.009542,
    "mean_time": 14.4494225172414,
    "avg_rows": 321
  },
  {
    "rolname": "postgres",
    "query": "SELECT\n    tbl.schemaname,\n    tbl.tablename,\n    tbl.quoted_name,\n    tbl.is_table,\n    json_agg(a) as columns\n  FROM\n    (\n      SELECT\n        n.nspname as schemaname,\n        c.relname as tablename,\n        (quote_ident(n.nspname) || $1 || quote_ident(c.relname)) as quoted_name,\n        $2 as is_table\n      FROM\n        pg_catalog.pg_class c\n        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace\n      WHERE\n        c.relkind = $3\n        AND n.nspname not in ($4, $5, $6)\n        AND n.nspname not like $7\n        AND n.nspname not like $8\n        AND has_schema_privilege(n.oid, $9) = $10\n        AND has_table_privilege(quote_ident(n.nspname) || $11 || quote_ident(c.relname), $12) = $13\n      union all\n      SELECT\n        n.nspname as schemaname,\n        c.relname as tablename,\n        (quote_ident(n.nspname) || $14 || quote_ident(c.relname)) as quoted_name,\n        $15 as is_table\n      FROM\n        pg_catalog.pg_class c\n        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace\n      WHERE\n        c.relkind in ($16, $17)\n        AND n.nspname not in ($18, $19, $20)\n        AND n.nspname not like $21\n        AND n.nspname not like $22\n        AND has_schema_privilege(n.oid, $23) = $24\n        AND has_table_privilege(quote_ident(n.nspname) || $25 || quote_ident(c.relname), $26) = $27\n    ) as tbl\n    LEFT JOIN (\n      SELECT\n        attrelid,\n        attname,\n        format_type(atttypid, atttypmod) as data_type,\n        attnum,\n        attisdropped\n      FROM\n        pg_attribute\n    ) as a ON (\n      a.attrelid = tbl.quoted_name::regclass\n      AND a.attnum > $28\n      AND NOT a.attisdropped\n      AND has_column_privilege(tbl.quoted_name, a.attname, $29)\n    )\n  WHERE schemaname = $30\n  GROUP BY schemaname, tablename, quoted_name, is_table",
    "calls": 1,
    "total_time": 41.624048,
    "min_time": 41.624048,
    "max_time": 41.624048,
    "mean_time": 41.624048,
    "avg_rows": 137
  },
  {
    "rolname": "postgres",
    "query": "select\n    auth.rolname,\n    statements.query,\n    statements.calls,\n    -- -- Postgres 13, 14, 15\n    statements.total_exec_time + statements.total_plan_time as total_time,\n    statements.min_exec_time + statements.min_plan_time as min_time,\n    statements.max_exec_time + statements.max_plan_time as max_time,\n    statements.mean_exec_time + statements.mean_plan_time as mean_time,\n    -- -- Postgres <= 12\n    -- total_time,\n    -- min_time,\n    -- max_time,\n    -- mean_time,\n    statements.rows / statements.calls as avg_rows\n  from pg_stat_statements as statements\n    inner join pg_authid as auth on statements.userid = auth.oid\n  \n  order by statements.calls desc\n  limit $1\n\n-- source: dashboard\n-- user: fdea4ddf-c839-49e5-8a0a-7e351484490e\n-- date: 2025-07-03T18:04:13.081Z",
    "calls": 12,
    "total_time": 153.205751,
    "min_time": 8.876882,
    "max_time": 39.521249,
    "mean_time": 12.7671459166667,
    "avg_rows": 20
  },
  {
    "rolname": "pgbouncer",
    "query": "SELECT * FROM pgbouncer.get_auth($1)",
    "calls": 698,
    "total_time": 371.450107,
    "min_time": 0.061746,
    "max_time": 39.41159,
    "mean_time": 0.532163477077364,
    "avg_rows": 1
  },
  {
    "rolname": "postgres",
    "query": "SELECT \"public\".\"assessments\".\"id\", \"public\".\"assessments\".\"createdById\" FROM \"public\".\"assessments\" WHERE \"public\".\"assessments\".\"createdById\" IN ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36) OFFSET $37",
    "calls": 2,
    "total_time": 36.90343,
    "min_time": 0.405535,
    "max_time": 36.497895,
    "mean_time": 18.451715,
    "avg_rows": 432
  }
]

[
  {
    "rolname": "postgres",
    "query": "with tables as (SELECT\n  c.oid :: int8 AS id,\n  nc.nspname AS schema,\n  c.relname AS name,\n  c.relrowsecurity AS rls_enabled,\n  c.relforcerowsecurity AS rls_forced,\n  CASE\n    WHEN c.relreplident = $1 THEN $2\n    WHEN c.relreplident = $3 THEN $4\n    WHEN c.relreplident = $5 THEN $6\n    ELSE $7\n  END AS replica_identity,\n  pg_total_relation_size(format($8, nc.nspname, c.relname)) :: int8 AS bytes,\n  pg_size_pretty(\n    pg_total_relation_size(format($9, nc.nspname, c.relname))\n  ) AS size,\n  pg_stat_get_live_tuples(c.oid) AS live_rows_estimate,\n  pg_stat_get_dead_tuples(c.oid) AS dead_rows_estimate,\n  obj_description(c.oid) AS comment,\n  coalesce(pk.primary_keys, $10) as primary_keys,\n  coalesce(\n    jsonb_agg(relationships) filter (where relationships is not null),\n    $11\n  ) as relationships\nFROM\n  pg_namespace nc\n  JOIN pg_class c ON nc.oid = c.relnamespace\n  left join (\n    select\n      table_id,\n      jsonb_agg(_pk.*) as primary_keys\n    from (\n      select\n        n.nspname as schema,\n        c.relname as table_name,\n        a.attname as name,\n        c.oid :: int8 as table_id\n      from\n        pg_index i,\n        pg_class c,\n        pg_attribute a,\n        pg_namespace n\n      where\n        i.indrelid = c.oid\n        and c.relnamespace = n.oid\n        and a.attrelid = c.oid\n        and a.attnum = any (i.indkey)\n        and i.indisprimary\n    ) as _pk\n    group by table_id\n  ) as pk\n  on pk.table_id = c.oid\n  left join (\n    select\n      c.oid :: int8 as id,\n      c.conname as constraint_name,\n      nsa.nspname as source_schema,\n      csa.relname as source_table_name,\n      sa.attname as source_column_name,\n      nta.nspname as target_table_schema,\n      cta.relname as target_table_name,\n      ta.attname as target_column_name\n    from\n      pg_constraint c\n    join (\n      pg_attribute sa\n      join pg_class csa on sa.attrelid = csa.oid\n      join pg_namespace nsa on csa.relnamespace = nsa.oid\n    ) on sa.attrelid = c.conrelid and sa.attnum = any (c.conkey)\n    join (\n      pg_attribute ta\n      join pg_class cta on ta.attrelid = cta.oid\n      join pg_namespace nta on cta.relnamespace = nta.oid\n    ) on ta.attrelid = c.confrelid and ta.attnum = any (c.confkey)\n    where\n      c.contype = $12\n  ) as relationships\n  on (relationships.source_schema = nc.nspname and relationships.source_table_name = c.relname)\n  or (relationships.target_table_schema = nc.nspname and relationships.target_table_name = c.relname)\nWHERE\n  c.relkind IN ($13, $14)\n  AND NOT pg_is_other_temp_schema(nc.oid)\n  AND (\n    pg_has_role(c.relowner, $15)\n    OR has_table_privilege(\n      c.oid,\n      $16\n    )\n    OR has_any_column_privilege(c.oid, $17)\n  )\ngroup by\n  c.oid,\n  c.relname,\n  c.relrowsecurity,\n  c.relforcerowsecurity,\n  c.relreplident,\n  nc.nspname,\n  pk.primary_keys\n)\n  , columns as (-- Adapted from information_schema.columns\n\nSELECT\n  c.oid :: int8 AS table_id,\n  nc.nspname AS schema,\n  c.relname AS table,\n  (c.oid || $18 || a.attnum) AS id,\n  a.attnum AS ordinal_position,\n  a.attname AS name,\n  CASE\n    WHEN a.atthasdef THEN pg_get_expr(ad.adbin, ad.adrelid)\n    ELSE $19\n  END AS default_value,\n  CASE\n    WHEN t.typtype = $20 THEN CASE\n      WHEN bt.typelem <> $21 :: oid\n      AND bt.typlen = $22 THEN $23\n      WHEN nbt.nspname = $24 THEN format_type(t.typbasetype, $25)\n      ELSE $26\n    END\n    ELSE CASE\n      WHEN t.typelem <> $27 :: oid\n      AND t.typlen = $28 THEN $29\n      WHEN nt.nspname = $30 THEN format_type(a.atttypid, $31)\n      ELSE $32\n    END\n  END AS data_type,\n  COALESCE(bt.typname, t.typname) AS format,\n  a.attidentity IN ($33, $34) AS is_identity,\n  CASE\n    a.attidentity\n    WHEN $35 THEN $36\n    WHEN $37 THEN $38\n    ELSE $39\n  END AS identity_generation,\n  a.attgenerated IN ($40) AS is_generated,\n  NOT (\n    a.attnotnull\n    OR t.typtype = $41 AND t.typnotnull\n  ) AS is_nullable,\n  (\n    c.relkind IN ($42, $43)\n    OR c.relkind IN ($44, $45) AND pg_column_is_updatable(c.oid, a.attnum, $46)\n  ) AS is_updatable,\n  uniques.table_id IS NOT NULL AS is_unique,\n  check_constraints.definition AS \"check\",\n  array_to_json(\n    array(\n      SELECT\n        enumlabel\n      FROM\n        pg_catalog.pg_enum enums\n      WHERE\n        enums.enumtypid = coalesce(bt.oid, t.oid)\n        OR enums.enumtypid = coalesce(bt.typelem, t.typelem)\n      ORDER BY\n        enums.enumsortorder\n    )\n  ) AS enums,\n  col_description(c.oid, a.attnum) AS comment\nFROM\n  pg_attribute a\n  LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid\n  AND a.attnum = ad.adnum\n  JOIN (\n    pg_class c\n    JOIN pg_namespace nc ON c.relnamespace = nc.oid\n  ) ON a.attrelid = c.oid\n  JOIN (\n    pg_type t\n    JOIN pg_namespace nt ON t.typnamespace = nt.oid\n  ) ON a.atttypid = t.oid\n  LEFT JOIN (\n    pg_type bt\n    JOIN pg_namespace nbt ON bt.typnamespace = nbt.oid\n  ) ON t.typtype = $47\n  AND t.typbasetype = bt.oid\n  LEFT JOIN (\n    SELECT DISTINCT ON (table_id, ordinal_position)\n      conrelid AS table_id,\n      conkey[$48] AS ordinal_position\n    FROM pg_catalog.pg_constraint\n    WHERE contype = $49 AND cardinality(conkey) = $50\n  ) AS uniques ON uniques.table_id = c.oid AND uniques.ordinal_position = a.attnum\n  LEFT JOIN (\n    -- We only select the first column check\n    SELECT DISTINCT ON (table_id, ordinal_position)\n      conrelid AS table_id,\n      conkey[$51] AS ordinal_position,\n      substring(\n        pg_get_constraintdef(pg_constraint.oid, $52),\n        $53,\n        length(pg_get_constraintdef(pg_constraint.oid, $54)) - $55\n      ) AS \"definition\"\n    FROM pg_constraint\n    WHERE contype = $56 AND cardinality(conkey) = $57\n    ORDER BY table_id, ordinal_position, oid asc\n  ) AS check_constraints ON check_constraints.table_id = c.oid AND check_constraints.ordinal_position = a.attnum\nWHERE\n  NOT pg_is_other_temp_schema(nc.oid)\n  AND a.attnum > $58\n  AND NOT a.attisdropped\n  AND (c.relkind IN ($59, $60, $61, $62, $63))\n  AND (\n    pg_has_role(c.relowner, $64)\n    OR has_column_privilege(\n      c.oid,\n      a.attnum,\n      $65\n    )\n  )\n)\nselect\n  *\n  , \nCOALESCE(\n  (\n    SELECT\n      array_agg(row_to_json(columns)) FILTER (WHERE columns.table_id = tables.id)\n    FROM\n      columns\n  ),\n  $66\n) AS columns\nfrom tables where schema IN ($67)",
    "calls": 12,
    "total_time": 27479.49591,
    "prop_total_time": "31.4%"
  },
  {
    "rolname": "authenticator",
    "query": "SELECT name FROM pg_timezone_names",
    "calls": 263,
    "total_time": 19863.790643,
    "prop_total_time": "22.7%"
  },
  {
    "rolname": "authenticator",
    "query": "WITH\n  columns AS (\n      SELECT\n          nc.nspname::name AS table_schema,\n          c.relname::name AS table_name,\n          a.attname::name AS column_name,\n          d.description AS description,\n  \n          CASE\n            WHEN t.typbasetype  != $2  THEN pg_get_expr(t.typdefaultbin, $3)\n            WHEN a.attidentity  = $4 THEN format($5, quote_literal(seqsch.nspname || $6 || seqclass.relname))\n            WHEN a.attgenerated = $7 THEN $8\n            ELSE pg_get_expr(ad.adbin, ad.adrelid)::text\n          END AS column_default,\n          not (a.attnotnull OR t.typtype = $9 AND t.typnotnull) AS is_nullable,\n          CASE\n              WHEN t.typtype = $10 THEN\n              CASE\n                  WHEN nbt.nspname = $11::name THEN format_type(t.typbasetype, $12::integer)\n                  ELSE format_type(a.atttypid, a.atttypmod)\n              END\n              ELSE\n              CASE\n                  WHEN nt.nspname = $13::name THEN format_type(a.atttypid, $14::integer)\n                  ELSE format_type(a.atttypid, a.atttypmod)\n              END\n          END::text AS data_type,\n          format_type(a.atttypid, a.atttypmod)::text AS nominal_data_type,\n          information_schema._pg_char_max_length(\n              information_schema._pg_truetypid(a.*, t.*),\n              information_schema._pg_truetypmod(a.*, t.*)\n          )::integer AS character_maximum_length,\n          COALESCE(bt.oid, t.oid) AS base_type,\n          a.attnum::integer AS position\n      FROM pg_attribute a\n          LEFT JOIN pg_description AS d\n              ON d.objoid = a.attrelid and d.objsubid = a.attnum\n          LEFT JOIN pg_attrdef ad\n              ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum\n          JOIN (pg_class c JOIN pg_namespace nc ON c.relnamespace = nc.oid)\n              ON a.attrelid = c.oid\n          JOIN (pg_type t JOIN pg_namespace nt ON t.typnamespace = nt.oid)\n              ON a.atttypid = t.oid\n          LEFT JOIN (pg_type bt JOIN pg_namespace nbt ON bt.typnamespace = nbt.oid)\n              ON t.typtype = $15 AND t.typbasetype = bt.oid\n          LEFT JOIN (pg_collation co JOIN pg_namespace nco ON co.collnamespace = nco.oid)\n              ON a.attcollation = co.oid AND (nco.nspname <> $16::name OR co.collname <> $17::name)\n          LEFT JOIN pg_depend dep\n              ON dep.refobjid = a.attrelid and dep.refobjsubid = a.attnum and dep.deptype = $18\n          LEFT JOIN pg_class seqclass\n              ON seqclass.oid = dep.objid\n          LEFT JOIN pg_namespace seqsch\n              ON seqsch.oid = seqclass.relnamespace\n      WHERE\n          NOT pg_is_other_temp_schema(nc.oid)\n          AND a.attnum > $19\n          AND NOT a.attisdropped\n          AND c.relkind in ($20, $21, $22, $23, $24)\n          AND nc.nspname = ANY($1)\n  ),\n  columns_agg AS (\n    SELECT DISTINCT\n        info.table_schema AS table_schema,\n        info.table_name AS table_name,\n        array_agg(row(\n          info.column_name,\n          info.description,\n          info.is_nullable::boolean,\n          info.data_type,\n          info.nominal_data_type,\n          info.character_maximum_length,\n          info.column_default,\n          coalesce(enum_info.vals, $25)) order by info.position) as columns\n    FROM columns info\n    LEFT OUTER JOIN (\n        SELECT\n            e.enumtypid,\n            array_agg(e.enumlabel ORDER BY e.enumsortorder) AS vals\n        FROM pg_type t\n        JOIN pg_enum e ON t.oid = e.enumtypid\n        JOIN pg_namespace n ON n.oid = t.typnamespace\n        GROUP BY enumtypid\n    ) AS enum_info ON info.base_type = enum_info.enumtypid\n    WHERE info.table_schema NOT IN ($26, $27)\n    GROUP BY info.table_schema, info.table_name\n  ),\n  tbl_constraints AS (\n      SELECT\n          c.conname::name AS constraint_name,\n          nr.nspname::name AS table_schema,\n          r.relname::name AS table_name\n      FROM pg_namespace nc\n      JOIN pg_constraint c ON nc.oid = c.connamespace\n      JOIN pg_class r ON c.conrelid = r.oid\n      JOIN pg_namespace nr ON nr.oid = r.relnamespace\n      WHERE\n        r.relkind IN ($28, $29)\n        AND NOT pg_is_other_temp_schema(nr.oid)\n        AND c.contype = $30\n  ),\n  key_col_usage AS (\n      SELECT\n          ss.conname::name AS constraint_name,\n          ss.nr_nspname::name AS table_schema,\n          ss.relname::name AS table_name,\n          a.attname::name AS column_name,\n          (ss.x).n::integer AS ordinal_position,\n          CASE\n              WHEN ss.contype = $31 THEN information_schema._pg_index_position(ss.conindid, ss.confkey[(ss.x).n])\n              ELSE $32::integer\n          END::integer AS position_in_unique_constraint\n      FROM pg_attribute a\n      JOIN (\n        SELECT r.oid AS roid,\n          r.relname,\n          r.relowner,\n          nc.nspname AS nc_nspname,\n          nr.nspname AS nr_nspname,\n          c.oid AS coid,\n          c.conname,\n          c.contype,\n          c.conindid,\n          c.confkey,\n          information_schema._pg_expandarray(c.conkey) AS x\n        FROM pg_namespace nr\n        JOIN pg_class r\n          ON nr.oid = r.relnamespace\n        JOIN pg_constraint c\n          ON r.oid = c.conrelid\n        JOIN pg_namespace nc\n          ON c.connamespace = nc.oid\n        WHERE\n          c.contype in ($33, $34)\n          AND r.relkind IN ($35, $36)\n          AND NOT pg_is_other_temp_schema(nr.oid)\n      ) ss ON a.attrelid = ss.roid AND a.attnum = (ss.x).x\n      WHERE\n        NOT a.attisdropped\n  ),\n  tbl_pk_cols AS (\n    SELECT\n        key_col_usage.table_schema,\n        key_col_usage.table_name,\n        array_agg(key_col_usage.column_name) as pk_cols\n    FROM\n        tbl_constraints\n    JOIN\n        key_col_usage\n    ON\n        key_col_usage.table_name = tbl_constraints.table_name AND\n        key_col_usage.table_schema = tbl_constraints.table_schema AND\n        key_col_usage.constraint_name = tbl_constraints.constraint_name\n    WHERE\n        key_col_usage.table_schema NOT IN ($37, $38)\n    GROUP BY key_col_usage.table_schema, key_col_usage.table_name\n  )\n  SELECT\n    n.nspname AS table_schema,\n    c.relname AS table_name,\n    d.description AS table_description,\n    c.relkind IN ($39,$40) as is_view,\n    (\n      c.relkind IN ($41,$42)\n      OR (\n        c.relkind in ($43,$44)\n        -- The function `pg_relation_is_updateable` returns a bitmask where 8\n        -- corresponds to `1 << CMD_INSERT` in the PostgreSQL source code, i.e.\n        -- it's possible to insert into the relation.\n        AND (pg_relation_is_updatable(c.oid::regclass, $45) & $46) = $47\n      )\n    ) AS insertable,\n    (\n      c.relkind IN ($48,$49)\n      OR (\n        c.relkind in ($50,$51)\n        -- CMD_UPDATE\n        AND (pg_relation_is_updatable(c.oid::regclass, $52) & $53) = $54\n      )\n    ) AS updatable,\n    (\n      c.relkind IN ($55,$56)\n      OR (\n        c.relkind in ($57,$58)\n        -- CMD_DELETE\n        AND (pg_relation_is_updatable(c.oid::regclass, $59) & $60) = $61\n      )\n    ) AS deletable,\n    coalesce(tpks.pk_cols, $62) as pk_cols,\n    coalesce(cols_agg.columns, $63) as columns\n  FROM pg_class c\n  JOIN pg_namespace n ON n.oid = c.relnamespace\n  LEFT JOIN pg_description d on d.objoid = c.oid and d.objsubid = $64\n  LEFT JOIN tbl_pk_cols tpks ON n.nspname = tpks.table_schema AND c.relname = tpks.table_name\n  LEFT JOIN columns_agg cols_agg ON n.nspname = cols_agg.table_schema AND c.relname = cols_agg.table_name\n  WHERE c.relkind IN ($65,$66,$67,$68,$69)\n  AND n.nspname NOT IN ($70, $71)  AND not c.relispartition ORDER BY table_schema, table_name",
    "calls": 263,
    "total_time": 11104.912669,
    "prop_total_time": "12.7%"
  },
  {
    "rolname": "authenticator",
    "query": "-- Recursively get the base types of domains\n  WITH\n  base_types AS (\n    WITH RECURSIVE\n    recurse AS (\n      SELECT\n        oid,\n        typbasetype,\n        COALESCE(NULLIF(typbasetype, $3), oid) AS base\n      FROM pg_type\n      UNION\n      SELECT\n        t.oid,\n        b.typbasetype,\n        COALESCE(NULLIF(b.typbasetype, $4), b.oid) AS base\n      FROM recurse t\n      JOIN pg_type b ON t.typbasetype = b.oid\n    )\n    SELECT\n      oid,\n      base\n    FROM recurse\n    WHERE typbasetype = $5\n  ),\n  arguments AS (\n    SELECT\n      oid,\n      array_agg((\n        COALESCE(name, $6), -- name\n        type::regtype::text, -- type\n        CASE type\n          WHEN $7::regtype THEN $8\n          WHEN $9::regtype THEN $10\n          WHEN $11::regtype THEN $12\n          WHEN $13::regtype THEN $14\n          ELSE type::regtype::text\n        END, -- convert types that ignore the lenth and accept any value till maximum size\n        idx <= (pronargs - pronargdefaults), -- is_required\n        COALESCE(mode = $15, $16) -- is_variadic\n      ) ORDER BY idx) AS args,\n      CASE COUNT(*) - COUNT(name) -- number of unnamed arguments\n        WHEN $17 THEN $18\n        WHEN $19 THEN (array_agg(type))[$20] IN ($21::regtype, $22::regtype, $23::regtype, $24::regtype, $25::regtype)\n        ELSE $26\n      END AS callable\n    FROM pg_proc,\n         unnest(proargnames, proargtypes, proargmodes)\n           WITH ORDINALITY AS _ (name, type, mode, idx)\n    WHERE type IS NOT NULL -- only input arguments\n    GROUP BY oid\n  )\n  SELECT\n    pn.nspname AS proc_schema,\n    p.proname AS proc_name,\n    d.description AS proc_description,\n    COALESCE(a.args, $27) AS args,\n    tn.nspname AS schema,\n    COALESCE(comp.relname, t.typname) AS name,\n    p.proretset AS rettype_is_setof,\n    (t.typtype = $28\n     -- if any TABLE, INOUT or OUT arguments present, treat as composite\n     or COALESCE(proargmodes::text[] && $29, $30)\n    ) AS rettype_is_composite,\n    bt.oid <> bt.base as rettype_is_composite_alias,\n    p.provolatile,\n    p.provariadic > $31 as hasvariadic,\n    lower((regexp_split_to_array((regexp_split_to_array(iso_config, $32))[$33], $34))[$35]) AS transaction_isolation_level,\n    coalesce(func_settings.kvs, $36) as kvs\n  FROM pg_proc p\n  LEFT JOIN arguments a ON a.oid = p.oid\n  JOIN pg_namespace pn ON pn.oid = p.pronamespace\n  JOIN base_types bt ON bt.oid = p.prorettype\n  JOIN pg_type t ON t.oid = bt.base\n  JOIN pg_namespace tn ON tn.oid = t.typnamespace\n  LEFT JOIN pg_class comp ON comp.oid = t.typrelid\n  LEFT JOIN pg_description as d ON d.objoid = p.oid\n  LEFT JOIN LATERAL unnest(proconfig) iso_config ON iso_config LIKE $37\n  LEFT JOIN LATERAL (\n    SELECT\n      array_agg(row(\n        substr(setting, $38, strpos(setting, $39) - $40),\n        substr(setting, strpos(setting, $41) + $42)\n      )) as kvs\n    FROM unnest(proconfig) setting\n    WHERE setting ~ ANY($2)\n  ) func_settings ON $43\n  WHERE t.oid <> $44::regtype AND COALESCE(a.callable, $45)\nAND prokind = $46 AND pn.nspname = ANY($1)",
    "calls": 263,
    "total_time": 6226.156307,
    "prop_total_time": "7.1%"
  },
  {
    "rolname": "postgres",
    "query": "with tables as (SELECT\n  c.oid :: int8 AS id,\n  nc.nspname AS schema,\n  c.relname AS name,\n  c.relrowsecurity AS rls_enabled,\n  c.relforcerowsecurity AS rls_forced,\n  CASE\n    WHEN c.relreplident = $1 THEN $2\n    WHEN c.relreplident = $3 THEN $4\n    WHEN c.relreplident = $5 THEN $6\n    ELSE $7\n  END AS replica_identity,\n  pg_total_relation_size(format($8, nc.nspname, c.relname)) :: int8 AS bytes,\n  pg_size_pretty(\n    pg_total_relation_size(format($9, nc.nspname, c.relname))\n  ) AS size,\n  pg_stat_get_live_tuples(c.oid) AS live_rows_estimate,\n  pg_stat_get_dead_tuples(c.oid) AS dead_rows_estimate,\n  obj_description(c.oid) AS comment,\n  coalesce(pk.primary_keys, $10) as primary_keys,\n  coalesce(\n    jsonb_agg(relationships) filter (where relationships is not null),\n    $11\n  ) as relationships\nFROM\n  pg_namespace nc\n  JOIN pg_class c ON nc.oid = c.relnamespace\n  left join (\n    select\n      table_id,\n      jsonb_agg(_pk.*) as primary_keys\n    from (\n      select\n        n.nspname as schema,\n        c.relname as table_name,\n        a.attname as name,\n        c.oid :: int8 as table_id\n      from\n        pg_index i,\n        pg_class c,\n        pg_attribute a,\n        pg_namespace n\n      where\n        i.indrelid = c.oid\n        and c.relnamespace = n.oid\n        and a.attrelid = c.oid\n        and a.attnum = any (i.indkey)\n        and i.indisprimary\n    ) as _pk\n    group by table_id\n  ) as pk\n  on pk.table_id = c.oid\n  left join (\n    select\n      c.oid :: int8 as id,\n      c.conname as constraint_name,\n      nsa.nspname as source_schema,\n      csa.relname as source_table_name,\n      sa.attname as source_column_name,\n      nta.nspname as target_table_schema,\n      cta.relname as target_table_name,\n      ta.attname as target_column_name\n    from\n      pg_constraint c\n    join (\n      pg_attribute sa\n      join pg_class csa on sa.attrelid = csa.oid\n      join pg_namespace nsa on csa.relnamespace = nsa.oid\n    ) on sa.attrelid = c.conrelid and sa.attnum = any (c.conkey)\n    join (\n      pg_attribute ta\n      join pg_class cta on ta.attrelid = cta.oid\n      join pg_namespace nta on cta.relnamespace = nta.oid\n    ) on ta.attrelid = c.confrelid and ta.attnum = any (c.confkey)\n    where\n      c.contype = $12\n  ) as relationships\n  on (relationships.source_schema = nc.nspname and relationships.source_table_name = c.relname)\n  or (relationships.target_table_schema = nc.nspname and relationships.target_table_name = c.relname)\nWHERE\n  c.relkind IN ($13, $14)\n  AND NOT pg_is_other_temp_schema(nc.oid)\n  AND (\n    pg_has_role(c.relowner, $15)\n    OR has_table_privilege(\n      c.oid,\n      $16\n    )\n    OR has_any_column_privilege(c.oid, $17)\n  )\ngroup by\n  c.oid,\n  c.relname,\n  c.relrowsecurity,\n  c.relforcerowsecurity,\n  c.relreplident,\n  nc.nspname,\n  pk.primary_keys\n)\n  \nselect\n  *\n  \nfrom tables where schema IN ($18)",
    "calls": 40,
    "total_time": 4805.832284,
    "prop_total_time": "5.5%"
  },
  {
    "rolname": "postgres",
    "query": "SELECT\n                oid.namespace,\n                info.table_name,\n                info.column_name,\n                format_type(att.atttypid, att.atttypmod) as formatted_type,\n                info.numeric_precision,\n                info.numeric_scale,\n                info.numeric_precision_radix,\n                info.datetime_precision,\n                info.data_type,\n                info.udt_schema as type_schema_name,\n                info.udt_name as full_data_type,\n                pg_get_expr(attdef.adbin, attdef.adrelid) AS column_default,\n                info.is_nullable,\n                info.is_identity,\n                info.character_maximum_length,\n                col_description(att.attrelid, ordinal_position) AS description\n            FROM information_schema.columns info\n            JOIN pg_attribute att ON att.attname = info.column_name\n            JOIN (\n                 SELECT pg_class.oid, relname, pg_namespace.nspname as namespace\n                 FROM pg_class\n                 JOIN pg_namespace on pg_namespace.oid = pg_class.relnamespace\n                 AND pg_namespace.nspname = ANY ( $1 )\n                 WHERE reltype > $2\n                ) as oid on oid.oid = att.attrelid \n                  AND relname = info.table_name\n                  AND namespace = info.table_schema\n            LEFT OUTER JOIN pg_attrdef attdef ON attdef.adrelid = att.attrelid AND attdef.adnum = att.attnum AND table_schema = namespace\n            WHERE table_schema = ANY ( $1 ) \n            ORDER BY namespace, table_name, ordinal_position",
    "calls": 10,
    "total_time": 1675.092051,
    "prop_total_time": "1.9%"
  },
  {
    "rolname": "authenticator",
    "query": "WITH\n    pks_uniques_cols AS (\n      SELECT\n        connamespace,\n        conrelid,\n        jsonb_agg(column_info.cols) as cols\n      FROM pg_constraint\n      JOIN lateral (\n        SELECT array_agg(cols.attname order by cols.attnum) as cols\n        FROM ( select unnest(conkey) as col) _\n        JOIN pg_attribute cols on cols.attrelid = conrelid and cols.attnum = col\n      ) column_info ON $1\n      WHERE\n        contype IN ($2, $3) and\n        connamespace::regnamespace::text <> $4\n      GROUP BY connamespace, conrelid\n    )\n    SELECT\n      ns1.nspname AS table_schema,\n      tab.relname AS table_name,\n      ns2.nspname AS foreign_table_schema,\n      other.relname AS foreign_table_name,\n      (ns1.nspname, tab.relname) = (ns2.nspname, other.relname) AS is_self,\n      traint.conname  AS constraint_name,\n      column_info.cols_and_fcols,\n      (column_info.cols IN (SELECT * FROM jsonb_array_elements(pks_uqs.cols))) AS one_to_one\n    FROM pg_constraint traint\n    JOIN LATERAL (\n      SELECT\n        array_agg(row(cols.attname, refs.attname) order by ord) AS cols_and_fcols,\n        jsonb_agg(cols.attname order by cols.attnum) AS cols\n      FROM unnest(traint.conkey, traint.confkey) WITH ORDINALITY AS _(col, ref, ord)\n      JOIN pg_attribute cols ON cols.attrelid = traint.conrelid AND cols.attnum = col\n      JOIN pg_attribute refs ON refs.attrelid = traint.confrelid AND refs.attnum = ref\n    ) AS column_info ON $5\n    JOIN pg_namespace ns1 ON ns1.oid = traint.connamespace\n    JOIN pg_class tab ON tab.oid = traint.conrelid\n    JOIN pg_class other ON other.oid = traint.confrelid\n    JOIN pg_namespace ns2 ON ns2.oid = other.relnamespace\n    LEFT JOIN pks_uniques_cols pks_uqs ON pks_uqs.connamespace = traint.connamespace AND pks_uqs.conrelid = traint.conrelid\n    WHERE traint.contype = $6\n   and traint.conparentid = $7 ORDER BY traint.conrelid, traint.conname",
    "calls": 263,
    "total_time": 1651.380324,
    "prop_total_time": "1.9%"
  },
  {
    "rolname": "postgres",
    "query": "SELECT\n  e.name,\n  n.nspname AS schema,\n  e.default_version,\n  x.extversion AS installed_version,\n  e.comment\nFROM\n  pg_available_extensions() e(name, default_version, comment)\n  LEFT JOIN pg_extension x ON e.name = x.extname\n  LEFT JOIN pg_namespace n ON x.extnamespace = n.oid",
    "calls": 37,
    "total_time": 971.214836,
    "prop_total_time": "1.1%"
  },
  {
    "rolname": "authenticator",
    "query": "with\n      role_setting as (\n        select r.rolname, unnest(r.rolconfig) as setting\n        from pg_auth_members m\n        join pg_roles r on r.oid = m.roleid\n        where member = current_user::regrole::oid\n      ),\n      kv_settings AS (\n        SELECT\n          rolname,\n          substr(setting, $1, strpos(setting, $2) - $3) as key,\n          lower(substr(setting, strpos(setting, $4) + $5)) as value\n        FROM role_setting\n      ),\n      iso_setting AS (\n        SELECT rolname, value\n        FROM kv_settings\n        WHERE key = $6\n      )\n      select\n        kv.rolname,\n        i.value as iso_lvl,\n        coalesce(array_agg(row(kv.key, kv.value)) filter (where key <> $7), $8) as role_settings\n      from kv_settings kv\n      join pg_settings ps on ps.name = kv.key and (ps.context = $9 or has_parameter_privilege(current_user::regrole::oid, ps.name, $10)) \n      left join iso_setting i on i.rolname = kv.rolname\n      group by kv.rolname, i.value",
    "calls": 263,
    "total_time": 601.275551999999,
    "prop_total_time": "0.7%"
  },
  {
    "rolname": "postgres",
    "query": "WITH rawindex AS (\r\n    SELECT\r\n        indrelid, \r\n        indexrelid,\r\n        indisunique,\r\n        indisprimary,\r\n        unnest(indkey) AS indkeyid,\r\n        generate_subscripts(indkey, $2) AS indkeyidx,\r\n        unnest(indclass) AS indclass,\r\n        unnest(indoption) AS indoption\r\n    FROM pg_index -- https://www.postgresql.org/docs/current/catalog-pg-index.html\r\n    WHERE\r\n        indpred IS NULL -- filter out partial indexes\r\n        AND NOT indisexclusion -- filter out exclusion constraints\r\n)\r\nSELECT\r\n    schemainfo.nspname AS namespace,\r\n    indexinfo.relname AS index_name,\r\n    tableinfo.relname AS table_name,\r\n    columninfo.attname AS column_name,\r\n    rawindex.indisunique AS is_unique,\r\n    rawindex.indisprimary AS is_primary_key,\r\n    rawindex.indkeyidx AS column_index,\r\n    opclass.opcname AS opclass,\r\n    opclass.opcdefault AS opcdefault,\r\n    indexaccess.amname AS index_algo,\r\n    CASE rawindex.indoption & $3\r\n        WHEN $4 THEN $5\r\n        ELSE $6 END\r\n        AS column_order,\r\n    CASE rawindex.indoption & $7\r\n        WHEN $8 THEN $9\r\n        ELSE $10 END\r\n        AS nulls_first,\r\n    pc.condeferrable AS condeferrable,\r\n    pc.condeferred AS condeferred\r\nFROM\r\n    rawindex\r\n    INNER JOIN pg_class AS tableinfo ON tableinfo.oid = rawindex.indrelid\r\n    INNER JOIN pg_class AS indexinfo ON indexinfo.oid = rawindex.indexrelid\r\n    INNER JOIN pg_namespace AS schemainfo ON schemainfo.oid = tableinfo.relnamespace\r\n    LEFT JOIN pg_attribute AS columninfo\r\n        ON columninfo.attrelid = tableinfo.oid AND columninfo.attnum = rawindex.indkeyid\r\n    INNER JOIN pg_am AS indexaccess ON indexaccess.oid = indexinfo.relam\r\n    LEFT JOIN pg_opclass AS opclass -- left join because crdb has no opclasses\r\n        ON opclass.oid = rawindex.indclass\r\n    LEFT JOIN pg_constraint pc ON rawindex.indexrelid = pc.conindid AND pc.contype <> $11\r\nWHERE schemainfo.nspname = ANY ( $1 )\r\nORDER BY namespace, table_name, index_name, column_index",
    "calls": 10,
    "total_time": 588.039596,
    "prop_total_time": "0.7%"
  },
  {
    "rolname": "authenticator",
    "query": "with recursive\n      pks_fks as (\n        -- pk + fk referencing col\n        select\n          contype::text as contype,\n          conname,\n          array_length(conkey, $3) as ncol,\n          conrelid as resorigtbl,\n          col as resorigcol,\n          ord\n        from pg_constraint\n        left join lateral unnest(conkey) with ordinality as _(col, ord) on $4\n        where contype IN ($5, $6)\n        union\n        -- fk referenced col\n        select\n          concat(contype, $7) as contype,\n          conname,\n          array_length(confkey, $8) as ncol,\n          confrelid,\n          col,\n          ord\n        from pg_constraint\n        left join lateral unnest(confkey) with ordinality as _(col, ord) on $9\n        where contype=$10\n      ),\n      views as (\n        select\n          c.oid       as view_id,\n          n.nspname   as view_schema,\n          c.relname   as view_name,\n          r.ev_action as view_definition\n        from pg_class c\n        join pg_namespace n on n.oid = c.relnamespace\n        join pg_rewrite r on r.ev_class = c.oid\n        where c.relkind in ($11, $12) and n.nspname = ANY($1 || $2)\n      ),\n      transform_json as (\n        select\n          view_id, view_schema, view_name,\n          -- the following formatting is without indentation on purpose\n          -- to allow simple diffs, with less whitespace noise\n          replace(\n            replace(\n            replace(\n            replace(\n            replace(\n            replace(\n            replace(\n            regexp_replace(\n            replace(\n            replace(\n            replace(\n            replace(\n            replace(\n            replace(\n            replace(\n            replace(\n            replace(\n            replace(\n            replace(\n              view_definition::text,\n            -- This conversion to json is heavily optimized for performance.\n            -- The general idea is to use as few regexp_replace() calls as possible.\n            -- Simple replace() is a lot faster, so we jump through some hoops\n            -- to be able to use regexp_replace() only once.\n            -- This has been tested against a huge schema with 250+ different views.\n            -- The unit tests do NOT reflect all possible inputs. Be careful when changing this!\n            -- -----------------------------------------------\n            -- pattern           | replacement         | flags\n            -- -----------------------------------------------\n            -- `<>` in pg_node_tree is the same as `null` in JSON, but due to very poor performance of json_typeof\n            -- we need to make this an empty array here to prevent json_array_elements from throwing an error\n            -- when the targetList is null.\n            -- We'll need to put it first, to make the node protection below work for node lists that start with\n            -- null: `(<> ...`, too. This is the case for coldefexprs, when the first column does not have a default value.\n               $13              , $14\n            -- `,` is not part of the pg_node_tree format, but used in the regex.\n            -- This removes all `,` that might be part of column names.\n            ), $15               , $16\n            -- The same applies for `{` and `}`, although those are used a lot in pg_node_tree.\n            -- We remove the escaped ones, which might be part of column names again.\n            ), $17            , $18\n            ), $19            , $20\n            -- The fields we need are formatted as json manually to protect them from the regex.\n            ), $21   , $22\n            ), $23        , $24\n            ), $25   , $26\n            ), $27   , $28\n            -- Make the regex also match the node type, e.g. `{QUERY ...`, to remove it in one pass.\n            ), $29               , $30\n            -- Protect node lists, which start with `({` or `((` from the greedy regex.\n            -- The extra `{` is removed again later.\n            ), $31              , $32\n            ), $33              , $34\n            -- This regex removes all unused fields to avoid the need to format all of them correctly.\n            -- This leads to a smaller json result as well.\n            -- Removal stops at `,` for used fields (see above) and `}` for the end of the current node.\n            -- Nesting can't be parsed correctly with a regex, so we stop at `{` as well and\n            -- add an empty key for the followig node.\n            ), $35       , $36              , $37\n            -- For performance, the regex also added those empty keys when hitting a `,` or `}`.\n            -- Those are removed next.\n            ), $38           , $39\n            ), $40           , $41\n            -- This reverses the \"node list protection\" from above.\n            ), $42              , $43\n            -- Every key above has been added with a `,` so far. The first key in an object doesn't need it.\n            ), $44              , $45\n            -- pg_node_tree has `()` around lists, but JSON uses `[]`\n            ), $46               , $47\n            ), $48               , $49\n            -- pg_node_tree has ` ` between list items, but JSON uses `,`\n            ), $50             , $51\n          )::json as view_definition\n        from views\n      ),\n      target_entries as(\n        select\n          view_id, view_schema, view_name,\n          json_array_elements(view_definition->$52->$53) as entry\n        from transform_json\n      ),\n      results as(\n        select\n          view_id, view_schema, view_name,\n          (entry->>$54)::int as view_column,\n          (entry->>$55)::oid as resorigtbl,\n          (entry->>$56)::int as resorigcol\n        from target_entries\n      ),\n      -- CYCLE detection according to PG docs: https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-CYCLE\n      -- Can be replaced with CYCLE clause once PG v13 is EOL.\n      recursion(view_id, view_schema, view_name, view_column, resorigtbl, resorigcol, is_cycle, path) as(\n        select\n          r.*,\n          $57,\n          ARRAY[resorigtbl]\n        from results r\n        where view_schema = ANY ($1)\n        union all\n        select\n          view.view_id,\n          view.view_schema,\n          view.view_name,\n          view.view_column,\n          tab.resorigtbl,\n          tab.resorigcol,\n          tab.resorigtbl = ANY(path),\n          path || tab.resorigtbl\n        from recursion view\n        join results tab on view.resorigtbl=tab.view_id and view.resorigcol=tab.view_column\n        where not is_cycle\n      ),\n      repeated_references as(\n        select\n          view_id,\n          view_schema,\n          view_name,\n          resorigtbl,\n          resorigcol,\n          array_agg(attname) as view_columns\n        from recursion\n        join pg_attribute vcol on vcol.attrelid = view_id and vcol.attnum = view_column\n        group by\n          view_id,\n          view_schema,\n          view_name,\n          resorigtbl,\n          resorigcol\n      )\n      select\n        sch.nspname as table_schema,\n        tbl.relname as table_name,\n        rep.view_schema,\n        rep.view_name,\n        pks_fks.conname as constraint_name,\n        pks_fks.contype as constraint_type,\n        array_agg(row(col.attname, view_columns) order by pks_fks.ord) as column_dependencies\n      from repeated_references rep\n      join pks_fks using (resorigtbl, resorigcol)\n      join pg_class tbl on tbl.oid = rep.resorigtbl\n      join pg_attribute col on col.attrelid = tbl.oid and col.attnum = rep.resorigcol\n      join pg_namespace sch on sch.oid = tbl.relnamespace\n      group by sch.nspname, tbl.relname,  rep.view_schema, rep.view_name, pks_fks.conname, pks_fks.contype, pks_fks.ncol\n      -- make sure we only return key for which all columns are referenced in the view - no partial PKs or FKs\n      having ncol = array_length(array_agg(row(col.attname, view_columns) order by pks_fks.ord), $58)",
    "calls": 263,
    "total_time": 511.724467,
    "prop_total_time": "0.6%"
  },
  {
    "rolname": "supabase_admin",
    "query": "do $$\n    declare\n        tbl record;\n        seq_name text;\n        new_seq_name text;\n        archive_table_name text;\n    begin\n        -- No tables should be owned by the extension.\n        -- We want them to be included in logical backups\n        for tbl in\n            select c.relname as table_name\n            from pg_class c\n              join pg_depend d\n                on c.oid = d.objid\n              join pg_extension e\n                on d.refobjid = e.oid\n            where\n              c.relkind in ('r', 'p', 'u')\n              and e.extname = 'pgmq'\n              and (c.relname like 'q\\_%' or c.relname like 'a\\_%')\n        loop\n          execute format('\n            alter extension pgmq drop table pgmq.\"%s\";',\n            tbl.table_name\n          );\n        end loop;\n    end $$",
    "calls": 32,
    "total_time": 501.433844,
    "prop_total_time": "0.6%"
  },
  {
    "rolname": "authenticator",
    "query": "with\n    all_relations as (\n      select reltype\n      from pg_class\n      where relkind in ($1,$2,$3,$4,$5)\n    ),\n    computed_rels as (\n      select\n        (parse_ident(p.pronamespace::regnamespace::text))[$6] as schema,\n        p.proname::text                  as name,\n        arg_schema.nspname::text         as rel_table_schema,\n        arg_name.typname::text           as rel_table_name,\n        ret_schema.nspname::text         as rel_ftable_schema,\n        ret_name.typname::text           as rel_ftable_name,\n        not p.proretset or p.prorows = $7 as single_row\n      from pg_proc p\n        join pg_type      arg_name   on arg_name.oid = p.proargtypes[$8]\n        join pg_namespace arg_schema on arg_schema.oid = arg_name.typnamespace\n        join pg_type      ret_name   on ret_name.oid = p.prorettype\n        join pg_namespace ret_schema on ret_schema.oid = ret_name.typnamespace\n      where\n        p.pronargs = $9\n        and p.proargtypes[$10] in (select reltype from all_relations)\n        and p.prorettype in (select reltype from all_relations)\n    )\n    select\n      *,\n      row(rel_table_schema, rel_table_name) = row(rel_ftable_schema, rel_ftable_name) as is_self\n    from computed_rels",
    "calls": 263,
    "total_time": 464.296653,
    "prop_total_time": "0.5%"
  },
  {
    "rolname": "supabase_admin",
    "query": "SELECT t.oid, t.typname, t.typsend, t.typreceive, t.typoutput, t.typinput,\n       coalesce(d.typelem, t.typelem), coalesce(r.rngsubtype, $1), ARRAY (\n  SELECT a.atttypid\n  FROM pg_attribute AS a\n  WHERE a.attrelid = t.typrelid AND a.attnum > $2 AND NOT a.attisdropped\n  ORDER BY a.attnum\n)\n\nFROM pg_type AS t\nLEFT JOIN pg_type AS d ON t.typbasetype = d.oid\nLEFT JOIN pg_range AS r ON r.rngtypid = t.oid OR r.rngmultitypid = t.oid OR (t.typbasetype <> $3 AND r.rngtypid = t.typbasetype)\nWHERE (t.typrelid = $4)\nAND (t.typelem = $5 OR NOT EXISTS (SELECT $6 FROM pg_catalog.pg_type s WHERE s.typrelid != $7 AND s.oid = t.typelem))",
    "calls": 29,
    "total_time": 419.033253,
    "prop_total_time": "0.5%"
  },
  {
    "rolname": "pgbouncer",
    "query": "SELECT t.oid, t.typname, t.typsend, t.typreceive, t.typoutput, t.typinput,\n       coalesce(d.typelem, t.typelem), coalesce(r.rngsubtype, $1), ARRAY (\n  SELECT a.atttypid\n  FROM pg_attribute AS a\n  WHERE a.attrelid = t.typrelid AND a.attnum > $2 AND NOT a.attisdropped\n  ORDER BY a.attnum\n)\nFROM pg_type AS t\nLEFT JOIN pg_type AS d ON t.typbasetype = d.oid\nLEFT JOIN pg_range AS r ON r.rngtypid = t.oid OR r.rngmultitypid = t.oid OR (t.typbasetype <> $3 AND r.rngtypid = t.typbasetype)\nWHERE (t.typrelid = $4)\nAND (t.typelem = $5 OR NOT EXISTS (SELECT $6 FROM pg_catalog.pg_type s WHERE s.typrelid != $7 AND s.oid = t.typelem))",
    "calls": 31,
    "total_time": 408.094947,
    "prop_total_time": "0.5%"
  },
  {
    "rolname": "pgbouncer",
    "query": "SELECT * FROM pgbouncer.get_auth($1)",
    "calls": 698,
    "total_time": 371.450107,
    "prop_total_time": "0.4%"
  },
  {
    "rolname": "postgres",
    "query": "select\n    auth.rolname,\n    statements.query,\n    statements.calls,\n    -- -- Postgres 13, 14, 15\n    statements.total_exec_time + statements.total_plan_time as total_time,\n    statements.min_exec_time + statements.min_plan_time as min_time,\n    statements.max_exec_time + statements.max_plan_time as max_time,\n    statements.mean_exec_time + statements.mean_plan_time as mean_time,\n    -- -- Postgres <= 12\n    -- total_time,\n    -- min_time,\n    -- max_time,\n    -- mean_time,\n    statements.rows / statements.calls as avg_rows\n  from pg_stat_statements as statements\n    inner join pg_authid as auth on statements.userid = auth.oid\n  \n  order by max_time desc\n  limit $1\n\n-- source: dashboard\n-- user: fdea4ddf-c839-49e5-8a0a-7e351484490e\n-- date: 2025-07-01T04:11:06.911Z",
    "calls": 26,
    "total_time": 332.662323,
    "prop_total_time": "0.4%"
  },
  {
    "rolname": "supabase_admin",
    "query": "SELECT concat(conrelid::regclass, $1, conname) as fk\n    FROM   pg_constraint \n    WHERE  contype = $2 \n    ORDER  BY 1 desc",
    "calls": 32,
    "total_time": 294.970723,
    "prop_total_time": "0.3%"
  },
  {
    "rolname": "postgres",
    "query": "SELECT \"public\".\"users\".\"id\", \"public\".\"users\".\"primaryCampusId\", \"public\".\"users\".\"status\"::text FROM \"public\".\"users\" WHERE (\"public\".\"users\".\"id\" = $1 AND $4=$5) LIMIT $2 OFFSET $3",
    "calls": 6615,
    "total_time": 285.424683,
    "prop_total_time": "0.3%"
  },
  {
    "rolname": "postgres",
    "query": "select\n    auth.rolname,\n    statements.query,\n    statements.calls,\n    statements.total_exec_time + statements.total_plan_time as total_time,\n    to_char(((statements.total_exec_time + statements.total_plan_time)/sum(statements.total_exec_time + statements.total_plan_time) OVER()) * $1, $2) || $3  AS prop_total_time\n  from pg_stat_statements as statements\n    inner join pg_authid as auth on statements.userid = auth.oid\n  \n  order by total_time desc\n  limit $4\n\n-- source: dashboard\n-- user: fdea4ddf-c839-49e5-8a0a-7e351484490e\n-- date: 2025-07-03T18:04:13.097Z",
    "calls": 12,
    "total_time": 251.815908,
    "prop_total_time": "0.3%"
  }
]

errors

[
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.user_permissions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "user_permissions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_user_permissions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.permissions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "permissions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_permissions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.users\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "users",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_users"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.campuses\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "campuses",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_campuses"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.user_campus_access\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "user_campus_access",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_user_campus_access"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.courses\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "courses",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_courses"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.terms\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "terms",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_terms"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.subjects\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "subjects",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_subjects"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_subject_qualifications\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_subject_qualifications",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_subject_qualifications"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.programs\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "programs",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_programs"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.program_campuses\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "program_campuses",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_program_campuses"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.timetables\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "timetables",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_timetables"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.timetable_periods\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "timetable_periods",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_timetable_periods"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_subject_assignments\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_subject_assignments",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_subject_assignments"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.student_profiles\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "student_profiles",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_student_profiles"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.student_enrollments\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "student_enrollments",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_student_enrollments"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_assignments\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_assignments",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_assignments"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_profiles\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_profiles",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_profiles"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.coordinator_profiles\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "coordinator_profiles",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_coordinator_profiles"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.assessment_results\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "assessment_results",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_assessment_results"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.assessment_submissions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "assessment_submissions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_assessment_submissions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.assessment_criteria\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "assessment_criteria",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_assessment_criteria"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.attendance\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "attendance",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_attendance"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_attendance\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_attendance",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_attendance"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.assessments\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "assessments",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_assessments"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.activities\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "activities",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_activities"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_assistant_interactions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_assistant_interactions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_assistant_interactions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_assistant_searches\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_assistant_searches",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_assistant_searches"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.campus_features\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "campus_features",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_campus_features"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_preferences\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_preferences",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_preferences"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.audit_logs\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "audit_logs",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_audit_logs"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.facilities\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "facilities",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_facilities"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.grade_books\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "grade_books",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_grade_books"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.student_grades\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "student_grades",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_student_grades"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.academic_cycles\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "academic_cycles",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_academic_cycles"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.institutions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "institutions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_institutions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.assessment_templates\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "assessment_templates",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_assessment_templates"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_feedback\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_feedback",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_feedback"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.feedback_responses\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "feedback_responses",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_feedback_responses"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.analytics_events\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "analytics_events",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_analytics_events"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.analytics_metrics\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "analytics_metrics",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_analytics_metrics"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.feedback_base\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "feedback_base",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_feedback_base"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.student_feedback\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "student_feedback",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_student_feedback"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.ProfessionalDevelopment\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "ProfessionalDevelopment",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_ProfessionalDevelopment"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.student_course_completions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "student_course_completions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_student_course_completions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_schedules\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_schedules",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_schedules"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_schedule_periods\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_schedule_periods",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_schedule_periods"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.facility_schedules\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "facility_schedules",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_facility_schedules"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.facility_schedule_periods\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "facility_schedule_periods",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_facility_schedule_periods"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.resources\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "resources",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_resources"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.course_campus\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "course_campus",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_course_campus"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.course_prerequisites\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "course_prerequisites",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_course_prerequisites"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.conversations\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "conversations",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_conversations"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.messages\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "messages",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_messages"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.fee_structures\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "fee_structures",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_fee_structures"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.discount_types\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "discount_types",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_discount_types"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.enrollment_fees\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "enrollment_fees",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_enrollment_fees"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.resource_permissions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "resource_permissions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_resource_permissions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.files\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "files",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_files"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.fee_arrears\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "fee_arrears",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_fee_arrears"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.fee_challans\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "fee_challans",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_fee_challans"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.challan_templates\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "challan_templates",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_challan_templates"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.fee_transactions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "fee_transactions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_fee_transactions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.enrollment_history\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "enrollment_history",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_enrollment_history"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.worksheets\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "worksheets",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_worksheets"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_points\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_points",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_points"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.fee_discounts\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "fee_discounts",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_fee_discounts"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.additional_charges\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "additional_charges",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_additional_charges"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_performance_metrics\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_performance_metrics",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_performance_metrics"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.holidays\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "holidays",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_holidays"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_points_aggregate\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_points_aggregate",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_points_aggregate"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.academic_calendar_events\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "academic_calendar_events",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_academic_calendar_events"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.schedule_exceptions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "schedule_exceptions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_schedule_exceptions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.grading_scales\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "grading_scales",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_grading_scales"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.academic_cycle_templates\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "academic_cycle_templates",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_academic_cycle_templates"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.schedule_patterns\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "schedule_patterns",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_schedule_patterns"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.teacher_achievements\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "teacher_achievements",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_teacher_achievements"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.holiday_templates\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "holiday_templates",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_holiday_templates"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.assessment_policies\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "assessment_policies",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_assessment_policies"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.archived_activity_grades\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "archived_activity_grades",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_archived_activity_grades"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.student_topic_grades\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "student_topic_grades",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_student_topic_grades"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.question_banks\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "question_banks",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_question_banks"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.subject_topics\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "subject_topics",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_subject_topics"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.question_categories\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "question_categories",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_question_categories"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.lesson_plans\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "lesson_plans",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_lesson_plans"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.activity_grades\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "activity_grades",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_activity_grades"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.questions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "questions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_questions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.h5p_content_completions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "h5p_content_completions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_h5p_content_completions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.canvases\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "canvases",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_canvases"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.student_achievements\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "student_achievements",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_student_achievements"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.student_points\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "student_points",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_student_points"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.student_levels\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "student_levels",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_student_levels"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.leaderboard_snapshots\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "leaderboard_snapshots",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_leaderboard_snapshots"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.student_points_aggregates\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "student_points_aggregates",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_student_points_aggregates"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.question_versions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "question_versions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_question_versions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.question_category_mappings\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "question_category_mappings",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_question_category_mappings"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.learning_goals\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "learning_goals",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_learning_goals"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.journey_events\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "journey_events",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_journey_events"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.personal_bests\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "personal_bests",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_personal_bests"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.class_performance\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "class_performance",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_class_performance"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.question_sources\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "question_sources",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_question_sources"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.learning_time_records\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "learning_time_records",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_learning_time_records"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.CommitmentContract\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "CommitmentContract",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_CommitmentContract"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.question_usage_stats\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "question_usage_stats",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_question_usage_stats"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.LearningOutcome\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "LearningOutcome",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_LearningOutcome"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.PerformanceLevel\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "PerformanceLevel",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_PerformanceLevel"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.ActivityTemplate\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "ActivityTemplate",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_ActivityTemplate"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.reward_points_config\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "reward_points_config",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_reward_points_config"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.CriteriaLevel\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "CriteriaLevel",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_CriteriaLevel"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.RubricOutcome\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "RubricOutcome",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_RubricOutcome"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.RubricCriteria\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "RubricCriteria",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_RubricCriteria"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.topic_masteries\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "topic_masteries",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_topic_masteries"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.Rubric\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "Rubric",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_Rubric"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.system_config\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "system_config",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_system_config"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.ActivityOutcome\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "ActivityOutcome",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_ActivityOutcome"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public._CampusToHoliday\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "_CampusToHoliday",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public__CampusToHoliday"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public._ClassToHoliday\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "_ClassToHoliday",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public__ClassToHoliday"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public._HolidayUsers\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "_HolidayUsers",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public__HolidayUsers"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public._AcademicCalendarEventToCampus\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "_AcademicCalendarEventToCampus",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public__AcademicCalendarEventToCampus"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public._AcademicCalendarEventToClass\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "_AcademicCalendarEventToClass",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public__AcademicCalendarEventToClass"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public._EventUsers\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "_EventUsers",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public__EventUsers"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public._LearningOutcomeToQuestion\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "_LearningOutcomeToQuestion",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public__LearningOutcomeToQuestion"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.AssessmentOutcome\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "AssessmentOutcome",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_AssessmentOutcome"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.Session\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "Session",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_Session"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.classes\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "classes",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_classes"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.h5p_content\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "h5p_content",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_h5p_content"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.conversation_participants\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "conversation_participants",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_conversation_participants"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.LessonPlanOutcome\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "LessonPlanOutcome",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_LessonPlanOutcome"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.social_comments\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "social_comments",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_social_comments"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.social_reactions\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "social_reactions",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_social_reactions"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.social_user_tags\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "social_user_tags",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_social_user_tags"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.social_moderation_logs\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "social_moderation_logs",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_social_moderation_logs"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.social_archives\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "social_archives",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_social_archives"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.social_posts\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "social_posts",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_social_posts"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.social_reports\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "social_reports",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_social_reports"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.social_activity_tags\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "social_activity_tags",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_social_activity_tags"
  },
  {
    "name": "rls_disabled_in_public",
    "title": "RLS Disabled in Public",
    "level": "ERROR",
    "facing": "EXTERNAL",
    "categories": [
      "SECURITY"
    ],
    "description": "Detects cases where row level security (RLS) has not been enabled on tables in schemas exposed to PostgREST",
    "detail": "Table \\`public.notifications\\` is public, but RLS has not been enabled.",
    "remediation": "https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public",
    "metadata": {
      "name": "notifications",
      "type": "table",
      "schema": "public"
    },
    "cache_key": "rls_disabled_in_public_public_notifications"
  }
]