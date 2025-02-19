import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'

import ErrorHandler from '../utils/ErrorHandler'
import CatchAsyncError from './catchAsyncError'
import { APIUserService } from '../services/user.service'

export const isAuthenticated = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accessToken = (await req.cookies.access_token) as string
      if (!accessToken) {
        return next(new ErrorHandler('Please login to access this route', 400))
      }

      const decoded = (await jwt.verify(
        accessToken,
        process.env.JWT_ACCESS_TOKEN_SECRET as string
      )) as JwtPayload
      if (!decoded) {
        return next(new ErrorHandler('Invalid access token', 401))
      }

      const user = await APIUserService.getById(decoded.id)
      if (!user) {
        return next(new ErrorHandler('User not found', 404))
      }

      req.user = user

      next()
    } catch (error: any) {
      console.log(error, '[Authentication_Error]')
      return next(new ErrorHandler(error.message, 400))
    }
  }
)

export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role as string)) {
      return next(new ErrorHandler('You are not authorized to access this route', 403))
    }
    next()
  }
}
