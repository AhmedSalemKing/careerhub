import { PartialType } from '@nestjs/swagger';
import { CreateExternalInstructorDto } from './create-external-instructor.dto';

export class UpdateExternalInstructorDto extends PartialType(CreateExternalInstructorDto) {}
