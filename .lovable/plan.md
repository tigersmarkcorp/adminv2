

# Admin Portal - Implementation Plan

## Overview
A colorful, modern Admin Portal with Supabase backend for managing Employees, Workers, and File storage — all in real-time.

---

## 1. Authentication — Admin Login Page
- Clean, modern login page with email/password
- Admin accounts are pre-created in Supabase (no signup page)
- Role-based access using a `user_roles` table to verify admin status
- Redirect to Dashboard after successful login

## 2. Dashboard
- Welcome screen with summary cards showing:
  - Total Employees count
  - Total Workers count
  - Total Files uploaded
  - Recent activity feed
- Colorful, modern design with vibrant accent colors and card-based layout

## 3. Sidebar Navigation
- Collapsible sidebar with the following menu items:
  - **Dashboard** (home icon)
  - **Employees** (users icon)
  - **Workers** (hard hat icon)
  - **Forms / Files** (folder icon)
- **Live Philippine Time & Date** displayed in the sidebar
- **Logout button** at the bottom of the sidebar
- Modern colorful styling with active state indicators

## 4. Employees Page
- **Employee List** — Table view showing all employees with search & filter, real-time updates
- **Create Employee Form** with fields:
  - Profile photo (uploaded to Supabase Storage)
  - Full name, email, phone number
  - Date of birth, gender, address
  - Position / Job title, Department
  - Date hired, Employment status (Active/Inactive)
  - Emergency contact info
- Edit and delete functionality
- Real-time sync — new employees appear instantly

## 5. Workers Page
- **Worker List** — Table view with search & filter, real-time updates
- **Create Worker Form** with fields:
  - Profile photo (uploaded to Supabase Storage)
  - Full name, email, phone number
  - Date of birth, gender, address
  - Job role / Skill type, Assignment area
  - Date started, Worker status (Active/Inactive)
  - Emergency contact info
- Edit and delete functionality
- Real-time sync — new workers appear instantly

## 6. Forms / Files Page
- **File storage system** for PDFs and other documents
- Upload files (PDF, DOCX, images, etc.) to Supabase Storage
- File list with name, upload date, file type, and size
- Download any file anytime
- Delete files
- Real-time updates when files are added or removed

## 7. Backend (Supabase)
- **Database tables**: employees, workers, files metadata, user_roles
- **Supabase Storage buckets**: employee-photos, worker-photos, forms-files
- **Row Level Security (RLS)** on all tables — only authenticated admins can access
- **Real-time subscriptions** on employees, workers, and files tables
- **Security definer function** for role checking (admin verification)

## 8. Design & UX
- Colorful & modern theme with vibrant gradients and accent colors
- Responsive layout (desktop-first with mobile support)
- Toast notifications for all actions (create, update, delete)
- Loading states and empty states
- Philippine timezone clock in sidebar (live updating)

