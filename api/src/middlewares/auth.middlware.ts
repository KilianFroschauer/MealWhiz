import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import jwt, { JwtPayload } from "jsonwebtoken"

export interface AuthRequest extends Request {
    payload: JwtPayload;
}

// TODO: Add roles
// export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
//     try {
//         // This assumes isAuthenticated middleware has run and populated req.payload
//         const payload = (req as AuthRequest).payload;

//         // Check if the user object and role property exist in the payload
//         if (payload && payload.user && payload.user.role === "admin") {
//             next();
//         } else {
//             res.status(StatusCodes.FORBIDDEN).json({ message: "Forbidden: Admin role required" });
//         }
//     } catch (err) {
//         console.error("Error in isAdmin middleware:", err);
//         res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized: Authentication required or invalid token structure" });
//     }
// }

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            throw new Error("No bearer token available");
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("JWT_SECRET is not defined in environment variables. Ensure .env file is loaded correctly.");
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Internal server configuration error." });
            return;
        }

        const decoded: string | JwtPayload = jwt.verify(token, secret);
        
        // Ensure the decoded payload has the expected structure, especially 'user'
        if (typeof decoded === 'object' && decoded !== null && 'user' in decoded) {
            (req as AuthRequest).payload = decoded as JwtPayload; // Attach payload
            next();
        } else {
            console.error("Authentication error: Invalid token payload structure");
            res.status(StatusCodes.UNAUTHORIZED).json({ message: "Unauthorized: Invalid token payload" });
            return;
        }
    } catch (err: any) {
        console.error("Authentication error:", err.message);
        res.status(401).json({ message: "Unauthorized: Invalid or expired token." });
        return;
    }
};