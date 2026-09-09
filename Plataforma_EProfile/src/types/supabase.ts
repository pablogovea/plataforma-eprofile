export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type AppRole = 'estudiante' | 'admin_plataforma';
export type ProfileStatus = 'borrador' | 'publicado';
export type PdfTemplate = 'clasica' | 'moderna' | 'minimalista';

export interface UserRole {
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface Student {
  id: string;
  user_id: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  student_id: string;
  full_name: string;
  career: string;
  bio: string;
  photo_url: string | null;
  pdf_template: PdfTemplate;
  status: ProfileStatus;
  published_snapshot: Json | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Formation {
  id: string;
  student_id: string;
  institution: string;
  degree: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
  sort_order: number;
}

export interface Experience {
  id: string;
  student_id: string;
  organization: string;
  position: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
  sort_order: number;
}

export interface Skill {
  id: string;
  student_id: string;
  name: string;
  category: string;
  level: number | null;
  sort_order: number;
}

export interface Recognition {
  id: string;
  student_id: string;
  title: string;
  issuer: string;
  awarded_on: string | null;
  description: string;
  url: string | null;
  sort_order: number;
}

export interface Project {
  id: string;
  student_id: string;
  name: string;
  description: string;
  technologies: string[];
  role: string;
  repository_url: string | null;
  live_url: string | null;
  is_academic: boolean;
  sort_order: number;
}

export interface Contact {
  id: string;
  student_id: string;
  email: string;
  phone: string;
  linkedin_url: string | null;
  github_url: string | null;
  website_url: string | null;
  location: string;
  updated_at: string;
}

export interface ProfileBundle {
  student: Pick<Student, 'id' | 'slug' | 'is_active'>;
  profile: Omit<Profile, 'published_snapshot'>;
  formations: Formation[];
  experiences: Experience[];
  skills: Skill[];
  recognitions: Recognition[];
  projects: Project[];
  contact: Contact | null;
}

export interface AdminStudentSummary {
  student_id: string;
  user_id: string;
  email: string;
  slug: string;
  is_active: boolean;
  full_name: string;
  career: string;
  status: ProfileStatus | 'vacio';
  published_at: string | null;
}

type Table<Row, Insert, Update> = {
  Row: Row & Record<string, unknown>;
  Insert: Insert & Record<string, unknown>;
  Update: Update & Record<string, unknown>;
  Relationships: [];
};

type CommonSectionInsert<T> = Omit<T, 'id'> & { id?: string };

export interface Database {
  public: {
    Tables: {
      user_roles: Table<UserRole, UserRole, Partial<Pick<UserRole, 'role'>>>;
      students: Table<Student, Omit<Student, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }, Partial<Omit<Student, 'id' | 'user_id' | 'created_at'>>>;
      profiles: Table<Profile, Omit<Profile, 'id' | 'created_at' | 'updated_at' | 'published_snapshot' | 'published_at'> & { id?: string; created_at?: string; updated_at?: string; published_snapshot?: Json | null; published_at?: string | null }, Partial<Omit<Profile, 'id' | 'student_id' | 'created_at'>>>;
      formations: Table<Formation, CommonSectionInsert<Formation>, Partial<Omit<Formation, 'id' | 'student_id'>>>;
      experiences: Table<Experience, CommonSectionInsert<Experience>, Partial<Omit<Experience, 'id' | 'student_id'>>>;
      skills: Table<Skill, CommonSectionInsert<Skill>, Partial<Omit<Skill, 'id' | 'student_id'>>>;
      recognitions: Table<Recognition, CommonSectionInsert<Recognition>, Partial<Omit<Recognition, 'id' | 'student_id'>>>;
      projects: Table<Project, CommonSectionInsert<Project>, Partial<Omit<Project, 'id' | 'student_id'>>>;
      contacts: Table<Contact, Omit<Contact, 'id' | 'updated_at'> & { id?: string; updated_at?: string }, Partial<Omit<Contact, 'id' | 'student_id'>>>;
    };
    Views: Record<string, never>;
    Functions: {
      get_public_profile: { Args: { requested_slug: string }; Returns: Json };
      publish_profile: { Args: { target_student_id: string }; Returns: Json };
      save_profile_bundle: { Args: { target_student_id: string; payload: Json }; Returns: boolean };
      is_platform_admin: { Args: Record<string, never>; Returns: boolean };
      owns_student: { Args: { target_student_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: AppRole;
      profile_status: ProfileStatus;
      pdf_template: PdfTemplate;
    };
    CompositeTypes: Record<never, never>;
  };
}

export type EditableTable = 'formations' | 'experiences' | 'skills' | 'recognitions' | 'projects';
