import { PartialType } from '@nestjs/swagger';
import { CreateLectureRecordDto } from './create-lecture-record.dto';

export class UpdateLectureRecordDto extends PartialType(CreateLectureRecordDto) {}
