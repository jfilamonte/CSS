import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user from environment variables
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@craftedflooringsolutions.com"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123"

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        emailVerifiedAt: new Date(),
      },
    })

    console.log(`✅ Created admin user: ${admin.email}`)
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`)
  }

  // Create some sample leads for testing
  const sampleLeads = [
    {
      fullName: "John Smith",
      email: "john@example.com",
      phone: "555-0123",
      projectType: "Residential Garage",
      squareFootage: "500",
      timeline: "Within 2 weeks",
      address: "123 Main St, Anytown, USA",
      details: "Looking for metallic epoxy finish",
      wantsAppointment: true,
      status: "NEW" as const,
    },
    {
      fullName: "Sarah Johnson",
      email: "sarah@business.com",
      phone: "555-0456",
      projectType: "Commercial Warehouse",
      squareFootage: "5000",
      timeline: "Next month",
      address: "456 Industrial Blvd, Business City, USA",
      details: "High-traffic industrial flooring needed",
      wantsAppointment: false,
      status: "CONTACTED" as const,
    },
  ]

  for (const leadData of sampleLeads) {
    const existingLead = await prisma.lead.findFirst({
      where: { email: leadData.email },
    })

    if (!existingLead) {
      await prisma.lead.create({ data: leadData })
      console.log(`✅ Created sample lead: ${leadData.fullName}`)
    }
  }

  console.log("🎉 Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
