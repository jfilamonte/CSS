import SalesRepLoginForm from "./SalesRepLoginForm" // Declare the SalesRepLoginForm variable

export default function SalesPortalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex min-h-screen">
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div>
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Sales Rep Portal</h2>
              <p className="mt-2 text-sm text-gray-600">Sign in to manage your schedule and appointments</p>
            </div>

            <div className="mt-8">
              <SalesRepLoginForm />
            </div>
          </div>
        </div>

        <div className="hidden lg:block relative w-0 flex-1">
          <img
            className="absolute inset-0 h-full w-full object-cover"
            src="/placeholder-u4j13.png"
            alt="Sales workspace"
          />
        </div>
      </div>
    </div>
  )
}
