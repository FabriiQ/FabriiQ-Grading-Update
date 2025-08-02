# Robust Database Seeding for FabriiQ

This document describes the robust seeding solution created for your Supabase database.

## Overview

The `robust-seed.ts` script creates a complete educational institution setup with **DEMO CREDENTIALS ALIGNED WITH YOUR LOGIN PAGE**:

- **1 Institution**: Main Educational Institution
- **1 Campus**: Main Campus (primary campus)
- **1 Academic Cycle**: Academic Year 2024
- **12 Demo Users**: System admin, coordinators, campus admins, teachers, students
- **3 Programs**: Elementary, Middle School, High School
- **10 Courses**: Grade levels from 1-12
- **120 Subjects**: Core subjects across all grade levels
- **120 Subject Topics**: Learning topics for each subject
- **6 Teachers**: Specialized in different subjects
- **9 Classes**: Various grade sections
- **10 Students**: Enrolled across different classes

> **🎯 KEY FEATURE**: All demo account usernames exactly match the buttons on your login page!

## How to Run

### Prerequisites

1. Ensure your Supabase database is connected and accessible
2. Make sure your Prisma schema is up to date
3. Run any pending migrations if needed

### Running the Seed

```bash
# Run the robust seed script
npm run db:robust-seed
```

## What Gets Created

### 1. Institution & Campus
- **Institution**: "Main Educational Institution" (code: MAIN)
- **Campus**: "Main Campus" (code: MAIN-CAMPUS)
- **Academic Cycle**: Academic Year 2024 (365 days duration)

### 2. Demo Users Created (Aligned with Login Page)

#### System Level Users
- **System Admin**: sys_admin (sys.admin@maincampus.edu)
- **Program Coordinator**: alex_johnson (alex.johnson@maincampus.edu)

#### Campus Level Users
- **Boys Campus Admin**: michael_smith (michael.smith@maincampus.edu)
- **Girls Campus Admin**: sarah_williams (sarah.williams@maincampus.edu)

#### Teachers (6 total)
- **Robert Brown** (robert_brown) - Mathematics (Boys)
- **Jennifer Davis** (jennifer_davis) - Mathematics (Girls)
- **James Anderson** (james_anderson) - Science
- **Lisa Wilson** (lisa_wilson) - English
- **David Taylor** (david_taylor) - Physical Education
- **Emma Clark** (emma_clark) - Arts

#### Students (10 total)
- **John Smith** (john_smith) - Boy Student - Grade 1A
- **Emily Johnson** (emily_johnson) - Girl Student - Grade 1A
- **Charlie Brown** (charlie_brown) - Grade 1B
- **Diana Prince** (diana_prince) - Grade 2A
- **Ethan Hunt** (ethan_hunt) - Grade 3A
- **Fiona Green** (fiona_green) - Grade 6A
- **George Washington** (george_washington) - Grade 7A
- **Helen Troy** (helen_troy) - Grade 8A
- **Ivan Petrov** (ivan_petrov) - Grade 9A
- **Jane Doe** (jane_doe) - Grade 10A

### 3. Academic Structure

#### Programs
1. **Elementary Program** (ELEM) - Grades 1-6
2. **Middle School Program** (MIDDLE) - Grades 6-8
3. **High School Program** (HIGH) - Grades 9-12

#### Subjects (per course)
- Mathematics (4.0 credits)
- English Language Arts (4.0 credits)
- Science (3.0 credits)
- History (3.0 credits)
- Geography (2.0 credits)
- Arts & Crafts (2.0 credits)
- Physical Education (2.0 credits)
- Music (1.0 credits)
- Chemistry (4.0 credits) - High school
- Physics (4.0 credits) - High school
- Biology (4.0 credits) - High school
- Computer Science (3.0 credits) - High school

#### Subject Topics (per subject)
- **Mathematics**: Numbers and Operations, Algebra, Geometry, Statistics
- **English**: Reading Comprehension, Writing Skills, Literature, Speaking & Listening
- **Science**: Life Science, Physical Science, Earth Science, Scientific Method

### 4. Classes Created
- Grade 1 Section A (25 capacity)
- Grade 1 Section B (25 capacity)
- Grade 2 Section A (25 capacity)
- Grade 3 Section A (25 capacity)
- Grade 6 Section A (30 capacity)
- Grade 7 Section A (30 capacity)
- Grade 8 Section A (30 capacity)
- Grade 9 Section A (35 capacity)
- Grade 10 Section A (35 capacity)

## Login Credentials (Aligned with Login Page Demo Accounts)

All users have the same default password: **Password123!**

### System Level Access
- **System Admin**: sys_admin / Password123!
- **Program Coordinator**: alex_johnson / Password123!

### Campus Level Access
- **Boys Campus Admin**: michael_smith / Password123!
- **Girls Campus Admin**: sarah_williams / Password123!

### Teacher Access
- **Math Teacher (Boys)**: robert_brown / Password123!
- **Math Teacher (Girls)**: jennifer_davis / Password123!
- **Science Teacher**: james_anderson / Password123!

### Student Access
- **Boy Student**: john_smith / Password123!
- **Girl Student**: emily_johnson / Password123!

> **Note**: These usernames exactly match the demo account buttons on your login page, so you can click any demo account button and it will work immediately!

## Key Features

### ✅ Robust Error Handling
- Uses `upsert` operations to prevent duplicate entries
- Handles missing relationships gracefully
- Provides detailed logging throughout the process

### ✅ Complete Relationships
- All foreign key relationships are properly established
- Program-Campus associations created
- Course-Campus associations created
- Student enrollments properly linked
- Teacher profiles created

### ✅ Realistic Data
- Meaningful names and codes
- Proper academic structure
- Realistic enrollment numbers
- Appropriate class capacities

### ✅ Extensible Structure
- Easy to add more programs, courses, or users
- Modular design allows for easy modifications
- Clear separation of concerns

## Troubleshooting

### If the seed fails:
1. Check your database connection
2. Ensure Prisma schema is up to date
3. Run `npx prisma generate` to update the client
4. Check for any pending migrations

### To re-run the seed:
The script uses `upsert` operations, so it's safe to run multiple times. It will update existing records rather than create duplicates.

### To clean the database:
If you need to start fresh, you can reset your database and run the seed again.

## Next Steps

After running the seed:
1. Test login with the admin account
2. Verify that all relationships are working
3. Add additional users, classes, or subjects as needed
4. Configure any additional settings specific to your institution

## Support

If you encounter any issues with the seeding process, check the console output for detailed error messages and ensure all prerequisites are met.
