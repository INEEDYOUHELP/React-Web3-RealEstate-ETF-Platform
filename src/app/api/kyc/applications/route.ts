import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

// 获取所有申请（管理员）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const applicantAddress = searchParams.get('applicantAddress');

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (applicantAddress) {
      where.applicantAddress = applicantAddress;
    }

    const applications = await db.publisherApplication.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
    });

    // 不返回文件路径，只返回基本信息
    const sanitized = applications.map(app => ({
      id: app.id,
      applicantAddress: app.applicantAddress,
      applicationId: app.applicationId,
      fullName: app.fullName,
      email: app.email,
      phone: app.phone,
      companyName: app.companyName,
      kycDocumentType: app.kycDocumentType,
      kycVerificationHash: app.kycVerificationHash,
      status: app.status,
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
      reviewerAddress: app.reviewerAddress,
      adminNotes: app.adminNotes,
      rejectionReason: app.rejectionReason,
    }));

    return NextResponse.json({ applications: sanitized });
  } catch (error) {
    console.error('Failed to fetch applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

