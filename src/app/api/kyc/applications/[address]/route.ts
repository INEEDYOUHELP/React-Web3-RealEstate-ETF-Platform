import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';

// 获取单个申请
export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const application = await db.publisherApplication.findUnique({
      where: { applicantAddress: params.address },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // 不返回文件路径
    const sanitized = {
      id: application.id,
      applicantAddress: application.applicantAddress,
      applicationId: application.applicationId,
      fullName: application.fullName,
      email: application.email,
      phone: application.phone,
      companyName: application.companyName,
      kycDocumentType: application.kycDocumentType,
      kycVerificationHash: application.kycVerificationHash,
      status: application.status,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      reviewerAddress: application.reviewerAddress,
      adminNotes: application.adminNotes,
      rejectionReason: application.rejectionReason,
    };

    return NextResponse.json({ application: sanitized });
  } catch (error) {
    console.error('Failed to fetch application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

// 更新申请状态（管理员审核后调用）
export async function PATCH(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const body = await request.json();
    const { status, reviewerAddress, adminNotes, rejectionReason } = body;

    const application = await db.publisherApplication.update({
      where: { applicantAddress: params.address },
      data: {
        status: status || undefined,
        reviewerAddress: reviewerAddress || undefined,
        reviewedAt: status && status !== 'pending' ? new Date() : undefined,
        adminNotes: adminNotes || undefined,
        rejectionReason: rejectionReason || undefined,
      },
    });

    return NextResponse.json({ 
      success: true,
      application: {
        id: application.id,
        applicantAddress: application.applicantAddress,
        applicationId: application.applicationId,
        status: application.status,
        reviewedAt: application.reviewedAt,
        reviewerAddress: application.reviewerAddress,
      }
    });
  } catch (error) {
    console.error('Failed to update application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

