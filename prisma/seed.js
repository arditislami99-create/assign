const { PrismaClient, Role, ShootStatus, AssignmentStatus } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const PRODUCTION_ROLES = [
  "Producer",
  "Director",
  "DP",
  "Camera Op",
  "1st AC",
  "2nd AC",
  "Gaffer",
  "Grip",
  "Sound Mixer",
  "Editor",
  "Production Coordinator",
  "HMU",
  "Stylist",
  "PA",
];

async function main() {
  for (const name of PRODUCTION_ROLES) {
    await prisma.productionRole.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const password = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@deepsync.pro" },
    update: {},
    create: {
      name: "Maya Chen",
      email: "admin@deepsync.pro",
      passwordHash: password,
      role: Role.ADMIN,
      phone: "(310) 555-0142",
    },
  });

  const staffSeed = [
    { name: "Alex Rivera", email: "alex@deepsync.pro", role: "Director", phone: "(310) 555-0112" },
    { name: "Jordan Lee", email: "jordan@deepsync.pro", role: "DP", phone: "(310) 555-0178" },
    { name: "Sam Whitfield", email: "sam@deepsync.pro", role: "Camera Op", phone: "(310) 555-0194" },
    { name: "Priya Patel", email: "priya@deepsync.pro", role: "Gaffer", phone: "(310) 555-0108" },
    { name: "Marcus Webb", email: "marcus@deepsync.pro", role: "Sound Mixer", phone: "(310) 555-0163" },
    { name: "Tessa Nguyen", email: "tessa@deepsync.pro", role: "Editor", phone: "(310) 555-0127" },
    { name: "Diego Alvarez", email: "diego@deepsync.pro", role: "Grip", phone: "(310) 555-0189" },
    { name: "Nia Brooks", email: "nia@deepsync.pro", role: "PA", phone: "(310) 555-0135" },
  ];

  const staffUsers = [];
  for (const s of staffSeed) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        passwordHash: password,
        role: Role.STAFF,
        phone: s.phone,
      },
    });
    staffUsers.push({ user, role: s.role });
  }

  const daysFromNow = (n) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + n);
    return d;
  };

  const shoots = [
    {
      title: "TerraForm Beverage — Summer Campaign",
      client: "TerraForm",
      date: daysFromNow(1),
      callTime: "06:30",
      wrapTime: "15:30",
      location: "Stage B, Hollywood",
      notes: "2 setups, indoor product. Breakfast catered at 6am.",
      status: ShootStatus.CONFIRMED,
      assignments: [
        ["Director", "Alex Rivera", AssignmentStatus.CONFIRMED],
        ["DP", "Jordan Lee", AssignmentStatus.CONFIRMED],
        ["Camera Op", "Sam Whitfield", AssignmentStatus.CONFIRMED],
        ["Gaffer", "Priya Patel", AssignmentStatus.CONFIRMED],
        ["Sound Mixer", "Marcus Webb", AssignmentStatus.TENTATIVE],
        ["PA", "Nia Brooks", AssignmentStatus.CONFIRMED],
      ],
    },
    {
      title: "Northline Documentary — Day 1",
      client: "Northline Films",
      date: daysFromNow(2),
      callTime: "07:00",
      wrapTime: "17:00",
      location: "Downtown LA streets",
      notes: "Run-and-gun, city hall exteriors. Street parking pass provided.",
      status: ShootStatus.CONFIRMED,
      assignments: [
        ["Director", "Alex Rivera", AssignmentStatus.CONFIRMED],
        ["DP", "Jordan Lee", AssignmentStatus.CONFIRMED],
        ["Sound Mixer", "Marcus Webb", AssignmentStatus.CONFIRMED],
        ["Grip", "Diego Alvarez", AssignmentStatus.CONFIRMED],
        ["PA", "Nia Brooks", AssignmentStatus.CONFIRMED],
      ],
    },
    {
      title: "Helios Fitness — Launch Reel",
      client: "Helios Fitness",
      date: daysFromNow(2),
      callTime: "09:00",
      wrapTime: "14:00",
      location: "Sunset Blvd rooftop",
      notes: "Overlaps Northline Day 1 — resolve Alex & Jordan before confirming.",
      status: ShootStatus.TENTATIVE,
      assignments: [
        ["Director", "Alex Rivera", AssignmentStatus.TENTATIVE],
        ["DP", "Jordan Lee", AssignmentStatus.TENTATIVE],
        ["PA", "Nia Brooks", AssignmentStatus.TENTATIVE],
      ],
    },
    {
      title: "Aurora Skincare — Skincare Routine",
      client: "Aurora Beauty",
      date: daysFromNow(4),
      callTime: "08:00",
      wrapTime: "16:00",
      location: "Culver City studio",
      notes: "Macro lens work, ring light setup. Client approving on set.",
      status: ShootStatus.TENTATIVE,
      assignments: [
        ["Director", "Alex Rivera", AssignmentStatus.TENTATIVE],
        ["Camera Op", "Sam Whitfield", AssignmentStatus.TENTATIVE],
        ["Gaffer", "Priya Patel", AssignmentStatus.TENTATIVE],
        ["HMU", "Tessa Nguyen", AssignmentStatus.TENTATIVE],
      ],
    },
    {
      title: "Sable Coffee — Brand Spot",
      client: "Sable Coffee Co.",
      date: daysFromNow(6),
      callTime: "06:00",
      wrapTime: "14:00",
      location: "Ridgeline Coffee Roasters",
      notes: "Steadicam day. Roastery environment, low light interiors.",
      status: ShootStatus.CONFIRMED,
      assignments: [
        ["Director", "Alex Rivera", AssignmentStatus.CONFIRMED],
        ["DP", "Jordan Lee", AssignmentStatus.CONFIRMED],
        ["Camera Op", "Sam Whitfield", AssignmentStatus.CONFIRMED],
        ["Sound Mixer", "Marcus Webb", AssignmentStatus.CONFIRMED],
        ["PA", "Nia Brooks", AssignmentStatus.CONFIRMED],
      ],
    },
    {
      title: "Vista Motors — EV Launch Event",
      client: "Vista Motors",
      date: daysFromNow(9),
      callTime: "10:00",
      wrapTime: "19:00",
      location: "LA Convention Center",
      notes: "Live event coverage, 3 cameras. Media wall backline.",
      status: ShootStatus.TENTATIVE,
      assignments: [
        ["Producer", "Maya Chen", AssignmentStatus.CONFIRMED],
        ["Director", "Alex Rivera", AssignmentStatus.TENTATIVE],
        ["DP", "Jordan Lee", AssignmentStatus.TENTATIVE],
        ["Grip", "Diego Alvarez", AssignmentStatus.TENTATIVE],
      ],
    },
    {
      title: "Harbor & Vine — Restaurant Series",
      client: "Harbor & Vine",
      date: daysFromNow(12),
      callTime: "11:00",
      wrapTime: "18:00",
      location: "Harbor & Vine, Venice",
      notes: "Food styling day, golden hour exteriors. Chef interviews.",
      status: ShootStatus.CONFIRMED,
      assignments: [
        ["Director", "Alex Rivera", AssignmentStatus.CONFIRMED],
        ["Camera Op", "Sam Whitfield", AssignmentStatus.CONFIRMED],
        ["Gaffer", "Priya Patel", AssignmentStatus.CONFIRMED],
        ["Sound Mixer", "Marcus Webb", AssignmentStatus.CONFIRMED],
        ["Editor", "Tessa Nguyen", AssignmentStatus.CONFIRMED],
        ["PA", "Nia Brooks", AssignmentStatus.CONFIRMED],
      ],
    },
  ];

  for (const s of shoots) {
    const existing = await prisma.shoot.findFirst({ where: { title: s.title } });
    if (existing) continue;

    const shoot = await prisma.shoot.create({
      data: {
        title: s.title,
        client: s.client,
        date: s.date,
        callTime: s.callTime,
        wrapTime: s.wrapTime,
        location: s.location,
        notes: s.notes,
        status: s.status,
      },
    });

    for (const [role, staffName, status] of s.assignments) {
      const staff = staffUsers.find((u) => u.user.name === staffName)?.user;
      if (!staff) continue;
      await prisma.assignment.create({
        data: {
          shootId: shoot.id,
          userId: staff.id,
          role,
          status,
        },
      });
    }

    // Assign admin as Producer on every shoot
    await prisma.assignment.create({
      data: {
        shootId: shoot.id,
        userId: admin.id,
        role: "Producer",
        status: AssignmentStatus.CONFIRMED,
      },
    });
  }

  console.log("Seed complete.");
  console.log("Admin: admin@deepsync.pro / password123");
  console.log("Staff: alex@deepsync.pro / password123 (and 7 more)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());