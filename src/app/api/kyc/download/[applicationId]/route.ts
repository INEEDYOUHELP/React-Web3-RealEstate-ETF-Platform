import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { db } from '../../../../../lib/db';

// 下载KYC文件（仅管理员）
export async function GET(
  request: NextRequest,
  { params }: { params: { applicationId: string } }
) {
  try {
    // 从数据库获取申请信息
    const application = await db.publisherApplication.findUnique({
      where: { applicationId: params.applicationId },
    });

    if (!application || !application.kycDocumentPath) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // 检查文件是否存在
    if (!existsSync(application.kycDocumentPath)) {
      return NextResponse.json(
        { error: 'File does not exist on server' },
        { status: 404 }
      );
    }

    // 读取文件
    const fileBuffer = await readFile(application.kycDocumentPath);
    
    // 获取文件扩展名
    const fileExtension = application.kycDocumentPath.split('.').pop() || 'pdf';
    const contentType = 
      fileExtension === 'pdf' ? 'application/pdf' :
      fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' :
      fileExtension === 'png' ? 'image/png' :
      'application/octet-stream';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="kyc_${params.applicationId}.${fileExtension}"`,
      },
    });
  } catch (error) {
    console.error('Failed to download file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}

