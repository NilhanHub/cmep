-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vibe" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "gradientFrom" TEXT NOT NULL,
    "gradientTo" TEXT NOT NULL,
    "coverImagePath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "initials" TEXT NOT NULL,
    "avatarTone" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "website" TEXT,
    "city" TEXT,
    "status" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "lifecycleStage" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "customFields" JSONB NOT NULL,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Organization_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "title" TEXT,
    "city" TEXT,
    "status" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "lifecycleStage" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "customFields" JSONB NOT NULL,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offering" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortLabel" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "tags" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "heroMediaPath" TEXT,
    "iconName" TEXT,
    "unitLabel" TEXT,
    "isPhysical" BOOLEAN NOT NULL DEFAULT false,
    "isDigital" BOOLEAN NOT NULL DEFAULT false,
    "isService" BOOLEAN NOT NULL DEFAULT false,
    "taxCategory" TEXT,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Offering_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferingMedia" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfferingMedia_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferingMedia_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferingVariant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayLabel" TEXT NOT NULL,
    "optionValues" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "mediaPath" TEXT,
    "serviceDurationMinutes" INTEGER,
    "fulfillmentMetadata" JSONB,
    "inventoryPolicy" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfferingVariant_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferingVariant_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferingPrice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "variantId" TEXT,
    "name" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "compareAtCents" INTEGER,
    "billingModel" TEXT NOT NULL,
    "interval" TEXT,
    "intervalCount" INTEGER,
    "quantityMinimum" INTEGER,
    "quantityMaximum" INTEGER,
    "effectiveFrom" DATETIME,
    "effectiveTo" DATETIME,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfferingPrice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferingPrice_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferingPrice_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "OfferingVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Catalog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Catalog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "offeringId" TEXT NOT NULL,
    "variantId" TEXT,
    "priceId" TEXT,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "requestable" BOOLEAN NOT NULL DEFAULT true,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CatalogItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CatalogItem_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CatalogItem_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CatalogItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "OfferingVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CatalogItem_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "OfferingPrice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CatalogAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "organizationId" TEXT,
    "contactId" TEXT,
    "segment" TEXT,
    "portalVisible" BOOLEAN NOT NULL DEFAULT true,
    "negotiatedPricing" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" DATETIME,
    "effectiveTo" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CatalogAssignment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CatalogAssignment_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CatalogAssignment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CatalogAssignment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferingBundleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "bundleOfferingId" TEXT NOT NULL,
    "itemOfferingId" TEXT NOT NULL,
    "itemVariantId" TEXT,
    "itemPriceId" TEXT,
    "requirement" TEXT NOT NULL DEFAULT 'INCLUDED',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfferingBundleItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferingBundleItem_bundleOfferingId_fkey" FOREIGN KEY ("bundleOfferingId") REFERENCES "Offering" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferingBundleItem_itemOfferingId_fkey" FOREIGN KEY ("itemOfferingId") REFERENCES "Offering" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferingBundleItem_itemVariantId_fkey" FOREIGN KEY ("itemVariantId") REFERENCES "OfferingVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OfferingBundleItem_itemPriceId_fkey" FOREIGN KEY ("itemPriceId") REFERENCES "OfferingPrice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OfferingRouteBinding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "offeringId" TEXT,
    "variantId" TEXT,
    "catalogId" TEXT,
    "pipelineTemplateId" TEXT,
    "bookingTypeId" TEXT,
    "intakeFormId" TEXT,
    "automationRuleId" TEXT,
    "ownerUserId" TEXT,
    "quoteDefaults" JSONB,
    "invoiceDefaults" JSONB,
    "portalVisible" BOOLEAN NOT NULL DEFAULT true,
    "requestable" BOOLEAN NOT NULL DEFAULT true,
    "tags" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OfferingRouteBinding_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OfferingRouteBinding_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OfferingRouteBinding_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "OfferingVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OfferingRouteBinding_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OfferingRouteBinding_pipelineTemplateId_fkey" FOREIGN KEY ("pipelineTemplateId") REFERENCES "PipelineTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OfferingRouteBinding_bookingTypeId_fkey" FOREIGN KEY ("bookingTypeId") REFERENCES "BookingType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OfferingRouteBinding_intakeFormId_fkey" FOREIGN KEY ("intakeFormId") REFERENCES "IntakeForm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OfferingRouteBinding_automationRuleId_fkey" FOREIGN KEY ("automationRuleId") REFERENCES "AutomationRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CustomerOfferingLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT,
    "contactId" TEXT,
    "catalogId" TEXT,
    "offeringId" TEXT NOT NULL,
    "variantId" TEXT,
    "priceId" TEXT,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT,
    "status" TEXT NOT NULL,
    "firstSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" DATETIME,
    "endedAt" DATETIME,
    "lastActivityAt" DATETIME,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerOfferingLink_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerOfferingLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustomerOfferingLink_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustomerOfferingLink_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "Catalog" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustomerOfferingLink_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerOfferingLink_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "OfferingVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustomerOfferingLink_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "OfferingPrice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "organizationId" TEXT,
    "conversationId" TEXT,
    "lifecycleItemId" TEXT,
    "taskId" TEXT,
    "bookingId" TEXT,
    "quoteId" TEXT,
    "invoiceId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "actorLabel" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "occurredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Activity_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Activity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_lifecycleItemId_fkey" FOREIGN KEY ("lifecycleItemId") REFERENCES "LifecycleItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Activity_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "organizationId" TEXT,
    "conversationId" TEXT,
    "lifecycleItemId" TEXT,
    "authorUserId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Note_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Note_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Note_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Note_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Note_lifecycleItemId_fkey" FOREIGN KEY ("lifecycleItemId") REFERENCES "LifecycleItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "organizationId" TEXT,
    "subject" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "assignedUserId" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "portalVisible" BOOLEAN NOT NULL DEFAULT true,
    "summary" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "lastMessageAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Conversation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Conversation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "authorType" TEXT NOT NULL,
    "authorLabel" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isInternalNote" BOOLEAN NOT NULL DEFAULT false,
    "intent" TEXT,
    "riskLabel" TEXT,
    "extractedTags" JSONB NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "conversationId" TEXT,
    "messageId" TEXT,
    "fileAssetId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Attachment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Attachment_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Attachment_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CannedReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CannedReply_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PipelineTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PipelineTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PipelineStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PipelineStage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PipelineStage_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PipelineTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LifecycleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "contactId" TEXT,
    "organizationId" TEXT,
    "customerOfferingLinkId" TEXT,
    "offeringId" TEXT,
    "offeringVariantId" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" DATETIME,
    "valueCents" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "riskFlag" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LifecycleItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LifecycleItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "PipelineTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LifecycleItem_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LifecycleItem_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LifecycleItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LifecycleItem_customerOfferingLinkId_fkey" FOREIGN KEY ("customerOfferingLinkId") REFERENCES "CustomerOfferingLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LifecycleItem_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LifecycleItem_offeringVariantId_fkey" FOREIGN KEY ("offeringVariantId") REFERENCES "OfferingVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "organizationId" TEXT,
    "conversationId" TEXT,
    "lifecycleItemId" TEXT,
    "bookingId" TEXT,
    "quoteId" TEXT,
    "invoiceId" TEXT,
    "ownerUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Task_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_lifecycleItemId_fkey" FOREIGN KEY ("lifecycleItemId") REFERENCES "LifecycleItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "triggerType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastRunAt" DATETIME,
    CONSTRAINT "AutomationRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AutomationRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "ruleId" TEXT,
    "triggerType" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutomationRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AutomationRun_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "AutomationRule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntakeForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntakeForm_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BookingType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "intakeFormId" TEXT,
    "offeringId" TEXT,
    "offeringVariantId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "bufferMinutes" INTEGER NOT NULL,
    "availabilityJson" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BookingType_intakeFormId_fkey" FOREIGN KEY ("intakeFormId") REFERENCES "IntakeForm" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BookingType_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BookingType_offeringVariantId_fkey" FOREIGN KEY ("offeringVariantId") REFERENCES "OfferingVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "bookingTypeId" TEXT NOT NULL,
    "contactId" TEXT,
    "organizationId" TEXT,
    "customerOfferingLinkId" TEXT,
    "offeringId" TEXT,
    "offeringVariantId" TEXT,
    "status" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Booking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_bookingTypeId_fkey" FOREIGN KEY ("bookingTypeId") REFERENCES "BookingType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Booking_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_customerOfferingLinkId_fkey" FOREIGN KEY ("customerOfferingLinkId") REFERENCES "CustomerOfferingLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Booking_offeringVariantId_fkey" FOREIGN KEY ("offeringVariantId") REFERENCES "OfferingVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IntakeSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "intakeFormId" TEXT NOT NULL,
    "bookingId" TEXT,
    "contactId" TEXT,
    "answers" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntakeSubmission_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IntakeSubmission_intakeFormId_fkey" FOREIGN KEY ("intakeFormId") REFERENCES "IntakeForm" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IntakeSubmission_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IntakeSubmission_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "organizationId" TEXT,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "portalVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Quote_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteId" TEXT NOT NULL,
    "offeringId" TEXT,
    "offeringVariantId" TEXT,
    "offeringPriceId" TEXT,
    "customerOfferingLinkId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "isAdHoc" BOOLEAN NOT NULL DEFAULT false,
    "adHocReason" TEXT,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "QuoteLineItem_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteLineItem_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QuoteLineItem_offeringVariantId_fkey" FOREIGN KEY ("offeringVariantId") REFERENCES "OfferingVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QuoteLineItem_offeringPriceId_fkey" FOREIGN KEY ("offeringPriceId") REFERENCES "OfferingPrice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "QuoteLineItem_customerOfferingLinkId_fkey" FOREIGN KEY ("customerOfferingLinkId") REFERENCES "CustomerOfferingLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "organizationId" TEXT,
    "reference" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "issueDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "subtotalCents" INTEGER NOT NULL,
    "taxCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "balanceCents" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "portalVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Invoice_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "offeringId" TEXT,
    "offeringVariantId" TEXT,
    "offeringPriceId" TEXT,
    "customerOfferingLinkId" TEXT,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "isAdHoc" BOOLEAN NOT NULL DEFAULT false,
    "adHocReason" TEXT,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoiceLineItem_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InvoiceLineItem_offeringVariantId_fkey" FOREIGN KEY ("offeringVariantId") REFERENCES "OfferingVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InvoiceLineItem_offeringPriceId_fkey" FOREIGN KEY ("offeringPriceId") REFERENCES "OfferingPrice" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "InvoiceLineItem_customerOfferingLinkId_fkey" FOREIGN KEY ("customerOfferingLinkId") REFERENCES "CustomerOfferingLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringAgreement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "organizationId" TEXT,
    "customerOfferingLinkId" TEXT,
    "offeringId" TEXT,
    "offeringVariantId" TEXT,
    "offeringPriceId" TEXT,
    "name" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "cadence" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "nextBillingDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringAgreement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecurringAgreement_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecurringAgreement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecurringAgreement_customerOfferingLinkId_fkey" FOREIGN KEY ("customerOfferingLinkId") REFERENCES "CustomerOfferingLink" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecurringAgreement_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "Offering" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecurringAgreement_offeringVariantId_fkey" FOREIGN KEY ("offeringVariantId") REFERENCES "OfferingVariant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecurringAgreement_offeringPriceId_fkey" FOREIGN KEY ("offeringPriceId") REFERENCES "OfferingPrice" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "organizationId" TEXT,
    "uploadedByUserId" TEXT,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FileAsset_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FileAsset_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FileAsset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PortalAccess" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "contactId" TEXT,
    "organizationId" TEXT,
    "accessKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortalAccess_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PortalAccess_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "PortalAccess_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Membership_tenantId_role_idx" ON "Membership"("tenantId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_tenantId_userId_key" ON "Membership"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "Organization_tenantId_status_idx" ON "Organization"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Organization_tenantId_ownerUserId_idx" ON "Organization"("tenantId", "ownerUserId");

-- CreateIndex
CREATE INDEX "Contact_tenantId_status_idx" ON "Contact"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Contact_tenantId_organizationId_idx" ON "Contact"("tenantId", "organizationId");

-- CreateIndex
CREATE INDEX "Contact_tenantId_ownerUserId_idx" ON "Contact"("tenantId", "ownerUserId");

-- CreateIndex
CREATE INDEX "Offering_tenantId_type_status_idx" ON "Offering"("tenantId", "type", "status");

-- CreateIndex
CREATE INDEX "Offering_tenantId_family_category_idx" ON "Offering"("tenantId", "family", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Offering_tenantId_code_key" ON "Offering"("tenantId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Offering_tenantId_slug_key" ON "Offering"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "OfferingMedia_tenantId_offeringId_sortOrder_idx" ON "OfferingMedia"("tenantId", "offeringId", "sortOrder");

-- CreateIndex
CREATE INDEX "OfferingVariant_tenantId_offeringId_active_idx" ON "OfferingVariant"("tenantId", "offeringId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "OfferingVariant_offeringId_code_key" ON "OfferingVariant"("offeringId", "code");

-- CreateIndex
CREATE INDEX "OfferingPrice_tenantId_offeringId_active_idx" ON "OfferingPrice"("tenantId", "offeringId", "active");

-- CreateIndex
CREATE INDEX "OfferingPrice_tenantId_billingModel_active_idx" ON "OfferingPrice"("tenantId", "billingModel", "active");

-- CreateIndex
CREATE INDEX "Catalog_tenantId_type_active_idx" ON "Catalog"("tenantId", "type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Catalog_tenantId_code_key" ON "Catalog"("tenantId", "code");

-- CreateIndex
CREATE INDEX "CatalogItem_tenantId_catalogId_sortOrder_idx" ON "CatalogItem"("tenantId", "catalogId", "sortOrder");

-- CreateIndex
CREATE INDEX "CatalogItem_tenantId_offeringId_idx" ON "CatalogItem"("tenantId", "offeringId");

-- CreateIndex
CREATE INDEX "CatalogAssignment_tenantId_catalogId_active_idx" ON "CatalogAssignment"("tenantId", "catalogId", "active");

-- CreateIndex
CREATE INDEX "CatalogAssignment_tenantId_organizationId_idx" ON "CatalogAssignment"("tenantId", "organizationId");

-- CreateIndex
CREATE INDEX "CatalogAssignment_tenantId_contactId_idx" ON "CatalogAssignment"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "CatalogAssignment_tenantId_segment_idx" ON "CatalogAssignment"("tenantId", "segment");

-- CreateIndex
CREATE INDEX "OfferingBundleItem_tenantId_bundleOfferingId_sortOrder_idx" ON "OfferingBundleItem"("tenantId", "bundleOfferingId", "sortOrder");

-- CreateIndex
CREATE INDEX "OfferingRouteBinding_tenantId_offeringId_idx" ON "OfferingRouteBinding"("tenantId", "offeringId");

-- CreateIndex
CREATE INDEX "OfferingRouteBinding_tenantId_variantId_idx" ON "OfferingRouteBinding"("tenantId", "variantId");

-- CreateIndex
CREATE INDEX "OfferingRouteBinding_tenantId_catalogId_idx" ON "OfferingRouteBinding"("tenantId", "catalogId");

-- CreateIndex
CREATE INDEX "CustomerOfferingLink_tenantId_status_idx" ON "CustomerOfferingLink"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CustomerOfferingLink_tenantId_organizationId_idx" ON "CustomerOfferingLink"("tenantId", "organizationId");

-- CreateIndex
CREATE INDEX "CustomerOfferingLink_tenantId_contactId_idx" ON "CustomerOfferingLink"("tenantId", "contactId");

-- CreateIndex
CREATE INDEX "CustomerOfferingLink_tenantId_offeringId_idx" ON "CustomerOfferingLink"("tenantId", "offeringId");

-- CreateIndex
CREATE INDEX "Activity_tenantId_occurredAt_idx" ON "Activity"("tenantId", "occurredAt");

-- CreateIndex
CREATE INDEX "Note_tenantId_createdAt_idx" ON "Note"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_status_idx" ON "Conversation"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Conversation_tenantId_lastMessageAt_idx" ON "Conversation"("tenantId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Message_tenantId_sentAt_idx" ON "Message"("tenantId", "sentAt");

-- CreateIndex
CREATE INDEX "Attachment_tenantId_createdAt_idx" ON "Attachment"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "CannedReply_tenantId_category_idx" ON "CannedReply"("tenantId", "category");

-- CreateIndex
CREATE INDEX "PipelineTemplate_tenantId_category_idx" ON "PipelineTemplate"("tenantId", "category");

-- CreateIndex
CREATE INDEX "PipelineStage_tenantId_templateId_idx" ON "PipelineStage"("tenantId", "templateId");

-- CreateIndex
CREATE UNIQUE INDEX "PipelineStage_templateId_order_key" ON "PipelineStage"("templateId", "order");

-- CreateIndex
CREATE INDEX "LifecycleItem_tenantId_stageId_idx" ON "LifecycleItem"("tenantId", "stageId");

-- CreateIndex
CREATE INDEX "LifecycleItem_tenantId_ownerUserId_idx" ON "LifecycleItem"("tenantId", "ownerUserId");

-- CreateIndex
CREATE INDEX "LifecycleItem_tenantId_offeringId_idx" ON "LifecycleItem"("tenantId", "offeringId");

-- CreateIndex
CREATE INDEX "Task_tenantId_status_idx" ON "Task"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Task_tenantId_dueDate_idx" ON "Task"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "AutomationRule_tenantId_triggerType_idx" ON "AutomationRule"("tenantId", "triggerType");

-- CreateIndex
CREATE INDEX "AutomationRun_tenantId_createdAt_idx" ON "AutomationRun"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingType_tenantId_offeringId_idx" ON "BookingType"("tenantId", "offeringId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingType_tenantId_slug_key" ON "BookingType"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Booking_tenantId_startsAt_idx" ON "Booking"("tenantId", "startsAt");

-- CreateIndex
CREATE INDEX "Booking_tenantId_offeringId_idx" ON "Booking"("tenantId", "offeringId");

-- CreateIndex
CREATE UNIQUE INDEX "IntakeSubmission_bookingId_key" ON "IntakeSubmission"("bookingId");

-- CreateIndex
CREATE INDEX "IntakeSubmission_tenantId_createdAt_idx" ON "IntakeSubmission"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Quote_tenantId_status_idx" ON "Quote"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_tenantId_reference_key" ON "Quote"("tenantId", "reference");

-- CreateIndex
CREATE INDEX "QuoteLineItem_quoteId_sortOrder_idx" ON "QuoteLineItem"("quoteId", "sortOrder");

-- CreateIndex
CREATE INDEX "QuoteLineItem_offeringPriceId_idx" ON "QuoteLineItem"("offeringPriceId");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_status_idx" ON "Invoice"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_tenantId_reference_key" ON "Invoice"("tenantId", "reference");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_invoiceId_sortOrder_idx" ON "InvoiceLineItem"("invoiceId", "sortOrder");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_offeringPriceId_idx" ON "InvoiceLineItem"("offeringPriceId");

-- CreateIndex
CREATE INDEX "RecurringAgreement_tenantId_status_idx" ON "RecurringAgreement"("tenantId", "status");

-- CreateIndex
CREATE INDEX "RecurringAgreement_tenantId_offeringPriceId_idx" ON "RecurringAgreement"("tenantId", "offeringPriceId");

-- CreateIndex
CREATE INDEX "FileAsset_tenantId_createdAt_idx" ON "FileAsset"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_tenantId_createdAt_idx" ON "Notification"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PortalAccess_accessKey_key" ON "PortalAccess"("accessKey");

-- CreateIndex
CREATE INDEX "PortalAccess_tenantId_active_idx" ON "PortalAccess"("tenantId", "active");
