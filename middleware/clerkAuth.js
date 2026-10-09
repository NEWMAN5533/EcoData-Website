import { clerkMiddleware, getAuth } from "@clerk/express";

/***
 * /Initialize clerk authentication
 * apply clerk middleware globally in server.js
 * 
 * 
 */

export const initializeClerk = clerkMiddleware();

/**
 * require an authenticated user
 * 
 */

export function requireAuth(req, res, next){
  const auth = getAuth(req);

  if(!auth?.userId){
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }
  next();
}

/***
 * Required an authenticated administrator.
 * 
 * we will implement the actual admin authorization
 * using a trusted server-site role record in a later step.
 */


export function requiredAdmin(req, res, next){
  return res.status(501).json({
    success: false,
    message: "Administrator authorization is not configured yet.",
  });
}