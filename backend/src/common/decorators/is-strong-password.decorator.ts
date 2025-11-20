import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

/**
 * Custom validator for strong password requirements
 */
@ValidatorConstraint({ name: "isStrongPassword", async: false })
export class IsStrongPasswordConstraint
  implements ValidatorConstraintInterface
{
  validate(password: string) {
    if (!password || typeof password !== "string") {
      return false;
    }

    if (password.length < 8) {
      return false;
    }

    if (!/[a-z]/.test(password)) {
      return false;
    }

    if (!/[A-Z]/.test(password)) {
      return false;
    }

    if (!/\d/.test(password)) {
      return false;
    }

    if (!/[@$!%*?&#]/.test(password)) {
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    const password = args.value as string;

    if (!password || password.length < 8) {
      return "Password must be at least 8 characters long";
    }

    if (!/[a-z]/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }

    if (!/[A-Z]/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }

    if (!/\d/.test(password)) {
      return "Password must contain at least one number";
    }

    if (!/[@$!%*?&#]/.test(password)) {
      return "Password must contain at least one special character (@$!%*?&#)";
    }

    return "Password is not strong enough";
  }
}

/**
 * Custom decorator for strong password validation
 *
 * Requirements:
 * - At least 8 characters long
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character (@$!%*?&#)
 *
 * @example
 * ```typescript
 * export class SignUpDto {
 *   @IsStrongPassword()
 *   password: string;
 * }
 * ```
 */
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isStrongPassword",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsStrongPasswordConstraint,
    });
  };
}
