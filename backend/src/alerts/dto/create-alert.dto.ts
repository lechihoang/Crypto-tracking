import {
  IsString,
  IsNumber,
  IsEnum,
  MinLength,
  Min,
} from "class-validator";

export class CreateAlertDto {
  @IsString()
  @MinLength(1, { message: "Coin ID không được để trống" })
  coinId: string;

  @IsEnum(["above", "below"])
  condition: "above" | "below";

  @IsNumber()
  @Min(0.00000001, { message: "Giá mục tiêu phải lớn hơn 0" })
  targetPrice: number;
}
