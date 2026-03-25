import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class TokenService{
    constructor(private jwtService: JwtService) {}

    //generate a JWt
    sign(payload:{accountNumber: string; name: string; email:string}){
        return this.jwtService.sign(payload);
    }

     // Verify a JWT
    verifyToken(token: string){
       try{
         return this.jwtService.verify(token);
       }catch(err){
         return null;  //invalid token
       }
    }
}