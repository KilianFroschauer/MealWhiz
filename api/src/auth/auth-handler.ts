import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken"

export interface AuthRequest extends Request {
    payload: JwtPayload;
}

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {

    try {
        // check if the jwt payload contains an admin role
        // TODO: How to access the jwt from the authentication middleware?
        const payload = (req as AuthRequest).payload;
        if (payload.user.role === "admin") {
            next();
        } else {
            res.status(401).send("Admin role required");
        }
    } catch (err) {
        // the request has not been authorized before
        res.status(401).send("Authentication required");
    }
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            // If you send a response here, you MUST return
            // res.status(401).send("No token provided");
            // return;
            throw new Error("No bearer token available");
        }
        const decoded: string | JwtPayload = jwt.verify(token, "SECRET_KEY");
        (req as AuthRequest).payload = decoded as JwtPayload; // Attach payload
        next(); // Calls the next middleware or route handler
    } catch (err: any) {
        // If an error occurs (e.g., token invalid, expired)
        console.error("Authentication error:", err.message);
        res.status(401).send("Unauthorized: Invalid or expired token."); // Sending a response
        // If you send a response here, you should NOT call next()
        // OR if you call next(), the route handler must be aware that a response might have been sent.
        // For typical auth middleware, you send the error response and stop.
        return; // Explicitly return to prevent calling next() if it was outside the catch
    }
};