-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_role_approvalStatus_idx" ON "User"("role", "approvalStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Address_userId_idx" ON "Address"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_brandId_idx" ON "Product"("brandId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_isPublished_isArchived_idx" ON "Product"("isPublished", "isArchived");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Product_createdAt_idx" ON "Product"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductVariant_isAvailable_idx" ON "ProductVariant"("isAvailable");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductVariant_baseWholesalePrice_idx" ON "ProductVariant"("baseWholesalePrice");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductImage_productId_idx" ON "ProductImage"("productId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductImage_variantId_idx" ON "ProductImage"("variantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderItem_orderId_idx" ON "OrderItem"("orderId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Conversation_customerId_idx" ON "Conversation"("customerId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NotificationDelivery_type_idx" ON "NotificationDelivery"("type");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NotificationDelivery_recipient_idx" ON "NotificationDelivery"("recipient");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NotificationDelivery_status_idx" ON "NotificationDelivery"("status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "NotificationDelivery_createdAt_idx" ON "NotificationDelivery"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
