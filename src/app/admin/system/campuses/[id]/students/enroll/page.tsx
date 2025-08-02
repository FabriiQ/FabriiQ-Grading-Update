'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { ChevronLeftIcon } from 'lucide-react';
import { EnrollStudentDialog } from '@/components/campus/EnrollStudentDialog';
import { api } from '~/trpc/react';
import { SystemStatus } from '@prisma/client';

// Define ProgramChangeType as const (not exported from page component)
const ProgramChangeType = {
  NEW_ENROLLMENT: "NEW_ENROLLMENT",
  PROGRAM_TRANSFER: "PROGRAM_TRANSFER",
  PROGRAM_UPGRADE: "PROGRAM_UPGRADE",
} as const;

// Define the type for program campus
interface ProgramCampus {
  id: string;
  programId: string;
  campusId: string;
  program: {
    name: string;
    code: string;
  };
}

export default function EnrollStudentPage() {
  const router = useRouter();
  const params = useParams();
  const campusId = params.id as string;
  const [dialogOpen, setDialogOpen] = useState(true);
  
  // Fetch campus details
  const { data: campus, isLoading: campusLoading } = api.campus.getCampus.useQuery({
    id: campusId,
  });

  // Fetch available students
  const { data: availableStudents, isLoading: studentsLoading } = api.user.getAvailableStudents.useQuery({
    campusId: campusId,
  });

  // Fetch available programs
  const { data: programCampuses, isLoading: programsLoading } =
    api.program.getProgramCampusesByCampus.useQuery({
      campusId: campusId,
      status: SystemStatus.ACTIVE,
    });

  // Handle dialog close
  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      router.push(`/admin/system/campuses/${campusId}/students`);
    }
  };

  // If data is loading, show loading state
  if (campusLoading || studentsLoading || programsLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <PageHeader
            title="Enroll Student"
            description="Loading campus details..."
          />
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // If no campus found, show error
  if (!campus) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <PageHeader
            title="Error"
            description="Campus not found"
          />
        </div>
        <div className="flex justify-center">
          <Button onClick={() => router.push('/admin/system/campuses')}>
            Return to Campuses
          </Button>
        </div>
      </div>
    );
  }

  // Format program options
  const programOptions = programCampuses?.map(pc => ({
    id: pc.id,
    name: pc.program.name,
    code: pc.program.code,
  })) || [];

  const handleProgramChange = (pc: ProgramCampus) => {
    // Handle program change
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        <PageHeader
          title={`Enroll Student - ${campus.name}`}
          description={`Enroll a student to ${campus.code} campus`}
        />
      </div>

      <EnrollStudentDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        campusId={campusId}
        availableStudents={availableStudents?.students || []}
        availablePrograms={programOptions}
        returnUrl={`/admin/system/campuses/${campusId}/students`}
      />
    </div>
  );
} 
