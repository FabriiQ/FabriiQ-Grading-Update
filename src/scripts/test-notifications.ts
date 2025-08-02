/**
 * Test script to verify notifications are working
 */

import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/server/api/services/notification.service';

async function testNotifications() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing notification system...');
    
    // Create notification service
    const notificationService = new NotificationService({ prisma });
    
    // Find a test user
    const testUser = await prisma.user.findFirst({
      where: {
        userType: {
          in: ['STUDENT', 'CAMPUS_STUDENT']
        }
      }
    });
    
    if (!testUser) {
      console.log('❌ No test user found');
      return;
    }
    
    console.log(`✅ Found test user: ${testUser.name} (${testUser.id})`);
    
    // Create a test notification
    const result = await notificationService.createNotification({
      title: 'Test Notification',
      content: 'This is a test notification to verify the system is working',
      type: 'SOCIAL_WALL_POST',
      deliveryType: 'IN_APP',
      status: 'PUBLISHED',
      senderId: testUser.id,
      recipientIds: [testUser.id],
      metadata: {
        actionUrl: '/student/class/test/social-wall',
        testNotification: true
      }
    });
    
    console.log('✅ Notification created:', result.success);
    
    // Get user notifications
    const notifications = await notificationService.getUserNotifications({
      userId: testUser.id,
      limit: 10
    });
    
    console.log(`✅ User has ${notifications.notifications?.length || 0} notifications`);
    
    // Get unread count
    const unreadCount = await notificationService.getUnreadNotificationCount(testUser.id);
    console.log(`✅ Unread count: ${unreadCount.count}`);
    
    // Test marking as read
    if (notifications.notifications && notifications.notifications.length > 0) {
      const firstNotification = notifications.notifications[0];
      await notificationService.markNotificationAsRead(firstNotification.id, testUser.id);
      console.log('✅ Marked notification as read');
      
      // Check unread count again
      const newUnreadCount = await notificationService.getUnreadNotificationCount(testUser.id);
      console.log(`✅ New unread count: ${newUnreadCount.count}`);
    }
    
    console.log('🎉 Notification system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Notification test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testNotifications()
    .then(() => {
      console.log('✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

export { testNotifications };
