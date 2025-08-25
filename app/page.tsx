"use client"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-800 rounded"></div>
              <span className="text-xl font-bold text-gray-900">Crafted Surface Solutions</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-green-800">
                Home
              </a>
              <a href="/services" className="text-gray-700 hover:text-green-800">
                Services
              </a>
              <a href="/gallery" className="text-gray-700 hover:text-green-800">
                Gallery
              </a>
              <a href="/contact" className="text-gray-700 hover:text-green-800">
                Contact
              </a>
            </nav>
            <button
              onClick={() => (window.location.href = "tel:+15551234567")}
              className="bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded-md"
            >
              Call Now
            </button>
          </div>
        </div>
      </header>

      <main className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Floors with
            <span className="text-green-800"> Premium Epoxy</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            From residential garages to commercial warehouses, we deliver durable, beautiful epoxy flooring solutions
            that last for decades.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-green-800 hover:bg-green-900 text-white px-8 py-3 rounded-md text-lg">
              Get Free Quote
            </button>
            <button className="border border-green-800 text-green-800 hover:bg-green-800 hover:text-white px-8 py-3 rounded-md text-lg">
              View Our Work
            </button>
          </div>
        </div>
      </main>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Epoxy Solutions?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Lifetime Durability</h3>
              <p className="text-gray-600">
                Our epoxy systems are engineered to withstand heavy traffic, chemicals, and daily wear for decades.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Fast Installation</h3>
              <p className="text-gray-600">
                Most residential projects completed in 2-3 days with minimal disruption to your daily routine.
              </p>
            </div>
            <div className="text-center p-6 bg-white rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Expert Craftsmanship</h3>
              <p className="text-gray-600">
                Certified installers with 15+ years experience and thousands of successful installations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-green-800 rounded"></div>
            <span className="text-xl font-bold">Crafted Surface Solutions</span>
          </div>
          <p className="text-gray-400 mb-4">
            Professional epoxy flooring solutions for residential and commercial applications.
          </p>
          <p className="text-gray-400">&copy; 2024 Crafted Surface Solutions. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
