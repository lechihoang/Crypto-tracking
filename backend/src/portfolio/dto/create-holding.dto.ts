import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
} from "class-validator";

export class CreateHoldingDto {
  @IsString()
  @MinLength(1, { message: "Coin ID is required" })
  coinId: string;

  @IsString()
  @MinLength(1, { message: "Coin symbol is required" })
  coinSymbol: string;

  @IsString()
  @MinLength(1, { message: "Coin name is required" })
  coinName: string;

  @IsOptional()
  @IsString()
  coinImage?: string;

  @IsNumber()
  @Min(0.00000001, { message: "Quantity must be greater than 0" })
  quantity: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  averageBuyPrice?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
