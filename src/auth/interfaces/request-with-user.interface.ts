import { Request } from 'express';
import { UserPayloadDto } from '../dto/user-payload.dto.js';

export interface RequestWithUser extends Request {
  user: UserPayloadDto;
}
