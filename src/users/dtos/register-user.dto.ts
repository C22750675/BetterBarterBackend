import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\S+$/, {
    message: 'Username cannot contain spaces.',
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message:
        'Password is too weak. It must contain an uppercase letter, a lowercase letter, a number, and a special character.',
    },
  )
  password: string;
}
