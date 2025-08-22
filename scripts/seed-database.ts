import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user from environment variables
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@craftedflooringsolutions.com"
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "admin123"

  // Check if admin already exists
  const { data: existingAdmin } = await supabase.from("users").select("*").eq("email", adminEmail).single()

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    const { data: admin, error } = await supabase
      .from("users")
      .insert({
        email: adminEmail,
        password_hash: passwordHash,
        role: "admin",
        email_verified_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("❌ Error creating admin user:", error)
    } else {
      console.log(`✅ Created admin user: ${adminEmail}`)
    }
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`)
  }

  // Create some sample leads for testing
  const sampleLeads = [
    {
      customer_name: "John Smith",
      customer_email: "john@example.com",
      customer_phone: "555-0123",
      project_type: "Residential Garage",
      square_footage: 500,
      project_address: "123 Main St, Anytown, USA",
      message: "Looking for metallic epoxy finish",
      status: "new",
    },
    {
      customer_name: "Sarah Johnson",
      customer_email: "sarah@business.com",
      customer_phone: "555-0456",
      project_type: "Commercial Warehouse",
      square_footage: 5000,
      project_address: "456 Industrial Blvd, Business City, USA",
      message: "High-traffic industrial flooring needed",
      status: "contacted",
    },
  ]

  for (const leadData of sampleLeads) {
    const { data: existingLead } = await supabase
      .from("quotes")
      .select("*")
      .eq("customer_email", leadData.customer_email)
      .single()

    if (!existingLead) {
      const { error } = await supabase.from("quotes").insert(leadData)

      if (error) {
        console.error(`❌ Error creating sample lead for ${leadData.customer_name}:`, error)
      } else {
        console.log(`✅ Created sample lead: ${leadData.customer_name}`)
      }
    }
  }

  console.log("🎉 Database seeded successfully!")
}

main().catch((e) => {
  console.error("❌ Error seeding database:", e)
  process.exit(1)
})
