import { IsString, IsNumber, IsEnum, MinLength, Min, IsOptional } from "class-validator";

export class CreateAlertDto {
  @IsNumber()
  @Min(1, { message: "Coin ID không hợp lệ" })
  coinId: number;

  @IsString()
  @MinLength(1, { message: "Symbol không được để trống" })
  coinSymbol: string;

  @IsString()
  @MinLength(1, { message: "Tên coin không được để trống" })
  coinName: string;

  @IsOptional()
  @IsString()
  coinImage?: string;

  @IsEnum(["above", "below"])
  condition: "above" | "below";

  @IsNumber()
  @Min(0.00000001, { message: "Giá mục tiêu phải lớn hơn 0" })
  targetPrice: number;
}
