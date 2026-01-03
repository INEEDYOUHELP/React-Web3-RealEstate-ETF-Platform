import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { db } from '../../../../lib/db';

export async function POST(request: NextRequest) {
  try {
    // 确保数据库连接正常
    try {
      await db.$connect();
    } catch (dbError: any) {
      console.error('Database connection error:', dbError);
      const errorMessage = dbError?.message || 'Unknown database error';
      return NextResponse.json(
        { 
          error: 'Database connection failed', 
          details: errorMessage,
          hint: 'Please check if MySQL is running and the database exists'
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
    
    const formData = await request.formData();
    const applicantAddress = formData.get('applicantAddress') as string;
    const fullName = formData.get('fullName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const companyName = formData.get('companyName') as string;
    const kycFile = formData.get('kycFile') as File;

    if (!applicantAddress || !kycFile) {
      return NextResponse.json(
        { error: 'Missing required fields: applicantAddress and kycFile are required' },
        { status: 400 }
      );
    }

    // 验证地址格式
    if (!/^0x[a-fA-F0-9]{40}$/.test(applicantAddress)) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address format' },
        { status: 400 }
      );
    }

    // 检查是否已有申请
    const existing = await db.publisherApplication.findUnique({
      where: { applicantAddress },
    });

    if (existing && existing.status === 'pending') {
      return NextResponse.json(
        { error: 'You already have a pending application' },
        { status: 400 }
      );
    }

    // 生成申请ID
    const applicationId = uuidv4();

    // 保存KYC文件
    const uploadDir = join(process.cwd(), 'uploads', 'kyc', applicationId);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileExtension = kycFile.name.split('.').pop();
    const fileName = `kyc_${Date.now()}.${fileExtension}`;
    const filePath = join(uploadDir, fileName);

    const bytes = await kycFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    await writeFile(filePath, buffer);

    // 计算文件hash
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // 保存到数据库
    const application = await db.publisherApplication.create({
      data: {
        applicantAddress,
        applicationId,
        fullName: fullName || null,
        email: email || null,
        phone: phone || null,
        companyName: companyName || null,
        kycDocumentPath: filePath,
        kycDocumentType: kycFile.type,
        kycVerificationHash: fileHash,
        status: 'pending',
      },
    });

    return NextResponse.json({
      success: true,
      applicationId: application.applicationId,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('KYC application error:', error);
    
    // 确保返回 JSON 响应
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name,
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to submit application', 
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

