/*
Purpose: 

Variables Summary:
*/


export interface UserCourse{
  id: number;
  name: string;
  course_code: string;
  account_id: number;
  created_at: string; // ISO 8601 date string
  start_at: string | null;
  default_view: "wiki" | string;
  enrollment_term_id: number;
  is_public: boolean;
  grading_standard_id: number | null;
  root_account_id: number;
  uuid: string;
  license: string;
  grade_passback_setting: string | null;
  end_at: string | null;
  public_syllabus: boolean;
  public_syllabus_to_auth: boolean;
  storage_quota_mb: number;
  is_public_to_auth_users: boolean;
  homeroom_course: boolean;
  course_color: string | null;
  friendly_name: string | null;
  apply_assignment_group_weights: boolean;
  calendar: {
    ics: string;
  };
  time_zone: string;
  blueprint: boolean;
  template: boolean;
  enrollments: Enrollment[];
  hide_final_grades: boolean;
  workflow_state: "available" | string;
  restrict_enrollments_to_course_dates: boolean;
}

type Enrollment = {
  type: "student" | string;
  role: string;
  role_id: number;
  user_id: number;
  enrollment_state: "active" | string;
  limit_privileges_to_course_section: boolean;
};

export interface CourseModule {
  id: number;
  position: number;
  name: string;
  unlock_at: string | null; // ISO 8601 date string
  require_sequential_progress: boolean;
  requirement_type: "all" | "any" | "none" | string;
  publish_final_grade: boolean;
  prerequisite_module_ids: number[];
  state: "completed" | "unlocked" | "locked" | string;
  completed_at: string | null; // ISO 8601 date string
  items_count: number;
  items_url: string;
}

export interface CourseAssignment {
  id: number;
  position: number;
  name: string;
  description: string; // HTML string
  points_possible: number;
  grading_type: "points" | "percent" | "letter_grade" | "gpa_scale" | string;

  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  due_at: string | null;

  final_grader_id: number | null;
  grader_count: number;
  graders_anonymous_to_graders: boolean;
  grader_comments_visible_to_graders: boolean;
  grader_names_visible_to_final_grader: boolean;

  lock_at: string | null;
  unlock_at: string | null;

  assignment_group_id: number;
  peer_reviews: boolean;
  anonymous_peer_reviews: boolean;
  automatic_peer_reviews: boolean;
  intra_group_peer_reviews: boolean;

  post_to_sis: boolean;
  grade_group_students_individually: boolean;
  group_category_id: number | null;
  grading_standard_id: number | null;

  moderated_grading: boolean;
  hide_in_gradebook: boolean;
  omit_from_final_grade: boolean;
  suppress_assignment: boolean;

  anonymous_instructor_annotations: boolean;
  anonymous_grading: boolean;

  allowed_attempts: number; // -1 = unlimited
  annotatable_attachment_id: number | null;

  secure_params: string;
  lti_context_id: string;
  course_id: number;

  submission_types: Array<
    | "online_text_entry"
    | "online_upload"
    | "online_url"
    | "media_recording"
    | "none"
    | string
  >;

  has_submitted_submissions: boolean;
  due_date_required: boolean;
  max_name_length: number;

  in_closed_grading_period: boolean;
  graded_submissions_exist: boolean;
  is_quiz_assignment: boolean;
  can_duplicate: boolean;

  original_course_id: number | null;
  original_assignment_id: number | null;
  original_lti_resource_link_id: string | null;
  original_assignment_name: string | null;
  original_quiz_id: number | null;

  workflow_state: "published" | "unpublished" | string;
  important_dates: boolean;
  muted: boolean;

  html_url: string;
  published: boolean;
  only_visible_to_overrides: boolean;
  visible_to_everyone: boolean;
  locked_for_user: boolean;

  submissions_download_url: string;
  post_manually: boolean;
  anonymize_students: boolean;
  new_quizzes_anonymous_participants: boolean;
  require_lockdown_browser: boolean;
  restrict_quantitative_data: boolean;
}

export interface CourseQuiz {
  id: number;
  title: string;
  html_url: string;
  mobile_url: string;
  description: string; // HTML string

  quiz_type: "assignment" | "practice_quiz" | "graded_survey" | "survey" | string;

  time_limit: number | null;
  timer_autosubmit_disabled: boolean;
  shuffle_answers: boolean;
  show_correct_answers: boolean;

  scoring_policy: "keep_highest" | "keep_latest" | string;
  allowed_attempts: number;

  one_question_at_a_time: boolean;
  question_count: number;
  points_possible: number;
  cant_go_back: boolean;

  ip_filter: string | null;

  due_at: string | null; // ISO 8601
  lock_at: string | null;
  unlock_at: string | null;

  published: boolean;
  locked_for_user: boolean;

  hide_results: "always" | "until_after_last_attempt" | null | string;
  show_correct_answers_at: string | null;
  hide_correct_answers_at: string | null;

  all_dates: QuizDate[];

  can_update: boolean;

  require_lockdown_browser: boolean;
  require_lockdown_browser_for_results: boolean;
  require_lockdown_browser_monitor: boolean;
  lockdown_browser_monitor_data: unknown | null;

  permissions: QuizPermissions;

  quiz_reports_url: string;
  quiz_statistics_url: string;

  important_dates: boolean;
  quiz_submission_versions_html_url: string;

  assignment_id: number;
  one_time_results: boolean;
  visible_to_everyone: boolean;
  assignment_group_id: number;

  show_correct_answers_last_attempt: boolean;
  version_number: number;

  has_access_code: boolean;
  post_to_sis: boolean;
  migration_id: string | null;
  in_paced_course: boolean;
};

type QuizDate = {
  due_at: string | null;
  unlock_at: string | null;
  lock_at: string | null;
  title: string;
  base: boolean;
};

type QuizPermissions = {
  read: boolean;
  create: boolean;
  manage: boolean;
  update: boolean;
  submit: boolean;
  preview: boolean;
  delete: boolean;
  read_statistics: boolean;
  grade: boolean;
  review_grades: boolean;
  view_answer_audits: boolean;
  manage_assign_to: boolean;
};

export interface CourseModuleItem {
  id: number;
  position: number;
  title: string;
  indent: number;
  quiz_lti: boolean;
  type: "Page";
  module_id: number;
  html_url: string;
  content_id: number;
  url: string;
};

export interface CourseAssignmentItem {
  id: number;
  position: number;
  description: string;
  points_possible: number;
  grading_type: string;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
  due_at: string | null;
  final_grader_id: number | null;
  grader_count: number;
  graders_anonymous_to_graders: boolean;
  grader_comments_visible_to_graders: boolean;
  grader_names_visible_to_final_grader: boolean;
  lock_at: string | null;
  unlock_at: string | null;
  assignment_group_id: number;
  peer_reviews: boolean;
  anonymous_peer_reviews: boolean;
  automatic_peer_reviews: boolean;
  intra_group_peer_reviews: boolean;
  post_to_sis: boolean;
  grade_group_students_individually: boolean;
  group_category_id: number | null;
  grading_standard_id: number | null;
  moderated_grading: boolean;
  hide_in_gradebook: boolean;
  omit_from_final_grade: boolean;
  suppress_assignment: boolean;
  anonymous_instructor_annotations: boolean;
  anonymous_grading: boolean;
  allowed_attempts: number;
  annotatable_attachment_id: number | null;
  lock_info: LockInfo;
  secure_params: string;
  lti_context_id: string;
  course_id: number;
  name: string;
  submission_types: string[];
  has_submitted_submissions: boolean;
  due_date_required: boolean;
  max_name_length: number;
  in_closed_grading_period: boolean;
  graded_submissions_exist: boolean;
  is_quiz_assignment: boolean;
  can_duplicate: boolean;
  original_course_id: number | null;
  original_assignment_id: number | null;
  original_lti_resource_link_id: string | null;
  original_assignment_name: string | null;
  original_quiz_id: number | null;
  workflow_state: string;
  important_dates: boolean;
  muted: boolean;
  html_url: string;
  quiz_id: number | null;
  anonymous_submissions: boolean;
  published: boolean;
  only_visible_to_overrides: boolean;
  visible_to_everyone: boolean;
  locked_for_user: boolean;
  lock_explanation: string | null;
  submissions_download_url: string;
  post_manually: boolean;
  anonymize_students: boolean;
  new_quizzes_anonymous_participants: boolean;
  require_lockdown_browser: boolean;
  restrict_quantitative_data: boolean;
}

type LockInfo = {
  lock_at: string;
  can_view: boolean;
  asset_string: string;
}

export interface CourseQuizItem {
  id: number;
  title: string;
  html_url: string;
  mobile_url: string;
  description: string;
  quiz_type:
    | 'practice_quiz'
    | 'assignment'
    | 'graded_survey'
    | 'survey';
  time_limit: number | null;
  timer_autosubmit_disabled: boolean;
  shuffle_answers: boolean;
  show_correct_answers: boolean;
  scoring_policy: 'keep_highest' | 'keep_latest';
  allowed_attempts: number;
  one_question_at_a_time: boolean;
  question_count: number;
  points_possible: number;
  cant_go_back: boolean;
  ip_filter: string | null;
  due_at: string | null;
  lock_at: string | null;
  unlock_at: string | null;
  published: boolean;
  locked_for_user: boolean;
  hide_results: 'always' | 'until_after_last_attempt' | null;
  show_correct_answers_at: string | null;
  hide_correct_answers_at: string | null;

  all_dates: CourseQuizItemDate[];

  can_update: boolean;
  require_lockdown_browser: boolean;
  require_lockdown_browser_for_results: boolean;
  require_lockdown_browser_monitor: boolean;
  lockdown_browser_monitor_data: string;

  permissions: CourseQuizItemPermissions;

  quiz_reports_url: string;
  quiz_statistics_url: string;
  important_dates: boolean;
  quiz_submission_versions_html_url: string;

  assignment_id: number | null;
  one_time_results: boolean;
  visible_to_everyone: boolean;
  assignment_group_id: number;
  show_correct_answers_last_attempt: boolean;
  version_number: number;
  has_access_code: boolean;
  post_to_sis: boolean | null;
  migration_id: string;
  in_paced_course: boolean;

  question_types: string[];
}

export interface CourseQuizItemDate {
  due_at: string | null;
  unlock_at: string | null;
  lock_at: string | null;
  title: string;
  base: boolean;
}

export interface CourseQuizItemPermissions {
  read: boolean;
  create: boolean;
  manage: boolean;
  update: boolean;
  submit: boolean;
  preview: boolean;
  delete: boolean;
  read_statistics: boolean;
  grade: boolean;
  review_grades: boolean;
  view_answer_audits: boolean;
  manage_assign_to: boolean;
}
