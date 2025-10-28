import { Request } from 'express';
import { UserPayloadDto } from '../dto/user-payload.dto';

export interface RequestWithUser extends Request {
  user: UserPayloadDto;
}
