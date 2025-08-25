import {
  getCurrentUser,
  requireAuth,
  requireAdmin,
  requireSalesRep,
  requireCustomer,
  requireStaff,
  hasRole,
  isAdmin,
  isSalesRep,
  isCustomer,
  isStaff,
  signIn,
  signUp,
  signOut,
  ROLES,
  type User,
  type UserRole,
} from "./auth"

// Re-export all functions from the main auth module for backward compatibility
export {
  getCurrentUser,
  requireAuth,
  requireAdmin,
  requireSalesRep,
  requireCustomer,
  requireStaff,
  hasRole,
  isAdmin,
  isSalesRep,
  isCustomer,
  isStaff,
  signIn,
  signUp,
  signOut,
  ROLES,
  type User,
  type UserRole,
}

// Legacy function aliases for backward compatibility
export const requireAdminAuth = requireAdmin
export const requireSalesRepAuth = requireSalesRep
export const requireCustomerAuth = requireCustomer
export const signInAction = signIn
export const signUpAction = signUp
export const signOutAction = signOut
