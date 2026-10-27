import { PartialType } from '@nestjs/swagger';
import { CreateExternalLectureDto } from './create-external-lecture.dto';

export class UpdateExternalLectureDto extends PartialType(CreateExternalLectureDto) {}
