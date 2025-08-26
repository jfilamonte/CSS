// Sample data seeding script for testing advanced features
const { createClient } = require("@supabase/ssr")

async function seedSampleData() {
  console.log("🌱 Starting sample data seeding...")

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase environment variables")
      console.log(
        "Available env vars:",
        Object.keys(process.env).filter((key) => key.includes("SUPABASE")),
      )
      process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Sample customers
    const { data: customers, error: customersError } = await supabase
      .from("customers")
      .upsert([
        {
          id: "sample-customer-1",
          name: "John Smith",
          email: "john.smith@example.com",
          phone: "(555) 123-4567",
          address: "123 Main St, Anytown, ST 12345",
          created_at: new Date().toISOString(),
        },
        {
          id: "sample-customer-2",
          name: "Sarah Johnson",
          email: "sarah.johnson@example.com",
          phone: "(555) 987-6543",
          address: "456 Oak Ave, Somewhere, ST 67890",
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (customersError) throw customersError
    console.log("✅ Sample customers created")

    // Sample projects
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .upsert([
        {
          id: "sample-project-1",
          name: "Residential Garage Floor",
          customer_id: "sample-customer-1",
          status: "completed",
          project_type: "residential",
          square_footage: 600,
          estimated_cost: 3500.0,
          actual_cost: 3200.0,
          start_date: "2024-01-15",
          completion_date: "2024-01-18",
          created_at: new Date().toISOString(),
        },
        {
          id: "sample-project-2",
          name: "Commercial Warehouse Floor",
          customer_id: "sample-customer-2",
          status: "in_progress",
          project_type: "commercial",
          square_footage: 5000,
          estimated_cost: 25000.0,
          start_date: "2024-02-01",
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (projectsError) throw projectsError
    console.log("✅ Sample projects created")

    // Sample equipment
    const { data: equipment, error: equipmentError } = await supabase
      .from("equipment")
      .upsert([
        {
          id: "sample-equipment-1",
          name: "Floor Grinder - Husqvarna PG 280",
          category: "surface_prep",
          status: "available",
          purchase_date: "2023-06-15",
          purchase_cost: 8500.0,
          last_maintenance: "2024-01-15",
          next_maintenance: "2024-04-15",
          created_at: new Date().toISOString(),
        },
        {
          id: "sample-equipment-2",
          name: "Epoxy Mixer - Graco Reactor",
          category: "application",
          status: "in_use",
          purchase_date: "2023-08-20",
          purchase_cost: 12000.0,
          last_maintenance: "2024-02-01",
          next_maintenance: "2024-05-01",
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (equipmentError) throw equipmentError
    console.log("✅ Sample equipment created")

    // Sample warranties
    const { data: warranties, error: warrantiesError } = await supabase
      .from("warranties")
      .upsert([
        {
          id: "sample-warranty-1",
          project_id: "sample-project-1",
          warranty_type: "standard",
          start_date: "2024-01-18",
          end_date: "2029-01-18",
          coverage_details: "5-year warranty covering material defects and workmanship",
          status: "active",
          created_at: new Date().toISOString(),
        },
      ])
      .select()

    if (warrantiesError) throw warrantiesError
    console.log("✅ Sample warranties created")

    console.log("🎉 Sample data seeding completed successfully!")
  } catch (error) {
    console.error("❌ Error seeding sample data:", error)
    process.exit(1)
  }
}

seedSampleData()
