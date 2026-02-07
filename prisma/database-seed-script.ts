import { PrismaClient } from "../src/generated/prisma";
import { hash } from "crypto";

const prisma = new PrismaClient();

// Simple password hash for seed data (use bcrypt in production)
function hashPassword(password: string): string {
  return hash("sha256", password);
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.eventAttendee.deleteMany();
  await prisma.event.deleteMany();
  await prisma.task.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.customerInterest.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.customerContact.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.property.deleteMany();
  await prisma.project.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.setting.deleteMany();

  console.log("✅ Cleaned existing data");

  // Create Users
  const admin = await prisma.user.create({
    data: {
      email: "admin@joyhomes.vn",
      phone: "0901234567",
      passwordHash: hashPassword("admin123"),
      fullName: "Admin Joyhomes",
      role: "ADMIN",
      department: "Ban Giám Đốc",
      position: "Quản trị viên",
      status: "ACTIVE",
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@joyhomes.vn",
      phone: "0901234568",
      passwordHash: hashPassword("manager123"),
      fullName: "Nguyễn Văn Minh",
      role: "MANAGER",
      department: "Kinh Doanh",
      position: "Trưởng phòng",
      status: "ACTIVE",
      baseSalary: 25000000,
      bankAccount: "1234567890",
      bankName: "Vietcombank",
    },
  });

  const sales1 = await prisma.user.create({
    data: {
      email: "sales1@joyhomes.vn",
      phone: "0901234569",
      passwordHash: hashPassword("sales123"),
      fullName: "Trần Thị Hoa",
      role: "SALES",
      department: "Kinh Doanh",
      position: "Nhân viên kinh doanh",
      status: "ACTIVE",
      baseSalary: 12000000,
      bankAccount: "0987654321",
      bankName: "Techcombank",
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      email: "sales2@joyhomes.vn",
      phone: "0901234570",
      passwordHash: hashPassword("sales123"),
      fullName: "Lê Văn Nam",
      role: "SALES",
      department: "Kinh Doanh",
      position: "Nhân viên kinh doanh",
      status: "ACTIVE",
      baseSalary: 12000000,
    },
  });

  const accountant = await prisma.user.create({
    data: {
      email: "ketoan@joyhomes.vn",
      phone: "0901234571",
      passwordHash: hashPassword("ketoan123"),
      fullName: "Phạm Thị Lan",
      role: "ACCOUNTANT",
      department: "Kế Toán",
      position: "Kế toán trưởng",
      status: "ACTIVE",
      baseSalary: 18000000,
    },
  });

  console.log("✅ Created 5 users");

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      code: "VH-01",
      name: "Vinhomes Grand Park",
      developer: "Vingroup",
      location: "Quận 9, TP.HCM",
      address: "Đường Nguyễn Xiển, Phường Long Thạnh Mỹ",
      district: "Quận 9",
      city: "Hồ Chí Minh",
      description: "Đại đô thị đẳng cấp với hệ thống tiện ích hoàn chỉnh",
      totalUnits: 500,
      availableUnits: 120,
      status: "OPEN",
      commissionRate: 2.5,
      launchDate: new Date("2025-01-15"),
    },
  });

  const project2 = await prisma.project.create({
    data: {
      code: "MH-02",
      name: "Masteri Homes",
      developer: "Masterise Homes",
      location: "Thủ Đức, TP.HCM",
      address: "Đường Võ Nguyên Giáp",
      district: "Thủ Đức",
      city: "Hồ Chí Minh",
      description: "Căn hộ cao cấp view sông Sài Gòn",
      totalUnits: 300,
      availableUnits: 85,
      status: "OPEN",
      commissionRate: 3.0,
      launchDate: new Date("2025-03-01"),
    },
  });

  const project3 = await prisma.project.create({
    data: {
      code: "EC-03",
      name: "Ecopark Hưng Yên",
      developer: "Ecopark",
      location: "Văn Giang, Hưng Yên",
      address: "Xã Xuân Quan",
      district: "Văn Giang",
      city: "Hưng Yên",
      description: "Khu đô thị sinh thái xanh",
      totalUnits: 200,
      availableUnits: 45,
      status: "OPEN",
      commissionRate: 2.0,
    },
  });

  console.log("✅ Created 3 projects");

  // Create Properties for Project 1
  const properties = [];
  const buildings = ["A1", "A2", "B1"];
  const statuses = ["AVAILABLE", "AVAILABLE", "AVAILABLE", "HOLD", "BOOKED", "SOLD"] as const;

  for (const building of buildings) {
    for (let floor = 5; floor <= 15; floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        const statusIndex = Math.floor(Math.random() * statuses.length);
        const bedrooms = unit <= 2 ? 2 : 3;
        const area = bedrooms === 2 ? 65 : 85;
        const price = area * 55000000;

        properties.push({
          code: `${building}-${floor.toString().padStart(2, "0")}-${unit.toString().padStart(2, "0")}`,
          projectId: project1.id,
          building,
          floor,
          unit: unit.toString().padStart(2, "0"),
          propertyType: "APARTMENT" as const,
          area,
          bedrooms,
          bathrooms: bedrooms,
          direction: ["Đông", "Tây", "Nam", "Bắc"][unit - 1],
          price,
          pricePerSqm: 55000000,
          status: statuses[statusIndex],
        });
      }
    }
  }

  await prisma.property.createMany({ data: properties.slice(0, 50) });
  console.log("✅ Created 50 properties");

  // Create Customers
  const customers = [
    {
      code: "KH-001",
      fullName: "Nguyễn Văn An",
      phone: "0912345678",
      email: "an.nguyen@gmail.com",
      address: "123 Nguyễn Huệ, Q1, TP.HCM",
      source: "FACEBOOK" as const,
      status: "QUALIFIED" as const,
      priority: "HIGH" as const,
      userId: sales1.id,
    },
    {
      code: "KH-002",
      fullName: "Trần Thị Bình",
      phone: "0923456789",
      email: "binh.tran@gmail.com",
      address: "456 Lê Lợi, Q3, TP.HCM",
      source: "REFERRAL" as const,
      status: "NEGOTIATING" as const,
      priority: "URGENT" as const,
      userId: sales1.id,
    },
    {
      code: "KH-003",
      fullName: "Lê Văn Cường",
      phone: "0934567890",
      email: "cuong.le@gmail.com",
      source: "WALK_IN" as const,
      status: "NEW" as const,
      priority: "MEDIUM" as const,
      userId: sales2.id,
    },
    {
      code: "KH-004",
      fullName: "Phạm Thị Dung",
      phone: "0945678901",
      email: "dung.pham@gmail.com",
      source: "GOOGLE" as const,
      status: "CONTACTED" as const,
      priority: "MEDIUM" as const,
      userId: sales2.id,
    },
    {
      code: "KH-005",
      fullName: "Hoàng Văn Em",
      phone: "0956789012",
      source: "ZALO" as const,
      status: "WON" as const,
      priority: "HIGH" as const,
      userId: sales1.id,
    },
  ];

  const createdCustomers = [];
  for (const customer of customers) {
    const created = await prisma.customer.create({ data: customer });
    createdCustomers.push(created);
  }
  console.log("✅ Created 5 customers");

  // Create Customer Contacts
  await prisma.customerContact.createMany({
    data: [
      {
        customerId: createdCustomers[0].id,
        type: "CALL",
        content: "Gọi điện giới thiệu dự án Vinhomes Grand Park",
        result: "Khách quan tâm căn 2PN",
        nextAction: "Hẹn lịch xem nhà mẫu",
        createdBy: sales1.id,
      },
      {
        customerId: createdCustomers[0].id,
        type: "SITE_VISIT",
        content: "Đưa khách xem nhà mẫu block A1",
        result: "Khách thích căn góc, view hồ",
        nextAction: "Gửi báo giá chi tiết",
        createdBy: sales1.id,
      },
      {
        customerId: createdCustomers[1].id,
        type: "MEETING",
        content: "Họp bàn về phương thức thanh toán",
        result: "Khách muốn trả góp 24 tháng",
        createdBy: sales1.id,
      },
    ],
  });
  console.log("✅ Created customer contacts");

  // Create Tasks
  await prisma.task.createMany({
    data: [
      {
        title: "Gọi điện follow up khách KH-001",
        description: "Nhắc khách về lịch xem nhà mẫu cuối tuần",
        creatorId: manager.id,
        assigneeId: sales1.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        priority: "HIGH",
        status: "TODO",
        customerId: createdCustomers[0].id,
      },
      {
        title: "Chuẩn bị hợp đồng cho KH-002",
        description: "Soạn hợp đồng mua bán căn A1-10-02",
        creatorId: manager.id,
        assigneeId: sales1.id,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        priority: "URGENT",
        status: "IN_PROGRESS",
      },
      {
        title: "Báo cáo doanh số tuần",
        creatorId: admin.id,
        assigneeId: manager.id,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        priority: "MEDIUM",
        status: "TODO",
      },
    ],
  });
  console.log("✅ Created tasks");

  // Create Events
  const event = await prisma.event.create({
    data: {
      title: "Lễ mở bán Vinhomes Grand Park Phase 2",
      description: "Sự kiện mở bán chính thức Phase 2 với nhiều ưu đãi hấp dẫn",
      type: "OPENING",
      location: "Sales Gallery Vinhomes Grand Park",
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      projectId: project1.id,
      status: "UPCOMING",
      createdBy: admin.id,
    },
  });

  await prisma.eventAttendee.createMany({
    data: [
      { eventId: event.id, userId: manager.id, role: "Lead" },
      { eventId: event.id, userId: sales1.id, role: "Participant" },
      { eventId: event.id, userId: sales2.id, role: "Participant" },
    ],
  });
  console.log("✅ Created events");

  // Create Settings
  await prisma.setting.createMany({
    data: [
      { key: "company_name", value: "Joyhomes Real Estate", type: "string" },
      { key: "company_phone", value: "1900 1234", type: "string" },
      { key: "company_email", value: "contact@joyhomes.vn", type: "string" },
      { key: "default_commission_rate", value: "2.5", type: "number" },
      { key: "booking_expire_days", value: "7", type: "number" },
    ],
  });
  console.log("✅ Created settings");

  console.log("\n🎉 Seeding completed successfully!");
  console.log(`
📊 Summary:
- Users: 5
- Projects: 3
- Properties: 50
- Customers: 5
- Tasks: 3
- Events: 1
  `);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
