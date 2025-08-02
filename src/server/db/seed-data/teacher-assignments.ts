import { PrismaClient, SystemStatus } from '@prisma/client';

/**
 * Seed teacher assignments to ensure teachers have proper access to classes
 */
export async function seedTeacherAssignments(
  prisma: PrismaClient,
  teachers: any[],
  classes: any[],
  subjects: any[]
) {
  console.log('Seeding teacher assignments...');

  if (!teachers || teachers.length === 0) {
    console.warn('No teachers provided for assignment seeding');
    return [];
  }

  if (!classes || classes.length === 0) {
    console.warn('No classes provided for assignment seeding');
    return [];
  }

  const assignments = [];

  // Teacher specializations based on their data
  const teacherSpecializations: Record<string, string[]> = {
    'robert_brown': ['MATH'], // Math teacher (Boys)
    'jennifer_davis': ['MATH'], // Math teacher (Girls)
    'david_wilson': ['ENG'], // English teacher (Boys)
    'emily_taylor': ['ENG'], // English teacher (Girls)
    'james_anderson': ['SCI'], // Science teacher (Multi-campus)
    'lisa_martinez': ['PE'], // PE teacher (Multi-campus)
  };

  for (const teacher of teachers) {
    if (!teacher.teacherProfileId) {
      console.log(`⚠️ Teacher ${teacher.name} has no profile, skipping...`);
      continue;
    }

    const teacherUsername = teacher.username;
    const teacherSubjects = teacherSpecializations[teacherUsername] || ['MATH'];
    
    console.log(`👨‍🏫 Processing assignments for ${teacher.name} (${teacherUsername})`);
    
    // Get teacher's campus access
    const teacherCampusAccess = await prisma.userCampusAccess.findMany({
      where: {
        userId: teacher.id,
        status: SystemStatus.ACTIVE
      },
      include: {
        campus: true
      }
    });

    const teacherCampusIds = teacherCampusAccess.map(access => access.campusId);
    
    // Filter classes that are in teacher's accessible campuses
    const accessibleClasses = classes.filter(cls => 
      teacherCampusIds.includes(cls.campusId)
    );

    console.log(`   - Can access ${accessibleClasses.length} classes in their campuses`);

    // Assign teacher to classes based on their specialization
    let assignedClasses = 0;
    const maxAssignments = teacherUsername === 'james_anderson' || teacherUsername === 'lisa_martinez' ? 4 : 2; // Multi-campus teachers get more assignments

    for (const classItem of accessibleClasses) {
      if (assignedClasses >= maxAssignments) break;

      // Get class subjects through courseCampus -> course -> subjects
      const classWithSubjects = await prisma.class.findUnique({
        where: { id: classItem.id },
        include: {
          courseCampus: {
            include: {
              course: {
                include: {
                  subjects: true
                }
              }
            }
          }
        }
      });

      const classSubjects = classWithSubjects?.courseCampus?.course?.subjects || [];
      
      // Check if class has subjects that match teacher's specialization
      const hasMatchingSubject = classSubjects.some(subject => 
        teacherSubjects.some(teacherSubject => 
          subject.code.includes(teacherSubject) || subject.name.toUpperCase().includes(teacherSubject)
        )
      );

      // Always assign if teacher is the primary class teacher, or if subjects match
      const isPrimaryTeacher = classItem.classTeacherId === teacher.teacherProfileId;
      const shouldAssign = isPrimaryTeacher || hasMatchingSubject;

      if (shouldAssign) {
        // Check if teacher is already assigned to this class
        const existingAssignment = await prisma.teacherAssignment.findFirst({
          where: {
            teacherId: teacher.teacherProfileId,
            classId: classItem.id,
            status: SystemStatus.ACTIVE
          }
        });

        if (!existingAssignment) {
          const assignment = await prisma.teacherAssignment.create({
            data: {
              teacherId: teacher.teacherProfileId,
              classId: classItem.id,
              status: SystemStatus.ACTIVE,
              startDate: new Date(),
            }
          });
          
          assignments.push(assignment);
          assignedClasses++;
          
          const reason = isPrimaryTeacher ? '(primary teacher)' : '(subject match)';
          console.log(`   ✅ Assigned to ${classItem.name} ${reason}`);
        } else {
          console.log(`   ⚠️ Already assigned to ${classItem.name}`);
        }
      }
    }

    // If no assignments were made and teacher has accessible classes, assign to at least one
    if (assignedClasses === 0 && accessibleClasses.length > 0) {
      const classItem = accessibleClasses[0];
      
      const existingAssignment = await prisma.teacherAssignment.findFirst({
        where: {
          teacherId: teacher.teacherProfileId,
          classId: classItem.id,
          status: SystemStatus.ACTIVE
        }
      });

      if (!existingAssignment) {
        const assignment = await prisma.teacherAssignment.create({
          data: {
            teacherId: teacher.teacherProfileId,
            classId: classItem.id,
            status: SystemStatus.ACTIVE,
            startDate: new Date(),
          }
        });
        
        assignments.push(assignment);
        console.log(`   ✅ Assigned to ${classItem.name} (fallback assignment)`);
      }
    }

    console.log(`   📊 Total assignments for ${teacher.name}: ${assignedClasses}`);
  }

  // Create subject assignments for teachers
  console.log('\n📚 Creating subject assignments...');
  
  for (const teacher of teachers) {
    if (!teacher.teacherProfileId) continue;

    const teacherUsername = teacher.username;
    const teacherSubjects = teacherSpecializations[teacherUsername] || ['MATH'];

    // Get teacher's assignments
    const teacherAssignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacher.teacherProfileId,
        status: SystemStatus.ACTIVE
      },
      include: {
        class: {
          include: {
            courseCampus: {
              include: {
                course: {
                  include: {
                    subjects: true
                  }
                }
              }
            }
          }
        }
      }
    });

    for (const assignment of teacherAssignments) {
      const classSubjects = assignment.class.courseCampus?.course?.subjects || [];
      
      // Assign teacher to subjects that match their specialization
      for (const subject of classSubjects) {
        const matchesSpecialization = teacherSubjects.some(teacherSubject => 
          subject.code.includes(teacherSubject) || subject.name.toUpperCase().includes(teacherSubject)
        );

        if (matchesSpecialization) {
          // Check if subject assignment already exists
          const existingSubjectAssignment = await prisma.teacherSubjectAssignment.findFirst({
            where: {
              teacherId: teacher.teacherProfileId,
              subjectId: subject.id,
              classId: assignment.classId,
              status: SystemStatus.ACTIVE
            }
          });

          if (!existingSubjectAssignment) {
            await prisma.teacherSubjectAssignment.create({
              data: {
                teacherId: teacher.teacherProfileId,
                subjectId: subject.id,
                classId: assignment.classId,
                status: SystemStatus.ACTIVE,
                startDate: new Date(),
              }
            });
            
            console.log(`   📖 Assigned ${teacher.name} to ${subject.name} in ${assignment.class.name}`);
          }
        }
      }
    }
  }

  console.log(`\n✅ Teacher assignments completed: ${assignments.length} total assignments`);
  
  // Verification
  console.log('\n🔍 Verifying teacher assignments...');
  for (const teacher of teachers) {
    if (teacher.teacherProfileId) {
      const teacherAssignments = await prisma.teacherAssignment.findMany({
        where: {
          teacherId: teacher.teacherProfileId,
          status: SystemStatus.ACTIVE
        },
        include: {
          class: true
        }
      });
      
      console.log(`📋 ${teacher.name}: ${teacherAssignments.length} classes assigned`);
      teacherAssignments.forEach(assignment => {
        console.log(`   - ${assignment.class.name}`);
      });
    }
  }

  return assignments;
}
