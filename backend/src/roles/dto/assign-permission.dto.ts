import { IsUUID, IsArray, IsNotEmpty } from 'class-validator';

export class AssignPermissionDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  permissionIds: string[];
}
