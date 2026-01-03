-- CreateTable
CREATE TABLE `PublisherApplication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicantAddress` VARCHAR(42) NOT NULL,
    `applicationId` VARCHAR(255) NOT NULL,
    `kycDocumentPath` TEXT NULL,
    `kycDocumentType` VARCHAR(50) NULL,
    `kycVerificationHash` VARCHAR(255) NULL,
    `fullName` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `phone` VARCHAR(50) NULL,
    `companyName` VARCHAR(255) NULL,
    `businessLicense` VARCHAR(255) NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending',
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `reviewerAddress` VARCHAR(42) NULL,
    `adminNotes` TEXT NULL,
    `rejectionReason` TEXT NULL,

    UNIQUE INDEX `PublisherApplication_applicantAddress_key`(`applicantAddress`),
    UNIQUE INDEX `PublisherApplication_applicationId_key`(`applicationId`),
    INDEX `PublisherApplication_applicantAddress_idx`(`applicantAddress`),
    INDEX `PublisherApplication_status_idx`(`status`),
    INDEX `PublisherApplication_submittedAt_idx`(`submittedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
