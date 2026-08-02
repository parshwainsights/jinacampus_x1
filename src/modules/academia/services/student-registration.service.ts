import { db } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit/audit-log";
import { notFound } from "@/lib/errors";
import type { TenantContext } from "@/lib/tenant/context";
import { ACADEMIA_AUDIT_EVENTS } from "@/modules/academia/audit-events";
import {
  type CreateStudentRegistrationInput,
  createStudentRegistrationSchema
} from "@/modules/academia/schemas";
import { createEnrollmentRecord } from "./enrollment.service";
import { conflict, requireBranchPermission } from "./shared";
import { createStudentRecord } from "./student.service";

function guardianName(input: CreateStudentRegistrationInput) {
  switch (input.primaryGuardian.relation) {
    case "MOTHER":
      return input.student.motherName;
    case "GUARDIAN":
      return input.student.guardianName ?? input.student.fatherName;
    default:
      return input.student.fatherName;
  }
}

function splitGuardianName(name: string) {
  const parts = name.trim().split(/\s+/);
  const firstName = parts.shift() ?? name;
  const lastName = parts.join(" ") || undefined;
  return {
    firstName: firstName.slice(0, 80),
    lastName: lastName?.slice(0, 80),
    displayName: name.slice(0, 180)
  };
}

export async function createStudentRegistration(ctx: TenantContext, input: unknown) {
  const data = createStudentRegistrationSchema.parse(input);
  await requireBranchPermission(ctx, "academia.student.create", data.student.branchId);
  await requireBranchPermission(ctx, "academia.guardian.manage", data.student.branchId);
  if (data.initialClassAssignment) {
    await requireBranchPermission(ctx, "academia.enrollment.manage", data.student.branchId);
  }

  return db.$transaction(async (tx) => {
    const student = await createStudentRecord(tx, ctx, data.student);
    const contactFilters = [
      ...(data.primaryGuardian.phone ? [{ phone: data.primaryGuardian.phone }] : []),
      ...(data.primaryGuardian.email ? [{ email: data.primaryGuardian.email }] : [])
    ];
    const matchingGuardians = contactFilters.length
      ? await tx.guardian.findMany({
          where: {
            tenantId: ctx.tenantId,
            OR: contactFilters
          },
          take: 2
        })
      : [];
    if (matchingGuardians.length > 1) {
      throw conflict("GUARDIAN_CONTACTS_BELONG_TO_DIFFERENT_RECORDS");
    }

    let guardian = matchingGuardians[0];
    if (!guardian) {
      const names = splitGuardianName(guardianName(data));
      guardian = await tx.guardian.create({
        data: {
          tenantId: ctx.tenantId,
          ...names,
          phone: data.primaryGuardian.phone,
          email: data.primaryGuardian.email,
          occupation:
            data.primaryGuardian.relation === "FATHER"
              ? data.student.fatherOccupation
              : undefined,
          addressLine1: data.student.permanentAddress ?? data.student.currentAddress,
          city: data.student.city,
          state: data.student.state,
          postalCode: data.student.pincode,
          country: "India",
          createdById: ctx.userId
        }
      });
      await writeAuditLog({
        ctx,
        action: ACADEMIA_AUDIT_EVENTS.GUARDIAN_CREATED,
        entityType: "Guardian",
        entityId: guardian.id,
        branchId: student.branchId,
        after: guardian
      }, tx);
    }

    const guardianLink = await tx.studentGuardianLink.create({
      data: {
        tenantId: ctx.tenantId,
        studentId: student.id,
        guardianId: guardian.id,
        relation: data.primaryGuardian.relation,
        isPrimary: true,
        isEmergencyContact: data.primaryGuardian.isEmergencyContact,
        hasPickupPermission: data.primaryGuardian.hasPickupPermission,
        createdById: ctx.userId
      }
    });
    await writeAuditLog({
      ctx,
      action: ACADEMIA_AUDIT_EVENTS.GUARDIAN_LINKED,
      entityType: "StudentGuardianLink",
      entityId: guardianLink.id,
      branchId: student.branchId,
      after: guardianLink
    }, tx);

    let enrollment = null;
    if (data.initialClassAssignment) {
      const classSection = await tx.classSection.findFirst({
        where: {
          id: data.initialClassAssignment.classSectionId,
          tenantId: ctx.tenantId,
          branchId: student.branchId,
          status: "ACTIVE",
          academicYear: {
            tenantId: ctx.tenantId,
            isActive: true,
            status: "ACTIVE"
          }
        },
        select: { id: true, branchId: true, academicYearId: true }
      });
      if (!classSection) throw notFound("CLASS_SECTION_NOT_FOUND");

      enrollment = await createEnrollmentRecord(tx, ctx, {
        branchId: classSection.branchId,
        academicYearId: classSection.academicYearId,
        studentId: student.id,
        classSectionId: classSection.id,
        rollNumber: data.initialClassAssignment.rollNumber,
        enrolledOn: data.initialClassAssignment.enrolledOn ?? data.student.admissionDate
      });
    }

    return { student, guardian, guardianLink, enrollment };
  });
}
